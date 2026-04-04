# AI Coding Agent Guidelines

## Build Commands

```bash
bun run build          # Build to dist/
bun run dev            # Build with watch mode
bun run clean          # Remove dist/
bun run rebuild        # Clean + build
```

## Test Commands

```bash
bun test                      # Run all tests
bun test src/index.test.ts    # Run specific test file
bun test --watch              # Watch mode
```

## Code Style

### Imports

```typescript
// 1. External packages (alphabetical)
import type { Plugin, PluginInput } from '@opencode-ai/plugin'
import { glob } from 'glob'

// 2. Internal modules (alphabetical)
import { loadConfig } from './config'
import { generateId, extractFiles } from './utils'
```

- Use `import type` for type-only imports
- Use ESM syntax (no CommonJS `require`)
- Group external imports first, then internal
- Alphabetical ordering within groups

### Formatting

- Indent: 2 spaces
- Semicolons: Required
- Quotes: Single for strings, double for JSON
- Trailing commas: ES5-compatible (arrays/objects only)
- Max line width: 100 characters

### Types

```typescript
// Prefer interfaces for object shapes
export interface TelemetryEntry {
  id: string
  skill: string
  timestamp: string
  confidence: number
  outcome: 'success' | 'failure' | 'partial'
}

// Use type for unions, primitives, and utility types
type Outcome = 'success' | 'failure' | 'partial'
type MetricsMap = Record<string, SkillMetrics>

// Explicit return types for public functions
export async function logInvocation(entry: TelemetryEntry): Promise<void> {
  // ...
}

// Use type inference for internal functions
const embed = async (text: string) => {
  // ...
}
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | camelCase | `telemetry.ts`, `skillMetrics.ts` |
| Classes | PascalCase | `TfIdfEmbedder` |
| Interfaces | PascalCase | `TelemetryEntry`, `PluginConfig` |
| Functions | camelCase | `logInvocation`, `aggregateMetrics` |
| Constants | camelCase | `DATA_DIR`, `CONFIG_FILE` |
| Private methods | camelCase | No prefix needed |

### Error Handling

```typescript
// Graceful degradation - don't throw for expected failures
export async function loadConfig(): Promise<PluginConfig> {
  if (!existsSync(CONFIG_FILE)) {
    return defaultConfig  // Return default, not throw
  }

  try {
    const content = await readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return defaultConfig  // Fallback on error
  }
}

// Throw for programming errors (unreachable states, invalid args)
function validateId(id: string): void {
  if (!id.startsWith('inv-')) {
    throw new Error(`Invalid telemetry ID: ${id}`)
  }
}
```

### Async Patterns

```typescript
// Prefer async/await over .then()
// Good
const result = await embedder.embed(text)

// Avoid
embedder.embed(text).then(result => { })

// Parallel operations with Promise.all
const [metrics, learnings] = await Promise.all([
  aggregateMetrics(),
  loadLearnings(),
])
```

### File Organization

```
src/
├── index.ts           # Plugin entry point, exports
├── types.ts           # All interfaces, types, defaults
├── config.ts          # Configuration loading
├── utils.ts           # Shared utilities
├── telemetry.ts       # Telemetry logging
├── recommender.ts     # Skill recommendation engine
├── consolidator.ts    # Learning extraction
├── embedder/
│   ├── index.ts       # Auto-detect embedder
│   ├── transformers.ts # Transformers.js backend
│   └── tfidf.ts       # TF-IDF fallback
└── *.test.ts          # Test files (same directory)
```

### Module Exports

```typescript
// Named exports for utilities
export { generateId, extractFiles, cosineSimilarity }

// Default export for main plugin
export default SkillEvolutionPlugin

// Also export named for flexibility
export { SkillEvolutionPlugin }
```

## Testing

### Test File Naming

- Place tests alongside source: `src/utils.test.ts`
- Pattern: `<module>.test.ts`

### Test Structure

```typescript
import { describe, test, expect, beforeEach } from 'bun:test'

describe('ModuleName', () => {
  let subject: SubjectType

  beforeEach(() => {
    subject = new SubjectType()
  })

  test('should do something specific', async () => {
    const result = await subject.doSomething()
    expect(result).toBe(expectedValue)
  })
})
```

### Assertions

```typescript
// Prefer specific matchers
expect(value).toBe(true)           // Exact equality
expect(value).toEqual({ a: 1 })    // Deep equality
expect(fn).toThrow()               // Error thrown
expect(array).toContain('item')    // Array contains
expect(num).toBeGreaterThan(0)     // Numeric comparison
expect(num).toBeCloseTo(1.0, 5)    // Floating point
```

## Plugin Architecture

### Hooks

```typescript
const Plugin: Plugin = async (ctx: PluginInput) => {
  const { client, project } = ctx

  return {
    'session.start': async (input) => { },
    'tool.execute.after': async (context) => { },
    'session.compacted': async (context) => { },
  }
}
```

### Data Storage

- Config: `~/.config/opencode/plugins/skill-evolution/config.json`
- Data: `~/.config/opencode/plugins/skill-evolution/data/`
- Use `getDataPath()` utility for data files

## Commit Conventions

This project uses conventional commits for automated releases:

| Type | Version Bump | Example |
|------|--------------|---------|
| `feat:` | Minor | `feat: add new embedding backend` |
| `fix:` | Patch | `fix: handle missing config gracefully` |
| `feat!:` | Major | `feat!: redesign config schema` |
| `docs:` | None | `docs: update README` |
| `chore:` | None | `chore: update dependencies` |
| `test:` | None | `test: add telemetry coverage` |

## CI/CD

- **PR checks**: Build, test, commitlint
- **Release**: Merge to main creates Release PR, merging publishes to npm
- **Branch protection**: main requires PR, status checks required
