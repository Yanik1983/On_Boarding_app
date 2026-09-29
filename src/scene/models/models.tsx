// Simplified, illustrative 3D models built from code – no licensed assets needed.
// Each model is roughly 1–1.4 units in size and centred on the origin.
import { RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import { CatmullRomCurve3, DoubleSide, ExtrudeGeometry, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import type { ProductModel as ProductModelType } from '../../content/schema'
import { heartShape } from '../geometry'

export const METAL = { color: '#c7ccd4', metalness: 1, roughness: 0.24 }
const PLASTIC = { color: '#f4f5f7', metalness: 0, roughness: 0.42 }
const DARK = { color: '#2b3038', metalness: 0.2, roughness: 0.45 }

function Metal() {
  return <meshStandardMaterial {...METAL} />
}
function Plastic({ color }: { color?: string }) {
  return <meshStandardMaterial {...PLASTIC} color={color ?? PLASTIC.color} />
}
function Glow({ color, intensity = 2 }: { color: string; intensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />
}

function useTube(points: [number, number, number][], radius: number, segments = 64) {
  return useMemo(
    () => new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p))), segments, radius, 12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(points), radius, segments],
  )
}

export function HeartModel({ color = '#d51900', depth = 0.34 }: { color?: string; depth?: number }) {
  const geometry = useMemo(() => {
    const g = new ExtrudeGeometry(heartShape(), {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.08,
      bevelSegments: 8,
      curveSegments: 48,
    })
    g.center()
    return g
  }, [depth])
  return (
    <mesh geometry={geometry} rotation-z={Math.PI} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} clearcoatRoughness={0.15} />
    </mesh>
  )
}

/** Biconvex (power > 0) or biconcave (power < 0) lens, axis along X. */
export function lensGeometry(power: number, radius = 0.9) {
  const centre = 0.06 + Math.max(0, power) * 0.07
  const edge = 0.06 + Math.max(0, -power) * 0.07
  const half = (r: number) => edge + (centre - edge) * (1 - (r / radius) ** 2)
  const points: Vector2[] = []
  const steps = 24
  for (let i = 0; i <= steps; i++) points.push(new Vector2((i / steps) * radius, half((i / steps) * radius)))
  for (let i = steps; i >= 0; i--) points.push(new Vector2((i / steps) * radius, -half((i / steps) * radius)))
  const g = new LatheGeometry(points, 64)
  g.rotateZ(Math.PI / 2)
  return g
}

export function LensModel({ color = '#9fd9e6', power = 1.2, radius = 0.7 }: { color?: string; power?: number; radius?: number }) {
  const geometry = useMemo(() => lensGeometry(power, radius), [power, radius])
  return (
    <mesh geometry={geometry} rotation-y={Math.PI / 2} castShadow>
      <meshPhysicalMaterial color={color} transmission={0.85} thickness={0.6} roughness={0.08} ior={1.45} clearcoat={1} />
    </mesh>
  )
}

export function KneeModel({ angle = 25 }: { angle?: number }) {
  const flex = (angle * Math.PI) / 180
  return (
    <group scale={0.55}>
      <group position={[0, 0, 0]} rotation-x={-flex}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.3, 2, 32]} />
          <meshStandardMaterial color="#efe7da" roughness={0.7} />
        </mesh>
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.18, 0]} rotation-y={Math.PI / 2} castShadow>
            <torusGeometry args={[0.28, 0.16, 20, 40, Math.PI * 1.25]} />
            <Metal />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -0.18, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 40]} />
        <meshStandardMaterial color="#fbfbf6" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.3, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.07, 40]} />
        <Metal />
      </mesh>
      <mesh position={[0, -1.3, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.24, 1.9, 32]} />
        <meshStandardMaterial color="#efe7da" roughness={0.7} />
      </mesh>
    </group>
  )
}

function MappingSystem() {
  return (
    <group position={[0, -0.1, 0]}>
      <RoundedBox args={[1.3, 0.82, 0.07]} radius={0.03} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial {...DARK} />
      </RoundedBox>
      <mesh position={[0, 0.45, 0.04]}>
        <planeGeometry args={[1.18, 0.7]} />
        <meshBasicMaterial color="#0c1a2b" toneMapped={false} />
      </mesh>
      <group position={[0, 0.45, 0.06]} scale={0.42}>
        <mesh>
          <shapeGeometry args={[heartShape(), 32]} />
          <meshBasicMaterial color="#ff6a3d" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.08, 0.01]} scale={0.55}>
          <shapeGeometry args={[heartShape(), 32]} />
          <meshBasicMaterial color="#ffd23d" toneMapped={false} />
        </mesh>
        <mesh position={[0.05, 0.12, 0.02]} scale={0.22}>
          <shapeGeometry args={[heartShape(), 32]} />
          <meshBasicMaterial color="#6bd0ff" toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, -0.12, -0.05]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.34, 16]} />
        <Metal />
      </mesh>
      <RoundedBox args={[0.7, 0.06, 0.4]} radius={0.02} position={[0, -0.3, 0]} castShadow>
        <Plastic />
      </RoundedBox>
    </group>
  )
}

