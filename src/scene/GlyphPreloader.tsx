import { useEffect } from 'react'
import { preloadFont } from 'troika-three-text'
import { useContent } from '../content/context'
import { useStore } from '../state/store'
import { isCovered } from './fontCoverage'
import { fonts } from './fonts'
import { SDF_GLYPH_SIZE } from './Label'

/** Collects every character that can appear in 3D labels (content texts, fixed labels, the name). */
function characterSet(content: unknown, name: string) {
  const chars = new Set<string>()
  const add = (text: string) => {
    for (const ch of text) chars.add(ch)
  }
  for (let code = 32; code < 127; code++) chars.add(String.fromCharCode(code))
  add('·–—’‘“”…')
  add(name)
  const walk = (value: unknown) => {
    if (typeof value === 'string') add(value)
    else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  walk(content)
  return [...chars].filter(isCovered).join('')
}

/**
 * Generates the letter shapes for all 3D labels once, at startup. Otherwise the shared glyph atlas grows
 * whenever a label with new letters first appears – which re-lays out every label and causes a stutter.
 */
export function GlyphPreloader() {
  const content = useContent()
  useEffect(() => {
    const characters = characterSet(content, useStore.getState().name)
    // Only the weights used by 3D labels (semibold is the default, bold for titles).
    for (const font of [fonts.semibold, fonts.bold]) preloadFont({ font, characters, sdfGlyphSize: SDF_GLYPH_SIZE }, () => {})
  }, [content])
  return null
}
