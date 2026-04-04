import { appendFile, readFile, writeFile, existsSync } from 'fs'
import { TelemetryEntry, SkillMetrics } from './types'
import { getDataPath } from './utils'

export async function logInvocation(entry: TelemetryEntry): Promise<void> {
  const path = getDataPath('telemetry.jsonl')
  await appendFile(path, JSON.stringify(entry) + '\n')
}

export async function loadTelemetry(): Promise<TelemetryEntry[]> {
  const path = getDataPath('telemetry.jsonl')
  if (!existsSync(path)) return []

  const content = await readFile(path, 'utf-8')
  return content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
}

export async function aggregateMetrics(): Promise<Record<string, SkillMetrics>> {
  const telemetry = await loadTelemetry()
  const metrics: Record<string, SkillMetrics> = {}

  for (const entry of telemetry) {
    if (!metrics[entry.skill]) {
      metrics[entry.skill] = {
        invocations: 0,
        successRate: 0,
        avgConfidence: 0,
        lastUsed: entry.timestamp,
        topContexts: [],
        correctionRate: 0,
        recentTrend: 'stable',
      }
    }

    const m = metrics[entry.skill]
    const n = m.invocations

    m.invocations++
    m.successRate = (m.successRate * n + (entry.outcome === 'success' ? 1 : 0)) / (n + 1)
    m.avgConfidence = (m.avgConfidence * n + entry.confidence) / (n + 1)
    m.lastUsed = entry.timestamp

    if (entry.outcome !== 'success') {
      m.correctionRate = (m.correctionRate * n + 1) / (n + 1)
    }

    // Track top contexts
    if (entry.context && !m.topContexts.includes(entry.context.slice(0, 50))) {
      if (m.topContexts.length < 5) {
        m.topContexts.push(entry.context.slice(0, 50))
      }
    }
  }

  return metrics
}

export async function saveMetrics(metrics: Record<string, SkillMetrics>): Promise<void> {
  const path = getDataPath('skill-metrics.json')
  await writeFile(path, JSON.stringify(metrics, null, 2))
}