import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, InstancedMesh, Object3D, type Group } from 'three'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import { useStore } from '../../state/store'
import { seeded } from '../geometry'
import { Label } from '../Label'
import { useStationInfo } from '../StationContext'

const CONFETTI = 220
const palette = ['#d51900', '#ffffff', '#ffb000', '#1f6feb', '#2e7d32', '#c2185b']

function Confetti() {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const pieces = useMemo(() => {
    const random = seeded(7)
    return Array.from({ length: CONFETTI }, () => ({
      x: (random() - 0.5) * 11,
      z: (random() - 0.5) * 8,
      y: random() * 9,
      speed: 0.6 + random() * 0.9,
      spin: random() * 6,
      color: new Color(palette[Math.floor(random() * palette.length)]),
    }))
  }, [])

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    pieces.forEach((p, i) => {
      p.y -= delta * p.speed
      if (p.y < 0.2) p.y = 9
      dummy.position.set(p.x + Math.sin(state.clock.elapsedTime + i) * 0.2, p.y, p.z)
      dummy.rotation.set(p.spin + state.clock.elapsedTime * 2, p.spin, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, p.color)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI]}>
      <planeGeometry args={[0.12, 0.2]} />
      <meshStandardMaterial side={2} roughness={0.5} />
    </instancedMesh>
  )
}

/** Podium with a glowing medal; celebrates once the knowledge check is passed. */
export function FinishStation({ station }: { station: StationOf<'finish'> }) {
  const { active } = useStationInfo()
  const reduced = useReducedMotion()
  const passed = useStore((s) => s.quiz?.passed ?? false)
  const name = useStore((s) => s.name)
  const medal = useRef<Group>(null)

  useFrame((_, delta) => {
    if (medal.current && active && !reduced) medal.current.rotation.y += delta * 0.6
  })

  return (
    <group>
      {[
        [3.2, 0.3],
        [2.4, 0.3],
        [1.6, 0.3],
      ].map(([radius, height], i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius + 0.08, height, 64]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      ))}
      <Float speed={reduced ? 0 : 1.5} floatIntensity={0.5}>
        <group ref={medal} position={[0, 3, 0]}>
          <mesh rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[1.1, 1.1, 0.16, 64]} />
            <meshStandardMaterial color={passed ? '#e2b33c' : '#eef1f5'} metalness={passed ? 1 : 0.2} roughness={passed ? 0.2 : 0.35} />
          </mesh>
          <mesh>
            <torusGeometry args={[1.12, 0.07, 16, 96]} />
            <meshStandardMaterial color={station.color} emissive={station.color} emissiveIntensity={passed ? 2.5 : 0.4} toneMapped={false} />
          </mesh>
          {[0, Math.PI].map((r) => (
            <group key={r} rotation-y={r}>
              <Label position={[0, 0, 0.09]} fontSize={passed ? 0.38 : 0.7} weight="bold" color={passed ? '#7a5a00' : station.color}>
                {passed ? 'DONE' : '?'}
              </Label>
            </group>
          ))}
        </group>
      </Float>
      <group position={[0, 0.9, 4.4]} rotation-x={-0.5}>
        <Label fontSize={0.4} weight="bold" maxWidth={10} textAlign="center" color={passed ? station.color : '#1b1f24'}>
          {passed ? `Journey complete${name ? `, ${name}` : ''}!` : 'One last step: the knowledge check'}
        </Label>
      </group>
      {passed && active && !reduced && <Confetti />}
    </group>
  )
}
