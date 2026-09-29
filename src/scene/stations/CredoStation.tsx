import { Float, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import { useHover, useSelection } from '../interaction'
import { Label } from '../Label'
import { useStationInfo } from '../StationContext'

const PANEL_Y = [4.75, 3.55, 2.35, 1.15]

function CredoPanel({ index, id, title, color }: { index: number; id: string; title: string; color: string }) {
  const [selected, select] = useSelection()
  const { hovered, bind } = useHover()
  const isSelected = selected === id
  return (
    <group position={[0, PANEL_Y[index], 0.34]}>
      <RoundedBox
        args={[2.9, 1.0, 0.1]}
        radius={0.05}
        {...bind}
        onClick={(e) => {
          e.stopPropagation()
          select(id)
        }}
      >
        <meshStandardMaterial
          color={isSelected ? color : '#ffffff'}
          emissive={color}
          emissiveIntensity={isSelected ? 0.7 : hovered ? 0.18 : 0}
          roughness={0.35}
        />
      </RoundedBox>
      <Label position={[-1.18, 0, 0.07]} fontSize={0.42} weight="bold" color={isSelected ? '#ffffff' : color}>
        {String(index + 1)}
      </Label>
      <Label position={[0.25, 0, 0.07]} fontSize={0.2} maxWidth={2.2} color={isSelected ? '#ffffff' : '#1b1f24'}>
        {title}
      </Label>
    </group>
  )
}

const orbitShapes = ['sphere', 'box', 'torus', 'octahedron'] as const

/** A frosted-glass monolith with the four responsibilities, circled by four symbols. */
export function CredoStation({ station }: { station: StationOf<'credo'> }) {
  const { active } = useStationInfo()
  const reduced = useReducedMotion()
  const [selected] = useSelection()
  const orbit = useRef<Group>(null)

  useFrame((_, delta) => {
    if (orbit.current && active && !reduced) orbit.current.rotation.y += delta * 0.25
  })

  return (
    <group>
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.6, 2.8, 0.3, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <RoundedBox args={[3.4, 5.4, 0.5]} radius={0.14} position={[0, 2.95, 0]} castShadow>
        <meshPhysicalMaterial color="#f4f7fb" transmission={0.9} thickness={1.4} roughness={0.32} ior={1.45} clearcoat={0.6} />
      </RoundedBox>
      {station.responsibilities.map((r, i) => (
        <CredoPanel key={r.id} index={i} id={r.id} title={r.title} color={station.color} />
      ))}
      <group ref={orbit} position={[0, 2.9, 0]}>
        {station.responsibilities.map((r, i) => {
          const angle = (i / 4) * Math.PI * 2
          const isSelected = selected === r.id
          const shape = orbitShapes[i]
          return (
            <Float key={r.id} speed={reduced ? 0 : 2} floatIntensity={0.6} rotationIntensity={0.8}>
              <mesh position={[Math.cos(angle) * 3.3, Math.sin(i * 1.7) * 0.8, Math.sin(angle) * 3.3]} scale={isSelected ? 1.5 : 1} castShadow>
                {shape === 'sphere' && <sphereGeometry args={[0.28, 32, 32]} />}
                {shape === 'box' && <boxGeometry args={[0.42, 0.42, 0.42]} />}
                {shape === 'torus' && <torusGeometry args={[0.24, 0.09, 16, 48]} />}
                {shape === 'octahedron' && <octahedronGeometry args={[0.32]} />}
                <meshStandardMaterial
                  color={isSelected ? station.color : '#e9edf2'}
                  emissive={station.color}
                  emissiveIntensity={isSelected ? 1.2 : 0.05}
                  metalness={0.4}
                  roughness={0.3}
                />
              </mesh>
            </Float>
          )
        })}
      </group>
    </group>
  )
}
