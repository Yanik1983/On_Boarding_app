import { useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { useContent } from '../content/context'
import type { Station } from '../content/schema'
import { personalize } from '../lib/personalize'
import { SHEET_QUERY } from '../lib/responsive'
import { getSteps } from '../lib/steps'
import { canVisit, useStore } from '../state/store'
import { Checkpoint } from './Checkpoint'
import { Explorer } from './explorers/Explorer'
import { goToPreviousStation } from './navigation'
import { CheckIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from './icons'

function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((p, i) => <p key={i}>{p.trim()}</p>)
}

/** Tells the 3D view how much of the screen the panel covers when it is a bottom sheet (phones). */
function useReportInset(panel: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = panel.current
    if (!element) return
    const update = () => {
      const { setViewInset } = useStore.getState()
      if (!window.matchMedia(SHEET_QUERY).matches) return setViewInset({ top: 0, bottom: 0 })
      const topbar = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0
      // offsetTop ignores the slide-in transform, so the value is stable during the animation.
      setViewInset({ top: topbar, bottom: Math.max(0, window.innerHeight - element.offsetTop) })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [panel])
}

export function StationPanel({ station, index, collapsible }: { station: Station; index: number; collapsible: boolean }) {
  const { stations } = useContent()
  const steps = getSteps(station)
  const storedStep = useStore((s) => s.steps[station.id] ?? 0)
  const step = Math.min(storedStep, steps.length - 1)
  const completed = useStore((s) => s.completed.includes(station.id))
  const canGoNext = useStore((s) => canVisit(s, index + 1))
  const nextStation = stations[index + 1]
  const previousStation = stations[index - 1]
  const body = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const sheetCollapsed = useStore((s) => s.sheetCollapsed)
  const collapsed = collapsible && sheetCollapsed
  const current = steps[step]
  const name = useStore((s) => s.name)
  const text = (value: string) => personalize(value, name)
  useReportInset(panel)
  // Direction of the last page change, for the slide animation.
  const previousStep = useRef(step)
  const direction = step >= previousStep.current ? 'forward' : 'back'
  useEffect(() => {
    previousStep.current = step
  }, [step])
  const setStep = (value: number) => useStore.getState().setStep(station.id, value)

  useEffect(() => {
    body.current?.scrollTo({ top: 0 })
  }, [step])

  // Stations without a quick-check question are completed by reaching their last page.
  // (Welcome completes with the name form, the final station with the knowledge check.)
  const completesOnLastPage = !station.checkpoint && station.kind !== 'welcome' && station.kind !== 'finish'
  useEffect(() => {
    if (completesOnLastPage && step === steps.length - 1 && !completed) useStore.getState().completeStation(station.id)
  }, [completesOnLastPage, step, steps.length, completed, station.id])

  return (
    <aside
      ref={panel}
      className={collapsed ? 'panel collapsed' : 'panel'}
      aria-labelledby="panel-title"
      style={{ '--accent': station.color } as CSSProperties}
    >
      <header className="panel-header">
        <p className="kicker">
          <span>{`Station ${index + 1} of ${stations.length}`}</span>
          <span aria-hidden>·</span>
          <span>{`about ${station.minutes} min`}</span>
          {completed && (
            <span className="done-chip">
              <CheckIcon /> Completed
            </span>
          )}
          {collapsible && (
            <button
              className="collapse-toggle"
              aria-expanded={!collapsed}
              aria-controls="panel-body"
              onClick={() => useStore.getState().setSheetCollapsed(!collapsed)}
            >
              {collapsed ? (
                <>
                  Show text <ChevronUp />
                </>
              ) : (
                <>
                  Hide text <ChevronDown />
                </>
              )}
            </button>
          )}
        </p>
        <h1 id="panel-title">{station.title}</h1>
        {station.subtitle && <p className="subtitle">{station.subtitle}</p>}
        <div className="step-row">
        <nav className="step-dots" aria-label="Pages in this station">
          {steps.map((s, i) => (
            <button
              key={i}
              className={i === step ? 'step-dot active' : i < step ? 'step-dot seen' : 'step-dot'}
              aria-label={`Page ${i + 1}: ${s.title}`}
              aria-current={i === step ? 'page' : undefined}
              onClick={() => setStep(i)}
            />
          ))}
        </nav>
          <span className="step-count" aria-hidden>{`${step + 1} / ${steps.length}`}</span>
        </div>
      </header>

      <div className="panel-body" id="panel-body" ref={body} data-step-type={current.type} hidden={collapsed}>
        <div key={step} className={`step-content ${direction}`}>
          <h2 className="step-title">{text(current.title)}</h2>
          {current.type === 'card' && paragraphs(text(station.cards[current.index].body))}
          {current.type === 'card' && station.cards[current.index].bullets && (
            <ul className="bullets">
              {station.cards[current.index].bullets!.map((b, i) => (
                <li key={i}>{text(b)}</li>
              ))}
            </ul>
          )}
          {current.type === 'explore' && <Explorer station={station} />}
          {current.type === 'checkpoint' && station.checkpoint && <Checkpoint station={station} question={station.checkpoint} />}
        </div>
        {step === steps.length - 1 && station.sources.length > 0 && (
          <details className="sources">
            <summary>{`Sources (${station.sources.length})`}</summary>
            <ul>
              {station.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <footer className="panel-footer">
        <button
          className="button secondary"
          onClick={() => (step > 0 ? setStep(step - 1) : goToPreviousStation(stations))}
          disabled={step === 0 && !previousStation}
          aria-label={step === 0 && previousStation ? `Back to ${previousStation.title}` : undefined}
          title={step === 0 && previousStation ? `Back to ${previousStation.title}` : undefined}
        >
          <ChevronLeft /> Back
        </button>
        {step < steps.length - 1 ? (
          <button className="button primary" onClick={() => setStep(step + 1)}>
            Next <ChevronRight />
          </button>
        ) : nextStation && canGoNext ? (
          <button className="button primary" onClick={() => useStore.getState().goTo(index + 1)}>
            {`Continue to ${nextStation.title}`} <ChevronRight />
          </button>
        ) : null}
      </footer>
    </aside>
  )
}
