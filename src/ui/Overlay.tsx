import { useEffect } from 'react'
import { useContent } from '../content/context'
import { isDraft } from '../content/load'
import { firstName, initials } from '../lib/personalize'
import { getSteps } from '../lib/steps'
import { usePerf } from '../state/perf'
import { canVisit, useStore } from '../state/store'
import { PrintCertificate } from './Certificate'
import { GearIcon, MenuIcon } from './icons'
import { JourneyBar } from './JourneyBar'
import { goToPreviousStation } from './navigation'
import { Settings } from './Settings'
import { StationMenu } from './StationMenu'
import { StationPanel } from './StationPanel'

const notices = {
  webgl: 'Your browser cannot show the 3D view here, so the journey is shown in text-only mode.',
  failed: 'The 3D view stopped working on this computer, so the journey continues in text-only mode.',
}

function useKeyboard() {
  const content = useContent()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const store = useStore.getState()
      if (event.key === 'Escape') {
        if (store.menuOpen) store.setMenuOpen(false)
        else if (store.settingsOpen) store.setSettingsOpen(false)
        else if (store.focus) store.setFocus(null)
        return
      }
      const target = event.target as HTMLElement
      if (store.menuOpen || store.settingsOpen || target.closest('input, textarea, select, [role="radiogroup"]')) return
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      const station = content.stations[store.current]
      const steps = getSteps(station)
      const step = Math.min(store.steps[station.id] ?? 0, steps.length - 1)
      if (event.key === 'ArrowRight') {
        if (step < steps.length - 1) store.setStep(station.id, step + 1)
        else if (canVisit(store, store.current + 1)) store.next()
      } else if (step > 0) {
        store.setStep(station.id, step - 1)
      } else {
        goToPreviousStation(content.stations)
      }
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content])
}

function Toast() {
  const toast = useStore((s) => s.toast)
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => useStore.getState().showToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <p className="toast" key={toast}>
          {toast}
        </p>
      )}
    </div>
  )
}

/** Shown when the browser draws 3D in software (graphics acceleration off, remote desktop, virtual machine). */
function SoftwareRenderingNotice() {
  const { software, noticeDismissed } = usePerf()
  if (!software || noticeDismissed) return null
  return (
    <div className="notice perf-notice" role="status">
      <p>
        <strong>3D is running without graphics acceleration</strong>, so it may feel slow. In Edge or Chrome open Settings › System and turn on{' '}
        <em>Use graphics acceleration when available</em>, then restart the browser. On a remote desktop, open the file on your own laptop instead.
      </p>
      <div className="row">
        <button className="button small primary" onClick={() => useStore.getState().setTextOnly(true)}>
          Switch to text-only mode
        </button>
        <button className="button small secondary" onClick={() => usePerf.getState().set({ noticeDismissed: true })}>
          Keep 3D
        </button>
      </div>
    </div>
  )
}

function NameChip() {
  const name = useStore((s) => s.name)
  if (!name.trim()) return null
  return (
    <button className="name-chip" onClick={() => useStore.getState().setSettingsOpen(true)} aria-label={`${name} – open settings`} title="Your profile">
      <span className="avatar" aria-hidden>
        {initials(name)}
      </span>
      <span className="name-chip-text">{firstName(name)}</span>
    </button>
  )
}

export function Overlay({ notice, show3d }: { notice: keyof typeof notices | null; show3d: boolean }) {
  const content = useContent()
  const current = useStore((s) => s.current)
  const menuOpen = useStore((s) => s.menuOpen)
  const settingsOpen = useStore((s) => s.settingsOpen)
  const station = content.stations[current]
  useKeyboard()

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <strong>{content.meta.appTitle}</strong>
            <span>{content.meta.organizationLabel}</span>
          </div>
        </div>
        <div className="top-actions">
          <NameChip />
          {isDraft(content) && (
            <span className="draft-badge" title="Some content has not been approved yet">
              DRAFT – content under review
            </span>
          )}
          <button className="icon-button" onClick={() => useStore.getState().setMenuOpen(true)} aria-label="All stations">
            <MenuIcon />
          </button>
          <button className="icon-button" onClick={() => useStore.getState().setSettingsOpen(true)} aria-label="Settings">
            <GearIcon />
          </button>
        </div>
      </header>
      {show3d && <SoftwareRenderingNotice />}
      {notice && (
        <p className="notice" role="status">
          {notices[notice]}
        </p>
      )}
      <StationPanel key={station.id} station={station} index={current} collapsible={show3d} />
      <JourneyBar />
      {menuOpen && <StationMenu />}
      {settingsOpen && <Settings />}
      <p className="sr-only" aria-live="polite">
        {`Station ${current + 1} of ${content.stations.length}: ${station.title}`}
      </p>
      <Toast />
      <PrintCertificate />
    </>
  )
}
