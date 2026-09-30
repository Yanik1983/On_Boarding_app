// Simplified, illustrative 3D models built from code – no licensed assets needed.
// Each model is roughly 1–1.5 units in size and centred on the origin.
import { RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import { CatmullRomCurve3, DoubleSide, ExtrudeGeometry, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import type { ProductModel as ProductModelType } from '../../content/schema'
import type { Vec3 } from '../../state/store'
import { heartShape } from '../geometry'

export const METAL = { color: '#c7ccd4', metalness: 1, roughness: 0.24 }
const PLASTIC = { color: '#f4f5f7', metalness: 0, roughness: 0.38 }
const DARK = { color: '#2b3038', metalness: 0.2, roughness: 0.45 }

/** Polished, brushed metal (anisotropic highlights like machined implants and instruments). */
function Metal({ color = METAL.color }: { color?: string }) {
  return <meshPhysicalMaterial {...METAL} color={color} anisotropy={0.6} clearcoat={0.35} clearcoatRoughness={0.2} />
}
/** Satin medical-grade plastic with a light clear coat. */
function Plastic({ color }: { color?: string }) {
  return <meshPhysicalMaterial {...PLASTIC} color={color ?? PLASTIC.color} clearcoat={0.3} clearcoatRoughness={0.35} />
}
function Rubber({ color = '#343a42' }: { color?: string }) {
  return <meshStandardMaterial color={color} roughness={0.85} />
}
function Glow({ color, intensity = 2 }: { color: string; intensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />
}

function useTube(points: Vec3[], radius: number, segments = 64, radial = 16) {
  return useMemo(
    () => new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p))), segments, radius, radial),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(points), radius, segments, radial],
  )
}

function Tube({ points, radius, color, segments = 64 }: { points: Vec3[]; radius: number; color: string; segments?: number }) {
  const geometry = useTube(points, radius, segments)
  return (
    <mesh geometry={geometry} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.3} />
    </mesh>
  )
}

/* -------------------------------------------------------------------- Heart */

/** A plump, rounded heart body, about 1.4 units tall and 0.86 deep, centred on the origin. */
export function heartGeometry() {
  // A deep bevel on a thin extrusion gives rounded, pillow-like sides that look good from every angle.
  const g = new ExtrudeGeometry(heartShape(), {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.31,
    bevelSize: 0.17,
    bevelSegments: 20,
    curveSegments: 96,
  })
  g.center()
  return g
}

/** Great vessels on top and coronary arteries on the front surface – makes the heart read as an organ. */
export function HeartVessels({ front = 0.44 }: { front?: number }) {
  const f = front
  return (
    <group>
      <Tube color="#b3202a" radius={0.09} points={[[0.05, 0.42, -0.02], [0.06, 0.72, 0], [-0.08, 0.88, 0], [-0.28, 0.84, -0.04], [-0.36, 0.6, -0.1]]} />
      {[-0.02, -0.12, -0.22].map((x, i) => (
        <Tube key={x} color="#b3202a" radius={0.03} points={[[x, 0.86 - i * 0.01, 0], [x - 0.02, 0.98, 0], [x - 0.04, 1.06, 0]]} segments={16} />
      ))}
      <Tube color="#3d63b0" radius={0.075} points={[[0.16, 0.4, 0.14], [0.2, 0.62, 0.16], [0.36, 0.72, 0.08], [0.48, 0.66, 0]]} />
      <Tube color="#3d63b0" radius={0.065} points={[[-0.26, 0.35, -0.14], [-0.27, 0.62, -0.16], [-0.26, 0.9, -0.16]]} />
      <Tube color="#7e1620" radius={0.022} points={[[0.02, 0.36, f], [0.03, 0.05, f + 0.01], [-0.02, -0.3, f], [-0.05, -0.52, f - 0.08]]} />
      <Tube color="#7e1620" radius={0.02} points={[[0.03, 0.34, f], [0.3, 0.24, f - 0.01], [0.5, 0.02, f - 0.1]]} />
      <Tube color="#7e1620" radius={0.02} points={[[-0.03, 0.33, f], [-0.3, 0.2, f - 0.01], [-0.52, -0.04, f - 0.1]]} />
      <Tube color="#7e1620" radius={0.015} points={[[0.03, 0.12, f + 0.01], [0.24, -0.1, f - 0.01], [0.3, -0.3, f - 0.07]]} />
      <Tube color="#7e1620" radius={0.015} points={[[0.0, -0.05, f + 0.01], [-0.2, -0.22, f - 0.01], [-0.24, -0.38, f - 0.07]]} />
    </group>
  )
}

