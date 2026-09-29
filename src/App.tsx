import { lazy, Suspense, useState } from 'react'
import { ContentProvider } from './content/context'
import type { LoadResult } from './content/load'
import { hasWebGL } from './lib/webgl'
import { useStore } from './state/store'
import { ContentError } from './ui/ContentError'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { Overlay } from './ui/Overlay'

const Scene = lazy(() => import('./scene/Scene').then((m) => ({ default: m.Scene })))

export function App({ result }: { result: LoadResult }) {
  if (!result.ok) return <ContentError problems={result.problems} />
  return (
    <ContentProvider content={result.content}>
      <Journey />
    </ContentProvider>
  )
}

function Journey() {
  const textOnly = useStore((s) => s.textOnly)
  const [sceneFailed, setSceneFailed] = useState(false)
  const webgl = hasWebGL()
  const show3d = webgl && !textOnly && !sceneFailed
  const notice = !webgl ? 'webgl' : sceneFailed ? 'failed' : null

  return (
    <div className={show3d ? 'app' : 'app text-only'}>
      {show3d ? (
        <ErrorBoundary onError={() => setSceneFailed(true)}>
          <Suspense fallback={<div className="scene-loading">Loading 3D view…</div>}>
            <Scene />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="text-only-backdrop" aria-hidden />
      )}
      <Overlay notice={notice} show3d={show3d} />
    </div>
  )
}
