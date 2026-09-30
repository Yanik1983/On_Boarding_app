import { describe, expect, it } from 'vitest'
import { coveredText, isCovered } from '../../src/scene/fontCoverage'

describe('3D text font coverage', () => {
  it('keeps Latin text, accents and typographic punctuation', () => {
    expect(coveredText('Welcome aboard, Zoë – “Credo” · 1943!')).toBe('Welcome aboard, Zoë – “Credo” · 1943!')
  })

  it('drops characters the bundled font cannot draw, so no fallback fonts are downloaded', () => {
    expect(isCovered('✓')).toBe(false)
    expect(coveredText('Welcome aboard, יניק!')).toBe('Welcome aboard!')
    expect(coveredText('Done ✓')).toBe('Done')
  })
})