export function HeartModel({ color = '#d51900' }: { color?: string }) {
  const geometry = useMemo(heartGeometry, [])
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={1} clearcoatRoughness={0.18} sheen={0.4} sheenColor="#ff9a8a" />
      </mesh>
      <HeartVessels />
    </group>
  )
}

/* --------------------------------------------------------------------- Lens */

/** Biconvex (power > 0) or biconcave (power < 0) lens, axis along X. */
export function lensGeometry(power: number, radius = 0.9) {
  const centre = 0.06 + Math.max(0, power) * 0.07
  const edge = 0.06 + Math.max(0, -power) * 0.07
  const half = (r: number) => edge + (centre - edge) * (1 - (r / radius) ** 2)
  const points: Vector2[] = []
  const steps = 32
  for (let i = 0; i <= steps; i++) points.push(new Vector2((i / steps) * radius, half((i / steps) * radius)))
  for (let i = steps; i >= 0; i--) points.push(new Vector2((i / steps) * radius, -half((i / steps) * radius)))
  const g = new LatheGeometry(points, 96)
  g.rotateZ(Math.PI / 2)
  return g
}

export function LensModel({ color = '#9fd9e6', power = 1.2, radius = 0.7 }: { color?: string; power?: number; radius?: number }) {
  const geometry = useMemo(() => lensGeometry(power, radius), [power, radius])
  return (
    <group rotation-y={Math.PI / 2}>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial color={color} transmission={0.85} thickness={0.6} roughness={0.05} ior={1.45} clearcoat={1} />
      </mesh>
      {/* Lens holder ring with two mounting tabs */}
      <mesh rotation-y={Math.PI / 2}>
        <torusGeometry args={[radius + 0.03, 0.035, 16, 96]} />
        <Metal />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, s * (radius + 0.1), 0]}>
          <boxGeometry args={[0.06, 0.12, 0.08]} />
          <Metal />
        </mesh>
      ))}
    </group>
  )
}

/* --------------------------------------------------------------------- Knee */

/** A knee with a total knee replacement. The femur group must stay the first child (it is animated). */
export function KneeModel({ angle = 25 }: { angle?: number }) {
  const flex = (angle * Math.PI) / 180
  const bone = <meshPhysicalMaterial color="#efe6d6" roughness={0.65} clearcoat={0.15} />
  return (
    <group scale={0.55}>
      <group rotation-x={-flex}>
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.3, 1.9, 48]} />
          {bone}
        </mesh>
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.34, 48, 32]} />
          {bone}
        </mesh>
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.18, 0]} rotation-y={Math.PI / 2} castShadow>
            <torusGeometry args={[0.28, 0.16, 32, 64, Math.PI * 1.25]} />
            <Metal color="#d3d7dd" />
          </mesh>
        ))}
        <mesh position={[0, 0.3, 0.3]} castShadow>
          <boxGeometry args={[0.2, 0.3, 0.1]} />
          <Metal color="#d3d7dd" />
        </mesh>
      </group>
      <mesh position={[0, -0.16, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.14, 64]} />
        <meshPhysicalMaterial color="#fbfbf4" roughness={0.45} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.12, 24]} />
        <meshPhysicalMaterial color="#fbfbf4" roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.28, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.08, 64]} />
        <Metal />
      </mesh>
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.05, 0.4, 24]} />
        <Metal />
      </mesh>
      <mesh position={[0, -1.35, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 1.9, 48]} />
        {bone}
      </mesh>
    </group>
  )
}