function AblationCatheter() {
  const shaft = useTube([[-0.7, -0.6, 0], [-0.3, -0.3, 0.1], [0, 0, 0], [0.1, 0.25, 0]], 0.035)
  return (
    <group>
      <mesh geometry={shaft} castShadow>
        <meshStandardMaterial color="#27415f" roughness={0.4} />
      </mesh>
      <group position={[0.12, 0.52, 0]} rotation-x={Math.PI / 2.4}>
        <mesh castShadow>
          <torusGeometry args={[0.28, 0.03, 16, 64]} />
          <meshStandardMaterial color="#27415f" roughness={0.4} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0]}>
              <sphereGeometry args={[0.045, 16, 16]} />
              <Glow color="#ffb347" intensity={1.4} />
            </mesh>
          )
        })}
      </group>
      <RoundedBox args={[0.28, 0.5, 0.2]} radius={0.06} position={[-0.8, -0.8, 0]} rotation-z={0.6} castShadow>
        <Plastic />
      </RoundedBox>
    </group>
  )
}

function HeartPump() {
  const pigtail = useTube(
    Array.from({ length: 18 }, (_, i) => {
      const a = (i / 17) * Math.PI * 1.6
      return [0.62 + Math.sin(a) * 0.14, 0.3 + Math.cos(a) * 0.14 - 0.14, 0] as [number, number, number]
    }),
    0.022,
  )
  return (
    <group rotation-z={0.5}>
      <mesh position={[-0.35, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 24]} />
        <meshStandardMaterial color="#e0e3e8" roughness={0.3} />
      </mesh>
      <mesh position={[0.2, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.3, 24]} />
        <Metal />
      </mesh>
      <mesh position={[0.45, 0.08, 0]} rotation-z={Math.PI / 2 - 0.4} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.32, 24]} />
        <meshStandardMaterial color="#e0e3e8" roughness={0.3} />
      </mesh>
      <mesh geometry={pigtail} castShadow>
        <meshStandardMaterial color="#e0e3e8" roughness={0.3} />
      </mesh>
      <mesh position={[0.2, 0, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.08, 0.012, 8, 32]} />
        <Glow color="#d51900" />
      </mesh>
      <mesh position={[-0.95, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 12]} />
        <meshStandardMaterial color="#e0e3e8" roughness={0.3} />
      </mesh>
    </group>
  )
}

function IvlCatheter() {
  return (
    <group rotation-z={0.35}>
      <mesh rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 2, 12]} />
        <meshStandardMaterial color="#394b63" roughness={0.4} />
      </mesh>
      <mesh rotation-z={Math.PI / 2}>
        <capsuleGeometry args={[0.13, 0.5, 12, 32]} />
        <meshPhysicalMaterial color="#cfe8ff" transmission={0.7} roughness={0.15} thickness={0.2} transparent opacity={0.85} />
      </mesh>
      {[-0.18, 0, 0.18].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.05, 0.015, 8, 24]} />
          <Glow color="#3db8ff" intensity={2.5} />
        </mesh>
      ))}
    </group>
  )
}

function Stapler() {
  return (
    <group rotation-z={-0.25} position={[0, -0.1, 0]}>
      <RoundedBox args={[0.34, 0.7, 0.22]} radius={0.08} position={[-0.55, -0.25, 0]} rotation-z={-0.3} castShadow>
        <Plastic color="#e8ecf1" />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.32, 0.24]} radius={0.08} position={[-0.5, 0.1, 0]} castShadow>
        <Plastic color="#e8ecf1" />
      </RoundedBox>
      <mesh position={[0.2, 0.1, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 24]} />
        <meshStandardMaterial color="#1f2328" roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.42, 0.05, 0.08]} radius={0.02} position={[0.9, 0.15, 0]} rotation-z={0.08} castShadow>
        <Metal />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.06, 0.08]} radius={0.02} position={[0.9, 0.06, 0]} castShadow>
        <Plastic color="#2b8bd6" />
      </RoundedBox>
    </group>
  )
}

function EnergyDevice() {
  return (
    <group rotation-z={-0.2} position={[0, -0.1, 0]}>
      <RoundedBox args={[0.24, 0.72, 0.2]} radius={0.08} position={[-0.6, -0.25, 0]} rotation-z={0.25} castShadow>
        <Plastic color="#f0e9dc" />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.26, 0.22]} radius={0.08} position={[-0.52, 0.1, 0]} castShadow>
        <Plastic color="#f0e9dc" />
      </RoundedBox>
      <mesh position={[0.2, 0.1, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 1.1, 20]} />
        <meshStandardMaterial color="#6c737d" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0.82, 0.12, 0]} rotation-z={-0.15} castShadow>
        <boxGeometry args={[0.2, 0.03, 0.05]} />
        <Metal />
      </mesh>
      <mesh position={[0.84, 0.07, 0]} castShadow>
        <boxGeometry args={[0.2, 0.025, 0.05]} />
        <Glow color="#ffd166" intensity={1.2} />
      </mesh>
    </group>
  )
}

