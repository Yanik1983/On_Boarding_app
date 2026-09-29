import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import type { Vec3 } from '../../state/store'
import { segment } from '../geometry'
import { useHover, useSelection } from '../interaction'
import { focusOn } from '../layout'
import { BillboardLabel } from '../Label'
import { UnitIcon } from '../models/models'
import { useStationInfo } from '../StationContext'
import { podFocusPoint, podPosition } from '../positions'

const HUB: Vec3 = [0, 2.3, 0]

type Unit = StationOf<'divisions'>['units'][number]

function Pod({ unit, index, count }: { unit: Unit; index: number; count: number }) {
  const [selected, select] = useSelection()
  const { hovered, bind } = useHover()
  const reduced = useReducedMotion()
  const isSelected = selected === unit.id
  const position = podPosition(index, count)
  const beam = segment([HUB[0], HUB[1] - 0.4, HUB[2]], [position[0], 0.5, position[2]])

  return (
    <>
      <mesh position={beam.position} quaternion={beam.quaternion}>
        <cylinderGeometry args={[0.03, 0.03, beam.length, 8]} />
        <meshStandardMaterial color={unit.color} emissive={unit.color} emissiveIntensity={isSelected ? 2.5 : 1} toneMapped={false} />
      </mesh>
      <group
        position={position}
        {...bind}
        onClick={(e) => {
          e.stopPropagation()
          select(unit.id, focusOn(podFocusPoint(position), 5.8, 1.2))
        }}
      >
        <mesh position={[0, -1.25, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.05, 1.15, 0.22, 48]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0, -1.13, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.92, 1.02, 64]} />
          <meshStandardMaterial color={unit.color} emissive={unit.color} emissiveIntensity={isSelected ? 3 : hovered ? 2 : 1} toneMapped={false} />
        </mesh>
        <Float speed={reduced ? 0 : 1.6} floatIntensity={0.4} rotationIntensity={0.25}>
          <group scale={isSelected ? 1.18 : hovered ? 1.08 : 1} position={[0, 0.35, 0]}>
            <UnitIcon icon={unit.icon} color={unit.color} />
          </group>
        </Float>
        <mesh visible={false}>
          <sphereGeometry args={[1.1, 12, 12]} />
        </mesh>
        <BillboardLabel position={[0, 1.45, 0]} fontSize={0.3} weight="bold" color={isSelected ? unit.color : '#1b1f24'}>
          {unit.name}
        </BillboardLabel>
      </group>
    </>
  )
}

/** The MedTech hub with a pod for every business unit. */
export function DivisionsStation({ station }: { station: StationOf<'divisions'> }) {
  const { active } = useStationInfo()
  const reduced = useReducedMotion()
  const ring = useRef<Mesh>(null)
  const [, select] = useSelection()

  useFrame((_, delta) => {
    if (ring.current && active && !reduced) ring.current.rotation.z += delta * 0.4
  })

  return (
    <group>
      <group
        onClick={(e) => {
          e.stopPropagation()
          select(null, null)
        }}
      >
        <mesh position={HUB} castShadow>
          <sphereGeometry args={[1.05, 64, 64]} />
          <meshStandardMaterial color="#f3f5f8" metalness={0.55} roughness={0.22} />
        </mesh>
        <mesh ref={ring} position={HUB} rotation-x={Math.PI / 2.3}>
          <torusGeometry args={[1.5, 0.035, 12, 96]} />
          <meshStandardMaterial color={station.color} emissive={station.color} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.9, 0.6, 48]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <BillboardLabel position={[0, 4.0, 0]} fontSize={0.36} weight="bold" color={station.color}>
          {station.hubLabel}
        </BillboardLabel>
      </group>
      {station.units.map((unit, i) => (
        <Pod key={unit.id} unit={unit} index={i} count={station.units.length} />
      ))}
    </group>
  )
}
