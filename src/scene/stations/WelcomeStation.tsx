import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group } from 'three'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import { useStore, type Vec3 } from '../../state/store'
import { heartGeometry } from '../models/models'
import { Label } from '../Label'
import { useStationInfo } from '../StationContext'

function helixPoint(t: number, phase: number): Vec3 {
  const angle = t * Math.PI * 4 + phase
  const radius = 2.25 + Math.sin(t * Math.PI) * 0.45
  return [Math.cos(angle) * radius, 0.5 + t * 4.6, Math.sin(angle) * radius]
}

/** Heartbeat curve: two quick pulses ("lub-dub") about once per second, then rest. */
function heartbeat(t: number) {
  const x = t % 1.1
  return Math.exp(-(((x - 0.1) / 0.06) ** 2)) + 0.6 * Math.exp(-(((x - 0.32) / 0.06) ** 2))
}

/** A double-helix ribbon around a glossy, turning heart – life science, technology and care. */
export function WelcomeStation({ station }: { station: StationOf<'welcome'> }) {
  const { active } = useStationInfo()
  const reduced = useReducedMotion()
  const name = useStore((s) => s.name)
  const spin = useRef<Group>(null)
  const heart = useRef<Group>(null)
  const heartShape = useMemo(heartGeometry, [])

  const { strandA, strandB, beads } = useMemo(() => {
    const strand = (phase: number) =>
      new TubeGeometry(
        new CatmullRomCurve3(Array.from({ length: 80 }, (_, i) => new Vector3(...helixPoint(i / 79, phase)))),
        320,
        0.11,
        16,
      )
    // Small glowing beads along both strands (the heart in the middle stays unobstructed).
    const beads = Array.from({ length: 24 }, (_, i) => helixPoint((i + 0.5) / 24, i % 2 ? Math.PI : 0))
    return { strandA: strand(0), strandB: strand(Math.PI), beads }
  }, [])

  useFrame((state, delta) => {
    if (!active || reduced) return
    if (spin.current) spin.current.rotation.y += delta * 0.18
    if (heart.current) {
      heart.current.rotation.y += delta * 0.7
      heart.current.scale.setScalar(1.8 * (1 + 0.06 * heartbeat(state.clock.elapsedTime)))
    }
  })

  return (
    <group>
      <Sparkles count={70} scale={[6.5, 5, 6.5]} position={[0, 2.8, 0]} size={3} speed={reduced ? 0 : 0.35} color={station.color} opacity={0.7} />
      <group ref={spin}>
        <mesh geometry={strandA} castShadow>
          <meshStandardMaterial color={station.color} emissive={station.color} emissiveIntensity={0.9} roughness={0.3} />
        </mesh>
        <mesh geometry={strandB} castShadow>
          <meshStandardMaterial color="#d8dde4" metalness={1} roughness={0.22} />
        </mesh>
        {beads.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.16, 24, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffd9d2" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={heart} position={[0, 2.8, 0]} scale={1.8}>
        <mesh geometry={heartShape} castShadow>
          <meshPhysicalMaterial
            color={station.color}
            emissive={station.color}
            emissiveIntensity={0.2}
            roughness={0.26}
            clearcoat={1}
            clearcoatRoughness={0.06}
            sheen={0.25}
            sheenColor="#ff5a45"
          />
        </mesh>
      </group>
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
