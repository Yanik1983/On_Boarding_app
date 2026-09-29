import type { StationOf } from '../../content/schema'
import { Chip, Chips, useStationSelection } from './shared'

export function OrganizationExplorer({ station }: { station: StationOf<'organization'> }) {
  const [selected, select] = useStationSelection(station.id)
  const fn = station.functions.find((f) => f.id === selected)
  const core = station.functions.filter((f) => f.lane === 'core')
  const support = station.functions.filter((f) => f.lane === 'support')
  return (
    <>
      <p>{station.operatingModel}</p>
      <p className="detail-kicker">From idea to patient</p>
      <Chips label="Core functions">
        {core.map((f) => (
          <Chip key={f.id} active={selected === f.id} onClick={() => select(f.id)}>
            {f.name}
          </Chip>
        ))}
      </Chips>
      <p className="detail-kicker">Support functions</p>
      <Chips label="Support functions">
        {support.map((f) => (
          <Chip key={f.id} active={selected === f.id} onClick={() => select(f.id)}>
            {f.name}
          </Chip>
        ))}
      </Chips>
      {fn && (
        <article className="detail">
          <h3>{fn.name}</h3>
          <p>{fn.role}</p>
          {fn.teams.length > 0 && (
            <>
              <p className="detail-kicker">Typical teams</p>
              <ul className="bullets">
                {fn.teams.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </>
          )}
          {fn.workWith && (
            <p>
              <strong>How you'll work with them: </strong>
              {fn.workWith}
            </p>
          )}
        </article>
      )}
    </>
  )
}
