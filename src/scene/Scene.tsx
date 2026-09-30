import { Preload, Stats } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { NeutralToneMapping, NoToneMapping } from 'three'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useContent } from '../content/context'
import type { Station as StationData } from '../content/schema'
import { urlOptions } from '../lib/params'
import { isHandheld } from '../lib/responsive'
import { probeWebGL } from '../lib/webgl'
import { usePerf, type Tier } from '../state/perf'
import { useStore } from '../state/store'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { GlyphPreloader } from './GlyphPreloader'
import { JourneyPath } from './JourneyPath'
import { stationView } from './layout'
import { Station } from './Station'
import { CompanyStation } from './stations/CompanyStation'
import { CredoStation } from './stations/CredoStation'
import { DivisionsStation } from './stations/DivisionsStation'
import { FinishStation } from './stations/FinishStation'
import { OrganizationStation } from './stations/OrganizationStation'
import { ProductsStation } from './stations/ProductsStation'
import { SiteStation } from './stations/SiteStation'
import { TechnologyStation } from './stations/TechnologyStation'
import { WelcomeStation } from './stations/WelcomeStation'
import { World } from './World'

function centerpiece(station: StationData): ReactNode {
  switch (station.kind) {
    case 'welcome':
      return <WelcomeStation station={station} />
    case 'company':
      return <CompanyStation station={station} />
    case 'credo':
      return <CredoStation station={station} />
    case 'divisions':
      return <DivisionsStation station={station} />
    case 'organization':
      return <OrganizationStation station={station} />
    case 'technology':
      return <TechnologyStation station={station} />
    case 'products':
      return <ProductsStation station={station} />
    case 'site':
      return <SiteStation station={station} />
    case 'finish':
      return <FinishStation station={station} />
  }
}

function useViewportWidth() {
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

/**
 * Graphics tiers. Auto starts at Balanced, checks the frame rate for a few seconds and switches to Smooth
 * if needed – then keeps a stable setting (switching effects on the fly causes stutters of its own).
 * - smooth:   native resolution on standard screens (max 1x desktop / 1.5x phones), no ambient occlusion or glow
 * - balanced: up to 1.5x (2x on phones), ambient occlusion, glow, light anti-aliasing
 * - ultra:    at least 3840 px wide, every effect at high quality, 4x multisampling
 */
function resolution(tier: Tier, reduced: boolean, viewportWidth: number) {
  const native = window.devicePixelRatio || 1
  const handheld = isHandheld()
  if (tier === 'ultra') return Math.min(3, Math.max(native, 3840 / Math.max(1, viewportWidth)))
  const cap = tier === 'balanced' ? (handheld ? 2 : 1.5) : handheld ? 1.5 : 1
  const dpr = Math.min(native, cap)
  return reduced ? Math.max(0.6, dpr * 0.75) : dpr
}

/**
 * Measures the frame rate. With Auto quality it makes at most two early decisions – Balanced to Smooth,
 * then a lower resolution – and publishes the live frame rate for the Settings panel.
 */
function PerformanceGovernor({ adaptive, tier, reduced, onSlower }: { adaptive: boolean; tier: Tier; reduced: boolean; onSlower: (step: 'smooth' | 'reduce') => void }) {
  const m = useRef({ elapsed: 0, holdUntil: 2, frames: 0, time: 0, buckets: [] as number[], measured: false })

  useEffect(() => {
    const { renderer, software } = probeWebGL()
    usePerf.getState().set({ renderer, software })
  }, [])

  useEffect(() => {
    usePerf.getState().set({ tier })
    m.current.holdUntil = m.current.elapsed + 2.5 // let a changed setting settle before judging again
    m.current.buckets = []
  }, [tier, reduced])

  useFrame((_, delta) => {
    const s = m.current
    if (delta > 0.25) return // tab switch or a one-off hitch: not representative
    s.elapsed += delta
    s.frames++
    s.time += delta
    if (s.time < 1) return
    const fps = s.frames / s.time
    s.frames = 0
    s.time = 0
    usePerf.getState().set({ fps: Math.round(fps) })
    if (!adaptive || s.elapsed < s.holdUntil) return
    s.buckets = [...s.buckets, fps].slice(-5)
    // First check: three seconds below 40 fps at Balanced -> Smooth.
    if (!s.measured && s.buckets.length >= 3) {
      s.measured = true
      if (tier === 'balanced' && average(s.buckets) < 40) onSlower('smooth')
      return
    }
    // Afterwards only react to a sustained, clearly bad frame rate (5 s below 26 fps).
    if (s.buckets.length === 5 && Math.max(...s.buckets) < 26) {
      if (tier === 'balanced') onSlower('smooth')
      else if (!reduced) onSlower('reduce')
    }
  })
  return null
}

/**
 * Smooth draws straight to the screen (no post-processing chain), so tone mapping is done by the renderer
 * itself; the other tiers tone-map in post-processing.
 */
function ToneMappingForTier({ tier }: { tier: Tier }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.toneMapping = tier === 'smooth' ? NeutralToneMapping : NoToneMapping
  }, [gl, tier])
  return null
}

