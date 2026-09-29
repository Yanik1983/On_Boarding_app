import { ContentSchema, formatIssues, type Content } from './schema'

export type LoadResult = { ok: true; content: Content } | { ok: false; problems: string[] }

/** Reads the editable content block embedded in the HTML file and validates it. */
export function loadContent(doc: Document = document): LoadResult {
  const element = doc.getElementById('onboarding-content')
  if (!element?.textContent) {
    return { ok: false, problems: ['The content block (id "onboarding-content") is missing from this file.'] }
  }
  let raw: unknown
  try {
    raw = JSON.parse(element.textContent)
  } catch (error) {
    return {
      ok: false,
      problems: [
        `The content block is not valid JSON: ${(error as Error).message}`,
        'Check for a missing comma, quote or bracket near the place you last edited.',
      ],
    }
  }
  const result = ContentSchema.safeParse(raw)
  return result.success ? { ok: true, content: result.data } : { ok: false, problems: formatIssues(result.error, raw) }
}

export function isDraft(content: Content): boolean {
  return content.stations.some((station) => station.status === 'draft')
}
