import { useCursor } from '@react-three/drei'
import { useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useContent } from '../content/context'
import { exploreStepIndex } from '../lib/steps'
import { useStore, type Focus } from '../state/store'
import { useStationInfo } from './StationContext'

/** Selection for the current station, synced with its explore page in the panel. */
export function useSelection(key?: string) {
  const { id } = useStationInfo()
  const selectionKey = key ?? id
  const selected = useStore((s) => s.selection[selectionKey] ?? null)
  const content = useContent()
  const select = (value: string | null, focus?: Focus | null) => {
    const store = useStore.getState()
    store.select(selectionKey, value)
    const station = content.stations.find((s) => s.id === id)
    if (station && value !== null) {
      store.setStep(id, exploreStepIndex(station))
      store.setSheetCollapsed(false)
    }
    if (focus !== undefined) store.setFocus(focus)
  }
  return [selected, select] as const
}

/** Hover state + pointer cursor for clickable meshes; only active at the current station. */
export function useHover() {
  const { active } = useStationInfo()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered && active)
  return {
    hovered: hovered && active,
    bind: {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(true)
      },
      onPointerOut: () => setHovered(false),
    },
  }
}
