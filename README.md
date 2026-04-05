# opencode-skill-evolution

[![npm version](https://img.shields.io/npm/v/opencode-skill-evolution.svg)](https://www.npmjs.com/package/opencode-skill-evolution)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/bigknoxy/opencode-skill-evolution/workflows/CI/badge.svg)](https://github.com/bigknoxy/opencode-skill-evolution/actions/workflows/ci.yml)

OpenCode plugin that **learns from your skill usage** and **suggests relevant skills automatically**.

---

## Why This Plugin?

OpenCode has dozens of skills (`/browse`, `/qa`, `/ship`, etc.), but remembering which skill to use and when is cognitive overhead. This plugin solves that by:

1. **Learning from your patterns** - Tracks which skills you use in which contexts
2. **Suggesting proactively** - Recommends skills at session start based on task context
3. **Improving over time** - Extracts patterns from corrections and approvals

---

## Quick Start

### Install

**Recommended: Use the OpenCode CLI**

```bash
opencode plugin opencode-skill-evolution@latest --global
```

This command:
1. Installs the plugin to `~/.cache/opencode/node_modules/`
2. Updates your `opencode.json` automatically
3. Works immediately on next OpenCode restart

**Alternative: Manual config edit**

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-skill-evolution@latest"]
}
```

Then **restart OpenCode completely** (not just a new session - kill and restart the server).

### Verify Installation

When you start a new OpenCode session, you should see:

```
[skill-evolution] Plugin loaded v1.0.1
```

If you don't see this message, the plugin isn't loaded. Run `opencode plugin opencode-skill-evolution@latest --global` to fix.

**That's it!** The plugin works out of the box with zero configuration.

### What Happens Next

1. **On session start** - Plugin loads and prepares recommendations
2. **During session** - Skill invocations are logged automatically
3. **On session end** - Patterns extracted, stale learnings pruned
4. **Next session** - Recommendations improve based on history

---

## Features

| Feature | Description | Default |
|---------|-------------|---------|
| **Proactive Recommendations** | Suggests skills at session start | Enabled |
| **Usage Telemetry** | Tracks skill invocations, success rates, patterns | Enabled |
| **Learning Engine** | Extracts patterns from corrections and approvals | Enabled |
| **Semantic Search** | k-NN matching using local embeddings | Enabled |
| **Auto-Update Descriptions** | Improves skill descriptions based on learning | Disabled |

---

## How It Works

### 1. Telemetry (Automatic)

Every skill invocation is logged to `telemetry.jsonl`:

```json
{
  "id": "abc123",
  "skill": "/qa",
  "timestamp": "2026-04-04T10:30:00Z",
  "context": "Testing authentication flow",
  "success": true,
  "confidence": 0.85,
  "files": ["src/auth/login.ts", "src/auth/session.ts"]
}
```

### 2. Recommendations

On session start, the plugin:

1. **Embeds task context** - Converts your task to a vector
2. **Searches patterns** - Finds similar past invocations
3. **Scores skills** - Ranks by relevance × success rate
4. **Suggests top K** - Shows 3 most relevant skills

### 3. Learning

After each session:

- **Pattern extraction** - Identifies recurring skill+context combinations
- **Confidence adjustment** - Increases weight for successful patterns
- **Staleness detection** - Prunes patterns referencing deleted files
- **Description updates** - (optional) Improves skill descriptions

---

## Configuration

Optional config at `~/.config/opencode/plugins/skill-evolution/config.json`:

```json
{
  "embedding": {
    "backend": "auto",
    "modelCache": true
  },
  "recommendations": {
    "topK": 3,
    "minConfidence": 0.6,
    "showInline": true,
    "showOnSessionStart": true
  },
  "autoUpdate": {
    "enabled": false,
    "descriptionThreshold": 5,
    "exampleConfidence": 8,
    "requireApprovalForPrompts": true
  },
  "data": {
    "maxTelemetryAge": 30,
    "maxLearnings": 1000,
    "stalenessThreshold": 20
  }
}
```

### Embedding Backends

| Backend | Quality | Setup | When to Use |
|---------|---------|-------|-------------|
| `auto` (default) | Best available | Zero-config | Most users |
| `transformers` | Good (68% MTEB) | Auto-downloads ~30MB model | Offline, privacy |
| `tfidf` | Basic | Always available | Fallback, minimal deps |

---

## Data Storage

All data stored locally in `~/.config/opencode/plugins/skill-evolution/data/`:

| File | Purpose | Format |
|------|---------|--------|
| `telemetry.jsonl` | Invocation logs | JSON Lines |
| `learnings.jsonl` | Extracted patterns | JSON Lines |
| `skill-metrics.json` | Aggregated stats | JSON |

### Privacy

- **No external API calls** - Embeddings run locally
- **No telemetry sent** - All data stays on your machine
- **No PII collected** - Only skill names, files, and timestamps

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Session                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Plugin Hooks                               │
│                                                              │
│  session.start ────► Recommender ────► Show suggestions     │
│  tool.execute.after ► Telemetry ────► Log invocation        │
│  session.compacted ► Consolidator ──► Extract learnings     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Modules                              │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Telemetry   │  │ Recommender │  │ Consolidator│          │
│  │             │  │             │  │             │          │
│  │ • Log       │  │ • Embed     │  │ • Extract   │          │
│  │ • Aggregate │  │ • Search    │  │ • Prune     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          ▼                                   │
│                  ┌─────────────┐                             │
│                  │   Embedder  │                             │
│                  │             │                             │
│                  │ Transformers│                             │
│                  │ (or TF-IDF) │                             │
│                  └─────────────┘                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│                                                              │
│  telemetry.jsonl  learnings.jsonl  skill-metrics.json       │
└─────────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

---

## Development

```bash
# Clone
git clone https://github.com/bigknoxy/opencode-skill-evolution.git
cd opencode-skill-evolution

# Install
bun install

# Build
bun run build

# Test
bun test

# Test locally
# Add to opencode.json: { "plugin": ["file:///path/to/opencode-skill-evolution"] }
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code style guide
- Commit conventions
- PR workflow

---

## Release Process

This project uses [release-please](https://github.com/googleapis/release-please) for automated releases:

1. **Merge PR to main** → release-please creates a "Release PR"
2. **Merge Release PR** → GitHub Release created
3. **GitHub Release** → npm publish automatically

### Commit Conventions

| Type | Example | Version Bump |
|------|---------|--------------|
| `feat:` | `feat: add new embedding backend` | Minor |
| `fix:` | `fix: handle missing config gracefully` | Patch |
| `feat!:` | `feat!: redesign config schema` | Major |
| `docs:` | `docs: update README` | None |
| `chore:` | `chore: update dependencies` | None |

---

## License

MIT © [bigknoxy](https://github.com/bigknoxy)

---

## Acknowledgments

- Research inspired by "Memory in the Age of AI Agents" (arXiv:2512.13564)
- Embeddings powered by [Transformers.js](https://huggingface.co/docs/transformers.js)
- Built for [OpenCode](https://opencode.ai)
