import { useStationOfKind } from '../../content/context'
import type { StationOf } from '../../content/schema'
import { focusOn } from '../../scene/layout'
import { pedestalFocusPoint, pedestalPosition, pedestalScale, PRODUCT_FILTER_KEY, resolveProductFilter } from '../../scene/positions'
import { Chip, Chips, Hint, useStationSelection } from './shared'

export function ProductsExplorer({ station }: { station: StationOf<'products'> }) {
  const divisions = useStationOfKind('divisions')
  const [filterValue, setFilter] = useStationSelection(PRODUCT_FILTER_KEY)
  const [selected, select] = useStationSelection(station.id)
  const unitOf = (id: string) => divisions?.units.find((u) => u.id === id)
  const product = station.products.find((p) => p.id === selected)
  const units = divisions?.units.filter((u) => station.products.some((p) => p.unit === u.id)) ?? []
  const filter = resolveProductFilter(filterValue, units[0]?.id)
  const visible = station.products.filter((p) => !filter || p.unit === filter)
  const scale = pedestalScale(visible.length)

  return (
    <>
      <Hint>Filter by business unit, then choose a product – or click a pedestal.</Hint>
      <Chips label="Filter by business unit">
        <Chip
          active={!filter}
          onClick={() => {
            setFilter('all')
            select(null, null)
          }}
        >
          All
        </Chip>
        {units.map((u) => (
          <Chip
            key={u.id}
            color={u.color}
            active={filter === u.id}
            onClick={() => {
              setFilter(u.id)
              select(null, null)
            }}
          >
            {u.name}
          </Chip>
        ))}
      </Chips>
      <ul className="product-list">
        {visible.map((p, i) => (
          <li key={p.id}>
            <button
              className={selected === p.id ? 'active' : ''}
              aria-pressed={selected === p.id}
              onClick={() => select(p.id, focusOn(pedestalFocusPoint(pedestalPosition(i, visible.length), scale), 4.5 + scale * 3, 1.2))}
            >
              <span className="chip-dot" style={{ background: unitOf(p.unit)?.color }} aria-hidden />
              {p.name}
            </button>
          </li>
        ))}
      </ul>
      {product && (
        <article className="detail" style={{ borderColor: unitOf(product.unit)?.color }}>
          <p className="detail-kicker">{unitOf(product.unit)?.name}</p>
          <h3>{product.name}</h3>
          <dl className="facts">
            <dt>What it does</dt>
            <dd>{product.what}</dd>
            <dt>Who it helps</dt>
            <dd>{product.who}</dd>
            <dt>The technology</dt>
            <dd>{product.technology}</dd>
          </dl>
        </article>
      )}
      {station.disclaimer && <p className="muted small">{station.disclaimer}</p>}
    </>
  )
}
