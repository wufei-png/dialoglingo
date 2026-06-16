import { useEffect, useMemo, useState } from 'react'
import type { NavSectionId } from '../../../../shared/navigation'
import { ResizableSplitPane } from '../../components/ResizableSplitPane'
import { trpc } from '../../lib/trpc'
import { PLATFORM_OPTIONS, type SearchPlatform } from './searchModel'
import { SearchRail } from './SearchRail'
import { SessionPreviewPane } from './SessionPreviewPane'

type SearchSession = {
  sessionId: string
  title: string
  snippet: string | null
  sourceType: 'codex' | 'claude' | 'opencode'
  projectPath: string | null
  updatedAt: string
  preview: string
}

type SessionPreview = {
  turns: Array<{ seq: number; role: string; text: string }>
  snippet: { snippet?: string } | null
}

export function SearchPage(props: {
  activeSection: NavSectionId
  onChangeSection: (section: NavSectionId) => void
  splitRatio: number
  onSplitRatioChange: (ratio: number) => void
  onSplitRatioCommit: (ratio: number) => void
  onOpenSettings: () => void
  onWorkbookReady: (payload: { jobId: string; workbookId: string }) => void
}) {
  const [sessions, setSessions] = useState<SearchSession[]>([])
  const [focusedSessionId, setFocusedSessionId] = useState<string | null>(null)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())
  const [platformFilter, setPlatformFilter] = useState<SearchPlatform[]>([
    ...PLATFORM_OPTIONS
  ])
  const [readyToLoad, setReadyToLoad] = useState(false)
  const [preview, setPreview] = useState<SessionPreview | null>(null)

  const focusedSession = useMemo(
    () => sessions.find((session) => session.sessionId === focusedSessionId) ?? null,
    [focusedSessionId, sessions]
  )

  async function loadSessions(platforms: SearchPlatform[]) {
    if (platforms.length === 0) {
      setSessions([])
      setFocusedSessionId(null)
      setSelectedSessionIds(new Set())
      return
    }

    const rows = (await trpc.sessionSearch.query({
      query: '',
      scope: 'all',
      groupBy: 'platform',
      timeRange: null,
      projects: [],
      platforms,
      includeArchived: false
    })) as SearchSession[]

    setSessions(rows)
    setSelectedSessionIds((current) => {
      const visibleIds = new Set(rows.map((row) => row.sessionId))
      return new Set([...current].filter((sessionId) => visibleIds.has(sessionId)))
    })
    setFocusedSessionId((current) =>
      rows.some((row) => row.sessionId === current)
        ? current
        : rows[0]?.sessionId ?? null
    )
  }

  useEffect(() => {
    void (async () => {
      try {
        const status = await trpc.launchScanStatus.query()

        if (!status.scanOnLaunch) {
          await trpc.sessionRescan.mutate()
        }

        if (status.launchPlan?.focusedSessionId) {
          setFocusedSessionId(status.launchPlan.focusedSessionId)
        }
        setReadyToLoad(true)
      } catch {
        setReadyToLoad(true)
      }
    })()
  }, [])

  useEffect(() => {
    if (!readyToLoad) {
      return
    }

    void loadSessions(platformFilter)
  }, [readyToLoad, platformFilter.join('|')])

  useEffect(() => {
    if (!focusedSessionId) {
      setPreview(null)
      return
    }

    void (async () => {
      const nextPreview = (await trpc.sessionPreview.query({
        sessionId: focusedSessionId,
        query: ''
      })) as SessionPreview
      setPreview(nextPreview)
    })()
  }, [focusedSessionId])

  const previewText =
    preview?.snippet?.snippet ||
    preview?.turns
      ?.map((turn) => `${turn.role}: ${turn.text}`)
      .join('\n\n') ||
    'Select a session from the left to inspect normalized preview text.'

  return (
    <ResizableSplitPane
      className="search-layout"
      ratio={props.splitRatio}
      onRatioChange={props.onSplitRatioChange}
      onRatioCommit={props.onSplitRatioCommit}
      left={(
        <SearchRail
          activeSection={props.activeSection}
          onChangeSection={props.onChangeSection}
          onOpenSettings={props.onOpenSettings}
        sessions={sessions}
        focusedSessionId={focusedSessionId}
        selectedSessionIds={selectedSessionIds}
        platformFilter={platformFilter}
        onPlatformFilterChange={setPlatformFilter}
        onToggleSession={(sessionId) =>
          setSelectedSessionIds((current) => {
            const next = new Set(current)
            if (next.has(sessionId)) {
              next.delete(sessionId)
            } else {
              next.add(sessionId)
            }
            return next
          })
        }
        onFocusSession={setFocusedSessionId}
        onRescan={() => {
          void (async () => {
            await trpc.sessionRescan.mutate()
            await loadSessions(platformFilter)
          })()
        }}
        onGenerate={async (sessionIds) => {
          const response = (await trpc.generationStart.mutate({
            sessionIds
          })) as {
            jobId: string
            workbookId: string
          }

          props.onWorkbookReady(response)
        }}
      />
      )}
      right={(
        <SessionPreviewPane
        sessionTitle={focusedSession?.title ?? 'No session selected'}
        preview={previewText}
        matchCount={0}
        onPrevMatch={() => undefined}
        onNextMatch={() => undefined}
      />
      )}
    />
  )
}