function Suture() {
  const thread = useTube(
    [
      [0.34, 0.1, 0],
      [0.55, -0.1, 0.1],
      [0.3, -0.4, 0.2],
      [-0.2, -0.3, 0.1],
      [-0.5, -0.55, 0],
    ],
    0.018,
    96,
  )
  return (
    <group position={[0, 0.1, 0]}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <torusGeometry args={[0.34, 0.022, 12, 64, Math.PI]} />
        <Metal />
      </mesh>
      <mesh geometry={thread} castShadow>
        <meshStandardMaterial color="#7b3fb5" roughness={0.5} />
      </mesh>
    </group>
  )
}

function Robot() {
  return (
    <group position={[0, -0.55, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.42, 0.16, 40]} />
        <Plastic />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 8, 24]} />
        <Plastic />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial {...DARK} />
      </mesh>
      <mesh position={[0.25, 0.9, 0]} rotation-z={-1.0} castShadow>
        <capsuleGeometry args={[0.08, 0.45, 8, 24]} />
        <Plastic />
      </mesh>
      <mesh position={[0.48, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshStandardMaterial {...DARK} />
      </mesh>
      <mesh position={[0.6, 0.8, 0]} rotation-z={0.35} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 8, 24]} />
        <Plastic />
      </mesh>
      <mesh position={[0.68, 0.52, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <Glow color="#3db8ff" intensity={2.5} />
      </mesh>
    </group>
  )
}

function ContactLens() {
  return (
    <group rotation-x={-0.9}>
      <mesh castShadow>
        <sphereGeometry args={[0.75, 64, 32, 0, Math.PI * 2, 0, 0.62]} />
        <meshPhysicalMaterial color="#8fd3ff" transmission={0.6} roughness={0.05} thickness={0.1} transparent opacity={0.8} side={DoubleSide} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.61, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.435, 0.012, 8, 64]} />
        <meshStandardMaterial color="#5bb8ef" />
      </mesh>
    </group>
  )
}

function Iol() {
  const optic = useMemo(() => lensGeometry(1.4, 0.3), [])
  return (
    <group rotation-x={-1.1}>
      <mesh geometry={optic} rotation-y={Math.PI / 2} castShadow>
        <meshPhysicalMaterial color="#f2fbff" transmission={0.8} roughness={0.05} thickness={0.2} clearcoat={1} />
      </mesh>
      {[0, Math.PI].map((r) => (
        <mesh key={r} rotation-z={r} position={[0, 0, 0]}>
          <torusGeometry args={[0.5, 0.02, 8, 48, Math.PI * 0.75]} />
          <meshStandardMaterial color="#e4b64c" roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function KneeImplant() {
  return (
    <group scale={1.1} position={[0, -0.05, 0]}>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.32, 0]} rotation-y={Math.PI / 2} castShadow>
          <torusGeometry args={[0.24, 0.12, 24, 48, Math.PI * 1.3]} />
          <Metal />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.12, 48]} />
        <meshStandardMaterial color="#fbfbf6" roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 48]} />
        <Metal />
      </mesh>
      <mesh position={[0, -0.36, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.04, 0.5, 24]} />
        <Metal />
      </mesh>
    </group>
  )
}

export function ProductModel({ type }: { type: ProductModelType }) {
  switch (type) {
    case 'mapping-system':
      return <MappingSystem />
    case 'ablation-catheter':
      return <AblationCatheter />
    case 'heart-pump':
      return <HeartPump />
    case 'ivl-catheter':
      return <IvlCatheter />
    case 'stapler':
      return <Stapler />
    case 'energy-device':
      return <EnergyDevice />
    case 'suture':
      return <Suture />
    case 'robot':
      return <Robot />
    case 'contact-lens':
      return <ContactLens />
    case 'iol':
      return <Iol />
    case 'knee-implant':
      return <KneeImplant />
  }
}

export function UnitIcon({ icon, color }: { icon: 'heart' | 'instrument' | 'lens' | 'joint'; color: string }) {
  switch (icon) {
    case 'heart':
      return (
        <group scale={1.3}>
          <HeartModel color={color} />
        </group>
      )
    case 'instrument':
      return <Stapler />
    case 'lens':
      return <LensModel color="#a8e3ee" power={1.5} radius={0.65} />
    case 'joint':
      return <KneeModel angle={20} />
  }
}
