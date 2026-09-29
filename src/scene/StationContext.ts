import { createContext, useContext } from 'react'

export interface StationInfo {
  index: number
  id: string
  /** The camera is at this station. */
  active: boolean
  /** Rendered (current, previous or next station). */
  visible: boolean
}

export const StationContext = createContext<StationInfo>({ index: 0, id: '', active: false, visible: false })

export const useStationInfo = () => useContext(StationContext)
