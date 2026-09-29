import { useContent } from '../content/context'
import { canVisit, useStore } from '../state/store'
import { Dialog } from './Dialog'
import { CheckIcon, LockIcon } from './icons'

export function StationMenu() {
  const { stations } = useContent()
  const state = useStore()
  const total = stations.reduce((sum, s) => sum + s.minutes, 0)
  return (
    <Dialog title="All stations" onClose={() => state.setMenuOpen(false)}>
      <p className="muted">{`${stations.length} stations · about ${total} minutes in total`}</p>
      <ol className="station-list">
        {stations.map((s, i) => {
          const done = state.completed.includes(s.id)
          const locked = !canVisit(state, i)
          return (
            <li key={s.id}>
              <button className={i === state.current ? 'current' : ''} disabled={locked} onClick={() => state.goTo(i)}>
                <span className="station-number" style={{ background: s.color }}>
                  {i + 1}
                </span>
                <span className="station-text">
                  <strong>{s.title}</strong>
                  <span>{s.subtitle}</span>
                </span>
                <span className="station-state">
                  {done ? (
                    <>
                      <CheckIcon /> Done
                    </>
                  ) : locked ? (
                    <>
                      <LockIcon /> Locked
                    </>
                  ) : (
                    `${s.minutes} min`
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </Dialog>
  )
}
