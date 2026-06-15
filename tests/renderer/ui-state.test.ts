import { describe, expect, it } from 'vitest'
import { createUIStateStore } from '../../src/renderer/src/app/store/uiState'

describe('createUIStateStore', () => {
  it('starts with search selected, last-7-days, platform grouping, and no sessions selected', () => {
    const store = createUIStateStore()

    expect(store.getState().activeSection).toBe('search')
    expect(store.getState().timeRange).toBe('last-7-days')
    expect(store.getState().groupBy).toBe('platform')
    expect(store.getState().selectedSessionIds.size).toBe(0)
  })

  it('hydrates discovered projects and focuses the first session after scan', () => {
    const store = createUIStateStore()

    store.getState().hydrateFromScan({
      projectIds: ['p1', 'p2'],
      groupIds: ['codex', 'claude'],
      firstSessionId: 's1'
    })

    expect([...store.getState().selectedProjectIds]).toEqual(['p1', 'p2'])
    expect([...store.getState().collapsedGroupIds]).toEqual(['codex', 'claude'])
    expect(store.getState().focusedSessionId).toBe('s1')
  })
})
