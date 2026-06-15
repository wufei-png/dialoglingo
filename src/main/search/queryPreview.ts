import type Database from 'better-sqlite3'

export function createPreviewQuery(db: Database.Database) {
  return (sessionId: string, query: string) => {
    const turns = db
      .prepare(
        `
          select
            seq,
            role,
            text,
            source_span_ref as sourceSpanRef
          from session_turns
          where session_id = ?
          order by seq asc
        `
      )
      .all(sessionId)

    if (!query.trim()) {
      return {
        turns,
        snippet: null
      }
    }

    const snippet = db
      .prepare(
        `
          select snippet(session_search, 3, '<mark>', '</mark>', ' … ', 20) as snippet
          from session_search
          where session_id = ? and session_search match ?
          limit 1
        `
      )
      .get(sessionId, query)

    return {
      turns,
      snippet
    }
  }
}
