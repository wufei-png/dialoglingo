import type {
  ExportSourceRef,
  ExpressionExportRow,
  SentenceExportRow
} from './manifest'

export type WorkbookExportListItem = {
  id: string
  itemType: 'Expression' | 'Sentence'
  state: 'active' | 'deleted'
  currentSnapshot: Record<string, unknown>
  sourceRefs: Array<{
    sessionId: string
    sourceSpanRef: string
    excerpt: string
  }>
}

export function buildWorkbookExportRows(
  items: WorkbookExportListItem[],
  getSourceType: (sessionId: string) => string | null
): {
  expressions: ExpressionExportRow[]
  sentences: SentenceExportRow[]
} {
  const augmentSourceRefs = (
    sourceRefs: WorkbookExportListItem['sourceRefs']
  ): ExportSourceRef[] =>
    sourceRefs.map((ref) => ({
      ...ref,
      sourceType: getSourceType(ref.sessionId)
    }))

  return {
    expressions: items
      .filter((item) => item.itemType === 'Expression')
      .map((item) => ({
        id: item.id,
        itemType: 'Expression' as const,
        state: item.state,
        expression: stringValue(item.currentSnapshot, 'sourceText'),
        translation: stringValue(item.currentSnapshot, 'targetText'),
        gloss: stringValue(item.currentSnapshot, 'gloss'),
        context: stringValue(item.currentSnapshot, 'contextText'),
        explanation: stringValue(item.currentSnapshot, 'explanation'),
        quizPrompt: stringValue(item.currentSnapshot, 'quizPrompt'),
        quizAnswer: stringValue(item.currentSnapshot, 'quizAnswer'),
        sourceRefs: augmentSourceRefs(item.sourceRefs),
        tags: stringArrayValue(item.currentSnapshot, 'tags'),
        flagged: item.currentSnapshot.flagged === true
      })),
    sentences: items
      .filter((item) => item.itemType === 'Sentence')
      .map((item) => ({
        id: item.id,
        itemType: 'Sentence' as const,
        state: item.state,
        sentence: stringValue(item.currentSnapshot, 'sourceText'),
        translation: stringValue(item.currentSnapshot, 'targetText'),
        focus: stringValue(item.currentSnapshot, 'gloss'),
        context: stringValue(item.currentSnapshot, 'contextText'),
        note: stringValue(item.currentSnapshot, 'explanation'),
        quizPrompt: stringValue(item.currentSnapshot, 'quizPrompt'),
        quizAnswer: stringValue(item.currentSnapshot, 'quizAnswer'),
        sourceRefs: augmentSourceRefs(item.sourceRefs),
        tags: stringArrayValue(item.currentSnapshot, 'tags'),
        flagged: item.currentSnapshot.flagged === true
      }))
  }
}

function stringValue(snapshot: Record<string, unknown>, key: string) {
  return typeof snapshot[key] === 'string' ? snapshot[key] : ''
}

function stringArrayValue(snapshot: Record<string, unknown>, key: string) {
  return Array.isArray(snapshot[key])
    ? snapshot[key].filter((value): value is string => typeof value === 'string')
    : []
}
