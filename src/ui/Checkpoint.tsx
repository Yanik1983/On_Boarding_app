import { useState } from 'react'
import type { QuestionT, Station } from '../content/schema'
import { useStore } from '../state/store'
import { CheckIcon } from './icons'

/** One multiple-choice question; answering it correctly completes the station. */
export function Checkpoint({ station, question }: { station: Station; question: QuestionT }) {
  const completed = useStore((s) => s.completed.includes(station.id))
  const [choice, setChoice] = useState<number | null>(completed ? question.answer : null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(completed ? 'correct' : null)
  const name = `checkpoint-${station.id}`

  const check = () => {
    if (choice === null) return
    if (choice === question.answer) {
      setResult('correct')
      useStore.getState().completeStation(station.id)
    } else {
      setResult('wrong')
    }
  }

  return (
    <div className="checkpoint">
      <fieldset>
        <legend>{question.question}</legend>
        <div className="options" role="radiogroup">
          {question.options.map((option, i) => (
            <label
              key={i}
              className={[
                'option',
                choice === i ? 'chosen' : '',
                result === 'correct' && i === question.answer ? 'correct' : '',
                result === 'wrong' && choice === i ? 'wrong' : '',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                checked={choice === i}
                disabled={result === 'correct'}
                onChange={() => {
                  setChoice(i)
                  setResult(null)
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {result !== 'correct' && (
        <button className="button primary" onClick={check} disabled={choice === null}>
          Check answer
        </button>
      )}
      <div aria-live="polite">
        {result === 'correct' && (
          <p className="feedback good">
            <CheckIcon /> <strong>Correct!</strong> {question.explanation}
          </p>
        )}
        {result === 'wrong' && (
          <p className="feedback bad">
            <strong>Not quite.</strong> Have another look at the cards and try again.
          </p>
        )}
      </div>
    </div>
  )
}
