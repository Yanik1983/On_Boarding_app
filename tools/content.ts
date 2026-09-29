// Build-time helpers: read the content JSON files from disk, validate them and
// render the editable <script> block that is embedded in the single HTML file.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ContentSchema, formatIssues } from '../src/content/schema.ts'

export const CONTENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content')

function readJson(relative: string): unknown {
  const file = path.join(CONTENT_DIR, relative)
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(`Could not read content file ${relative}: ${(error as Error).message}`, { cause: error })
  }
}

/** Combines meta.json and every station file listed in meta.order into one object. */
export function readRawContent(): { meta: Record<string, unknown>; stations: unknown[] } {
  const { order, ...meta } = readJson('meta.json') as { order: string[] } & Record<string, unknown>
  if (!Array.isArray(order)) throw new Error('meta.json must contain an "order" list of station ids')
  return { meta, stations: order.map((id) => readJson(`stations/${id}.json`)) }
}

/** Returns a list of human-readable problems (empty when the content is valid). */
export function validateRawContent(raw: unknown): string[] {
  const result = ContentSchema.safeParse(raw)
  return result.success ? [] : formatIssues(result.error, raw)
}

const EDITING_GUIDE = `
  ============================================================================
   EDITABLE CONTENT – New Employee Journey
  ============================================================================
   All texts of the app live in the block below, so they can be updated
   without a developer:

   1. Make a copy of this file first (keep the original as a backup).
   2. Open the copy in Notepad (right-click > Open with > Notepad).
   3. Change only the text between double quotes "...".
      Keep the quotes, commas, colons and brackets exactly as they are.
      - For a double quote inside a text write \\" (or use “ ” instead).
      - For a line break inside a text write \\n.
   4. Save and open the file in Edge or Chrome to check the result.
      If something is broken, the app shows which field needs fixing.

   Tip: paste the official text of Our Credo into the field "officialText".
   When a section has been reviewed, change its "status" from "draft" to
   "approved". The DRAFT badge disappears when every section is approved.
  ============================================================================`

/** Renders the editable content block. Only sequences that would end the script tag are escaped. */
export function renderContentBlock(raw: unknown): string {
  const json = JSON.stringify(raw, null, 2).replace(/<\//g, '<\\/').replace(/<!--/g, '\\u003c!--')
  return `<!--${EDITING_GUIDE}\n-->\n<script type="application/json" id="onboarding-content">\n${json}\n</script>`
}
