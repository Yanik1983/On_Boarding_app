import type { ReactNode } from 'react'
import { useStore, type Focus } from '../../state/store'

export function useStationSelection(key: string) {
  const selected = useStore((s) => s.selection[key] ?? null)
  const select = (value: string | null, focus?: Focus | null) => {
    const store = useStore.getState()
    store.select(key, value)
    if (focus !== undefined) store.setFocus(focus)
  }
  return [selected, select] as const
}

export function Chips({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {children}
    </div>
  )
}

export function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  return (
    <button className={active ? 'chip active' : 'chip'} aria-pressed={active} onClick={onClick} style={color ? { ['--chip' as string]: color } : undefined}>
      {color && <span className="chip-dot" aria-hidden />}
      {children}
    </button>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="hint">{children}</p>
}
