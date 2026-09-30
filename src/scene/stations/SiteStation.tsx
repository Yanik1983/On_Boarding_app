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

type Building = StationOf<'site'>['buildings'][number]

/** A building with glass window bands on every side, a roof deck and rooftop units. */
function CampusBuilding({ b }: { b: Building }) {
  const floors = Math.max(1, Math.floor(b.height / 0.34))
  const glass = <meshPhysicalMaterial color="#6f8aa8" metalness={0.35} roughness={0.08} clearcoat={1} />
  return (
    <group position={[b.x, BASE_Y, b.z]}>
      <RoundedBox args={[b.width, b.height, b.depth]} radius={0.04} position={[0, b.height / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={b.color} roughness={0.5} />
      </RoundedBox>
      {Array.from({ length: floors }, (_, f) => {
        const y = ((f + 0.55) / floors) * b.height
        const h = Math.min(0.16, (b.height / floors) * 0.5)
        return (
          <group key={f} position={[0, y, 0]}>
            {[1, -1].map((side) => (
              <mesh key={`z${side}`} position={[0, 0, side * (b.depth / 2 + 0.004)]} rotation-y={side > 0 ? 0 : Math.PI}>
                <planeGeometry args={[b.width * 0.88, h]} />
                {glass}
              </mesh>
            ))}
            {[1, -1].map((side) => (
              <mesh key={`x${side}`} position={[side * (b.width / 2 + 0.004), 0, 0]} rotation-y={(side * Math.PI) / 2}>
                <planeGeometry args={[b.depth * 0.88, h]} />
                {glass}
              </mesh>
            ))}
          </group>
        )
      })}
      <mesh position={[0, b.height + 0.012, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[b.width * 0.9, b.depth * 0.9]} />
        <meshStandardMaterial color="#f7f8fa" roughness={0.5} />
      </mesh>
      {[-0.22, 0.22].map((dx, i) => (
        <RoundedBox key={i} args={[0.26, 0.12, 0.2]} radius={0.02} position={[dx * b.width, b.height + 0.07, (i ? -0.18 : 0.12) * b.depth]} castShadow>
          <meshPhysicalMaterial color="#c9ced6" metalness={0.6} roughness={0.3} />
        </RoundedBox>
      ))}
    </group>
  )
}

/** A leafy tree made of a few overlapping crowns. */
function Tree({ position, size, tint }: { position: [number, number]; size: number; tint: string }) {
  return (
    <group position={[position[0], BASE_Y, position[1]]} scale={size}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.28, 10]} />
        <meshStandardMaterial color="#8a6b4f" roughness={0.9} />
      </mesh>
      {[
        [0, 0.42, 0, 0.2],
        [0.1, 0.34, 0.06, 0.14],
        [-0.09, 0.36, -0.05, 0.15],
        [0.02, 0.54, -0.03, 0.13],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 2]} />
          <meshStandardMaterial color={tint} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

const CAR_COLORS = ['#d51900', '#f4f5f7', '#2b3038', '#1f6feb', '#9aa3ad', '#f4f5f7', '#2e7d32', '#c9ced6']

function Car({ position, color, rotation = 0 }: { position: [number, number]; color: string; rotation?: number }) {
  return (
    <group position={[position[0], BASE_Y, position[1]]} rotation-y={rotation}>
      <RoundedBox args={[0.2, 0.08, 0.38]} radius={0.03} position={[0, 0.07, 0]} castShadow>
        <meshPhysicalMaterial color={color} metalness={0.5} roughness={0.25} clearcoat={1} />
      </RoundedBox>
      <RoundedBox args={[0.17, 0.07, 0.2]} radius={0.03} position={[0, 0.135, -0.02]} castShadow>
        <meshPhysicalMaterial color="#26303b" metalness={0.3} roughness={0.1} clearcoat={1} />
      </RoundedBox>
      {[
        [-0.1, 0.12],
        [0.1, 0.12],
        [-0.1, -0.12],
        [0.1, -0.12],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.035, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
          <meshStandardMaterial color="#1a1d22" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Lamp({ position }: { position: [number, number] }) {
  return (
    <group position={[position[0], BASE_Y, position[1]]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.012, 0.016, 0.6, 8]} />
        <meshStandardMaterial color="#6b7480" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.61, 0]}>
        <sphereGeometry args={[0.035, 16, 12]} />
        <meshStandardMaterial color="#fff6dc" emissive="#ffe7a8" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** A miniature campus generated from the site file, with clickable pins. */
export function SiteStation({ station }: { station: StationOf<'site'> }) {
  const trees = useMemo(() => {
    const random = seeded(42)
    const spots: { position: [number, number]; size: number; tint: string }[] = []
    const tints = ['#5c9e62', '#4f8f58', '#6aa86b', '#7bb56f']
    for (let i = 0; i < 30; i++) {
      const edge = i % 2 === 0
      const x = edge ? -5.6 + random() * 11.2 : (random() > 0.5 ? 1 : -1) * (5.3 + random() * 0.4)
      const z = edge ? (random() > 0.5 ? 1 : -1) * (3.75 + random() * 0.3) : -3.5 + random() * 7
      spots.push({ position: [x, z], size: 0.9 + random() * 0.6, tint: tints[Math.floor(random() * tints.length)] })
    }
    return spots
  }, [])

  const road = <meshStandardMaterial color="#b9c0c9" roughness={0.9} />

  return (
    <group>
      <RoundedBox args={[12.4, 0.5, 8.6]} radius={0.2} position={[0, 0.25, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#e3eadf" roughness={0.9} />
      </RoundedBox>
      {/* Roads with lane markings */}
      <mesh position={[0, BASE_Y + 0.005, 0.25]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[11.4, 0.5]} />
        {road}
      </mesh>
      <mesh position={[-1.4, BASE_Y + 0.005, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[0.45, 7.6]} />
        {road}
      </mesh>
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={i} position={[-5.3 + i * 0.62, BASE_Y + 0.008, 0.25]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.3, 0.025]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Parking lot */}
      <mesh position={[3.3, BASE_Y + 0.006, 1.55]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[2.6, 1.4]} />
        {road}
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[2.1 + i * 0.3, BASE_Y + 0.009, 1.55]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.02, 1.1]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {[0, 1, 3, 4, 6, 7].map((slot, i) => (
        <Car key={slot} position={[2.25 + slot * 0.3, 1.55 + (i % 2 ? 0.02 : -0.02)]} color={CAR_COLORS[i]} />
      ))}
      {[-4.6, -2.4, 0.2, 2.2, 4.4].map((x) => (
        <Lamp key={x} position={[x, 0.62]} />
      ))}
      {station.buildings.map((b) => (
        <CampusBuilding key={b.id} b={b} />
      ))}
      {trees.map((t, i) => (
        <Tree key={i} {...t} />
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
