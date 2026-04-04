# opencode-skill-evolution

[![npm version](https://img.shields.io/npm/v/opencode-skill-evolution.svg)](https://www.npmjs.com/package/opencode-skill-evolution)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OpenCode plugin that **learns from your skill usage** and **suggests relevant skills automatically**.

## Features

- 🎯 **Proactive Recommendations** - Suggests skills at session start based on context
- 📊 **Usage Telemetry** - Tracks skill invocations, success rates, and patterns
- 🧠 **Learning Engine** - Extracts patterns from corrections and approvals
- 🔍 **Semantic Search** - k-NN matching using local embeddings (zero-config)
- 🔄 **Auto-Updates** - Improves skill descriptions based on accumulated learning

## Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-skill-evolution@latest"]
}
```

**That's it!** The plugin works out of the box with zero configuration.

## How It Works

### 1. Telemetry (Automatic)

Every skill invocation is logged:
- Skill name and context
- Success/failure outcome
- Confidence score
- Files referenced

### 2. Recommendations

On session start, the plugin:
1. Embeds your task context
2. Searches learned patterns
3. Scores available skills by relevance + success rate
4. Suggests top 3 skills

### 3. Learning

After each session:
- Patterns extracted from corrections
- Stale learnings pruned
- Skill descriptions updated (if enabled)

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
    "enabled": true,
    "descriptionThreshold": 5,
    "exampleConfidence": 8,
    "requireApprovalForPrompts": true
  }
}
```

### Embedding Backends

| Backend | Quality | Setup |
|---------|---------|-------|
| `auto` (default) | Best available | Zero-config |
| `transformers` | Good (68% MTEB) | Auto-downloads model |
| `tfidf` | Basic | Always available |

## Data Storage

All data stored locally in `~/.config/opencode/plugins/skill-evolution/data/`:

| File | Purpose |
|------|---------|
| `telemetry.jsonl` | Invocation logs |
| `learnings.jsonl` | Extracted patterns |
| `skill-metrics.json` | Aggregated stats |

## Development

```bash
# Clone
git clone https://github.com/bigknoxy/opencode-skill-evolution.git
cd opencode-skill-evolution

# Install
bun install

# Build
bun run build

# Test locally
# Add to opencode.json: { "plugin": ["file:///path/to/opencode-skill-evolution"] }
```

## License

MIT © bigknoxy