/* ----------------------------------------------------------------- Products */

function MappingSystem() {
  return (
    <group position={[0, -0.12, 0]}>
      {/* Monitor with bezel */}
      <RoundedBox args={[1.36, 0.86, 0.08]} radius={0.035} position={[0, 0.48, 0]} castShadow>
        <meshPhysicalMaterial {...DARK} clearcoat={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.48, 0.042]}>
        <planeGeometry args={[1.24, 0.72]} />
        <meshBasicMaterial color="#0b1726" toneMapped={false} />
      </mesh>
      {/* Colour-coded activation map */}
      <group position={[-0.12, 0.5, 0.05]} scale={0.4}>
        {[
          ['#ff4d3d', 1, 0],
          ['#ff9a3d', 0.78, 0.04],
          ['#ffe03d', 0.56, 0.08],
          ['#5fd38a', 0.36, 0.11],
          ['#6bb8ff', 0.18, 0.14],
        ].map(([color, scale, y], i) => (
          <mesh key={i} position={[0, y as number, i * 0.005]} scale={scale as number}>
            <shapeGeometry args={[heartShape(), 48]} />
            <meshBasicMaterial color={color as string} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Side panels: signal traces and catheter status */}
      {[0.28, 0.16, 0.04, -0.08].map((y, i) => (
        <mesh key={y} position={[0.44, 0.48 + y, 0.046]}>
          <planeGeometry args={[0.28, 0.035]} />
          <meshBasicMaterial color={['#5cff9d', '#ffd166', '#6bb8ff', '#ff8a7a'][i]} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.17, 0.046]}>
        <planeGeometry args={[1.1, 0.05]} />
        <meshBasicMaterial color="#1d3a57" toneMapped={false} />
      </mesh>
      <mesh position={[0.6, 0.1, 0.042]}>
        <circleGeometry args={[0.012, 16]} />
        <Glow color="#5cff9d" />
      </mesh>
      {/* Stand, base and keyboard */}
      <mesh position={[0, -0.1, -0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.36, 24]} />
        <Metal />
      </mesh>
      <RoundedBox args={[0.72, 0.06, 0.42]} radius={0.025} position={[0, -0.3, -0.02]} castShadow>
        <Plastic />
      </RoundedBox>
      <RoundedBox args={[0.8, 0.03, 0.22]} radius={0.012} position={[0, -0.25, 0.36]} rotation-x={0.12} castShadow>
        <Plastic color="#e9ecf0" />
      </RoundedBox>
      {Array.from({ length: 3 }, (_, row) => (
        <mesh key={row} position={[0, -0.228 + row * 0.006, 0.3 + row * 0.055]} rotation-x={-Math.PI / 2 + 0.12}>
          <planeGeometry args={[0.7, 0.035]} />
          <meshStandardMaterial color="#c9cfd6" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function CatheterHandle({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation-z={rotation}>
      <mesh castShadow>
        <capsuleGeometry args={[0.09, 0.42, 12, 32]} />
        <Plastic />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.08, 32]} />
        <Plastic color="#2f6fb5" />
      </mesh>
      {[0.02, 0.06, 0.1, 0.14].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.105, 0.008, 8, 32]} />
          <Rubber color="#23466e" />
        </mesh>
      ))}
      <mesh position={[0, -0.34, 0]}>
        <cylinderGeometry args={[0.03, 0.06, 0.16, 24]} />
        <Rubber />
      </mesh>
    </group>
  )
}

function AblationCatheter() {
  const shaft = useTube([[-0.62, -0.5, 0], [-0.3, -0.3, 0.1], [0, 0, 0], [0.1, 0.25, 0], [0.12, 0.3, 0]], 0.03, 96)
  return (
    <group position={[0.12, 0.28, 0]} scale={0.88}>
      <mesh geometry={shaft} castShadow>
        <meshPhysicalMaterial color="#27415f" roughness={0.35} clearcoat={0.5} />
      </mesh>
      <group position={[0.12, 0.56, 0]} rotation-x={Math.PI / 2.4}>
        <mesh castShadow>
          <torusGeometry args={[0.28, 0.028, 16, 96]} />
          <meshPhysicalMaterial color="#27415f" roughness={0.35} clearcoat={0.5} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0]} rotation-z={a}>
              <cylinderGeometry args={[0.036, 0.036, 0.07, 20]} />
              <Metal color="#e8c77a" />
            </mesh>
          )
        })}
      </group>
      <CatheterHandle position={[-0.78, -0.72, 0]} rotation={0.75} />
    </group>
  )
}

