import { existsSync, mkdirSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { defaultConfig, PluginConfig } from './types'

const CONFIG_DIR = join(process.env.HOME || '~', '.config', 'opencode', 'plugins', 'skill-evolution')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export async function loadConfig(): Promise<PluginConfig> {
  if (!existsSync(CONFIG_FILE)) {
    await saveConfig(defaultConfig)
    return defaultConfig
  }

  try {
    const content = await readFile(CONFIG_FILE, 'utf-8')
    const userConfig = JSON.parse(content)
    return { ...defaultConfig, ...userConfig }
  } catch {
    return defaultConfig
  }
}

export async function saveConfig(config: PluginConfig): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export function getConfigPath(): string {
  return CONFIG_FILE
}