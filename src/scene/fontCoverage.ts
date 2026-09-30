// Unicode ranges covered by the bundled Inter "latin" font files. 3D text is limited to these characters:
// anything else would make the text library download fallback fonts from the internet (the app must work
// offline and send nothing), so unsupported characters are dropped from 3D labels. The on-screen panels use
// normal browser fonts and show every character.
const RANGES: [number, number][] = [
  [0x0000, 0x00ff],
  [0x0131, 0x0131],
  [0x0152, 0x0153],
  [0x02bb, 0x02bc],
  [0x02c6, 0x02c6],
  [0x02da, 0x02da],
  [0x02dc, 0x02dc],
  [0x0304, 0x0304],
  [0x0308, 0x0308],
  [0x0329, 0x0329],
  [0x2000, 0x206f],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2191, 0x2191],
  [0x2193, 0x2193],
  [0x2212, 0x2212],
  [0x2215, 0x2215],
  [0xfeff, 0xfeff],
  [0xfffd, 0xfffd],
]

export function isCovered(char: string): boolean {
  const code = char.codePointAt(0) ?? 0
  return RANGES.some(([from, to]) => code >= from && code <= to)
}

/** Removes characters the bundled font cannot draw (and tidies the spaces left behind). */
export function coveredText(text: string): string {
  const kept = [...text].filter(isCovered).join('')
  if (kept === text) return text
  return kept
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,!?.])/g, '$1')
    .replace(/,([!?.])/g, '$1')
    .trim()
}
