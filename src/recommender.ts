import { Recommendation, Learning, SkillMetrics } from './types'
import { getEmbedder } from './embedder'
import { aggregateMetrics } from './telemetry'
import { searchLearningsByEmbedding, loadLearnings } from './consolidator'
import { loadConfig } from './config'
import { glob } from 'glob'
import { readFile, existsSync } from 'fs'
import { join } from 'path'

export async function getAvailableSkills(): Promise<string[]> {
  const skills: string[] = []

  // Check global skills
  const globalSkillsDir = join(process.env.HOME || '~', '.config', 'opencode', 'skills')
  if (existsSync(globalSkillsDir)) {
    const files = await glob('**/SKILL.md', { cwd: globalSkillsDir })
    skills.push(...files.map(f => f.replace('/SKILL.md', '')))
  }

  // Check project skills
  const projectSkillsDir = '.opencode/skills'
  if (existsSync(projectSkillsDir)) {
    const files = await glob('**/SKILL.md', { cwd: projectSkillsDir })
    skills.push(...files.map(f => f.replace('/SKILL.md', '')))
  }

  return [...new Set(skills)]
}

export async function recommendSkills(context: string, _projectSlug: string): Promise<Recommendation[]> {
  const config = await loadConfig()
  const embedder = await getEmbedder()

  // Embed current context
  const contextEmbedding = await embedder.embed(context)

  // Load skill metrics
  const metrics = await aggregateMetrics()

  // Load relevant learnings
  const learnings = await searchLearningsByEmbedding(contextEmbedding, 10)

  // Get available skills
  const skills = await getAvailableSkills()

  // Score each skill
  const recommendations: Recommendation[] = []

  for (const skill of skills) {
    const m = metrics[skill] || { successRate: 0.5, avgConfidence: 0.5, correctionRate: 0 }

    const usageScore = m.successRate * 0.4
    const matchingLearnings = learnings.filter(l => l.skills.includes(skill))
    const learningScore = (matchingLearnings.length / Math.max(learnings.length, 1)) * 0.3
    const confidenceScore = m.avgConfidence * 0.2
    const correctionPenalty = m.correctionRate * 0.1

    const score = usageScore + learningScore + confidenceScore - correctionPenalty

    if (score >= config.recommendations.minConfidence) {
      recommendations.push({
        skill,
        score,
        confidence: m.avgConfidence,
        reason:
          matchingLearnings.length > 0
            ? `Matches ${matchingLearnings.length} learned patterns`
            : undefined,
      })
    }
  }

  return recommendations.sort((a, b) => b.score - a.score).slice(0, config.recommendations.topK)
}