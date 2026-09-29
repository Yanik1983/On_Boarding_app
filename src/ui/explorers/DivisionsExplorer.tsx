import type { StationOf } from '../../content/schema'
import { focusOn } from '../../scene/layout'
import { podFocusPoint, podPosition } from '../../scene/positions'
import { Chip, Chips, Hint, useStationSelection } from './shared'

export function DivisionsExplorer({ station }: { station: StationOf<'divisions'> }) {
  const [selected, select] = useStationSelection(station.id)
  const unit = station.units.find((u) => u.id === selected)
  const count = station.units.length
  return (
    <>
      <Hint>Choose a business unit, or click a pod in the 3D scene.</Hint>
      <Chips label="Business units">
        {station.units.map((u, i) => (
          <Chip key={u.id} color={u.color} active={selected === u.id} onClick={() => select(u.id, focusOn(podFocusPoint(podPosition(i, count)), 8.5, 1.8))}>
            {u.name}
          </Chip>
        ))}
        {unit && (
          <Chip active={false} onClick={() => select(null, null)}>
            Show all
          </Chip>
        )}
      </Chips>
      {unit && (
        <article className="detail" style={{ borderColor: unit.color }}>
          <h3 style={{ color: unit.color }}>{unit.name}</h3>
          <p className="lead">{unit.tagline}</p>
          <p>{unit.description}</p>
          {unit.focusAreas.length > 0 && (
            <ul className="bullets">
              {unit.focusAreas.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
          {unit.note && <p className="callout">{unit.note}</p>}
        </article>
      )}
    </>
  )
}
