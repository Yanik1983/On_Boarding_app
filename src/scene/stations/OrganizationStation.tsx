import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, Vector3, type Mesh } from 'three'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import type { Vec3 } from '../../state/store'
import { useHover, useSelection } from '../interaction'
import { BillboardLabel } from '../Label'
import { useStationInfo } from '../StationContext'

const CENTER: Vec3 = [0, 1.9, -0.6]

function corePosition(i: number, count: number): Vec3 {
  const angle = Math.PI * 0.97 - (i / Math.max(1, count - 1)) * Math.PI * 0.94
  return [Math.cos(angle) * 5.2 + 0.5, 0.7, Math.sin(angle) * 2.2 + 1.4]
}

function supportPosition(i: number, count: number): Vec3 {
  const angle = Math.PI * 1.06 + (i / Math.max(1, count - 1)) * Math.PI * 0.88
  return [Math.cos(angle) * 5.2, 3.5 + (i % 2) * 0.55, Math.sin(angle) * 2.2 - 1.2]
}

type Fn = StationOf<'organization'>['functions'][number]

function Node({ fn, position, color, core }: { fn: Fn; position: Vec3; color: string; core: boolean }) {
  const [selected, select] = useSelection()
  const { hovered, bind } = useHover()
  const isSelected = selected === fn.id
  return (
    <group position={position}>
      <mesh
        {...bind}
        onClick={(e) => {
          e.stopPropagation()
          select(fn.id)
        }}
        scale={isSelected ? 1.25 : hovered ? 1.12 : 1}
        castShadow
      >
        <cylinderGeometry args={[0.46, 0.46, 0.32, 6]} />
        <meshStandardMaterial
          color={isSelected ? color : core ? '#ffffff' : '#eef2f6'}
          emissive={color}
          emissiveIntensity={isSelected ? 0.9 : hovered ? 0.25 : 0}
          roughness={0.3}
          metalness={core ? 0 : 0.2}
        />
      </mesh>
      <mesh position={[0, -0.17, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.46, 0.52, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <BillboardLabel position={[0, 0.62, 0]} fontSize={0.19} maxWidth={1.7} textAlign="center" color={isSelected ? color : '#1b1f24'}>
        {fn.name}
      </BillboardLabel>
    </group>
  )
}

/** Departments as a value chain from idea to patient, with support functions around the business unit. */
export function OrganizationStation({ station }: { station: StationOf<'organization'> }) {
  const { active } = useStationInfo()
  const reduced = useReducedMotion()
  const token = useRef<Mesh>(null)
  const supportColor = '#5b6b7d'

  const layout = useMemo(() => {
    const byId = new Map(station.functions.map((f) => [f.id, f]))
    const flow = station.flow.map((id) => byId.get(id)).filter((f): f is Fn => Boolean(f))
    const flowIds = new Set(flow.map((f) => f.id))
    const rest = station.functions.filter((f) => !flowIds.has(f.id))
    const core = [...flow, ...rest.filter((f) => f.lane === 'core')]
    const support = rest.filter((f) => f.lane === 'support')
    const count = flow.length + 1
    const positions = new Map<string, Vec3>()
    flow.forEach((f, i) => positions.set(f.id, corePosition(i, count)))
    core.slice(flow.length).forEach((f, i) => positions.set(f.id, [-4.5 + i * 1.4, 0.7, 3.4]))
    support.forEach((f, i) => positions.set(f.id, supportPosition(i, support.length)))
    const patient = corePosition(count - 1, count)
    const flowPoints = [...flow.map((f) => positions.get(f.id)!), patient].map((p) => new Vector3(p[0], p[1] + 0.05, p[2]))
    return { core, support, positions, patient, curve: new CatmullRomCurve3(flowPoints), flowPoints }
  }, [station])

  useFrame((state) => {
    if (!token.current || !active) return
    const t = reduced ? 1 : (state.clock.elapsedTime * 0.09) % 1
    token.current.position.copy(layout.curve.getPointAt(t))
    token.current.position.y += 0.35
  })

  return (
    <group>
      <Line points={layout.curve.getPoints(120)} color={station.color} lineWidth={3} />
      {layout.support.map((f) => (
        <Line key={f.id} points={[layout.positions.get(f.id)!, CENTER]} color={supportColor} lineWidth={1.2} transparent opacity={0.5} />
      ))}
      <mesh position={CENTER} castShadow>
        <sphereGeometry args={[0.55, 48, 48]} />
        <meshStandardMaterial color="#f3f5f8" metalness={0.55} roughness={0.22} />
      </mesh>
      <BillboardLabel position={[CENTER[0], CENTER[1] + 0.9, CENTER[2]]} fontSize={0.26} weight="bold" color={station.color}>
        {station.hubLabel}
      </BillboardLabel>
      {layout.core.map((f) => (
        <Node key={f.id} fn={f} position={layout.positions.get(f.id)!} color={station.color} core />
      ))}
      {layout.support.map((f) => (
        <Node key={f.id} fn={f} position={layout.positions.get(f.id)!} color={supportColor} core={false} />
      ))}
      <group position={layout.patient}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 48, 48]} />
          <meshStandardMaterial color="#d51900" emissive="#d51900" emissiveIntensity={0.8} roughness={0.3} />
        </mesh>
        <BillboardLabel position={[0, 0.85, 0]} fontSize={0.26} weight="bold" color="#d51900">
          {station.flowEndLabel}
        </BillboardLabel>
      </group>
      <mesh ref={token}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffe3a3" emissiveIntensity={4} toneMapped={false} />
      </mesh>
    </group>
  )
}
