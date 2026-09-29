import { useContent } from '../content/context'
import { canVisit, useStore } from '../state/store'
import { CheckIcon, ChevronLeft, ChevronRight, LockIcon } from './icons'

/** Bottom navigation: one dot per station plus overall progress. */
export function JourneyBar() {
  const { stations } = useContent()
  const current = useStore((s) => s.current)
  const completed = useStore((s) => s.completed)
  const state = useStore()
  const done = stations.filter((s) => completed.includes(s.id)).length
  const percent = Math.round((done / stations.length) * 100)

  return (
    <nav className="journey" aria-label="Journey">
      <button className="icon-button" onClick={() => state.prev()} disabled={current === 0} aria-label="Previous station">
        <ChevronLeft />
      </button>
      <ol className="journey-dots">
        {stations.map((s, i) => {
          const isDone = completed.includes(s.id)
          const locked = !canVisit(state, i)
          return (
            <li key={s.id}>
              <button
                className={['journey-dot', i === current ? 'current' : '', isDone ? 'done' : '', locked ? 'locked' : ''].join(' ')}
                style={{ ['--dot' as string]: s.color }}
                onClick={() => state.goTo(i)}
                disabled={locked}
                aria-current={i === current ? 'step' : undefined}
                aria-label={`${i + 1}. ${s.title}${isDone ? ' (completed)' : ''}${locked ? ' (locked)' : ''}`}
              >
                <span className="dot" aria-hidden>
                  {isDone ? <CheckIcon /> : locked ? <LockIcon /> : i + 1}
                </span>
                <span className="dot-label" aria-hidden>
                  {s.title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="journey-progress" aria-label={`${percent}% complete`}>
        <div className="bar">
          <div style={{ width: `${percent}%` }} />
        </div>
        <span>{percent}%</span>
      </div>
      <button className="icon-button" onClick={() => state.next()} disabled={!canVisit(state, current + 1)} aria-label="Next station">
        <ChevronRight />
      </button>
    </nav>
  )
}