function HeartPump() {
  const pigtail = useTube(
    Array.from({ length: 24 }, (_, i) => {
      const a = (i / 23) * Math.PI * 1.7
      return [0.64 + Math.sin(a) * 0.14, 0.3 + Math.cos(a) * 0.14 - 0.14, 0] as Vec3
    }),
    0.02,
  )
  const catheterMaterial = <meshPhysicalMaterial color="#e3e6eb" roughness={0.3} clearcoat={0.5} />
  return (
    <group rotation-z={0.5}>
      <mesh position={[-0.42, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.8, 32]} />
        {catheterMaterial}
      </mesh>
      {/* Motor housing with cooling ribs */}
      <mesh position={[0.08, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.078, 0.078, 0.26, 40]} />
        <Metal />
      </mesh>
      {[-0.06, -0.02, 0.02].map((x) => (
        <mesh key={x} position={[0.08 + x, 0, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.079, 0.006, 8, 40]} />
          <Metal color="#9aa3ad" />
        </mesh>
      ))}
      {/* Outlet windows */}
      <mesh position={[0.26, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.1, 40]} />
        <Metal />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0.26, Math.cos((i * Math.PI) / 2) * 0.071, Math.sin((i * Math.PI) / 2) * 0.071]} rotation-x={(i * Math.PI) / 2}>
          <boxGeometry args={[0.06, 0.004, 0.04]} />
          <Rubber color="#1a1d22" />
        </mesh>
      ))}
      {/* Cannula with inlet area and pigtail tip */}
      <mesh position={[0.46, 0.07, 0]} rotation-z={Math.PI / 2 - 0.4} castShadow>
        <cylinderGeometry args={[0.048, 0.06, 0.32, 32]} />
        {catheterMaterial}
      </mesh>
      <mesh geometry={pigtail} castShadow>
        {catheterMaterial}
      </mesh>
      <mesh position={[0.08, 0, 0]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.082, 0.01, 8, 40]} />
        <Glow color="#d51900" />
      </mesh>
      <mesh position={[-0.95, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.4, 16]} />
        {catheterMaterial}
      </mesh>
    </group>
  )
}

