import { createStore } from 'zustand/vanilla'
import type { NavSectionId } from '../../../../shared/navigation'

export type QueryScope = 'all' | 'titles' | 'transcript'
export type TimeRangePreset = 'last-7-days' | 'last-30-days' | 'all-time'
export type PlatformFilter = 'codex' | 'claude' | 'opencode'
export type GroupBy = 'platform' | 'time' | 'project'

export type UIState = {
  activeSection: NavSectionId
  focusedSessionId: string | null
  selectedSessionIds: Set<string>
  selectedProjectIds: Set<string>
  collapsedGroupIds: Set<string>
  query: string
  queryScope: QueryScope
  timeRange: TimeRangePreset
  platformFilter: PlatformFilter[]
  groupBy: GroupBy
  setActiveSection: (value: NavSectionId) => void
  hydrateFromScan: (input: {
    projectIds: string[]
    groupIds: string[]
    firstSessionId: string | null
  }) => void
}

export function createUIStateStore() {
  return createStore<UIState>()((set) => ({
    activeSection: 'search',
    focusedSessionId: null,
    selectedSessionIds: new Set<string>(),
    selectedProjectIds: new Set<string>(),
    collapsedGroupIds: new Set<string>(),
    query: '',
    queryScope: 'all',
    timeRange: 'last-7-days',
    platformFilter: ['codex', 'claude', 'opencode'],
    groupBy: 'platform',
    setActiveSection: (value) => set({ activeSection: value }),
    hydrateFromScan: ({ projectIds, groupIds, firstSessionId }) =>
      set({
        selectedProjectIds: new Set(projectIds),
        collapsedGroupIds: new Set(groupIds),
        focusedSessionId: firstSessionId
      })
  }))
}
