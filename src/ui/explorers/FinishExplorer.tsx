import { useState } from 'react'
import type { StationOf } from '../../content/schema'
import { useStore } from '../../state/store'
import { Certificate } from '../Certificate'
import { CheckIcon, PrintIcon } from '../icons'

export function FinishExplorer({ station }: { station: StationOf<'finish'> }) {
  const quiz = useStore((s) => s.quiz)
  const [retake, setRetake] = useState(false)

  if (quiz?.passed && !retake) {
    return (
      <>
        <p className="feedback good">
          <CheckIcon /> <strong>{`Well done! You scored ${quiz.score} out of ${quiz.total}.`}</strong>
        </p>
        <Certificate result={quiz} />
        <div className="row">
          <button className="button primary" onClick={() => window.print()}>
            <PrintIcon /> Print or save as PDF
          </button>
          <button className="button secondary" onClick={() => setRetake(true)}>
            Retake the check
          </button>
        </div>
        {station.nextSteps.length > 0 && (
          <section className="section">
            <h3>Your next steps</h3>
            <ul className="bullets">
              {station.nextSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}
      </>
    )
  }
  return <Quiz station={station} onPassed={() => setRetake(false)} />
}

function Quiz({ station, onPassed }: { station: StationOf<'finish'>; onPassed: () => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => station.questions.map(() => null))
  const [submitted, setSubmitted] = useState(false)
  const total = station.questions.length
  const score = station.questions.filter((q, i) => answers[i] === q.answer).length
  const needed = Math.ceil(station.passMark * total)
  const allAnswered = answers.every((a) => a !== null)

  const submit = () => {
    setSubmitted(true)
    const passed = score >= needed
    const store = useStore.getState()
    store.setQuiz({ score, total, passed, date: new Date().toISOString() })
    if (passed) {
      store.completeStation(station.id)
      onPassed()
    }
  }

  return (
    <form
      className="quiz"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <p className="muted">{`${total} questions · you need ${needed} correct answers`}</p>
      <ol>
        {station.questions.map((q, qi) => (
          <li key={qi}>
            <fieldset>
              <legend>{q.question}</legend>
              <div className="options" role="radiogroup">
                {q.options.map((option, oi) => {
                  const chosen = answers[qi] === oi
                  const mark = submitted ? (oi === q.answer && chosen ? 'correct' : chosen ? 'wrong' : '') : ''
                  return (
                    <label key={oi} className={['option', chosen ? 'chosen' : '', mark].join(' ')}>
                      <input
                        type="radio"
                        name={`quiz-${qi}`}
                        checked={chosen}
                        disabled={submitted}
                        onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                      />
                      <span>{option}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      <div aria-live="polite">
        {submitted && score < needed && (
          <p className="feedback bad">
            <strong>{`You scored ${score} of ${total}.`}</strong> You need {needed} to pass. Review the marked answers, then try again.
          </p>
        )}
      </div>
      {submitted ? (
        <button
          type="button"
          className="button primary"
          onClick={() => {
            setAnswers(station.questions.map(() => null))
            setSubmitted(false)
          }}
        >
          Try again
        </button>
      ) : (
        <button type="submit" className="button primary" disabled={!allAnswered}>
          {allAnswered ? 'Submit answers' : `Answer all questions (${answers.filter((a) => a !== null).length}/${total})`}
        </button>
      )}
    </form>
  )
}
