import { useState } from 'react'
import type { StationOf } from '../../content/schema'
import { useStore } from '../../state/store'
import { ChevronRight } from '../icons'

export function WelcomeExplorer({ station }: { station: StationOf<'welcome'> }) {
  const storedName = useStore((s) => s.name)
  const [name, setName] = useState(storedName)

  return (
    <>
      <form
        className="welcome-form"
        onSubmit={(e) => {
          e.preventDefault()
          const store = useStore.getState()
          store.setName(name.trim())
          store.completeStation(station.id)
          store.next()
        }}
      >
        <label className="field">
          <span>Your name – it will appear on your certificate</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoComplete="name" placeholder="First and last name" />
        </label>
        <button className="button primary large" type="submit" disabled={!name.trim()}>
          Start my journey <ChevronRight />
        </button>
      </form>
      {station.howTo.length > 0 && (
        <ul className="bullets">
          {station.howTo.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
    </>
  )
}
