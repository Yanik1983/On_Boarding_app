import { Float, RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import { seeded } from '../geometry'
import { useHover, useSelection } from '../interaction'
import { BillboardLabel } from '../Label'

const BASE_Y = 0.5

type Hotspot = StationOf<'site'>['hotspots'][number]

function Pin({ hotspot, color }: { hotspot: Hotspot; color: string }) {
  const [selected, select] = useSelection()
  const { hovered, bind } = useHover()
  const reduced = useReducedMotion()
  const isSelected = selected === hotspot.id
  return (
    <group
      position={[hotspot.x, BASE_Y, hotspot.z]}
      {...bind}
      onClick={(e) => {
        e.stopPropagation()
        select(hotspot.id)
      }}
    >
      <Float speed={reduced ? 0 : 2.5} floatIntensity={0.3} rotationIntensity={0}>
        <group position={[0, 1.7, 0]} scale={isSelected ? 1.35 : hovered ? 1.15 : 1}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshStandardMaterial color={isSelected ? '#d51900' : color} emissive={isSelected ? '#d51900' : color} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, -0.32, 0]} rotation-x={Math.PI}>
            <coneGeometry args={[0.13, 0.4, 24]} />
            <meshStandardMaterial color={isSelected ? '#d51900' : color} />
          </mesh>
        </group>
      </Float>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.16, 0.24, 32]} />
        <meshBasicMaterial color={isSelected ? '#d51900' : color} />
      </mesh>
      <BillboardLabel position={[0, 2.35, 0]} fontSize={0.2} weight="bold" color={isSelected ? '#d51900' : '#1b1f24'}>
        {hotspot.name}
      </BillboardLabel>
    </group>
  )
}

/** A miniature campus generated from the site file, with clickable pins. */
export function SiteStation({ station }: { station: StationOf<'site'> }) {
  const trees = useMemo(() => {
    const random = seeded(42)
    const spots: [number, number, number][] = []
    for (let i = 0; i < 26; i++) {
      const edge = i % 2 === 0
      const x = edge ? -5.6 + random() * 11.2 : (random() > 0.5 ? 1 : -1) * (5.1 + random() * 0.4)
      const z = edge ? (random() > 0.5 ? 1 : -1) * (3.6 + random() * 0.3) : -3.5 + random() * 7
      spots.push([x, 0.35 + random() * 0.25, z])
    }
    return spots
  }, [])

  return (
    <group>
      <RoundedBox args={[12.4, 0.5, 8.6]} radius={0.2} position={[0, 0.25, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#e7ece4" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, BASE_Y + 0.005, 0.25]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[11.4, 0.5]} />
        <meshStandardMaterial color="#c5cbd3" roughness={0.9} />
      </mesh>
      <mesh position={[-1.4, BASE_Y + 0.005, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[0.45, 7.6]} />
        <meshStandardMaterial color="#c5cbd3" roughness={0.9} />
      </mesh>
      {station.buildings.map((b) => (
        <group key={b.id} position={[b.x, BASE_Y, b.z]}>
          <RoundedBox args={[b.width, b.height, b.depth]} radius={0.06} position={[0, b.height / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={b.color} roughness={0.55} />
          </RoundedBox>
          <mesh position={[0, b.height + 0.01, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[b.width * 0.86, b.depth * 0.86]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        </group>
      ))}
      {trees.map((p, i) => (
        <group key={i} position={[p[0], BASE_Y, p[2]]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.24, 8]} />
            <meshStandardMaterial color="#8a6b4f" />
          </mesh>
          <mesh position={[0, 0.24 + p[1] / 2, 0]} castShadow>
            <coneGeometry args={[0.24, p[1] + 0.2, 12]} />
            <meshStandardMaterial color="#5c9e62" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {station.hotspots.map((h) => (
        <Pin key={h.id} hotspot={h} color={station.color} />
      ))}
      <BillboardLabel position={[0, 4.3, -3.2]} fontSize={0.34} weight="bold" color={station.color}>
        {`${station.siteName} · ${station.location}`}
      </BillboardLabel>
    </group>
  )
}
