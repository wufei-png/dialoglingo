import { createClaudeAdapter } from './claude/adapter'
import { createCodexAdapter } from './codex/adapter'
import { createOpenCodeAdapter } from './opencode/adapter'
import { discoverSourcePaths } from './pathDiscovery'
import type { SourceRegistry } from './types'

export function createSourceRegistry(
  paths = discoverSourcePaths()
): SourceRegistry {
  return {
    codex: createCodexAdapter(paths.codex),
    claude: createClaudeAdapter(paths.claude),
    opencode: createOpenCodeAdapter(paths.opencode)
  }
}