function IvlCatheter() {
  return (
    <group rotation-z={0.35}>
      <mesh rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 2, 16]} />
        <meshPhysicalMaterial color="#394b63" roughness={0.35} clearcoat={0.5} />
      </mesh>
      <mesh position={[1.02, 0, 0]} rotation-z={-Math.PI / 2}>
        <coneGeometry args={[0.024, 0.08, 16]} />
        <meshPhysicalMaterial color="#394b63" roughness={0.35} />
      </mesh>
      <mesh rotation-z={Math.PI / 2}>
        <capsuleGeometry args={[0.13, 0.5, 16, 48]} />
        <meshPhysicalMaterial color="#cfe8ff" transmission={0.75} roughness={0.08} thickness={0.2} transparent opacity={0.85} clearcoat={1} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.03, 0.01, 8, 24]} />
          <Metal color="#e8c77a" />
        </mesh>
      ))}
      {[-0.18, 0, 0.18].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.045, 0.014, 8, 24]} />
            <Glow color="#3db8ff" intensity={2.5} />
          </mesh>
          <mesh rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.1, 0.004, 8, 48]} />
            <meshBasicMaterial color="#9fdcff" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Stapler() {
  return (
    <group rotation-z={-0.22} position={[-0.1, -0.05, 0]} scale={0.86}>
      {/* Pistol grip with rubber inlay */}
      <RoundedBox args={[0.3, 0.74, 0.24]} radius={0.1} position={[-0.55, -0.28, 0]} rotation-z={-0.28} castShadow>
        <Plastic color="#eef1f4" />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.5, 0.25]} radius={0.06} position={[-0.61, -0.31, 0]} rotation-z={-0.28}>
        <Rubber />
      </RoundedBox>
      {/* Body with buttons */}
      <RoundedBox args={[0.64, 0.34, 0.26]} radius={0.1} position={[-0.45, 0.1, 0]} castShadow>
        <Plastic color="#eef1f4" />
      </RoundedBox>
      {[-0.56, -0.42].map((x) => (
        <mesh key={x} position={[x, 0.275, 0.05]}>
          <cylinderGeometry args={[0.032, 0.032, 0.02, 24]} />
          <Plastic color="#2b8bd6" />
        </mesh>
      ))}
      {/* Trigger */}
      <RoundedBox args={[0.08, 0.32, 0.12]} radius={0.035} position={[-0.3, -0.19, 0]} rotation-z={-0.35} castShadow>
        <Plastic color="#2b8bd6" />
      </RoundedBox>
      {/* Rotation knob with grip ridges */}
      <mesh position={[-0.07, 0.1, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.13, 32]} />
        <Plastic color="#dfe4ea" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[-0.07, 0.1 + Math.cos(a) * 0.112, Math.sin(a) * 0.112]} rotation-x={a}>
            <boxGeometry args={[0.12, 0.012, 0.02]} />
            <Plastic color="#c9d0d8" />
          </mesh>
        )
      })}
      {/* Shaft, articulation joint and jaws */}
      <mesh position={[0.4, 0.1, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.84, 32]} />
        <meshPhysicalMaterial color="#1f2328" roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh position={[0.85, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.065, 32, 24]} />
        <Metal />
      </mesh>
      <mesh position={[0.85, 0.1, 0]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.066, 0.008, 8, 32]} />
        <Metal color="#9aa3ad" />
      </mesh>
      <RoundedBox args={[0.46, 0.05, 0.09]} radius={0.02} position={[1.12, 0.16, 0]} rotation-z={0.1} castShadow>
        <Metal />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.07, 0.1]} radius={0.02} position={[1.12, 0.06, 0]} castShadow>
        <Plastic color="#2b8bd6" />
      </RoundedBox>
      {[-0.028, 0, 0.028].map((z) => (
        <mesh key={z} position={[1.12, 0.097, z]}>
          <boxGeometry args={[0.4, 0.006, 0.01]} />
          <meshStandardMaterial color="#123f66" />
        </mesh>
      ))}
    </group>
  )
}

