import { describe, expect, it } from 'vitest'
import { createOpenCodeAdapter } from '../../../src/main/sources/opencode/adapter'

describe('createOpenCodeAdapter', () => {
  it('reconstructs ordered turns from session/message/part fixture files', async () => {
    const adapter = createOpenCodeAdapter('tests/fixtures/opencode')
    const [summary] = await adapter.listSessions({
      query: '',
      timeRange: null,
      projects: [],
      platforms: [],
      includeArchived: false
    })

    const turns = await adapter.readSession(summary.id)

    expect(turns.map((turn) => turn.role)).toEqual(['user', 'assistant'])
    expect(turns[1]?.text).toContain('start with a normalized session index')
  })
})
