import { useState } from 'react'
import { useContent } from '../content/context'
import { isDraft } from '../content/load'
import { hasWebGL } from '../lib/webgl'
import { useStore, type Quality } from '../state/store'
import { Dialog } from './Dialog'

const qualities: { value: Quality; label: string; text: string }[] = [
  { value: 'auto', label: 'Auto', text: 'Adapts to your computer to keep motion smooth (recommended).' },
  { value: 'high', label: 'High', text: "Your screen's full native resolution." },
  { value: 'ultra', label: 'Ultra 4K', text: 'Renders at least 3840 px wide. Best on powerful computers and 4K screens.' },
]

export function Settings() {
  const content = useContent()
  const state = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const motion = state.reducedMotion === null ? 'system' : state.reducedMotion ? 'reduced' : 'full'

  return (
    <Dialog title="Settings" onClose={() => state.setSettingsOpen(false)}>
      <label className="field">
        <span>Your name (shown on your certificate)</span>
        <input value={state.name} maxLength={60} onChange={(e) => state.setName(e.target.value)} autoComplete="name" />
      </label>

      <fieldset className="field" disabled={state.textOnly || !hasWebGL()}>
        <legend>3D quality</legend>
        {qualities.map((q) => (
          <label key={q.value} className="choice">
            <input type="radio" name="quality" checked={state.quality === q.value} onChange={() => state.setQuality(q.value)} />
            <span>
              <strong>{q.label}</strong> – {q.text}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="field">
        <legend>Motion</legend>
        {(
          [
            ['system', 'Follow my computer setting'],
            ['reduced', 'Reduce motion (no camera flights or animations)'],
            ['full', 'Full motion'],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="choice">
            <input
              type="radio"
              name="motion"
              checked={motion === value}
              onChange={() => state.setReducedMotion(value === 'system' ? null : value === 'reduced')}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <label className="choice field">
        <input type="checkbox" checked={state.textOnly} onChange={(e) => state.setTextOnly(e.target.checked)} />
        <span>
          <strong>Text-only mode</strong> – hide the 3D view (for slower computers or screen readers)
        </span>
      </label>

      <div className="field">
        <span className="field-label">Progress</span>
        {confirmReset ? (
          <div className="row">
            <span>This clears your name, progress and quiz result on this computer.</span>
            <button className="button danger" onClick={() => state.resetProgress()}>
              Yes, start over
            </button>
            <button className="button secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="button secondary" onClick={() => setConfirmReset(true)}>
            Start the journey over
          </button>
        )}
      </div>

      <p className="muted about">
        {`${content.meta.appTitle} · version ${content.meta.version} · ${content.meta.releaseDate}`}
        {isDraft(content) ? ' · contains draft content under review' : ''}
        <br />
        Your progress is stored only in this browser on this computer. Nothing is sent anywhere.
      </p>
    </Dialog>
  )
}
