import type { Station } from '../content/schema'

export type Step =
  | { type: 'card'; index: number; title: string }
  | { type: 'explore'; title: string }
  | { type: 'checkpoint'; title: string }

const exploreTitles: Record<Station['kind'], string> = {
  welcome: "Let's get started",
  company: 'Explore the timeline',
  credo: 'The four responsibilities',
  divisions: 'Explore the business units',
  organization: 'Explore the departments',
  technology: 'Science lab',
  products: 'Product showroom',
  site: 'Explore the campus',
  finish: 'Knowledge check',
}

/** The pages of a station's panel: its cards, then the interactive explore page, then the checkpoint. */
export function getSteps(station: Station): Step[] {
  const steps: Step[] = station.cards.map((card, index) => ({ type: 'card', index, title: card.title }))
  steps.push({ type: 'explore', title: exploreTitles[station.kind] })
  if (station.checkpoint && station.kind !== 'welcome' && station.kind !== 'finish') {
    steps.push({ type: 'checkpoint', title: 'Quick check' })
  }
  return steps
}

export function exploreStepIndex(station: Station): number {
  return getSteps(station).findIndex((s) => s.type === 'explore')
}
