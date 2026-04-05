import type { Plugin, PluginInput } from '@opencode-ai/plugin'
import { logInvocation, aggregateMetrics, saveMetrics } from './telemetry'
import { recommendSkills } from './recommender'
import { extractPatterns, saveLearning, pruneStaleLearnings } from './consolidator'
import { loadConfig } from './config'
import { generateId, extractFiles } from './utils'

const VERSION = '1.0.1'

const SkillEvolutionPlugin: Plugin = async (ctx: PluginInput) => {
  const { client } = ctx

  client.app.log(`[skill-evolution] Plugin loaded v${VERSION}`)

  return {
    'session.start': async (input: { projectSlug?: string; task?: string }) => {
      const config = await loadConfig()

      if (config.recommendations.showOnSessionStart && input.task) {
        const projectSlug = input.projectSlug || 'default'
        const recommendations = await recommendSkills(input.task, projectSlug)

        if (recommendations.length > 0) {
          client.app.log('[skill-evolution] Suggested skills:')
          for (const r of recommendations) {
            const reason = r.reason ? ` (${r.reason})` : ''
            client.app.log(`  /${r.skill} - ${(r.score * 100).toFixed(0)}%${reason}`)
          }
        }
      }
    },

    'tool.execute.after': async (context: {
      tool: string
      input: unknown
      output: unknown
      confidence?: number
    }) => {
      if (!context.tool.startsWith('/')) return

      const entry = {
        id: generateId(),
        skill: context.tool,
        timestamp: new Date().toISOString(),
        context: JSON.stringify(context.input).slice(0, 200),
        confidence: context.confidence ?? 0.8,
        outcome: context.output && typeof context.output === 'object' && 'error' in context.output ? 'failure' : 'success',
        filesReferenced: extractFiles(context.input),
        sessionSlug: process.env.SESSION_SLUG || 'unknown',
      }

      await logInvocation(entry)

      const metrics = await aggregateMetrics()
      await saveMetrics(metrics)
    },

    'session.compacted': async (context: { sessionSlug?: string }) => {
      const sessionSlug = context.sessionSlug || process.env.SESSION_SLUG || 'unknown'
      const patterns = await extractPatterns(sessionSlug)

      for (const pattern of patterns) {
        await saveLearning(pattern)
      }

      if (Math.random() < 0.1) {
        const pruned = await pruneStaleLearnings()
        if (pruned > 0) {
          client.app.log(`[skill-evolution] Pruned ${pruned} stale learnings`)
        }
      }
    },
  }
}

export default SkillEvolutionPlugin
export { SkillEvolutionPlugin }