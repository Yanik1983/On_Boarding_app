import { PerformanceMonitor, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useContent } from '../content/context'
import type { Station as StationData } from '../content/schema'
import { urlOptions } from '../lib/params'
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
 * Resolution strategy:
 * - auto:  native resolution (max 2x), lowered automatically when the frame rate drops
 * - high:  native resolution of the screen (max 2x)
 * - ultra: at least 3840 pixels wide (true 4K; supersampled on smaller screens)
 */
function resolution(quality: Quality, factor: number, viewportWidth: number) {
  const native = window.devicePixelRatio || 1
  if (quality === 'ultra') return Math.min(3, Math.max(native, 3840 / Math.max(1, viewportWidth)))
  if (quality === 'high') return Math.min(native, 2)
  return Math.max(0.75, Math.min(native, 2) * factor)
}

export function Scene() {
  const { stations } = useContent()
  const current = useStore((s) => s.current)
  const previous = useStore((s) => s.previous)
  const quality = useStore((s) => s.quality)
  const [factor, setFactor] = useState(1)
  const viewportWidth = useViewportWidth()
  const dpr = resolution(quality, factor, viewportWidth)
  const lowPower = quality === 'auto' && factor < 0.7
  const initialView = stationView(current, window.innerWidth / Math.max(1, window.innerHeight))

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
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setFactor((f) => Math.max(0.5, f - 0.2))}
        onIncline={() => setFactor((f) => Math.min(1, f + 0.1))}
        onFallback={() => setFactor(0.5)}
      />
      <Suspense fallback={null}>
        <World shadows={!lowPower} />
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
        <Effects full={!lowPower} />
      </Suspense>
      <CameraRig />
      {urlOptions.debug && <Stats />}
    </Canvas>
  )
}
