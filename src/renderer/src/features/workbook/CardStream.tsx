import { WorkbookCard } from './WorkbookCard'

type WorkbookRow = {
  id: string
  itemType: 'Expression' | 'Sentence'
  state: 'active' | 'deleted'
  isEdited: boolean
  currentSnapshot: {
    sourceText?: string
    targetText?: string
    gloss?: string
    explanation?: string
    contextText?: string
    quizPrompt?: string
    quizAnswer?: string
    tags?: string[]
  }
  sourceRefs: Array<{
    sessionId: string
    sourceSpanRef: string
    excerpt: string
  }>
}

export function CardStream(props: {
  rows: WorkbookRow[]
  selectedItemId: string | null
  onSelectItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onRestoreItem: (itemId: string) => void
  onSaveItem: (
    itemId: string,
    nextSnapshot: {
      sourceText: string
      targetText: string
      gloss: string
      explanation: string
      contextText: string
      quizPrompt: string
      quizAnswer: string
      tags: string[]
    }
  ) => void
  onRevertItem: (itemId: string) => void
  onOpenSource: (itemId: string) => void
}) {
  return (
    <div className="workbook-stream">
      {props.rows.map((row) => (
        <WorkbookCard
          key={row.id}
          itemType={row.itemType}
          source={String(row.currentSnapshot.sourceText ?? '')}
          target={String(row.currentSnapshot.targetText ?? '')}
          gloss={String(row.currentSnapshot.gloss ?? '')}
          explanation={String(row.currentSnapshot.explanation ?? '')}
          contextText={String(row.currentSnapshot.contextText ?? '')}
          quiz={String(row.currentSnapshot.quizPrompt ?? '')}
          quizAnswer={String(row.currentSnapshot.quizAnswer ?? '')}
          tags={String((row.currentSnapshot.tags ?? []).join(', '))}
          deleted={row.state === 'deleted'}
          selected={props.selectedItemId === row.id}
          modified={row.isEdited}
          onSelect={() => props.onSelectItem(row.id)}
          onDelete={() => props.onDeleteItem(row.id)}
          onRestore={() => props.onRestoreItem(row.id)}
          onSave={(nextSnapshot) => props.onSaveItem(row.id, nextSnapshot)}
          onCancelEdit={() => undefined}
          onRevert={() => props.onRevertItem(row.id)}
          onOpenSource={() => props.onOpenSource(row.id)}
        />
      ))}
    </div>
  )
}
