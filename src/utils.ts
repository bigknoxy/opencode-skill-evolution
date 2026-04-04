import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.env.HOME || '~', '.config', 'opencode', 'plugins', 'skill-evolution', 'data')

export function generateId(): string {
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function getDataPath(filename: string): string {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  return join(DATA_DIR, filename)
}

export function getDataDir(): string {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  return DATA_DIR
}

export function extractFiles(input: unknown): string[] {
  const files: string[] = []

  if (typeof input === 'string') {
    const matches = input.match(/[\w/.-]+\.(ts|js|tsx|jsx|py|go|rs|md|json)/g)
    if (matches) files.push(...matches)
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      for (const item of input) {
        files.push(...extractFiles(item))
      }
    } else {
      for (const value of Object.values(input as Record<string, unknown>)) {
        files.push(...extractFiles(value))
      }
    }
  }

  return [...new Set(files)]
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom > 0 ? dot / denom : 0
}