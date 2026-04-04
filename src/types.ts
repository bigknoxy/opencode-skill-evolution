export interface TelemetryEntry {
  id: string
  skill: string
  timestamp: string
  context: string
  confidence: number
  outcome: 'success' | 'failure' | 'partial'
  userSignal?: 'accept' | 'reject' | 'edit'
  filesReferenced: string[]
  sessionSlug: string
}

export interface SkillMetrics {
  invocations: number
  successRate: number
  avgConfidence: number
  lastUsed: string
  topContexts: string[]
  correctionRate: number
  recentTrend: 'improving' | 'stable' | 'declining'
}

export interface Learning {
  pattern: string
  confidence: number
  source: string
  skills: string[]
  files: string[]
  timestamp: string
  embedding?: number[]
}

export interface Recommendation {
  skill: string
  score: number
  reason?: string
  confidence: number
}

export interface Embedder {
  embed(text: string): Promise<number[]>
  similarity(a: number[], b: number[]): number
}

export interface PluginConfig {
  embedding: {
    backend: 'auto' | 'transformers' | 'ollama' | 'tfidf'
    ollamaUrl?: string
    modelCache: boolean
  }
  recommendations: {
    topK: number
    minConfidence: number
    showInline: boolean
    showOnSessionStart: boolean
  }
  autoUpdate: {
    enabled: boolean
    descriptionThreshold: number
    exampleConfidence: number
    requireApprovalForPrompts: boolean
  }
}

export const defaultConfig: PluginConfig = {
  embedding: {
    backend: 'auto',
    modelCache: true
  },
  recommendations: {
    topK: 3,
    minConfidence: 0.6,
    showInline: true,
    showOnSessionStart: true
  },
  autoUpdate: {
    enabled: true,
    descriptionThreshold: 5,
    exampleConfidence: 8,
    requireApprovalForPrompts: true
  }
}