export type SessionGroup = {
  label: string
  expanded: boolean
  selectedCount: number
  totalCount: number
  rows: Array<{
    sessionId: string
    title: string
    snippet: string | null
    selected: boolean
    focused: boolean
  }>
}

export function SessionTree(props: {
  groups: SessionGroup[]
  onToggleSession: (sessionId: string) => void
  onFocusSession: (sessionId: string) => void
}) {
  return (
    <div className="session-tree">
      {props.groups.map((group) => (
        <section key={group.label} className="session-group">
          <header className="session-group-header">
            <span>{group.label}</span>
            <span>
              {group.selectedCount}/{group.totalCount}
            </span>
          </header>
          {group.expanded ? (
            <ul className="session-group-list">
              {group.rows.map((row) => (
                <li key={row.sessionId} className="session-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => props.onToggleSession(row.sessionId)}
                    />
                    <button
                      type="button"
                      className={row.focused ? 'session-row-button is-focused' : 'session-row-button'}
                      onClick={() => props.onFocusSession(row.sessionId)}
                    >
                      <span>{row.title}</span>
                      {row.snippet ? <small>{row.snippet}</small> : null}
                    </button>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  )
}
