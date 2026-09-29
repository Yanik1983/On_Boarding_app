import { useSyncExternalStore } from 'react'
import { useStore } from '../state/store'

const query = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void) {
  const media = window.matchMedia?.(query)
  media?.addEventListener('change', callback)
  return () => media?.removeEventListener('change', callback)
}

/** True when animations should be minimised: the user's setting wins, otherwise the OS preference. */
export function useReducedMotion(): boolean {
  const osPreference = useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false, () => false)
  const setting = useStore((s) => s.reducedMotion)
  return setting ?? osPreference
}
