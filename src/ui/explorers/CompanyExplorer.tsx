import type { StationOf } from '../../content/schema'
import { Hint, useStationSelection } from './shared'

export function CompanyExplorer({ station }: { station: StationOf<'company'> }) {
  const [selected, select] = useStationSelection(station.id)
  const milestone = selected !== null ? station.milestones[Number(selected)] : undefined
  return (
    <>
      <Hint>Select a year here or click a disc on the 3D timeline.</Hint>
      <div className="timeline" role="group" aria-label="Milestones">
        {station.milestones.map((m, i) => (
          <button key={i} className={selected === String(i) ? 'year active' : 'year'} aria-pressed={selected === String(i)} onClick={() => select(String(i))}>
            {m.year}
          </button>
        ))}
      </div>
      {milestone ? (
        <article className="detail">
          <p className="detail-kicker">{milestone.year}</p>
          <h3>{milestone.title}</h3>
          <p>{milestone.text}</p>
        </article>
      ) : null}
    </>
  )
}
