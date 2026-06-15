import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { scanSessions } from '../../../src/main/scan/scanSessions'
import { createSourceRegistry } from '../../../src/main/sources'
import { createTestDb } from '../testDb'

const here = path.dirname(fileURLToPath(import.meta.url))

function fixtureRoot(name: string) {
  return path.resolve(here, '../../fixtures', name)
}

describe('scanSessions', () => {
  it('persists projects, sessions, and turns from the source registry', async () => {
    const db = createTestDb()
    const registry = createSourceRegistry({
      codex: fixtureRoot('codex'),
      claude: fixtureRoot('claude'),
      opencode: fixtureRoot('opencode')
    })

    await scanSessions(db, registry)

    const projectCount = db.prepare('select count(*) as count from projects').get() as {
      count: number
    }
    const sessionCount = db.prepare('select count(*) as count from sessions').get() as {
      count: number
    }
    const turnCount = db
      .prepare('select count(*) as count from session_turns')
      .get() as { count: number }
    const namespacedSession = db
      .prepare("select id from sessions where source_type = 'codex' limit 1")
      .get() as { id: string }
    const namespacedTurn = db
      .prepare(
        "select id from session_turns where session_id = ? limit 1"
      )
      .get(namespacedSession.id) as { id: string }

    expect(projectCount.count).toBeGreaterThan(0)
    expect(sessionCount.count).toBeGreaterThan(0)
    expect(turnCount.count).toBeGreaterThan(0)
    expect(namespacedSession.id.startsWith('codex:')).toBe(true)
    expect(namespacedTurn.id.startsWith(`${namespacedSession.id}:`)).toBe(true)
  })
})
