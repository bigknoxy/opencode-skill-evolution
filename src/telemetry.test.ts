import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { logInvocation, loadTelemetry, aggregateMetrics } from '../src/telemetry'
import { TelemetryEntry } from '../src/types'

const TEST_DATA_DIR = join(process.env.HOME || '~', '.config', 'opencode', 'plugins', 'skill-evolution', 'data')

describe('telemetry', () => {
  beforeEach(() => {
    // Clean test data
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    // Clean up after tests
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true })
    }
  })

  test('logInvocation creates file', async () => {
    const entry: TelemetryEntry = {
      id: 'test-1',
      skill: '/test-skill',
      timestamp: new Date().toISOString(),
      context: 'test context',
      confidence: 0.8,
      outcome: 'success',
      filesReferenced: [],
      sessionSlug: 'test-session'
    }

    await logInvocation(entry)

    const path = join(TEST_DATA_DIR, 'telemetry.jsonl')
    expect(existsSync(path)).toBe(true)
  })

  test('loadTelemetry returns entries', async () => {
    const entry: TelemetryEntry = {
      id: 'test-2',
      skill: '/test-skill',
      timestamp: new Date().toISOString(),
      context: 'test context',
      confidence: 0.8,
      outcome: 'success',
      filesReferenced: [],
      sessionSlug: 'test-session'
    }

    await logInvocation(entry)
    const entries = await loadTelemetry()

    expect(entries.length).toBe(1)
    expect(entries[0].skill).toBe('/test-skill')
  })

  test('aggregateMetrics calculates correct stats', async () => {
    const entries: TelemetryEntry[] = [
      {
        id: 'test-3',
        skill: '/skill-a',
        timestamp: new Date().toISOString(),
        context: 'context a',
        confidence: 0.9,
        outcome: 'success',
        filesReferenced: [],
        sessionSlug: 'test'
      },
      {
        id: 'test-4',
        skill: '/skill-a',
        timestamp: new Date().toISOString(),
        context: 'context b',
        confidence: 0.7,
        outcome: 'failure',
        filesReferenced: [],
        sessionSlug: 'test'
      }
    ]

    for (const entry of entries) {
      await logInvocation(entry)
    }

    const metrics = await aggregateMetrics()

    expect(metrics['/skill-a']).toBeDefined()
    expect(metrics['/skill-a'].invocations).toBe(2)
    expect(metrics['/skill-a'].successRate).toBe(0.5)
    expect(metrics['/skill-a'].avgConfidence).toBe(0.8)
  })
})