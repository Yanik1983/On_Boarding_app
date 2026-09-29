import type { StationOf } from '../../content/schema'
import { useStore } from '../../state/store'
import { Chip, Chips, Hint, useStationSelection } from './shared'

export function SiteExplorer({ station }: { station: StationOf<'site'> }) {
  const [selected, select] = useStationSelection(station.id)
  const checklist = useStore((s) => s.checklist)
  const toggle = useStore((s) => s.toggleChecklist)
  const hotspot = station.hotspots.find((h) => h.id === selected)
  const done = station.checklist.filter((c) => checklist.includes(c.id)).length

  return (
    <>
      <p className="lead">{`${station.siteName} · ${station.location}`}</p>
      <p>{station.role}</p>
      {station.hotspots.length > 0 && (
        <>
          <Hint>Click a pin on the campus map or choose a place:</Hint>
          <Chips label="Places">
            {station.hotspots.map((h) => (
              <Chip key={h.id} active={selected === h.id} onClick={() => select(h.id)}>
                {h.name}
              </Chip>
            ))}
          </Chips>
          {hotspot && (
            <article className="detail">
              <h3>{hotspot.name}</h3>
              <p>{hotspot.text}</p>
            </article>
          )}
        </>
      )}
      {station.safety.length > 0 && (
        <section className="section">
          <h3>Safety essentials</h3>
          <ul className="bullets">
            {station.safety.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}
      {station.contacts.length > 0 && (
        <section className="section">
          <h3>Key contacts</h3>
          <table className="contacts">
            <tbody>
              {station.contacts.map((c, i) => (
                <tr key={i}>
                  <th scope="row">{c.role}</th>
                  <td>{c.name}</td>
                  <td>{c.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {station.checklist.length > 0 && (
        <section className="section">
          <h3>{`My first-week checklist (${done}/${station.checklist.length})`}</h3>
          <ul className="checklist">
            {station.checklist.map((c) => (
              <li key={c.id}>
                <label className="choice">
                  <input type="checkbox" checked={checklist.includes(c.id)} onChange={() => toggle(c.id)} />
                  <span>{c.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