const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length

/** Marks the canvas as ready after the first rendered frame, so it can fade in. */
function ReadySignal() {
  const done = useRef(false)
  useFrame(({ gl }) => {
    if (done.current) return
    done.current = true
    gl.domElement.classList.add('ready')
  })
  return null
}

export function Scene() {
  const { stations } = useContent()
  const current = useStore((s) => s.current)
  const previous = useStore((s) => s.previous)
  const quality = useStore((s) => s.quality)
  // Without graphics acceleration, start straight away in the lightest setting.
  const software = probeWebGL().software
  const [autoTier, setAutoTier] = useState<Tier>(software ? 'smooth' : 'balanced')
  const [reducedResolution, setReducedResolution] = useState(software)
  const viewportWidth = useViewportWidth()
  const adaptive = quality === 'auto'
  const tier: Tier = adaptive ? autoTier : quality
  const reduced = adaptive && reducedResolution
  const dpr = resolution(tier, reduced, viewportWidth)
  const shadowMapSize = tier === 'ultra' ? 4096 : tier === 'balanced' ? 2048 : 1024
  const onSlower = useCallback((step: 'smooth' | 'reduce') => {
    setAutoTier('smooth')
    if (step === 'reduce') setReducedResolution(true)
  }, [])
  const initialView = stationView(current, window.innerWidth, window.innerHeight)
  // Created once: passing the same elements lets React skip re-processing every station's 3D tree on each
  // station change (only the parts that read the station context update).
  const centerpieces = useMemo(() => stations.map(centerpiece), [stations])

  return (
    <Canvas
      className="scene"
      shadows="percentage"
      dpr={dpr}
      flat
      gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 40, near: 0.1, far: 400, position: initialView.position }}
      onCreated={({ gl, scene }) => {
        // ?debug exposes the renderer and scene so draw calls, triangles and memory can be inspected.
        if (urlOptions.debug) Object.assign(window, { __renderer: gl, __scene: scene })
      }}
      aria-hidden
    >
      <GlyphPreloader />
      <PerformanceGovernor adaptive={adaptive} tier={tier} reduced={reduced} onSlower={onSlower} />
      <ToneMappingForTier tier={tier} />
      <Suspense fallback={null}>
        <World shadows={!reduced} shadowMapSize={shadowMapSize} />
        <JourneyPath count={stations.length} color={stations[0]?.color ?? '#d51900'} />
        {stations.map((station, index) => (
          <Station
            key={station.id}
            number={index + 1}
            title={station.title}
            color={station.color}
            info={{
              index,
              id: station.id,
              active: index === current,
              visible: index === current || index === previous || Math.abs(index - current) === 1,
            }}
          >
            {centerpieces[index]}
          </Station>
        ))}
        {tier !== 'smooth' && <Effects tier={tier} />}
        {/* Compile every station's shaders up front, so flying to a station never stalls. */}
        <Preload all />
        <ReadySignal />
      </Suspense>
      <CameraRig />
      {urlOptions.debug && <Stats />}
    </Canvas>
  )
}
