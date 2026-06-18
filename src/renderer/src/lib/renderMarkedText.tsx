import type { ReactNode } from 'react'
import { HIGHLIGHT_END, HIGHLIGHT_START } from '../../../shared/highlight'

type RenderMarkedTextOptions = {
  enabled: boolean
  activeMatchIndex?: number
  matchIndexRef?: { current: number }
}

export function renderMarkedText(
  value: string,
  options: RenderMarkedTextOptions
): ReactNode[] {
  if (!options.enabled) {
    return [value]
  }

  const matchIndexRef = options.matchIndexRef
  const rendered: ReactNode[] = []
  let cursor = 0
  let keyIndex = 0

  while (cursor < value.length) {
    const startIndex = value.indexOf(HIGHLIGHT_START, cursor)
    if (startIndex < 0) {
      rendered.push(value.slice(cursor))
      break
    }

    if (startIndex > cursor) {
      rendered.push(value.slice(cursor, startIndex))
    }

    const highlightStart = startIndex + HIGHLIGHT_START.length
    const endIndex = value.indexOf(HIGHLIGHT_END, highlightStart)
    if (endIndex < 0) {
      rendered.push(value.slice(startIndex))
      break
    }

    const highlighted = value.slice(highlightStart, endIndex)
    if (highlighted) {
      const currentIndex = matchIndexRef?.current ?? keyIndex
      rendered.push(
        <mark
          key={`${keyIndex}-${currentIndex}`}
          className={
            currentIndex === options.activeMatchIndex ? 'is-active' : undefined
          }
          data-match-index={currentIndex}
        >
          {highlighted}
        </mark>
      )

      if (matchIndexRef) {
        matchIndexRef.current += 1
      }
    }

    keyIndex += 1
    cursor = endIndex + HIGHLIGHT_END.length
  }

  return rendered
}
