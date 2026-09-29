import { beforeEach, describe, expect, it } from 'vitest'
import { canVisit, useStore } from '../../src/state/store'

const ids = ['welcome', 'company', 'credo', 'finish']

describe('journey progress', () => {
  beforeEach(() => {
    useStore.getState().resetProgress()
    useStore.getState().init(ids, { allowFreeOrder: false })
    useStore.setState({ current: 0, previous: 0 })
  })

  it('starts at the first station with only it unlocked', () => {
    const s = useStore.getState()
    expect(s.current).toBe(0)
    expect(canVisit(s, 0)).toBe(true)
    expect(canVisit(s, 1)).toBe(false)
  })

  it('does not allow skipping locked stations', () => {
    useStore.getState().goTo(2)
    expect(useStore.getState().current).toBe(0)
    useStore.getState().next()
    expect(useStore.getState().current).toBe(0)
  })

  it('completing a station unlocks the next one', () => {
    useStore.getState().completeStation('welcome')
    useStore.getState().next()
    const s = useStore.getState()
    expect(s.current).toBe(1)
    expect(s.previous).toBe(0)
    expect(s.completed).toEqual(['welcome'])
    expect(canVisit(s, 2)).toBe(false)
  })

  it('allows free order when configured, and in preview mode', () => {
    useStore.getState().init(ids, { allowFreeOrder: true })
    useStore.getState().goTo(3)
    expect(useStore.getState().current).toBe(3)
    useStore.getState().init(ids, { allowFreeOrder: false, preview: true })
    expect(canVisit(useStore.getState(), 3)).toBe(true)
  })

  it('clamps saved progress when stations are removed', () => {
    useStore.setState({ current: 3, highestUnlocked: 3, completed: ['welcome', 'company', 'removed'] })
    useStore.getState().init(['welcome', 'company'], { allowFreeOrder: false })
    const s = useStore.getState()
    expect(s.current).toBe(1)
    expect(s.highestUnlocked).toBe(1)
    expect(s.completed).toEqual(['welcome', 'company'])
  })

  it('resets progress but keeps settings', () => {
    const s = useStore.getState()
    s.setName('Alex')
    s.setQuality('ultra')
    s.completeStation('welcome')
    s.toggleChecklist('badge')
    s.resetProgress()
    const after = useStore.getState()
    expect(after.name).toBe('')
    expect(after.completed).toEqual([])
    expect(after.checklist).toEqual([])
    expect(after.highestUnlocked).toBe(0)
    expect(after.quality).toBe('ultra')
  })

  it('toggles checklist items', () => {
    useStore.getState().toggleChecklist('badge')
    expect(useStore.getState().checklist).toEqual(['badge'])
    useStore.getState().toggleChecklist('badge')
    expect(useStore.getState().checklist).toEqual([])
  })
})
