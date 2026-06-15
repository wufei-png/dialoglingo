import path from 'node:path'

export function discoverSourcePaths() {
  const home = process.env.HOME ?? ''

  return {
    codex: process.env.CODEX_HOME ?? path.join(home, '.codex'),
    claude: path.join(home, '.claude'),
    opencode: path.join(home, '.local', 'share', 'opencode')
  }
}
