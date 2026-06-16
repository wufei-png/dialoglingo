export type SearchPlatform = 'codex' | 'claude' | 'opencode'

export const PLATFORM_OPTIONS: SearchPlatform[] = ['codex', 'claude', 'opencode']

export const PLATFORM_LABELS: Record<SearchPlatform, string> = {
  codex: 'Codex',
  claude: 'Claude Code',
  opencode: 'OpenCode'
}

type SearchSession = {
  sessionId: string
  title: string
  snippet: string | null
  sourceType: SearchPlatform
  projectPath: string | null
}

export type SessionGroup = {
  id: SearchPlatform
  label: string
  expanded: boolean
  selectedCount: number
  totalCount: number
  rows: Array<{
    sessionId: string
    title: string
    selected: boolean
    focused: boolean
  }>
}

export function togglePlatformFilter(
  current: SearchPlatform[],
  platform: SearchPlatform
) {
  const next = current.includes(platform)
    ? current.filter((value) => value !== platform)
    : [...current, platform]

  return PLATFORM_OPTIONS.filter((value) => next.includes(value))
}

export function groupSessionsByPlatform(input: {
  sessions: SearchSession[]
  selectedPlatforms: SearchPlatform[]
  selectedSessionIds: Set<string>
  focusedSessionId: string | null
}): SessionGroup[] {
  return input.selectedPlatforms.map((sourceType) => {
    const rows = input.sessions
      .filter((session) => session.sourceType === sourceType)
      .map((session) => ({
        sessionId: session.sessionId,
        title: session.title,
        selected: input.selectedSessionIds.has(session.sessionId),
        focused: input.focusedSessionId === session.sessionId
      }))

    return {
      id: sourceType,
      label: PLATFORM_LABELS[sourceType],
      expanded: true,
      selectedCount: rows.filter((row) => row.selected).length,
      totalCount: rows.length,
      rows
    }
  })
}
