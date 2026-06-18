import { useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { countHighlightMarkers } from '../../../../shared/highlight'
import { renderMarkedText } from '../../lib/renderMarkedText'

type PreviewTurn = {
  seq: number
  role: 'user' | 'assistant' | string
  text: string
}

type PreviewProps = {
  sessionTitle: string
  sessionTitleSnippet?: string | null
  turns: PreviewTurn[]
  fallbackPreview: string
  enableHighlights: boolean
  matchCount: number
  activeMatchIndex: number
  onPrevMatch: () => void
  onNextMatch: () => void
  kicker?: string
  headerMeta?: ReactNode
  className?: string
}

function getTurnClassName(role: PreviewTurn['role']) {
  return role === 'user' ? 'preview-turn is-user' : 'preview-turn is-assistant'
}

function getTurnRoleLabel(role: PreviewTurn['role'], t: TFunction) {
  if (role === 'user') {
    return t('preview.roles.user')
  }

  if (role === 'assistant') {
    return t('preview.roles.assistant')
  }

  return role
}

function scrollMatchIntoPreview(container: HTMLElement, active: Element) {
  const containerRect = container.getBoundingClientRect()
  const activeRect = active.getBoundingClientRect()
  const nextTop =
    container.scrollTop +
    activeRect.top -
    containerRect.top -
    container.clientHeight / 2 +
    activeRect.height / 2

  container.scrollTo({
    top: Math.max(0, nextTop),
    behavior: 'smooth'
  })
}

export function SessionPreviewPane(props: PreviewProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLElement | null>(null)
  const titleMatchCount = countHighlightMarkers(props.sessionTitleSnippet)
  const renderedPreview = useMemo(
    () => {
      const matchIndexRef = { current: titleMatchCount }

      if (props.turns.length === 0) {
        return (
          <div className="preview-snippet">
            {renderMarkedText(props.fallbackPreview, {
              enabled: props.enableHighlights,
              activeMatchIndex: props.activeMatchIndex,
              matchIndexRef
            })}
          </div>
        )
      }

      return props.turns.map((turn) => (
        <div key={turn.seq} className={getTurnClassName(turn.role)}>
          <div className="preview-bubble">
            <p className="preview-turn-role">{getTurnRoleLabel(turn.role, t)}</p>
            <div className="preview-turn-text">
              {renderMarkedText(turn.text, {
                enabled: props.enableHighlights,
                activeMatchIndex: props.activeMatchIndex,
                matchIndexRef
              })}
            </div>
          </div>
        </div>
      ))
    },
    [
      props.activeMatchIndex,
      props.enableHighlights,
      props.fallbackPreview,
      props.turns,
      t,
      titleMatchCount
    ]
  )
  const renderedTitle = useMemo(
    () =>
      renderMarkedText(props.sessionTitleSnippet ?? props.sessionTitle, {
        enabled: Boolean(props.sessionTitleSnippet),
        activeMatchIndex: props.activeMatchIndex,
        matchIndexRef: { current: 0 }
      }),
    [props.activeMatchIndex, props.sessionTitle, props.sessionTitleSnippet]
  )

  useEffect(() => {
    const root = rootRef.current
    const active = root?.querySelector('mark.is-active')
    if (!root || !active) {
      return
    }

    scrollMatchIntoPreview(root, active)
  }, [
    props.activeMatchIndex,
    props.enableHighlights,
    props.fallbackPreview,
    props.sessionTitleSnippet,
    props.turns
  ])

  return (
    <section
      className={['search-preview', props.className].filter(Boolean).join(' ')}
      ref={rootRef}
    >
      {props.matchCount > 1 ? (
        <div className="match-nav" aria-label={t('preview.searchMatches')}>
          <button type="button" aria-label={t('preview.previousMatch')} onClick={props.onPrevMatch}>
            <span className="match-nav-icon is-prev" aria-hidden="true" />
          </button>
          <button type="button" aria-label={t('preview.nextMatch')} onClick={props.onNextMatch}>
            <span className="match-nav-icon is-next" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <header className="search-preview-header">
        <div>
          <p className="search-preview-kicker">
            {props.kicker ?? t('preview.normalizedPreview')}
          </p>
          <h2>{renderedTitle}</h2>
          {props.headerMeta ? (
            <div className="search-preview-meta">{props.headerMeta}</div>
          ) : null}
        </div>
      </header>
      <article className="search-preview-body">
        {renderedPreview}
      </article>
    </section>
  )
}
