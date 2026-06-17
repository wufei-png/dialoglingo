import { useEffect, useState } from 'react'

type Props = {
  itemType: 'Expression' | 'Sentence'
  source: string
  target: string
  gloss: string
  explanation: string
  contextText: string
  quiz: string
  quizAnswer: string
  tags: string
  deleted?: boolean
  selected: boolean
  modified: boolean
  onSelect: () => void
  onDelete: () => void
  onRestore: () => void
  onSave: (nextSnapshot: {
    sourceText: string
    targetText: string
    gloss: string
    explanation: string
    contextText: string
    quizPrompt: string
    quizAnswer: string
    tags: string[]
  }) => void
  onCancelEdit: () => void
  onRevert: () => void
  onOpenSource: () => void
}

export function WorkbookCard(props: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({
    source: props.source,
    target: props.target,
    gloss: props.gloss,
    explanation: props.explanation,
    contextText: props.contextText,
    quiz: props.quiz,
    quizAnswer: props.quizAnswer,
    tags: props.tags
  })

  useEffect(() => {
    setDraft({
      source: props.source,
      target: props.target,
      gloss: props.gloss,
      explanation: props.explanation,
      contextText: props.contextText,
      quiz: props.quiz,
      quizAnswer: props.quizAnswer,
      tags: props.tags
    })
    setIsEditing(false)
  }, [
    props.source,
    props.target,
    props.gloss,
    props.explanation,
    props.contextText,
    props.quiz,
    props.quizAnswer,
    props.tags
  ])

  function resetDraft() {
    setDraft({
      source: props.source,
      target: props.target,
      gloss: props.gloss,
      explanation: props.explanation,
      contextText: props.contextText,
      quiz: props.quiz,
      quizAnswer: props.quizAnswer,
      tags: props.tags
    })
    setIsEditing(false)
    props.onCancelEdit()
  }

  function saveDraft() {
    props.onSave({
      sourceText: draft.source,
      targetText: draft.target,
      gloss: draft.gloss,
      explanation: draft.explanation,
      contextText: draft.contextText,
      quizPrompt: draft.quiz,
      quizAnswer: draft.quizAnswer,
      tags: draft.tags
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    })
    setIsEditing(false)
  }

  return (
    <article
      className={props.selected ? 'workbook-card is-selected' : 'workbook-card'}
      onClick={props.onSelect}
    >
      <div className="workbook-card-header">
        <span className="workbook-card-kicker">{props.itemType}</span>
        <span>{draft.source}</span>
      </div>
      <textarea
        aria-label="Source"
        value={draft.source}
        readOnly
        onChange={() => undefined}
      />
      <input
        aria-label="Target"
        value={draft.target}
        readOnly={!isEditing || props.deleted}
        onChange={(event) =>
          setDraft((current) => ({ ...current, target: event.target.value }))
        }
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            saveDraft()
          }
          if (event.key === 'Escape') {
            resetDraft()
          }
        }}
      />
      <input
        aria-label="Gloss"
        value={draft.gloss}
        readOnly={!isEditing || props.deleted}
        onChange={(event) =>
          setDraft((current) => ({ ...current, gloss: event.target.value }))
        }
      />
      <textarea
        aria-label="Explanation"
        value={draft.explanation}
        readOnly={!isEditing || props.deleted}
        onChange={(event) =>
          setDraft((current) => ({ ...current, explanation: event.target.value }))
        }
      />
      <textarea
        aria-label="Quiz"
        value={draft.quiz}
        readOnly={!isEditing || props.deleted}
        onChange={(event) =>
          setDraft((current) => ({ ...current, quiz: event.target.value }))
        }
      />
      <input
        aria-label="Tags"
        value={draft.tags}
        readOnly={!isEditing || props.deleted}
        onChange={(event) =>
          setDraft((current) => ({ ...current, tags: event.target.value }))
        }
      />
      <div className="workbook-card-actions">
        {props.modified ? (
          <button type="button" onClick={props.onRevert}>
            Revert
          </button>
        ) : null}
        <button type="button" onClick={props.onOpenSource}>
          View source
        </button>
        {props.deleted ? (
          <button type="button" onClick={props.onRestore}>
            Restore
          </button>
        ) : (
          <button type="button" onClick={props.onDelete}>
            Delete
          </button>
        )}
        {!props.deleted ? (
          <button type="button" disabled={isEditing} onClick={() => setIsEditing(true)}>
            Edit
          </button>
        ) : null}
        <button type="button" disabled={!isEditing} onClick={resetDraft}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!isEditing || props.deleted}
          onClick={saveDraft}
        >
          Save
        </button>
      </div>
    </article>
  )
}
