import { describe, expect, it } from 'vitest'
import { loadContent } from '../../src/content/load'
import { getSteps } from '../../src/lib/steps'
import { readRawContent, renderContentBlock, validateRawContent } from '../../tools/content'

function fakeDocument(html: string): Document {
  const match = html.match(/<script type="application\/json" id="onboarding-content">\n([\s\S]*)\n<\/script>/)
  return { getElementById: () => (match ? { textContent: match[1] } : null) } as unknown as Document
}

describe('content', () => {
  const raw = readRawContent()

  it('is valid', () => {
    expect(validateRawContent(raw)).toEqual([])
  })

  it('round-trips through the embedded HTML block', () => {
    const result = loadContent(fakeDocument(renderContentBlock(raw)))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.content.stations.map((s) => s.id)).toEqual((raw.stations as { id: string }[]).map((s) => s.id))
  })

  it('escapes sequences that would break out of the script tag', () => {
    const tricky = structuredClone(raw) as { meta: Record<string, unknown> }
    tricky.meta.appTitle = 'Hello </script><script>alert(1)</script> <!-- x'
    const block = renderContentBlock(tricky)
    expect(block.match(/<\/script>/g)).toHaveLength(1)
    const result = loadContent(fakeDocument(block))
    expect(result.ok && result.content.meta.appTitle).toBe('Hello </script><script>alert(1)</script> <!-- x')
  })

  it('every station has content pages and an explore page', () => {
    const result = loadContent(fakeDocument(renderContentBlock(raw)))
    if (!result.ok) throw new Error('invalid')
    for (const station of result.content.stations) {
      const steps = getSteps(station)
      expect(steps.filter((s) => s.type === 'explore')).toHaveLength(1)
      expect(steps[0].type).toBe('card')
    }
  })

  it('explains mistakes in plain language, naming the station', () => {
    const broken = structuredClone(raw) as { stations: Record<string, unknown>[] }
    const products = broken.stations.find((s) => s.id === 'products') as { products: { unit: string }[] }
    products.products[0].unit = 'unknown-unit'
    const finish = broken.stations.find((s) => s.id === 'finish') as { questions: { answer: number }[] }
    finish.questions[0].answer = 9
    const problems = validateRawContent(broken)
    expect(problems.some((p) => p.includes('station "products"') && p.includes('unknown business unit'))).toBe(true)
    expect(problems.some((p) => p.includes('station "finish"') && p.includes('answer'))).toBe(true)
  })

  it('reports invalid JSON', () => {
    const result = loadContent({ getElementById: () => ({ textContent: '{"meta": ' }) } as unknown as Document)
    expect(result.ok).toBe(false)
  })
})
