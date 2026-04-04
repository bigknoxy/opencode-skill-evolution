# Contributing

## Development Setup

```bash
# Clone the repository
git clone https://github.com/bigknoxy/opencode-skill-evolution.git
cd opencode-skill-evolution

# Install dependencies
bun install

# Build
bun run build

# Run tests
bun test

# Watch mode for development
bun run dev
```

## Project Structure

```
opencode-skill-evolution/
├── src/
│   ├── index.ts           # Plugin entry point
│   ├── types.ts           # TypeScript interfaces
│   ├── config.ts          # Configuration management
│   ├── utils.ts           # Utility functions
│   ├── telemetry.ts       # Usage logging
│   ├── recommender.ts     # Skill recommendation
│   ├── consolidator.ts    # Learning extraction
│   ├── embedder/
│   │   ├── index.ts       # Embedder factory
│   │   ├── transformers.ts # Transformers.js backend
│   │   └── tfidf.ts       # TF-IDF backend
│   └── *.test.ts          # Test files
├── .github/
│   └── workflows/
│       ├── ci.yml         # PR checks
│       ├── release-please.yml # Automated releases
│       └── publish.yml    # npm publishing
├── package.json
├── tsconfig.json
├── AGENTS.md              # Agent guidelines
├── ARCHITECTURE.md        # Technical documentation
└── README.md              # User documentation
```

## Code Style

See [AGENTS.md](./AGENTS.md) for detailed code style guidelines.

### Key Points

- **Language**: TypeScript with strict mode
- **Runtime**: Bun (build and test)
- **Imports**: ESM with type imports
- **Formatting**: 2-space indent, semicolons required
- **Testing**: Bun test framework

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description | Version Impact |
|------|-------------|----------------|
| `feat:` | New feature | Minor bump |
| `fix:` | Bug fix | Patch bump |
| `feat!:` | Breaking change | Major bump |
| `docs:` | Documentation only | None |
| `test:` | Tests only | None |
| `chore:` | Maintenance | None |
| `refactor:` | Code refactoring | None |
| `perf:` | Performance improvement | None |

### Examples

```bash
feat: add Ollama embedding backend
fix: handle missing config directory gracefully
docs: update architecture diagram
test: add tests for cosine similarity
chore: update dependencies
```

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feat/your-feature-name
```

### 2. Make Changes

- Follow code style guidelines
- Add/update tests
- Update documentation if needed

### 3. Commit

```bash
git add .
git commit -m "feat: your feature description"
```

### 4. Push and Create PR

```bash
git push origin feat/your-feature-name
gh pr create --title "feat: your feature" --body "Description"
```

### 5. CI Checks

PRs require:
- Build passes
- Tests pass
- Commit message follows convention

### 6. Merge

PRs are merged by maintainers after review.

## Release Process

Releases are automated via [release-please](https://github.com/googleapis/release-please):

1. **PR merged to main** → Release-please creates a "Release PR"
2. **Release PR merged** → GitHub Release created
3. **GitHub Release** → Automated npm publish

### Manual Release (Maintainers Only)

If automated release fails:

```bash
# Ensure you're on main with latest
git checkout main
git pull

# Build and test
bun run build
bun test

# Bump version manually
npm version patch  # or minor, or major

# Create GitHub release
gh release create v$(node -p "require('./package.json').version")

# Publish to npm
npm publish --access public
```

## Testing

### Run All Tests

```bash
bun test
```

### Run Specific Test

```bash
bun test src/utils.test.ts
```

### Run with Coverage

```bash
bun test --coverage
```

### Test Structure

```typescript
import { describe, test, expect, beforeEach } from 'bun:test'

describe('MyModule', () => {
  test('should do something', () => {
    expect(true).toBe(true)
  })
})
```

## Adding New Features

### Adding a New Embedder

1. Create `src/embedder/my-embedder.ts`:

```typescript
import type { Embedder } from '../types'

export class MyEmbedder implements Embedder {
  async embed(text: string): Promise<number[]> {
    // Implementation
  }

  similarity(a: number[], b: number[]): number {
    return cosineSimilarity(a, b)
  }
}
```

2. Add to `src/embedder/index.ts`:

```typescript
import { MyEmbedder } from './my-embedder'

export async function getEmbedder(): Promise<Embedder> {
  // Add logic to select embedder
}
```

3. Add tests in `src/embedder/my-embedder.test.ts`

### Adding a New Hook

1. Update `src/index.ts`:

```typescript
return {
  // ...existing hooks
  'new.hook': async (context) => {
    // Implementation
  },
}
```

2. Update `package.json` opencode.hooks array

3. Add documentation in README.md

## Debugging

### Local Development

```bash
# Add local plugin to opencode.json
{
  "plugin": ["file:///path/to/opencode-skill-evolution"]
}

# Watch for changes
bun run dev
```

### Logs

Plugin logs to OpenCode's log stream:

```typescript
client.app.log('[skill-evolution] Message')
```

### Data Inspection

```bash
# View telemetry
cat ~/.config/opencode/plugins/skill-evolution/data/telemetry.jsonl | jq

# View learnings
cat ~/.config/opencode/plugins/skill-evolution/data/learnings.jsonl | jq

# View metrics
cat ~/.config/opencode/plugins/skill-evolution/data/skill-metrics.json | jq
```

## Questions?

- Open an issue: https://github.com/bigknoxy/opencode-skill-evolution/issues
- Read the docs: [README.md](./README.md), [ARCHITECTURE.md](./ARCHITECTURE.md)
