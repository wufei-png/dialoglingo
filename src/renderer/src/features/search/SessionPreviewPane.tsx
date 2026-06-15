type PreviewProps = {
  sessionTitle: string
  preview: string
  matchCount: number
  onPrevMatch: () => void
  onNextMatch: () => void
}

export function SessionPreviewPane(props: PreviewProps) {
  return (
    <section className="search-preview">
      <header className="search-preview-header">
        <div>
          <p className="search-preview-kicker">Normalized Preview</p>
          <h2>{props.sessionTitle}</h2>
        </div>
        {props.matchCount > 1 ? (
          <div className="match-nav">
            <button type="button" onClick={props.onPrevMatch}>
              Prev
            </button>
            <button type="button" onClick={props.onNextMatch}>
              Next
            </button>
          </div>
        ) : null}
      </header>
      <article className="search-preview-body">{props.preview}</article>
    </section>
  )
}
