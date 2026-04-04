# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OpenCode Runtime                              │
│                                                                      │
│  session.start ─────────────────────────────────────────────────►   │
│  tool.execute.after ────────────────────────────────────────────►   │
│  session.compacted ─────────────────────────────────────────────►   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Plugin Entry Point                              │
│                         src/index.ts                                 │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ session.start                                                 │    │
│  │ ├─ loadConfig()                                               │    │
│  │ ├─ recommendSkills(task, projectSlug)                         │    │
│  │ │   ├─ getEmbedder() → embed(task)                            │    │
│  │ │   ├─ aggregateMetrics()                                     │    │
│  │ │   ├─ searchLearningsByEmbedding(embedding)                  │    │
│  │ │   └─ Score skills, return top K                             │    │
│  │ └─ client.app.log(recommendations)                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ tool.execute.after                                            │    │
│  │ ├─ Create TelemetryEntry                                      │    │
│  │ │   ├─ generateId()                                           │    │
│  │ │   ├─ extractFiles(input)                                    │    │
│  │ │   └─ Determine outcome from output                          │    │
│  │ ├─ logInvocation(entry)                                       │    │
│  │ └─ saveMetrics(aggregateMetrics())                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ session.compacted                                             │    │
│  │ ├─ extractPatterns(sessionSlug)                               │    │
│  │ │   └─ Analyze telemetry for recurring patterns               │    │
│  │ ├─ saveLearning(pattern) for each                             │    │
│  │ └─ pruneStaleLearnings() (10% chance)                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Core Modules                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   Telemetry      │  │   Recommender    │  │   Consolidator   │   │
│  │                  │  │                  │  │                  │   │
│  │ logInvocation()  │  │ recommendSkills()│  │ extractPatterns()│   │
│  │ loadTelemetry()  │  │ getAvailableSkills() │ saveLearning() │   │
│  │ aggregateMetrics │  │                  │  │ pruneStale()     │   │
│  │ saveMetrics()    │  │                  │  │ searchByEmbed()  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│           │                    │                    │                │
│           └────────────────────┼────────────────────┘                │
│                                │                                     │
│                                ▼                                     │
│                    ┌──────────────────┐                              │
│                    │     Embedder     │                              │
│                    │                  │                              │
│                    │ embed(text)      │                              │
│                    │ similarity(a, b) │                              │
│                    └──────────────────┘                              │
│                           /          \                                │
│                          /            \                               │
│            ┌─────────────────┐  ┌─────────────────┐                  │
│            │ Transformers.js │  │     TF-IDF      │                  │
│            │                 │  │                 │                  │
│            │ 68% MTEB        │  │ Basic fallback  │                  │
│            │ ~30MB download  │  │ Zero deps       │                  │
│            └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ~/.config/opencode/plugins/skill-evolution/                         │
│  ├── config.json          # User configuration                       │
│  └── data/                                                          │
│      ├── telemetry.jsonl  # Invocation logs (append-only)           │
│      ├── learnings.jsonl  # Extracted patterns (append-only)        │
│      └── skill-metrics.json # Aggregated statistics                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Formats

### TelemetryEntry

```typescript
interface TelemetryEntry {
  id: string           // "inv-abc123-def456"
  skill: string        // "/qa", "/ship", etc.
  timestamp: string    // ISO 8601
  context: string      // Task context (truncated to 200 chars)
  confidence: number   // 0.0 - 1.0
  outcome: 'success' | 'failure' | 'partial'
  userSignal?: 'accept' | 'reject' | 'edit'
  filesReferenced: string[]
  sessionSlug: string
}
```

### Learning

```typescript
interface Learning {
  pattern: string      // Description of the pattern
  confidence: number   // 1-10 scale
  source: string       // Session ID
  skills: string[]     // Related skills
  files: string[]      // Referenced files
  timestamp: string    // ISO 8601
  embedding?: number[] // 384-dim vector (optional)
}
```

### SkillMetrics

```typescript
interface SkillMetrics {
  invocations: number
  successRate: number      // 0.0 - 1.0
  avgConfidence: number   // 0.0 - 1.0
  lastUsed: string        // ISO 8601
  topContexts: string[]   // Top 5 contexts
  correctionRate: number  // 0.0 - 1.0
  recentTrend: 'improving' | 'stable' | 'declining'
}
```

