import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './theme/tokens.css'
import './ui/ui.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { loadContent } from './content/load'
import { urlOptions } from './lib/params'
import { canVisit, useStore, type Quality } from './state/store'

const result = loadContent()

if (result.ok) {
  const { meta, stations } = result.content
  const store = useStore.getState()
  store.init(
    stations.map((s) => s.id),
    { allowFreeOrder: meta.allowFreeOrder, preview: urlOptions.preview },
  )
  if (urlOptions.quality && ['auto', 'smooth', 'balanced', 'ultra'].includes(urlOptions.quality)) {
    store.setQuality(urlOptions.quality as Quality)
  }
  if (urlOptions.textOnly) store.setTextOnly(true)
  const requested = stations.findIndex((s) => s.id === urlOptions.station)
  if (requested >= 0 && canVisit(useStore.getState(), requested)) {
    useStore.setState({ current: requested, previous: requested })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App result={result} />
  </StrictMode>,
)
