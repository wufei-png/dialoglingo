import type Database from 'better-sqlite3'
import {
  HIGHLIGHT_END,
  HIGHLIGHT_START,
  hasHighlightMarker
} from '../../shared/highlight'
import {
  buildHighlightedSnippet,
  buildScopedFtsMatchQuery,
  buildScopedLikeCondition,
  buildSearchQueryPlan,
  type QueryScope
} from './searchQuery'

export type SearchInput = {
  query: string
  scope: QueryScope
  groupBy: 'platform' | 'time' | 'project'
  timeRange: { from: string; to: string } | null
  projects: string[]
  platforms: Array<'codex' | 'claude' | 'opencode'>
  includeArchived: boolean
}

export type SearchRow = {
  sessionId: string
  title: string
  titleSnippet: string | null
  snippet: string | null
  sourceType: 'codex' | 'claude' | 'opencode'
  projectPath: string | null
  updatedAt: string
  preview: string
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

type FtsSearchRow = SearchRow & {
  titleSnippet: string | null
  previewSnippet: string | null
  textSnippet: string | null
}

type LikeSearchRow = SearchRow & {
  searchText: string
}

function pickFtsSnippet(row: FtsSearchRow, scope: QueryScope) {
  if (scope === 'titles') {
    return row.titleSnippet
  }

  if (scope === 'transcript') {
    return row.textSnippet
  }

  return (
    [row.textSnippet, row.previewSnippet, row.titleSnippet].find((snippet) =>
      hasHighlightMarker(snippet)
    ) ??
    row.previewSnippet ??
    row.textSnippet ??
    row.titleSnippet
  )
}

function pickLikeSnippet(row: LikeSearchRow, scope: QueryScope, variants: string[]) {
  if (scope === 'titles') {
    return buildHighlightedSnippet(row.title, variants, 70)
  }

  if (scope === 'transcript') {
    return buildHighlightedSnippet(row.searchText, variants)
  }

  const source = [row.searchText, row.preview, row.title].find((value) =>
    variants.some((variant) =>
      value.toLocaleLowerCase().includes(variant.toLocaleLowerCase())
    )
  )

  return buildHighlightedSnippet(source ?? row.preview, variants)
}

function buildTitleSnippet(
  title: string,
  scope: QueryScope,
  variants: string[],
  ftsTitleSnippet?: string | null
) {
  if (scope === 'transcript') {
    return null
  }

  if (hasHighlightMarker(ftsTitleSnippet)) {
    return ftsTitleSnippet ?? null
  }

  const snippet = buildHighlightedSnippet(title, variants, 70)
  return hasHighlightMarker(snippet) ? snippet : null
}

export function createSessionSearch(db: Database.Database) {
  return (input: SearchInput): SearchRow[] => {
    const plan = buildSearchQueryPlan(input.query)
    const where = buildWhereClauses(input)

    if (!plan.trimmed) {
      return db
        .prepare(
          `
            select
              s.id as sessionId,
              s.title as title,
              null as titleSnippet,
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

    if (plan.useLikeFallback) {
      const like = buildScopedLikeCondition(input.scope, plan.variants)
      const rows = db
        .prepare(
          `
            select
              s.id as sessionId,
              s.title as title,
              s.source_type as sourceType,
              s.project_id as projectPath,
              s.updated_at as updatedAt,
              s.preview as preview,
              s.search_text as searchText,
              s.preview as snippet
            from sessions s
            where ${like.sql}
            ${where.sql}
            order by s.updated_at desc
          `
        )
        .all(...like.args, ...where.args) as LikeSearchRow[]

      return rows.map(({ searchText: _searchText, ...row }) => ({
        ...row,
        titleSnippet: buildTitleSnippet(row.title, input.scope, plan.variants),
        snippet: pickLikeSnippet({ ...row, searchText: _searchText }, input.scope, plan.variants)
      }))
    }

    const rows = db
      .prepare(
        `
          select
            s.id as sessionId,
            s.title as title,
            s.source_type as sourceType,
            s.project_id as projectPath,
            s.updated_at as updatedAt,
            s.preview as preview,
            snippet(session_search, 1, '${HIGHLIGHT_START}', '${HIGHLIGHT_END}', ' … ', 12) as titleSnippet,
            snippet(session_search, 2, '${HIGHLIGHT_START}', '${HIGHLIGHT_END}', ' … ', 12) as previewSnippet,
            snippet(session_search, 3, '${HIGHLIGHT_START}', '${HIGHLIGHT_END}', ' … ', 12) as textSnippet
          from session_search
          join sessions s on s.id = session_search.session_id
          where session_search match ?
          ${where.sql}
          order by bm25(session_search), s.updated_at desc
        `
      )
      .all(buildScopedFtsMatchQuery(input.scope, plan.variants), ...where.args) as FtsSearchRow[]

    return rows.map((row) => ({
      sessionId: row.sessionId,
      title: row.title,
      titleSnippet: buildTitleSnippet(
        row.title,
        input.scope,
        plan.variants,
        row.titleSnippet
      ),
      snippet: pickFtsSnippet(row, input.scope),
      sourceType: row.sourceType,
      projectPath: row.projectPath,
      updatedAt: row.updatedAt,
      preview: row.preview
    }))
  }
}
