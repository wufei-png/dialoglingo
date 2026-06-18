export const HIGHLIGHT_START = '\uE000'
export const HIGHLIGHT_END = '\uE001'

export function markHighlightedText(value: string) {
  return `${HIGHLIGHT_START}${value}${HIGHLIGHT_END}`
}

export function hasHighlightMarker(value: string | null | undefined) {
  return Boolean(value?.includes(HIGHLIGHT_START))
}

export function countHighlightMarkers(value: string | null | undefined) {
  return value?.match(new RegExp(HIGHLIGHT_START, 'g'))?.length ?? 0
}
