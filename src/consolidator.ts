import { Learning, TelemetryEntry } from './types'
import { readFile, writeFile, appendFile } from 'fs/promises'
import { existsSync } from 'fs'
import { getEmbedder } from './embedder'
import { getDataPath } from './utils'

export async function loadLearnings(): Promise<Learning[]> {
  const path = getDataPath('learnings.jsonl')
  if (!existsSync(path)) return []

  const content = await readFile(path, 'utf-8')
  return content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
}

export async function saveLearning(learning: Learning): Promise<void> {
  const embedder = await getEmbedder()
  learning.embedding = await embedder.embed(learning.pattern)

  const path = getDataPath('learnings.jsonl')
  await appendFile(path, JSON.stringify(learning) + '\n')
}

export async function searchLearningsByEmbedding(query: number[], k: number): Promise<Learning[]> {
  const learnings = await loadLearnings()
  const embedder = await getEmbedder()

  const scored = learnings
    .filter(l => l.embedding)
    .map(l => ({
      learning: l,
      score: embedder.similarity(query, l.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)

  return scored.map(s => s.learning)
}

export async function extractPatterns(sessionSlug: string): Promise<Learning[]> {
  const { loadTelemetry } = await import('./telemetry')
  const telemetry = await loadTelemetry()
  const sessionEntries = telemetry.filter(e => e.sessionSlug === sessionSlug)

  const patterns: Learning[] = []

  const corrections = sessionEntries.filter(e => e.userSignal === 'edit' || e.outcome === 'partial')

  for (const correction of corrections) {
    if (correction.context) {
      patterns.push({
        pattern: `After ${correction.skill}, verify ${correction.context}`,
        confidence: 7,
        source: `correction-${sessionSlug}`,
        skills: [correction.skill],
        files: correction.filesReferenced,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return patterns
}

export async function checkStaleness(learning: Learning): Promise<boolean> {
  for (const file of learning.files) {
    if (!existsSync(file)) {
      return true
    }
  }
  return false
}

export async function pruneStaleLearnings(): Promise<number> {
  const learnings = await loadLearnings()
  const valid: Learning[] = []
  let pruned = 0

  for (const l of learnings) {
    if (!(await checkStaleness(l)) && l.confidence >= 3) {
      valid.push(l)
    } else {
      pruned++
    }
  }

  const path = getDataPath('learnings.jsonl')
  await writeFile(path, valid.map(l => JSON.stringify(l)).join('\n') + '\n')

  return pruned
}