export function LaunchScanScreen() {
  return (
    <div className="boot-screen">
      <div className="boot-card boot-card--centered">
        <p className="boot-eyebrow">DialogLingo</p>
        <h2>Scanning local sessions</h2>
        <div className="boot-spinner" aria-hidden="true" />
        <p className="boot-caption">
          Discovering Codex, Claude, and OpenCode transcripts…
        </p>
      </div>
    </div>
  )
}
