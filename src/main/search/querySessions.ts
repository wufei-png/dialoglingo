import type Database from 'better-sqlite3'

export type SearchInput = {
  query: string
  scope: 'all' | 'titles' | 'transcript'
  groupBy: 'platform' | 'time' | 'project'
  timeRange: { from: string; to: string } | null
  projects: string[]
  platforms: Array<'codex' | 'claude' | 'opencode'>
  includeArchived: boolean
}

export type SearchRow = {
  sessionId: string
  title: string
  snippet: string | null
  sourceType: 'codex' | 'claude' | 'opencode'
  projectPath: string | null
  updatedAt: string
  preview: string
}

function toMatchQuery(query: string) {
  return `"${query.replaceAll('"', '""')}"`
}

function buildScopedMatchQuery(input: SearchInput) {
  const base = toMatchQuery(input.query.trim())

  if (input.scope === 'titles') {
    return `title : ${base}`
  }

  if (input.scope === 'transcript') {
    return `normalized_text : ${base}`
  }

  return base
}

function buildWhereClauses(input: SearchInput) {
  const clauses: string[] = []
  const args: Array<string | number> = []

  if (input.platforms.length > 0) {
    clauses.push(`s.source_type in (${input.platforms.map(() => '?').join(', ')})`)
    args.push(...input.platforms)
  }

  if (input.projects.length > 0) {
    clauses.push(`s.project_id in (${input.projects.map(() => '?').join(', ')})`)
    args.push(...input.projects)
  }

  if (input.timeRange) {
    clauses.push('s.updated_at >= ? and s.updated_at <= ?')
    args.push(input.timeRange.from, input.timeRange.to)
  }

  if (!input.includeArchived) {
    clauses.push('s.is_archived = 0')
  }

  return {
    sql: clauses.length > 0 ? `and ${clauses.join(' and ')}` : '',
    args
  }
}

export function createSessionSearch(db: Database.Database) {
  return (input: SearchInput): SearchRow[] => {
    const trimmedQuery = input.query.trim()
    const where = buildWhereClauses(input)

    if (!trimmedQuery) {
      return db
        .prepare(
          `
            select
              s.id as sessionId,
              s.title as title,
              s.source_type as sourceType,
              s.project_id as projectPath,
              s.updated_at as updatedAt,
              s.preview as preview,
              s.preview as snippet
            from sessions s
            where 1 = 1
            ${where.sql}
            order by s.updated_at desc
          `
        )
        .all(...where.args) as SearchRow[]
    }

    const snippetColumn =
      input.scope === 'titles'
        ? 'title'
        : input.scope === 'transcript'
          ? 'normalized_text'
          : 'preview'

    return db
      .prepare(
        `
          select
            s.id as sessionId,
            s.title as title,
            s.source_type as sourceType,
            s.project_id as projectPath,
            s.updated_at as updatedAt,
            s.preview as preview,
            snippet(session_search, ${snippetColumn === 'title' ? 1 : snippetColumn === 'preview' ? 2 : 3}, '<mark>', '</mark>', ' … ', 12) as snippet
          from session_search
          join sessions s on s.id = session_search.session_id
          where session_search match ?
          ${where.sql}
          order by bm25(session_search), s.updated_at desc
        `
      )
      .all(buildScopedMatchQuery(input), ...where.args) as SearchRow[]
  }
}
