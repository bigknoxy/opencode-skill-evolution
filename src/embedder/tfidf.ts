import { Embedder } from '../types'
import { cosineSimilarity } from '../utils'

export class TfIdfEmbedder implements Embedder {
  private vocab: Map<string, number> = new Map()
  private idf: Map<string, number> = new Map()
  private documentCount = 0

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
  }

  termFreq(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>()
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1)
    }
    return tf
  }

  async embed(text: string): Promise<number[]> {
    const tokens = this.tokenize(text)
    if (tokens.length === 0) {
      return []
    }

    const tf = this.termFreq(tokens)

    this.documentCount++
    const seen = new Set(tokens)
    for (const t of seen) {
      this.idf.set(t, (this.idf.get(t) || 0) + 1)
    }

    const vec: number[] = []
    for (const [term, freq] of tf) {
      const idx = this.vocab.get(term) ?? this.vocab.size
      this.vocab.set(term, idx)
      const idfVal = Math.log((this.documentCount + 1) / (this.idf.get(term)! + 1)) + 1
      vec[idx] = freq * idfVal
    }

    return this.normalize(vec)
  }

  normalize(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0))
    return norm > 0 ? vec.map(v => v / norm) : vec
  }

  similarity(a: number[], b: number[]): number {
    const maxLen = Math.max(a.length, b.length)
    const aPadded = [...a, ...new Array(maxLen - a.length).fill(0)]
    const bPadded = [...b, ...new Array(maxLen - b.length).fill(0)]
    return cosineSimilarity(aPadded, bPadded)
  }
}