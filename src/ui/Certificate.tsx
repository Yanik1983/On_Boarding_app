import { useContent, useStationOfKind } from '../content/context'
import { useStore, type QuizResult } from '../state/store'

export function Certificate({ result }: { result: QuizResult }) {
  const { meta } = useContent()
  const finish = useStationOfKind('finish')
  const name = useStore((s) => s.name)
  const date = new Date(result.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  return (
    <div className="certificate">
      <div className="certificate-inner">
        <p className="certificate-org">{meta.organizationLabel}</p>
        <h2>{finish?.certificateTitle ?? 'Certificate of Completion'}</h2>
        <p>This certifies that</p>
        <p className="certificate-name">{name || 'Our new colleague'}</p>
        <p className="certificate-text">{finish?.certificateText}</p>
        <div className="certificate-meta">
          <span>{date}</span>
          <span>{`Knowledge check: ${result.score} / ${result.total}`}</span>
        </div>
      </div>
    </div>
  )
}

/** Hidden on screen; the only thing printed when the user prints the certificate. */
export function PrintCertificate() {
  const quiz = useStore((s) => s.quiz)
  if (!quiz?.passed) return null
  return (
    <div className="print-only">
      <Certificate result={quiz} />
    </div>
  )
}
