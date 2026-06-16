import { describe, expect, it } from 'vitest'
import {
  PLATFORM_OPTIONS,
  groupSessionsByPlatform,
  togglePlatformFilter
} from '../../src/renderer/src/features/search/searchModel'

describe('searchModel', () => {
  it('toggles platform filters while preserving platform order', () => {
    expect(togglePlatformFilter([...PLATFORM_OPTIONS], 'claude')).toEqual([
      'codex',
      'opencode'
    ])
    expect(togglePlatformFilter(['opencode'], 'codex')).toEqual(['codex', 'opencode'])
  })

  it('groups only selected platforms and exposes title-only rows', () => {
    const groups = groupSessionsByPlatform({
      selectedPlatforms: ['codex'],
      focusedSessionId: 's1',
      selectedSessionIds: new Set(['s2']),
      sessions: [
        {
          sessionId: 's1',
          title: 'A very long Codex title',
          snippet: 'This preview must stay out of the navigation row',
          sourceType: 'codex',
          projectPath: null
        },
        {
          sessionId: 's2',
          title: 'Claude title',
          snippet: 'Hidden by platform filter',
          sourceType: 'claude',
          projectPath: null
        }
      ]
    })

    expect(groups).toEqual([
      {
        id: 'codex',
        label: 'Codex',
        expanded: true,
        selectedCount: 0,
        totalCount: 1,
        rows: [
          {
            sessionId: 's1',
            title: 'A very long Codex title',
            selected: false,
            focused: true
          }
        ]
      }
    ])
    expect('snippet' in groups[0].rows[0]).toBe(false)
  })
})
