import { DEFAULT_SPLIT_RATIO } from '../../../shared/schemas/settings'

type Props = {
  open: boolean
  splitRatio: number
  onClose: () => void
  onResetSplitRatio: () => void
}

function formatRatio(value: number) {
  const left = Math.round(value * 100)
  const right = Math.round((1 - value) * 100)
  return `${left}:${right}`
}

export function SettingsSheet(props: Props) {
  if (!props.open) {
    return null
  }

  return (
    <div className="sheet-backdrop">
      <section className="sheet settings-sheet" role="dialog" aria-modal="true" aria-label="Settings">
        <header className="settings-sheet-header">
          <div>
            <p className="sheet-kicker">Settings</p>
            <h2>Layout</h2>
          </div>
          <button type="button" onClick={props.onClose}>
            Close
          </button>
        </header>
        <div className="settings-row">
          <span>Pane width</span>
          <strong>{formatRatio(props.splitRatio)}</strong>
        </div>
        <button type="button" onClick={props.onResetSplitRatio}>
          Reset to {formatRatio(DEFAULT_SPLIT_RATIO)}
        </button>
      </section>
    </div>
  )
}
