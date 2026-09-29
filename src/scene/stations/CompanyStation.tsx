import { useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import type { StationOf } from '../../content/schema'
import type { Vec3 } from '../../state/store'
import { useHover, useSelection } from '../interaction'
import { BillboardLabel } from '../Label'

function discPosition(i: number, count: number): Vec3 {
  const t = i / Math.max(1, count - 1)
  const angle = Math.PI * (1.02 - 1.04 * t)
  return [Math.cos(angle) * 5.2, 0.6 + t * 4.4, -Math.sin(angle) * 2.6 + 0.6]
}

function Milestone({ index, count, year, color }: { index: number; count: number; year: string; color: string }) {
  const [selected, select] = useSelection()
  const { hovered, bind } = useHover()
  const isSelected = selected === String(index)
  const position = discPosition(index, count)
  return (
    <group position={position}>
      <mesh
        {...bind}
        onClick={(e) => {
          e.stopPropagation()
          select(String(index))
        }}
        scale={isSelected ? 1.2 : hovered ? 1.1 : 1}
        castShadow
      >
        <cylinderGeometry args={[0.5, 0.5, 0.14, 48]} />
        <meshStandardMaterial
          color={isSelected ? color : '#ffffff'}
          emissive={color}
          emissiveIntensity={isSelected ? 0.9 : hovered ? 0.25 : 0}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, -0.075, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.5, 0.025, 8, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <BillboardLabel position={[0, 0.42, 0]} fontSize={0.28} weight="bold" color={isSelected ? color : '#1b1f24'}>
        {year}
      </BillboardLabel>
    </group>
  )
}

/** A rising spiral timeline – click a disc to read about that milestone. */
export function CompanyStation({ station }: { station: StationOf<'company'> }) {
  const count = station.milestones.length
  const spiral = useMemo(() => {
    const points = station.milestones.map((_, i) => new Vector3(...discPosition(i, count)))
    return new TubeGeometry(new CatmullRomCurve3(points), count * 24, 0.04, 8)
  }, [station.milestones, count])

  return (
    <group>
      <mesh geometry={spiral}>
        <meshStandardMaterial color={station.color} transparent opacity={0.55} />
      </mesh>
      {station.milestones.map((_, i) => {
        const [x, y, z] = discPosition(i, count)
        return (
          <mesh key={i} position={[x, (y - 0.08) / 2, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, y - 0.08, 8]} />
            <meshStandardMaterial color="#d5dbe2" metalness={0.8} roughness={0.3} />
          </mesh>
        )
      })}
      {station.milestones.map((m, i) => (
        <Milestone key={m.year + i} index={i} count={count} year={m.year} color={station.color} />
      ))}
    </group>
  )
}
