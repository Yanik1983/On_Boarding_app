import { useEffect, useRef, type CSSProperties } from 'react'
import { useContent } from '../content/context'
import type { Station } from '../content/schema'
import { getSteps } from '../lib/steps'
import { canVisit, useStore } from '../state/store'
import { Checkpoint } from './Checkpoint'
import { Explorer } from './explorers/Explorer'
import { CheckIcon, ChevronLeft, ChevronRight } from './icons'

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i}>{p.trim()}</p>
        ))}
    </>
  )
}

export function StationPanel({ station, index }: { station: Station; index: number }) {
  const { stations } = useContent()
  const steps = getSteps(station)
  const storedStep = useStore((s) => s.steps[station.id] ?? 0)
  const step = Math.min(storedStep, steps.length - 1)
  const completed = useStore((s) => s.completed.includes(station.id))
  const canGoNext = useStore((s) => canVisit(s, index + 1))
  const nextStation = stations[index + 1]
  const body = useRef<HTMLDivElement>(null)
  const current = steps[step]
  const setStep = (value: number) => useStore.getState().setStep(station.id, value)

  useEffect(() => {
    body.current?.scrollTo({ top: 0 })
  }, [step])

  const hint = station.kind === 'welcome' ? 'Enter your name to start' : steps.some((s) => s.type === 'checkpoint') ? 'Answer the quick check to continue' : 'Complete this station to continue'

  return (
    <aside className="panel" aria-labelledby="panel-title" style={{ '--accent': station.color } as CSSProperties}>
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
        </p>
        <h1 id="panel-title">{station.title}</h1>
        {station.subtitle && <p className="subtitle">{station.subtitle}</p>}
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
      </header>

      <div className="panel-body" ref={body} data-step-type={current.type}>
        <h2 className="step-title">{current.title}</h2>
        {current.type === 'card' && (
          <>
            <Paragraphs text={station.cards[current.index].body} />
            {station.cards[current.index].bullets && (
              <ul className="bullets">
                {station.cards[current.index].bullets!.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </>
        )}
        {current.type === 'explore' && <Explorer station={station} />}
        {current.type === 'checkpoint' && station.checkpoint && <Checkpoint station={station} question={station.checkpoint} />}
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
        <button className="button secondary" onClick={() => setStep(step - 1)} disabled={step === 0}>
          <ChevronLeft /> Back
        </button>
        {step < steps.length - 1 ? (
          <button className="button primary" onClick={() => setStep(step + 1)}>
            Next <ChevronRight />
          </button>
        ) : nextStation ? (
          <button className="button primary" onClick={() => useStore.getState().goTo(index + 1)} disabled={!canGoNext}>
            {canGoNext ? (
              <>
                {`Continue to ${nextStation.title}`} <ChevronRight />
              </>
            ) : (
              hint
            )}
          </button>
        ) : null}
      </footer>
    </aside>
  )
}
