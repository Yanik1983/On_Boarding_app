/** Shown when the editable content block is broken, listing what to fix. */
export function ContentError({ problems }: { problems: string[] }) {
  return (
    <main className="content-error">
      <h1>The content of this file needs a fix</h1>
      <p>
        Someone edited the text block inside this file and something doesn't fit. Open the file in Notepad, search for{' '}
        <code>EDITABLE CONTENT</code> and correct the following:
      </p>
      <ul>
        {problems.map((problem, i) => (
          <li key={i}>{problem}</li>
        ))}
      </ul>
      <p>Tip: every text must be inside double quotes, and items in a list are separated by commas.</p>
    </main>
  )
}
