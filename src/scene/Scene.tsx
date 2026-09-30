import { PerformanceMonitor, Preload, Stats } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useContent } from '../content/context'
import type { Station as StationData } from '../content/schema'
import { urlOptions } from '../lib/params'
import { isHandheld } from '../lib/responsive'
import { useStore, type Quality } from '../state/store'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
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
 * Adaptive quality ladder – keeps motion smooth by trading effects first and resolution last:
 *  -1  extra sharpness: standard (1x) desktop screens supersampled at 1.25x – only with frame-rate headroom
 *   0  full quality: native resolution, ambient occlusion, bloom, 4x anti-aliasing (start)
 *   1  ambient occlusion off
 *   2  bloom and vignette off, lighter anti-aliasing
 *   3  resolution 85%
 *   4  resolution 70% (Auto only)
 * Ultra is fixed: at least 3840 px wide with every effect.
 */
export type QualityLevel = -1 | 0 | 1 | 2 | 3 | 4

function resolution(quality: Quality, level: QualityLevel, viewportWidth: number) {
  const native = window.devicePixelRatio || 1
  const handheld = isHandheld()
  const full = Math.min(native, handheld ? 3 : 2)
  if (quality === 'ultra') return Math.min(3, Math.max(native, 3840 / Math.max(1, viewportWidth)))
  if (level < 0 && !handheld && native < 1.5) return 1.25
  if (level >= 4) return Math.max(0.6, full * 0.7)
  if (level >= 3) return Math.max(handheld ? 1.5 : 0.75, full * 0.85)
  return full
}

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

/** Waits a few seconds (loading and shader compilation make the first frames slow) before judging performance. */
function useDelayedStart(ms: number) {
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), ms)
    return () => window.clearTimeout(timer)
  }, [ms])
  return started
}

export function Scene() {
  const { stations } = useContent()
  const current = useStore((s) => s.current)
  const previous = useStore((s) => s.previous)
  const quality = useStore((s) => s.quality)
  const [level, setLevel] = useState<QualityLevel>(0)
  const viewportWidth = useViewportWidth()
  const dpr = resolution(quality, level, viewportWidth)
  const monitor = useDelayedStart(3000) && quality !== 'ultra'
  const maxLevel = quality === 'auto' ? 4 : 3
  const effectiveLevel: QualityLevel = quality === 'ultra' ? 0 : level
  const shadowMapSize = quality === 'ultra' ? 4096 : 2048
  const initialView = stationView(current, window.innerWidth, window.innerHeight)

  return (
    <Canvas
      className="scene"
      shadows="percentage"
      dpr={dpr}
      flat
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 40, near: 0.1, far: 400, position: initialView.position }}
      onCreated={({ gl }) => {
        // ?debug exposes the renderer so draw calls and triangle counts can be inspected.
        if (urlOptions.debug) (window as unknown as { __renderer: unknown }).__renderer = gl
      }}
      aria-hidden
    >
      {monitor && (
        // Below 45 fps: step down one level. Above 57 fps (smooth on a 60 Hz screen): step back up.
        <PerformanceMonitor
          bounds={() => [45, 57]}
          flipflops={3}
          onDecline={() => setLevel((l) => Math.min(maxLevel, l + 1) as QualityLevel)}
          onIncline={() => setLevel((l) => Math.max(-1, l - 1) as QualityLevel)}
        />
      )}
      <Suspense fallback={null}>
        <World shadows={effectiveLevel < 3} shadowMapSize={shadowMapSize} />
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
            {centerpiece(station)}
          </Station>
        ))}
        <Effects level={effectiveLevel} ultra={quality === 'ultra'} />
        {/* Compile every station's shaders up front, so flying to a station never stalls. */}
        <Preload all />
        <ReadySignal />
      </Suspense>
      <CameraRig />
      {urlOptions.debug && <Stats />}
    </Canvas>
  )
}
