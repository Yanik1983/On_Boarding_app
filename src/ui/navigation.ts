import type { Station } from '../content/schema'
import { getSteps } from '../lib/steps'
import { canVisit, useStore } from '../state/store'

/** "Back" from a station's first page: open the previous station on its last page, like turning back a page. */
export function goToPreviousStation(stations: Station[]) {
  const store = useStore.getState()
  const target = store.current - 1
  if (!canVisit(store, target)) return
  const previous = stations[target]
  store.setStep(previous.id, getSteps(previous).length - 1)
  store.goTo(target)
}
