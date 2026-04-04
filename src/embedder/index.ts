import { Embedder } from '../types'
import { TransformersEmbedder } from './transformers'
import { TfIdfEmbedder } from './tfidf'
import { loadConfig } from '../config'

export async function getEmbedder(): Promise<Embedder> {
  const config = await loadConfig()

  if (config.embedding.backend === 'auto') {
    // Try transformers.js (auto-downloads model)
    try {
      return await TransformersEmbedder.create()
    } catch (err) {
      console.error('[skill-evolution] Transformers.js failed, falling back to TF-IDF:', err)
      return new TfIdfEmbedder()
    }
  }

  if (config.embedding.backend === 'transformers') {
    return await TransformersEmbedder.create()
  }

  return new TfIdfEmbedder()
}