function EnergyDevice() {
  const cable = useTube([[-0.72, -0.62, 0], [-0.8, -0.8, 0.05], [-0.7, -0.95, 0.1], [-0.45, -1.0, 0.1]], 0.025, 48)
  return (
    <group rotation-z={-0.2} position={[-0.05, 0, 0]} scale={0.9}>
      <RoundedBox args={[0.24, 0.72, 0.2]} radius={0.08} position={[-0.6, -0.25, 0]} rotation-z={0.25} castShadow>
        <Plastic color="#f0e9dc" />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.26, 0.22]} radius={0.08} position={[-0.5, 0.1, 0]} castShadow>
        <Plastic color="#f0e9dc" />
      </RoundedBox>
      <mesh geometry={cable} castShadow>
        <Rubber color="#6d747d" />
      </mesh>
      {/* Ring trigger and activation buttons */}
      <mesh position={[-0.36, -0.14, 0]} castShadow>
        <torusGeometry args={[0.09, 0.025, 16, 40]} />
        <Plastic color="#4d5561" />
      </mesh>
      {[0.13, 0.05].map((y, i) => (
        <RoundedBox key={y} args={[0.05, 0.06, 0.1]} radius={0.015} position={[-0.26, y, 0]}>
          <Plastic color={i === 0 ? '#7a5cc4' : '#9aa3ad'} />
        </RoundedBox>
      ))}
      {/* Rotation wheel */}
      <mesh position={[-0.22, 0.1, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.05, 32]} />
        <Plastic color="#4d5561" />
      </mesh>
      <mesh position={[0.25, 0.1, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.9, 24]} />
        <Metal color="#8c949e" />
      </mesh>
      {/* Blade and clamp arm */}
      <mesh position={[0.82, 0.08, 0]} rotation-z={-0.04} castShadow>
        <boxGeometry args={[0.24, 0.026, 0.045]} />
        <Metal color="#e3e6ea" />
      </mesh>
      <mesh position={[0.8, 0.13, 0]} rotation-z={-0.18} castShadow>
        <boxGeometry args={[0.22, 0.03, 0.05]} />
        <Plastic color="#f7f7f5" />
      </mesh>
      <mesh position={[0.84, 0.066, 0]}>
        <boxGeometry args={[0.2, 0.006, 0.047]} />
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
      [-0.45, -0.5, 0],
    ],
    0.016,
    128,
  )
  return (
    <group position={[0, 0.1, 0]}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <torusGeometry args={[0.34, 0.022, 16, 96, Math.PI]} />
        <Metal color="#dde1e6" />
      </mesh>
      <mesh position={[0.34, 0.1, 0]}>
        <cylinderGeometry args={[0.03, 0.026, 0.07, 20]} />
        <Metal color="#b9c0c8" />
      </mesh>
      <mesh geometry={thread} castShadow>
        <meshStandardMaterial color="#7b3fb5" roughness={0.55} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.5, -0.56 - i * 0.012, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.13 - i * 0.012, 0.014, 12, 48]} />
          <meshStandardMaterial color="#7b3fb5" roughness={0.55} />
        </mesh>
      ))}
    </group>
  )
}

function Joint({ position, radius }: { position: Vec3; radius: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[radius, 32, 24]} />
        <meshPhysicalMaterial {...DARK} clearcoat={0.6} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[radius * 1.02, radius * 0.12, 8, 40]} />
        <Glow color="#3db8ff" intensity={1.6} />
      </mesh>
    </group>
  )
}

function Robot() {
  return (
    <group position={[0, -0.6, 0]}>
      {/* Cart with casters and a small screen */}
      <RoundedBox args={[0.7, 0.2, 0.5]} radius={0.06} position={[0, 0.14, 0]} castShadow>
        <Plastic />
      </RoundedBox>
      {[
        [-0.28, -0.2],
        [0.28, -0.2],
        [-0.28, 0.2],
        [0.28, 0.2],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.03, z]}>
          <sphereGeometry args={[0.04, 16, 12]} />
          <Rubber />
        </mesh>
      ))}
      <RoundedBox args={[0.2, 0.12, 0.02]} radius={0.01} position={[-0.18, 0.2, 0.26]} rotation-x={-0.3}>
        <meshBasicMaterial color="#1d3a57" toneMapped={false} />
      </RoundedBox>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 12, 32]} />
        <Plastic />
      </mesh>
      <Joint position={[0, 0.8, 0]} radius={0.13} />
      <mesh position={[0.25, 0.98, 0]} rotation-z={-1.0} castShadow>
        <capsuleGeometry args={[0.08, 0.45, 12, 32]} />
        <Plastic />
      </mesh>
      <Joint position={[0.48, 1.13, 0]} radius={0.1} />
      <mesh position={[0.6, 0.88, 0]} rotation-z={0.35} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 12, 32]} />
        <Plastic />
      </mesh>
      <mesh position={[0.68, 0.62, 0]} rotation-z={0.35}>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 12]} />
        <Metal />
      </mesh>
      <mesh position={[0.71, 0.53, 0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <Glow color="#3db8ff" intensity={2.5} />
      </mesh>
    </group>
  )
}