## Recommendation Algorithm

### Scoring Formula

```typescript
score = (successRate * 0.4) +
        (learningMatch * 0.3) +
        (avgConfidence * 0.2) -
        (correctionRate * 0.1)

where:
  successRate    = invocations.success / invocations.total
  learningMatch  = matchingLearnings / totalLearnings
  avgConfidence  = average confidence from telemetry
  correctionRate = corrections / invocations.total
```

### Ranking

1. Embed task context using configured backend
2. Search learnings by cosine similarity
3. Filter skills above `minConfidence` threshold
4. Sort by score descending
5. Return top `topK` results

## Embedder Selection

```
┌─────────────────────────────────────────────────────────┐
│                    config.backend                        │
│                                                          │
│   "auto" ──► Try Transformers.js                         │
│              │                                           │
│              ├─ Success ──► Use Transformers.js          │
│              │                                           │
│              └─ Fail ──► Fall back to TF-IDF             │
│                                                          │
│   "transformers" ──► Force Transformers.js               │
│   "tfidf" ──► Force TF-IDF                               │
└─────────────────────────────────────────────────────────┘
```

### Transformers.js Backend

- Model: `Xenova/all-MiniLM-L6-v2` (384 dimensions)
- Auto-downloads to HuggingFace cache on first use
- ~30MB model size
- Runs entirely locally (no API calls)

### TF-IDF Backend

- Vocabulary built from telemetry + config
- Basic term frequency / inverse document frequency
- 1000 dimensions (configurable)
- Always available as fallback

## Plugin Hooks

### session.start

**Trigger**: New conversation session begins

**Input**:
```typescript
{
  projectSlug?: string
  task?: string
}
```

**Behavior**:
1. Load configuration
2. If `showOnSessionStart` and task provided:
   - Embed task context
   - Search learnings
   - Log recommendations to client

### tool.execute.after

**Trigger**: Tool execution completes

**Input**:
```typescript
{
  tool: string          // Tool name (e.g., "/qa")
  input: unknown        // Tool input
  output: unknown       // Tool output
  confidence?: number   // Optional confidence score
}
```

**Behavior**:
1. Filter to skills only (tools starting with `/`)
2. Create telemetry entry
3. Append to telemetry.jsonl
4. Update skill-metrics.json

### session.compacted

**Trigger**: Session context is compressed

**Input**:
```typescript
{
  sessionSlug?: string
}
```

**Behavior**:
1. Extract patterns from session telemetry
2. Save patterns as learnings
3. With 10% probability: prune stale learnings

## Staleness Detection

A learning is considered stale when:

1. **File deleted**: Any referenced file no longer exists
2. **Low confidence**: Confidence drops below threshold
3. **Age**: Older than `maxTelemetryAge` days

```typescript
async function pruneStaleLearnings(): Promise<number> {
  const learnings = await loadLearnings()
  const metrics = await loadMetrics()
  
  const stale = learnings.filter(l => 
    l.confidence < 3 ||
    l.files.some(f => !existsSync(f)) ||
    isOlderThan(l.timestamp, 30)
  )
  
  // Remove stale learnings
  await saveLearnings(learnings.filter(l => !stale.includes(l)))
  return stale.length
}
```

## Configuration Schema

```typescript
interface PluginConfig {
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
  data: {
    maxTelemetryAge: number
    maxLearnings: number
    stalenessThreshold: number
  }
}
```

## Performance Considerations

| Operation | Time | Memory |
|-----------|------|--------|
| Embed (Transformers.js) | ~50ms | ~100MB (model) |
| Embed (TF-IDF) | ~5ms | ~1MB |
| Search learnings (100) | ~10ms | ~1MB |
| Aggregate metrics (1000) | ~20ms | ~5MB |
| Full recommendation | ~100ms | ~100MB |

## Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| Embedder | Fall back to TF-IDF |
| Config | Use defaults |
| Telemetry | Silent failure, log to file |
| Learnings | Skip corrupted entries |
| Recommendations | Return empty array |

## Security

- **No PII**: Only file paths, skill names, timestamps stored
- **Local-only**: No external API calls
- **No telemetry sent**: All data stays on user's machine
- **File permissions**: Respects OS file permissions
