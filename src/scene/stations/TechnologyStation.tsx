import { Line, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, Color, ShaderMaterial, TubeGeometry, Vector3, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import type { Line2 } from 'three-stdlib'
import type { StationOf } from '../../content/schema'
import { useReducedMotion } from '../../lib/motion'
import { computeOptics, OPTICS } from '../../lib/optics'
import { useStore, type Rhythm } from '../../state/store'
import { useHover } from '../interaction'
import { BillboardLabel, Label } from '../Label'
import { heartGeometry, HeartVessels, KneeModel, lensGeometry, METAL } from '../models/models'
import { useStationInfo } from '../StationContext'

const BENCH_Y = 2.4

/* ------------------------------------------------------------------ Optics */

function OpticsBench() {
  const eye = useStore((s) => s.lab.eye)
  const power = useStore((s) => s.lab.lensPower)
  const optics = useMemo(() => computeOptics(eye, power), [eye, power])
  const corrector = useMemo(() => lensGeometry(power / 3, 0.95), [power])
  const crystalline = useMemo(() => lensGeometry(1.1, 0.42), [])
  const sharp = optics.state === 'sharp'
  const eyeCentre = OPTICS.retinaX - 1.35

  return (
    <group position={[-0.6, BENCH_Y, 0]}>
      {Math.abs(power) > 0.01 && (
        <mesh geometry={corrector} position={[OPTICS.correctorX, 0, 0]}>
          <meshPhysicalMaterial color="#bfe6f2" transmission={0.7} roughness={0.05} thickness={0.4} transparent opacity={0.8} />
        </mesh>
      )}
      <mesh position={[eyeCentre, 0, 0]}>
        <sphereGeometry args={[1.38, 64, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.18} depthWrite={false} roughness={0.2} />
      </mesh>
      <mesh position={[eyeCentre, 0, 0]} rotation-z={-Math.PI / 2}>
        <sphereGeometry args={[1.4, 64, 32, 0, Math.PI * 2, 0, 0.9]} />
        <meshStandardMaterial
          color={sharp ? '#2e9d57' : '#d9776b'}
          emissive={sharp ? '#2e9d57' : '#d9776b'}
          emissiveIntensity={0.6}
          side={2}
        />
      </mesh>
      <mesh geometry={crystalline} position={[OPTICS.eyeLensX, 0, 0]}>
        <meshPhysicalMaterial color="#f6e7b0" transmission={0.5} roughness={0.1} thickness={0.3} />
      </mesh>
      {optics.rays.map((ray, i) => (
        <Line key={i} points={ray.points.map(([x, y]) => [x, y, 0] as [number, number, number])} color="#ffb000" lineWidth={2.6} />
      ))}
      {optics.focusX !== null && (
        <mesh position={[optics.focusX, 0, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffcc33" emissiveIntensity={4} toneMapped={false} />
        </mesh>
      )}
      <Label position={[OPTICS.correctorX, -1.35, 0]} fontSize={0.2}>
        {Math.abs(power) > 0.01 ? `Correcting lens ${power > 0 ? '+' : ''}${power.toFixed(2)} D` : 'No correcting lens'}
      </Label>
      <Label position={[eyeCentre, -1.75, 0]} fontSize={0.2}>
        Eye
      </Label>
      <Label position={[OPTICS.retinaX + 0.45, 1.25, 0]} fontSize={0.2} color={sharp ? '#2e9d57' : '#b3261e'}>
        {sharp ? 'Sharp image on the retina' : 'Blurry – focus misses the retina'}
      </Label>
    </group>
  )
}

/* ------------------------------------------------------------------- Heart */

const heartVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const heartFragment = /* glsl */ `
  uniform float uTime;
  uniform int uMode;
  uniform vec3 uBase;
  uniform vec3 uWave;
  uniform vec3 uLesion;
  varying vec3 vPos;
  varying vec3 vNormal;

  void main() {
    // 0 at the top of the heart (atria), 1 at the apex.
    float h = clamp(0.5 - vPos.y, 0.0, 1.0);
    float wave = 0.0;
    if (uMode == 1) {
      float n = sin(vPos.x * 23.0 + uTime * 9.0) * sin(vPos.y * 19.0 - uTime * 7.3) * sin((vPos.x - vPos.y) * 13.0 + uTime * 11.0);
      wave = smoothstep(0.15, 0.7, n) * (1.0 - smoothstep(0.32, 0.48, h));
      float beat = fract(uTime * 1.37 + sin(uTime * 0.7) * 0.35);
      wave += exp(-pow((h - 0.45 - beat * 0.7) * 9.0, 2.0)) * step(0.4, h) * 0.8;
    } else {
      float phase = fract(uTime * 0.85);
      wave = exp(-pow((h - phase * 1.35 + 0.1) * 7.0, 2.0));
    }
    vec3 color = mix(uBase, uWave, clamp(wave, 0.0, 1.0));
    if (uMode == 2) {
      float ringA = abs(length(vPos.xy - vec2(-0.2, 0.3)) - 0.13);
      float ringB = abs(length(vPos.xy - vec2(0.2, 0.3)) - 0.13);
      color = mix(uLesion, color, smoothstep(0.012, 0.03, min(ringA, ringB)));
    }
    vec3 light = normalize(vec3(0.4, 0.7, 0.6));
    float diffuse = 0.55 + 0.45 * max(dot(normalize(vNormal), light), 0.0);
    gl_FragColor = vec4(color * diffuse + uWave * wave * 0.6, 1.0);
  }
`

const ecg = (t: number, rhythm: Rhythm) => {
  if (rhythm === 'afib') {
    const fibrillation = Math.sin(t * 37) * 0.04 + Math.sin(t * 23 + 1) * 0.03
    const beatTimes = [0.13, 0.58, 0.81, 1.37, 1.62, 2.21]
    const local = t % 2.4
    const qrs = beatTimes.reduce((acc, b) => acc + Math.exp(-(((local - b) * 60) ** 2)) * 0.9, 0)
    return fibrillation + qrs
  }
  const x = t % 1
  const p = Math.exp(-(((x - 0.18) * 22) ** 2)) * 0.12
  const q = -Math.exp(-(((x - 0.36) * 70) ** 2)) * 0.12
  const r = Math.exp(-(((x - 0.4) * 60) ** 2)) * 0.95
  const s = -Math.exp(-(((x - 0.44) * 70) ** 2)) * 0.2
  const tw = Math.exp(-(((x - 0.68) * 14) ** 2)) * 0.22
  return p + q + r + s + tw
}

function HeartBench() {
  const rhythm = useStore((s) => s.lab.rhythm)
  const reduced = useReducedMotion()
  const trace = useRef<Line2>(null)
  const tip = useRef<Mesh>(null)

  const geometry = useMemo(heartGeometry, [])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: heartVertex,
        fragmentShader: heartFragment,
        uniforms: {
          uTime: { value: 0 },
          uMode: { value: 0 },
          uBase: { value: new Color('#b83434').convertSRGBToLinear() },
          uWave: { value: new Color('#ffd166').convertSRGBToLinear() },
          uLesion: { value: new Color('#1b1f24').convertSRGBToLinear() },
        },
      }),
    [],
  )

  const catheter = useMemo(
    () =>
      new TubeGeometry(
        new CatmullRomCurve3([new Vector3(3.2, -1.8, 0.6), new Vector3(2.2, -1.2, 0.6), new Vector3(1.1, 0.1, 0.5), new Vector3(0.45, 0.62, 0.42)]),
        64,
        0.035,
        10,
      ),
    [],
  )

  const tracePoints = useMemo(() => Array.from({ length: 160 }, (_, i) => [-2.4 + (i / 159) * 4.8, 0, 0] as [number, number, number]), [])

  useFrame((state) => {
    const time = reduced ? 0.4 : state.clock.elapsedTime
    material.uniforms.uTime.value = time
    material.uniforms.uMode.value = rhythm === 'normal' ? 0 : rhythm === 'afib' ? 1 : 2
    const line = trace.current
    if (line) {
      const effective: Rhythm = rhythm === 'afib' ? 'afib' : 'normal'
      const positions: number[] = []
      for (let i = 0; i < 160; i++) {
        const x = -2.4 + (i / 159) * 4.8
        positions.push(x, ecg(time * 0.9 + i / 70, effective) * 0.55, 0)
      }
      line.geometry.setPositions(positions)
    }
    if (tip.current) {
      const pulse = rhythm === 'ablated' ? 0.5 + Math.sin(time * 6) * 0.5 : 0
      ;(tip.current.material as MeshStandardMaterial).emissiveIntensity = 0.3 + pulse * 2.5
    }
  })

  return (
    <group position={[-0.3, BENCH_Y + 0.4, 0]}>
      <group scale={2.2}>
        <mesh geometry={geometry} material={material} castShadow />
        <HeartVessels />
      </group>
      <mesh geometry={catheter}>
        <meshStandardMaterial color="#27415f" roughness={0.4} />
      </mesh>
      <mesh ref={tip} position={[0.45, 0.62, 0.42]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffb347" emissive="#ff7b00" emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      <group position={[0, -2.25, 0.4]}>
        <RoundedBox args={[5.2, 1.0, 0.08]} radius={0.04} position={[0, 0.05, -0.08]}>
          <meshStandardMaterial color="#10202f" roughness={0.5} />
        </RoundedBox>
        <Line ref={trace} points={tracePoints} color="#5cff9d" lineWidth={2.2} />
      </group>
      <BillboardLabel position={[0, 2.05, 0]} fontSize={0.24} color="#1b1f24">
        {rhythm === 'normal' ? 'Normal sinus rhythm' : rhythm === 'afib' ? 'Atrial fibrillation – chaotic signals' : 'After ablation – lesions block faulty signals'}
      </BillboardLabel>
    </group>
  )
}

/* -------------------------------------------------------------------- Knee */

function KneeBench() {
  const angle = useStore((s) => s.lab.kneeAngle)
  const auto = useStore((s) => s.lab.kneeAuto)
  const reduced = useReducedMotion()
  const { active } = useStationInfo()
  const knee = useRef<Group>(null)
  const animated = useRef(angle)

  useFrame((state) => {
    if (!active) return
    animated.current = auto && !reduced ? 55 + Math.sin(state.clock.elapsedTime * 0.9) * 50 : angle
  })

  return (
    <group position={[0, BENCH_Y, 0]}>
      <group ref={knee} scale={1.9}>
        <AnimatedKnee value={animated} />
      </group>
      <BillboardLabel position={[1.9, 1.4, 0]} fontSize={0.2} maxWidth={2.4} textAlign="left" anchorX="left">
        Femoral component (metal)
      </BillboardLabel>
      <BillboardLabel position={[1.9, -0.35, 0]} fontSize={0.2} maxWidth={2.4} textAlign="left" anchorX="left">
        Polyethylene insert
      </BillboardLabel>
      <BillboardLabel position={[1.9, -0.8, 0]} fontSize={0.2} maxWidth={2.4} textAlign="left" anchorX="left">
        Tibial tray (metal)
      </BillboardLabel>
    </group>
  )
}

function AnimatedKnee({ value }: { value: { current: number } }) {
  const group = useRef<Group>(null)
  useFrame(() => {
    const femur = group.current?.children[0]?.children[0]
    if (femur) femur.rotation.x = (-value.current * Math.PI) / 180
  })
  return (
    <group ref={group}>
      <KneeModel angle={0} />
    </group>
  )
}

/* --------------------------------------------------------------- Lifecycle */

function LifecycleBench({ stages, color }: { stages: StationOf<'technology'>['lifecycle']; color: string }) {
  const stage = useStore((s) => s.lab.stage)
  const setLab = useStore((s) => s.setLab)
  const reduced = useReducedMotion()
  const { active } = useStationInfo()
  const token = useRef<Mesh>(null)
  const positions = stages.map((_, i) => {
    const t = i / Math.max(1, stages.length - 1)
    return [-5 + t * 10, 1 + Math.sin(t * Math.PI) * 1.4, -Math.sin(t * Math.PI) * 1.5] as [number, number, number]
  })
  const curve = useMemo(() => new CatmullRomCurve3(positions.map((p) => new Vector3(...p))), [positions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    if (!token.current || !active) return
    const t = reduced ? stage / Math.max(1, stages.length - 1) : (state.clock.elapsedTime * 0.08) % 1
    token.current.position.copy(curve.getPointAt(t))
    token.current.position.y += 0.55
  })

  return (
    <group position={[0, 0.3, 0.5]}>
      <Line points={curve.getPoints(100)} color={color} lineWidth={3} />
      {stages.map((s, i) => (
        <LifecycleStage
          key={s.id}
          position={positions[i]}
          index={i}
          title={s.title}
          color={color}
          selected={stage === i}
          onSelect={() => setLab({ stage: i })}
        />
      ))}
      <mesh ref={token}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffe3a3" emissiveIntensity={4} toneMapped={false} />
      </mesh>
    </group>
  )
}

function LifecycleStage(props: { position: [number, number, number]; index: number; title: string; color: string; selected: boolean; onSelect: () => void }) {
  const { hovered, bind } = useHover()
  const { position, index, title, color, selected, onSelect } = props
  return (
    <group position={position}>
      <RoundedBox
        args={[1.1, 0.5, 1.1]}
        radius={0.12}
        {...bind}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        scale={selected ? 1.2 : hovered ? 1.08 : 1}
        castShadow
      >
        <meshStandardMaterial color={selected ? color : '#ffffff'} emissive={color} emissiveIntensity={selected ? 0.8 : hovered ? 0.2 : 0} roughness={0.3} />
      </RoundedBox>
      <Label position={[0, 0.27, 0.35]} rotation-x={-Math.PI / 2} fontSize={0.34} weight="bold" color={selected ? '#ffffff' : color}>
        {String(index + 1)}
      </Label>
      <BillboardLabel position={[0, 0.85, 0]} fontSize={0.2} maxWidth={1.8} textAlign="center" color={selected ? color : '#1b1f24'}>
        {title}
      </BillboardLabel>
    </group>
  )
}

/* ----------------------------------------------------------------- Station */

/** The science lab: shows the demo chosen in the panel. */
export function TechnologyStation({ station }: { station: StationOf<'technology'> }) {
  const demo = useStore((s) => s.lab.demo)
  const available = station.demos.map((d) => d.id)
  const shown = available.includes(demo as (typeof available)[number]) ? demo : available[0]

  return (
    <group>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[5.6, 5.7, 0.24, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>
      {shown === 'knee' && (
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 1.1, 0.4, 48]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      )}
      {shown === 'optics' && <OpticsBench />}
      {shown === 'heart' && <HeartBench />}
      {shown === 'knee' && <KneeBench />}
      {shown === 'lifecycle' && <LifecycleBench stages={station.lifecycle} color={station.color} />}
    </group>
  )
}