function ContactLens() {
  return (
    <group rotation-x={-0.9}>
      <mesh castShadow>
        <sphereGeometry args={[0.75, 96, 48, 0, Math.PI * 2, 0, 0.62]} />
        <meshPhysicalMaterial
          color="#8fd3ff"
          transmission={0.65}
          roughness={0.04}
          thickness={0.1}
          transparent
          opacity={0.82}
          side={DoubleSide}
          clearcoat={1}
          iridescence={0.4}
        />
      </mesh>
      <mesh position={[0, 0.61, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.435, 0.012, 12, 96]} />
        <meshStandardMaterial color="#5bb8ef" />
      </mesh>
      <mesh position={[0, 0.745, 0]} rotation-x={Math.PI / 2}>
        <ringGeometry args={[0.1, 0.13, 48]} />
        <meshBasicMaterial color="#5bb8ef" transparent opacity={0.35} side={DoubleSide} />
      </mesh>
    </group>
  )
}

function Iol() {
  const optic = useMemo(() => lensGeometry(1.4, 0.3), [])
  return (
    <group rotation-x={-1.1}>
      <mesh geometry={optic} rotation-y={Math.PI / 2} castShadow>
        <meshPhysicalMaterial color="#f2fbff" transmission={0.85} roughness={0.03} thickness={0.2} clearcoat={1} iridescence={0.3} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.305, 0.01, 12, 64]} />
        <meshPhysicalMaterial color="#e4f3fa" roughness={0.2} />
      </mesh>
      {[0, Math.PI].map((r) => (
        <group key={r} rotation-z={r}>
          <mesh>
            <torusGeometry args={[0.5, 0.018, 12, 64, Math.PI * 0.75]} />
            <meshStandardMaterial color="#e4b64c" roughness={0.35} />
          </mesh>
          <mesh position={[0.5, 0, 0]}>
            <sphereGeometry args={[0.028, 16, 12]} />
            <meshStandardMaterial color="#e4b64c" roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function KneeImplant() {
  return (
    <group scale={1.1} position={[0, -0.05, 0]}>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.34, 0]} rotation-y={Math.PI / 2} castShadow>
          <torusGeometry args={[0.24, 0.12, 32, 64, Math.PI * 1.3]} />
          <Metal color="#d3d7dd" />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.14]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.2]} />
        <Metal color="#d3d7dd" />
      </mesh>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.62, -0.02]}>
          <cylinderGeometry args={[0.03, 0.02, 0.14, 16]} />
          <Metal />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.13, 64]} />
        <meshPhysicalMaterial color="#fbfbf4" roughness={0.42} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 24]} />
        <meshPhysicalMaterial color="#fbfbf4" roughness={0.42} />
      </mesh>
      <mesh position={[0, -0.075, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 64]} />
        <Metal />
      </mesh>
      <mesh position={[0, -0.36, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.035, 0.5, 24]} />
        <Metal />
      </mesh>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} position={[0, -0.24, 0]} rotation-y={r}>
          <boxGeometry args={[0.36, 0.2, 0.02]} />
          <Metal color="#b9c0c8" />
        </mesh>
      ))}
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
        <group scale={1.05} position={[0, -0.1, 0]}>
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
