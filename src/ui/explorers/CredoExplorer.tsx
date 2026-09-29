import type { StationOf } from '../../content/schema'
import { Hint, useStationSelection } from './shared'

export function CredoExplorer({ station }: { station: StationOf<'credo'> }) {
  const [selected, select] = useStationSelection(station.id)
  const active = station.responsibilities.find((r) => r.id === selected) ?? station.responsibilities[0]
  return (
    <>
      <Hint>Choose a responsibility, or click a panel on the monolith.</Hint>
      <div className="tabs" role="tablist" aria-label="Responsibilities">
        {station.responsibilities.map((r, i) => (
          <button key={r.id} role="tab" aria-selected={active.id === r.id} className={active.id === r.id ? 'tab active' : 'tab'} onClick={() => select(r.id)}>
            <span className="tab-number">{i + 1}</span>
            {r.title}
          </button>
        ))}
      </div>
      <article className="detail" role="tabpanel">
        <h3>{active.title}</h3>
        <p>{active.summary}</p>
        {active.inPractice.length > 0 && (
          <>
            <p className="detail-kicker">In practice</p>
            <ul className="bullets">
              {active.inPractice.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </article>
      <details className="credo-full" open={Boolean(station.officialText)}>
        <summary>Read the full text of Our Credo</summary>
        {station.officialText ? (
          <blockquote>
            {station.officialText.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </blockquote>
        ) : (
          <p className="muted">
            The official text of Our Credo will appear here once your onboarding team has added it (content field
            "officialText"). You can also read it on jnj.com.
          </p>
        )}
      </details>
    </>
  )
}
