import { describe, expect, it } from 'vitest'
import { createSessionSearch } from '../../../src/main/search/querySessions'
import { createTestDb } from '../testDb'

describe('createSessionSearch', () => {
  it('searches titles and normalized transcript text', () => {
    const db = createTestDb()

    db.exec(`
      insert into sessions (
        id,
        source_type,
        source_session_id,
        title,
        started_at,
        updated_at,
        preview,
        search_text,
        is_archived,
        raw_locator,
        hash
      )
      values (
        's1',
        'codex',
        's1',
        'Refine workbook ranking',
        '2026-06-15T00:00:00Z',
        '2026-06-15T00:10:00Z',
        'ranking',
        'Use a soft type-balance rerank.',
        0,
        'fixture',
        'h1'
      );

      insert into sessions (
        id,
        source_type,
        source_session_id,
        title,
        started_at,
        updated_at,
        preview,
        search_text,
        is_archived,
        raw_locator,
        hash
      )
      values (
        's2',
        'codex',
        's2',
        'Archived title',
        '2026-06-14T00:00:00Z',
        '2026-06-14T00:10:00Z',
        'old ranking',
        'Archived transcript token.',
        1,
        'fixture',
        'h2'
      );
    `)

    const search = createSessionSearch(db)
    const rows = search({
      query: 'type-balance',
      scope: 'all',
      groupBy: 'platform',
      timeRange: null,
      projects: [],
      platforms: [],
      includeArchived: false
    })

    expect(rows.map((row) => row.sessionId)).toEqual(['s1'])
  })

  it('honors scope-specific matches and archived filtering', () => {
    const db = createTestDb()

    db.exec(`
      insert into sessions (
        id,
        source_type,
        source_session_id,
        title,
        started_at,
        updated_at,
        preview,
        search_text,
        is_archived,
        raw_locator,
        hash
      )
      values (
        's1',
        'codex',
        's1',
        'Title keyword only',
        '2026-06-15T00:00:00Z',
        '2026-06-15T00:10:00Z',
        'preview',
        'body token only',
        0,
        'fixture',
        'h1'
      );

      insert into sessions (
        id,
        source_type,
        source_session_id,
        title,
        started_at,
        updated_at,
        preview,
        search_text,
        is_archived,
        raw_locator,
        hash
      )
      values (
        's2',
        'codex',
        's2',
        'Another session',
        '2026-06-15T00:00:00Z',
        '2026-06-15T00:10:00Z',
        'preview',
        'transcript keyword only',
        1,
        'fixture',
        'h2'
      );
    `)

    const search = createSessionSearch(db)

    const titleRows = search({
      query: 'title keyword only',
      scope: 'titles',
      groupBy: 'platform',
      timeRange: null,
      projects: [],
      platforms: [],
      includeArchived: false
    })

    const transcriptRows = search({
      query: 'transcript keyword only',
      scope: 'transcript',
      groupBy: 'platform',
      timeRange: null,
      projects: [],
      platforms: [],
      includeArchived: false
    })

    expect(titleRows.map((row) => row.sessionId)).toEqual(['s1'])
    expect(transcriptRows).toEqual([])
  })
})
