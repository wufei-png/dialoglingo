import { describe, expect, it } from 'vitest'
import { createClaudeAdapter } from '../../../src/main/sources/claude/adapter'

describe('createClaudeAdapter', () => {
  it('reads transcript turns from fixture jsonl', async () => {
    const adapter = createClaudeAdapter('tests/fixtures/claude')
    const [summary] = await adapter.listSessions({
      query: '',
      timeRange: null,
      projects: [],
      platforms: [],
      includeArchived: false
    })

    const turns = await adapter.readSession(summary.id)

    expect(turns.some((turn) => turn.text.includes('How should we structure state?'))).toBe(true)
    expect(
      turns.some((turn) =>
        turn.text.includes('Start with Zustand for local UI intent')
      )
    ).toBe(true)
  })
})
