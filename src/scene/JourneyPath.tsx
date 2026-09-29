import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3, type Mesh } from 'three'
import { useReducedMotion } from '../lib/motion'
import { useStore } from '../state/store'
import { stationPosition } from './layout'

const TUBULAR = 60
const RADIAL = 10

/** The glowing path that links the stations and fills up as the journey progresses. */
export function JourneyPath({ count, color }: { count: number; color: string }) {
  const reduced = useReducedMotion()
  const highestUnlocked = useStore((s) => s.highestUnlocked)
  const progress = useRef<Mesh>(null)
  const pulse = useRef<Mesh>(null)
  const shown = useRef(0)

  const { curve, base, glow, segments, stationU } = useMemo(() => {
    const points: Vector3[] = []
    for (let i = 0; i < count; i++) {
      const [x, , z] = stationPosition(i)
      points.push(new Vector3(x, -0.32, z))
      if (i < count - 1) {
        const [nx, , nz] = stationPosition(i + 1)
        points.push(new Vector3((x + nx) / 2, -0.32, (z + nz) / 2 + (i % 2 ? 4 : -4)))
      }
    }
    const curve = new CatmullRomCurve3(points, false, 'centripetal')
    const segments = Math.max(1, count - 1) * TUBULAR
    // Arc-length position of every station along the curve (the tube is built by arc length).
    const divisions = segments * 4
    const lengths = curve.getLengths(divisions)
    const total = lengths[divisions]
    const stationU = Array.from({ length: count }, (_, i) =>
      count > 1 ? lengths[Math.round((i / (count - 1)) * divisions)] / total : 1,
    )
    return {
      curve,
      segments,
      stationU,
      base: new TubeGeometry(curve, segments, 0.14, RADIAL),
      glow: new TubeGeometry(curve, segments, 0.18, RADIAL),
    }
  }, [count])

  useFrame((state, delta) => {
    const target = stationU[Math.min(highestUnlocked, count - 1)] ?? 1
    shown.current = reduced ? target : shown.current + (target - shown.current) * Math.min(1, delta * 1.5)
    const visible = Math.round(shown.current * segments)
    progress.current?.geometry.setDrawRange(0, visible * RADIAL * 6)
    if (pulse.current) {
      const t = reduced ? shown.current : ((state.clock.elapsedTime * 0.04) % 1) * shown.current
      pulse.current.position.copy(curve.getPointAt(Math.min(0.999, Math.max(0.001, t))))
      pulse.current.visible = shown.current > 0.01
    }
  })

  return (
    <group>
      <mesh geometry={base} receiveShadow>
        <meshStandardMaterial color="#d5dbe2" roughness={0.6} />
      </mesh>
      <mesh ref={progress} geometry={glow}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}
