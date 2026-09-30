import { Float, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { ExtrudeGeometry, type Group } from 'three'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import { heartShape } from '../geometry'
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

/** Small 3D symbols: a heart (patients), people (employees), a globe (communities), rising bars (stockholders). */
function StakeholderIcon({ index, color, selected }: { index: number; color: string; selected: boolean }) {
  const heart = useMemo(() => {
    const g = new ExtrudeGeometry(heartShape(), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 32 })
    g.center()
    return g
  }, [])
  const body = (
    <meshPhysicalMaterial
      color={selected ? color : '#eef1f5'}
      emissive={color}
      emissiveIntensity={selected ? 0.8 : 0.04}
      metalness={0.3}
      roughness={0.3}
      clearcoat={0.6}
    />
  )
  const accent = <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.6} />
  switch (index) {
    case 0:
      return (
        <mesh geometry={heart} scale={0.6} castShadow>
          {body}
        </mesh>
      )
    case 1:
      return (
        <group scale={0.8}>
          {[-0.22, 0, 0.22].map((x, i) => (
            <group key={x} position={[x, i === 1 ? 0.05 : 0, i === 1 ? 0.05 : 0]}>
              <mesh position={[0, 0.16, 0]} castShadow>
                <sphereGeometry args={[0.08, 24, 16]} />
                {i === 1 ? accent : body}
              </mesh>
              <mesh position={[0, -0.06, 0]} castShadow>
                <capsuleGeometry args={[0.08, 0.14, 8, 16]} />
                {body}
              </mesh>
            </group>
          ))}
        </group>
      )
    case 2:
      return (
        <group scale={0.9}>
          <mesh castShadow>
            <sphereGeometry args={[0.24, 32, 24]} />
            {body}
          </mesh>
          {[0, Math.PI / 2].map((r) => (
            <mesh key={r} rotation-y={r}>
              <torusGeometry args={[0.25, 0.012, 8, 48]} />
              {accent}
            </mesh>
          ))}
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.25, 0.012, 8, 48]} />
            {accent}
          </mesh>
        </group>
      )
    default:
      return (
        <group scale={0.9}>
          {[0.12, 0.22, 0.34].map((h, i) => (
            <mesh key={i} position={[-0.14 + i * 0.14, h / 2 - 0.15, 0]} castShadow>
              <boxGeometry args={[0.1, h, 0.1]} />
              {i === 2 ? accent : body}
            </mesh>
          ))}
          <mesh position={[-0.02, -0.17, 0]}>
            <boxGeometry args={[0.42, 0.02, 0.14]} />
            {body}
          </mesh>
        </group>
      )
  }
}

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
        <meshPhysicalMaterial color="#eef3f9" transparent opacity={0.62} roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} depthWrite={false} />
      </RoundedBox>
      {/* Chrome frame */}
      {[
        [0, 5.68, 3.5, 0.08],
        [0, 0.24, 3.5, 0.08],
        [-1.73, 2.96, 0.08, 5.44],
        [1.73, 2.96, 0.08, 5.44],
      ].map(([x, y, w, h], i) => (
        <RoundedBox key={i} args={[w, h, 0.56]} radius={0.03} position={[x, y, 0]} castShadow>
          <meshPhysicalMaterial color="#dfe3e8" metalness={1} roughness={0.18} anisotropy={0.6} />
        </RoundedBox>
      ))}
      <Label position={[0, 0.305, 2.05]} rotation-x={-Math.PI / 2} fontSize={0.26} letterSpacing={0.25} color={station.color} weight="bold">
        OUR CREDO · 1943
      </Label>
      {station.responsibilities.map((r, i) => (
        <CredoPanel key={r.id} index={i} id={r.id} title={r.title} color={station.color} />
      ))}
      <group ref={orbit} position={[0, 2.9, 0]}>
        {station.responsibilities.map((r, i) => {
          const angle = (i / 4) * Math.PI * 2
          const isSelected = selected === r.id
          return (
            <Float key={r.id} speed={reduced ? 0 : 2} floatIntensity={0.6} rotationIntensity={0.5}>
              <group position={[Math.cos(angle) * 3.3, Math.sin(i * 1.7) * 0.8, Math.sin(angle) * 3.3]} scale={isSelected ? 1.9 : 1.4}>
                <StakeholderIcon index={i} color={station.color} selected={isSelected} />
              </group>
            </Float>
          )
        })}
      </group>
    </group>
  )
}
