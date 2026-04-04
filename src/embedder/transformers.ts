import { pipeline } from '@xenova/transformers'
import { Embedder } from '../types'
import { cosineSimilarity } from '../utils'
import { getDataDir } from '../utils'

export class TransformersEmbedder implements Embedder {
  private pipe: Awaited<ReturnType<typeof pipeline>> | null = null

  static async create(): Promise<TransformersEmbedder> {
    const embedder = new TransformersEmbedder()
    const modelDir = getDataDir()
    embedder.pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      cache_dir: modelDir,
    })
    return embedder
  }

  async embed(text: string): Promise<number[]> {
    if (!this.pipe) {
      throw new Error('Embedder not initialized')
    }
    const output = await this.pipe(text, { pooling: 'mean', normalize: true })
    return Array.from(output.data as Float32Array)
  }

  similarity(a: number[], b: number[]): number {
    return cosineSimilarity(a, b)
  }
}