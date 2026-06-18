import { useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (payload: {
    format: 'anki-package' | 'anki-text-bundle' | 'generic-text-bundle'
    deckName: string
    direction: 'en-zh' | 'zh-en' | 'bilingual'
    includeExpressions: boolean
    includeSentences: boolean
    tagPrefix: string
    outputLocation: string
    keepFlaggedItems: boolean
  }) => void
}

function SelectionButton(props: { selected: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={props.selected ? 'selection-button is-selected' : 'selection-button'}
      aria-pressed={props.selected}
      aria-label={props.selected ? `Disable ${props.label}` : `Enable ${props.label}`}
      title={props.selected ? 'Selected' : 'Not selected'}
      onClick={props.onToggle}
    >
      <span className="selection-button-check" aria-hidden="true" />
    </button>
  )
}

export function ExportModal({ open, onClose, onConfirm }: Props) {
  const [deckName, setDeckName] = useState('DialogLingo')
  const [direction, setDirection] = useState<'en-zh' | 'zh-en' | 'bilingual'>('bilingual')
  const [includeExpressions, setIncludeExpressions] = useState(true)
  const [includeSentences, setIncludeSentences] = useState(true)
  const [tagPrefix, setTagPrefix] = useState('dialoglingo')
  const [outputLocation, setOutputLocation] = useState('~/Downloads/DialogLingo')
  const [keepFlaggedItems, setKeepFlaggedItems] = useState(false)

  if (!open) {
    return null
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet export-modal">
        <p className="sheet-kicker">Export Workbook</p>
        <h2>Choose an export target</h2>
        <div className="export-field-list">
          <label className="export-field">
            <span className="export-field-copy">
              <span className="export-field-label">Deck name</span>
              <span className="export-field-description">
                Name used for the Anki deck and export manifest.
              </span>
            </span>
            <input
              aria-label="Deck name"
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
            />
          </label>
          <label className="export-field">
            <span className="export-field-copy">
              <span className="export-field-label">Tag prefix</span>
              <span className="export-field-description">
                Prefix applied to generated Anki tags.
              </span>
            </span>
            <input
              aria-label="Tag prefix"
              value={tagPrefix}
              onChange={(event) => setTagPrefix(event.target.value)}
            />
          </label>
          <label className="export-field">
            <span className="export-field-copy">
              <span className="export-field-label">Output folder</span>
              <span className="export-field-description">
                Local folder where export files will be written.
              </span>
            </span>
            <input
              aria-label="Output folder"
              value={outputLocation}
              onChange={(event) => setOutputLocation(event.target.value)}
            />
          </label>
          <label className="export-field">
            <span className="export-field-copy">
              <span className="export-field-label">Card direction</span>
              <span className="export-field-description">
                Controls which language appears on the front or back.
              </span>
            </span>
            <select
              aria-label="Card direction"
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as 'en-zh' | 'zh-en' | 'bilingual')
              }
            >
              <option value="en-zh">EN -&gt; ZH</option>
              <option value="zh-en">ZH -&gt; EN</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </label>
        </div>
        <div className="export-option-list">
          <div className="export-option-row">
            <span className="export-option-copy">
              <span className="export-option-label">Expressions</span>
              <span className="export-option-description">
                Include reviewed expression cards.
              </span>
            </span>
            <SelectionButton
              selected={includeExpressions}
              label="Expressions"
              onToggle={() => setIncludeExpressions((current) => !current)}
            />
          </div>
          <div className="export-option-row">
            <span className="export-option-copy">
              <span className="export-option-label">Sentences</span>
              <span className="export-option-description">
                Include reviewed sentence cards.
              </span>
            </span>
            <SelectionButton
              selected={includeSentences}
              label="Sentences"
              onToggle={() => setIncludeSentences((current) => !current)}
            />
          </div>
          <div className="export-option-row">
            <span className="export-option-copy">
              <span className="export-option-label">Keep flagged items</span>
              <span className="export-option-description">
                Export items marked for another review pass.
              </span>
            </span>
            <SelectionButton
              selected={keepFlaggedItems}
              label="Keep flagged items"
              onToggle={() => setKeepFlaggedItems((current) => !current)}
            />
          </div>
        </div>
        <div className="sheet-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                format: 'anki-package',
                deckName,
                direction,
                includeExpressions,
                includeSentences,
                tagPrefix,
                outputLocation,
                keepFlaggedItems
              })
            }
          >
            Export Anki Package
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                format: 'anki-text-bundle',
                deckName,
                direction,
                includeExpressions,
                includeSentences,
                tagPrefix,
                outputLocation,
                keepFlaggedItems
              })
            }
          >
            Export Anki Text Bundle
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                format: 'generic-text-bundle',
                deckName,
                direction,
                includeExpressions,
                includeSentences,
                tagPrefix,
                outputLocation,
                keepFlaggedItems
              })
            }
          >
            Export Generic Text Bundle
          </button>
        </div>
      </div>
    </div>
  )
}
