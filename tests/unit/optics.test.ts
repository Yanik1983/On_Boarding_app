import { describe, expect, it } from 'vitest'
import { computeOptics } from '../../src/lib/optics'

describe('vision demo optics', () => {
  it('a normal eye focuses on the retina without a lens', () => {
    expect(computeOptics('normal', 0).state).toBe('sharp')
  })

  it('a myopic eye focuses in front of the retina and is corrected by about -4 D', () => {
    expect(computeOptics('myopia', 0).state).toBe('front')
    expect(computeOptics('myopia', -4).state).toBe('sharp')
    expect(computeOptics('myopia', 2).state).toBe('front')
  })

  it('a farsighted eye focuses behind the retina and is corrected by a plus lens', () => {
    expect(computeOptics('hyperopia', 0).state).toBe('behind')
    expect(computeOptics('hyperopia', 2).state).toBe('sharp')
  })

  it('draws one ray per height, from the light source to the retina', () => {
    const { rays } = computeOptics('normal', 0, [0.5, -0.5])
    expect(rays).toHaveLength(2)
    expect(rays[0].points).toHaveLength(4)
  })
})
