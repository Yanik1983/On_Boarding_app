import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group } from 'three'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import { useStore, type Vec3 } from '../../state/store'
import { segment } from '../geometry'
import { Label } from '../Label'
import { useStationInfo } from '../StationContext'

function helixPoint(t: number, phase: number): Vec3 {
  const angle = t * Math.PI * 4 + phase
  const radius = 1.9 + Math.sin(t * Math.PI) * 0.5
  return [Math.cos(angle) * radius, 0.5 + t * 4.6, Math.sin(angle) * radius]
}

/** A double-helix light ribbon around a glass core – life science meets technology. */
export function WelcomeStation({ station }: { station: StationOf<'welcome'> }) {
  const { active } = useStationInfo()
  const reduced = useReducedMotion()
  const name = useStore((s) => s.name)
  const spin = useRef<Group>(null)

  const { strandA, strandB, rungs } = useMemo(() => {
    const strand = (phase: number) =>
      new TubeGeometry(
        new CatmullRomCurve3(Array.from({ length: 80 }, (_, i) => new Vector3(...helixPoint(i / 79, phase)))),
        320,
        0.11,
        16,
      )
    const rungs = Array.from({ length: 16 }, (_, i) => {
      const t = (i + 0.5) / 16
      return segment(helixPoint(t, 0), helixPoint(t, Math.PI))
    })
    return { strandA: strand(0), strandB: strand(Math.PI), rungs }
  }, [])

  useFrame((_, delta) => {
    if (spin.current && active && !reduced) spin.current.rotation.y += delta * 0.18
  })

  return (
    <group>
      <group ref={spin}>
        <mesh geometry={strandA} castShadow>
          <meshStandardMaterial color={station.color} emissive={station.color} emissiveIntensity={0.9} roughness={0.3} />
        </mesh>
        <mesh geometry={strandB} castShadow>
          <meshStandardMaterial color="#d8dde4" metalness={1} roughness={0.22} />
        </mesh>
        {rungs.map((r, i) => (
          <mesh key={i} position={r.position} quaternion={r.quaternion}>
            <cylinderGeometry args={[0.035, 0.035, r.length, 10]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffd9d2" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 2.8, 0]} castShadow>
        <sphereGeometry args={[1.05, 64, 64]} />
        <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={1.2} roughness={0.08} ior={1.5} clearcoat={1} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color={station.color} emissive={station.color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.9, 3.1, 0.24, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <group position={[0, 0.5, 4.6]} rotation-x={-0.5}>
        <Label fontSize={0.5} weight="bold" color="#1b1f24" maxWidth={9} textAlign="center">
          {name ? `${station.greeting}, ${name}!` : `${station.greeting}!`}
        </Label>
      </group>
    </group>
  )
}
