import type { StationOf } from '../../content/schema'
import { computeOptics } from '../../lib/optics'
import { useStore, type EyeCondition, type Rhythm } from '../../state/store'
import { Chip, Chips } from './shared'

const eyes: [EyeCondition, string][] = [
  ['normal', 'Normal eye'],
  ['myopia', 'Nearsighted'],
  ['hyperopia', 'Farsighted'],
]
const rhythms: [Rhythm, string][] = [
  ['normal', 'Normal rhythm'],
  ['afib', 'Atrial fibrillation'],
  ['ablated', 'After ablation'],
]

function OpticsControls() {
  const { eye, lensPower } = useStore((s) => s.lab)
  const setLab = useStore((s) => s.setLab)
  const result = computeOptics(eye, lensPower)
  const status =
    result.state === 'sharp'
      ? 'Sharp: the light focuses exactly on the retina.'
      : result.state === 'front'
        ? 'Blurry: the light focuses in front of the retina. Try a minus (diverging) lens.'
        : 'Blurry: the light would focus behind the retina. Try a plus (converging) lens.'
  return (
    <div className="controls">
      <Chips label="Eye">
        {eyes.map(([value, label]) => (
          <Chip key={value} active={eye === value} onClick={() => setLab({ eye: value })}>
            {label}
          </Chip>
        ))}
      </Chips>
      <label className="field">
        <span>
          Correcting lens: <strong>{`${lensPower > 0 ? '+' : ''}${lensPower.toFixed(2)} D`}</strong>
        </span>
        <input type="range" min={-6} max={4} step={0.25} value={lensPower} onChange={(e) => setLab({ lensPower: Number(e.target.value) })} />
      </label>
      <p className={result.state === 'sharp' ? 'feedback good' : 'feedback'} aria-live="polite">
        {status}
      </p>
      <button className="button secondary small" onClick={() => setLab({ lensPower: 0 })}>
        Remove lens
      </button>
    </div>
  )
}

function HeartControls() {
  const rhythm = useStore((s) => s.lab.rhythm)
  const setLab = useStore((s) => s.setLab)
  return (
    <Chips label="Heart rhythm">
      {rhythms.map(([value, label]) => (
        <Chip key={value} active={rhythm === value} onClick={() => setLab({ rhythm: value })}>
          {label}
        </Chip>
      ))}
    </Chips>
  )
}

function KneeControls() {
  const { kneeAngle, kneeAuto } = useStore((s) => s.lab)
  const setLab = useStore((s) => s.setLab)
  return (
    <div className="controls">
      <label className="field">
        <span>
          Knee flexion: <strong>{`${kneeAngle}°`}</strong>
        </span>
        <input type="range" min={0} max={120} step={1} value={kneeAngle} onChange={(e) => setLab({ kneeAngle: Number(e.target.value), kneeAuto: false })} />
      </label>
      <label className="choice">
        <input type="checkbox" checked={kneeAuto} onChange={(e) => setLab({ kneeAuto: e.target.checked })} />
        <span>Animate automatically</span>
      </label>
    </div>
  )
}

function LifecycleControls({ stages }: { stages: StationOf<'technology'>['lifecycle'] }) {
  const stage = useStore((s) => s.lab.stage)
  const setLab = useStore((s) => s.setLab)
  const current = stages[Math.min(stage, stages.length - 1)]
  return (
    <>
      <ol className="stage-list">
        {stages.map((s, i) => (
          <li key={s.id}>
            <button className={i === stage ? 'active' : ''} aria-pressed={i === stage} onClick={() => setLab({ stage: i })}>
              <span className="tab-number">{i + 1}</span> {s.title}
            </button>
          </li>
        ))}
      </ol>
      <article className="detail">
        <h3>{current.title}</h3>
        <p>{current.text}</p>
      </article>
    </>
  )
}

export function TechnologyExplorer({ station }: { station: StationOf<'technology'> }) {
  const demoId = useStore((s) => s.lab.demo)
  const setLab = useStore((s) => s.setLab)
  const demo = station.demos.find((d) => d.id === demoId) ?? station.demos[0]
  return (
    <>
      <div className="tabs" role="tablist" aria-label="Demos">
        {station.demos.map((d) => (
          <button key={d.id} role="tab" aria-selected={demo.id === d.id} className={demo.id === d.id ? 'tab active' : 'tab'} onClick={() => setLab({ demo: d.id })}>
            {d.title.split(' – ')[0]}
          </button>
        ))}
      </div>
      <article className="detail" role="tabpanel">
        <h3>{demo.title}</h3>
        <p>{demo.text}</p>
        {demo.id === 'optics' && <OpticsControls />}
        {demo.id === 'heart' && <HeartControls />}
        {demo.id === 'knee' && <KneeControls />}
        {demo.id === 'lifecycle' && <LifecycleControls stages={station.lifecycle} />}
        {demo.points.length > 0 && (
          <ul className="bullets">
            {demo.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </article>
    </>
  )
}
