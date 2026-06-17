import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react'
import { useReducedMotion } from 'motion/react'

const DEFAULT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DEFAULT_EXIT_EASE = 'cubic-bezier(0.4, 0, 1, 1)'

type Props = {
  children: ReactNode
  className?: string
  durationMs?: number
  easing?: string
  exitDurationMs?: number
  exitEasing?: string
  id?: string
  onHeightChange?: () => void
  open: boolean
}

export function MeasuredCollapse({
  children,
  className,
  durationMs = 280,
  easing = DEFAULT_EASE,
  exitDurationMs = 220,
  exitEasing = DEFAULT_EXIT_EASE,
  id,
  onHeightChange,
  open
}: Props) {
  const shouldReduceMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const didMountRef = useRef(false)
  const onHeightChangeRef = useRef(onHeightChange)
  const [present, setPresent] = useState(open)
  const [height, setHeight] = useState(open ? 'auto' : '0px')
  const [opacity, setOpacity] = useState(open ? 1 : 0)

  function cancelPendingFrame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }

  function runAfterNextPaint(callback: () => void) {
    cancelPendingFrame()
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        callback()
      })
    })
  }

  useEffect(() => {
    onHeightChangeRef.current = onHeightChange
  }, [onHeightChange])

  useEffect(() => {
    return () => {
      cancelPendingFrame()
    }
  }, [])

  useLayoutEffect(() => {
    if (open && !present) {
      setPresent(true)
    }
  }, [open, present])

  useLayoutEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    if (!present) {
      return
    }

    cancelPendingFrame()

    if (shouldReduceMotion) {
      setHeight(open ? 'auto' : '0px')
      setOpacity(open ? 1 : 0)
      if (!open) {
        setPresent(false)
      }
      onHeightChangeRef.current?.()
      return
    }

    const node = contentRef.current
    if (!node) {
      return
    }

    if (open) {
      setHeight('0px')
      setOpacity(0)
      runAfterNextPaint(() => {
        setHeight(`${node.scrollHeight}px`)
        setOpacity(1)
        onHeightChangeRef.current?.()
      })
      return
    }

    setHeight(`${node.getBoundingClientRect().height}px`)
    setOpacity(1)
    runAfterNextPaint(() => {
      setHeight('0px')
      onHeightChangeRef.current?.()
    })
  }, [open, present, shouldReduceMotion])

  if (!present) {
    return null
  }

  const style: CSSProperties = {
    height,
    opacity,
    overflow: 'hidden',
    transition: shouldReduceMotion
      ? undefined
      : open
        ? `height ${durationMs}ms ${easing}, opacity ${Math.round(durationMs * 0.72)}ms ${easing}`
        : `height ${exitDurationMs}ms ${exitEasing}`
  }

  return (
    <div
      ref={contentRef}
      id={id}
      className={className}
      data-state={open ? 'open' : 'closed'}
      aria-hidden={!open}
      style={style}
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget || event.propertyName !== 'height') {
          return
        }

        if (!open) {
          setPresent(false)
        }

        onHeightChangeRef.current?.()
      }}
    >
      {children}
    </div>
  )
}
