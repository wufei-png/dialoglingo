import { AnimatePresence, motion } from 'motion/react'
import type { SessionGroup } from './searchModel'

export function SessionTree(props: {
  groups: SessionGroup[]
  onToggleSession: (sessionId: string) => void
  onFocusSession: (sessionId: string) => void
  onToggleGroup: (groupId: string) => void
}) {
  const totalRows = props.groups.reduce((count, group) => count + group.rows.length, 0)

  if (totalRows === 0) {
    return <div className="session-empty-state">No sessions</div>
  }

  return (
    <div className="session-tree">
      <AnimatePresence initial={false}>
        {props.groups.map((group) => (
          <motion.section
            key={group.id}
            className="session-group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            <button
              type="button"
              className="session-group-header"
              aria-expanded={group.expanded}
              onClick={() => props.onToggleGroup(group.id)}
            >
              <span className="session-group-title">
                <span className="collapsible-caret" aria-hidden="true" />
                <span>{group.label}</span>
              </span>
              <span className="session-group-count">
                {group.selectedCount}/{group.totalCount}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {group.expanded ? (
                <motion.div
                  className="session-group-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                >
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
                            title={row.title}
                            onClick={() => props.onFocusSession(row.sessionId)}
                          >
                            <span>{row.title}</span>
                          </button>
                        </label>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.section>
        ))}
      </AnimatePresence>
    </div>
  )
}
