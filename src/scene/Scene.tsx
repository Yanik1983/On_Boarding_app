import { PerformanceMonitor, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
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
 * Resolution strategy (pixels rendered per CSS pixel):
 * - high:  the screen's full native resolution – every physical pixel is drawn (default). Standard
 *          (1x) monitors are supersampled at 1.5x for crisper edges and text; if the frame rate stays
 *          low, only that extra is dropped – High never renders below native resolution.
 * - auto:  starts at native resolution and steps down if the frame rate stays very low
 * - ultra: at least 3840 pixels wide (true 4K; supersampled on smaller screens)
 * Phones have very dense screens (often 3x), so they are allowed up to 3x.
 */
function resolution(quality: Quality, factor: number, viewportWidth: number) {
  const native = window.devicePixelRatio || 1
  const full = Math.min(native, isHandheld() ? 3 : 2)
  if (quality === 'ultra') return Math.min(3, Math.max(native, 3840 / Math.max(1, viewportWidth)))
  if (quality === 'high') return Math.max(full, Math.max(full, isHandheld() ? full : 1.5) * factor)
  return Math.max(Math.min(native, 1), full * factor)
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
  const [factor, setFactor] = useState(1)
  const viewportWidth = useViewportWidth()
  const dpr = resolution(quality, factor, viewportWidth)
  const lowPower = quality === 'auto' && factor <= 0.6
  const monitor = useDelayedStart(4000) && quality !== 'ultra'
  const shadowMapSize = quality !== 'auto' && !isHandheld() ? 4096 : 2048
  const initialView = stationView(current, window.innerWidth, window.innerHeight)

  return (
    <Canvas
      className="scene"
      shadows="percentage"
      dpr={dpr}
      flat
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 40, near: 0.1, far: 400, position: initialView.position }}
      aria-hidden
    >
      {monitor && (
        <PerformanceMonitor
          bounds={() => [24, 45]}
          flipflops={4}
          onDecline={() => setFactor((f) => Math.max(0.6, f - 0.15))}
          onIncline={() => setFactor((f) => Math.min(1, f + 0.1))}
          onFallback={() => setFactor(0.7)}
        />
      )}
      <Suspense fallback={null}>
        <World shadows={!lowPower} shadowMapSize={shadowMapSize} />
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
        <Effects full={!lowPower} handheld={isHandheld()} />
      </Suspense>
      <CameraRig />
      {urlOptions.debug && <Stats />}
    </Canvas>
  )
}
