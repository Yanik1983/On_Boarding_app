// Shape of the editable content. Used at build time (fails the build on bad
// content), at runtime (shows a helpful error screen) and in unit tests.
import { z } from 'zod'

const text = z.string().trim().min(1, 'must not be empty')
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a colour like #d51900')
const id = z.string().regex(/^[a-z0-9-]+$/, 'use lowercase letters, numbers and dashes only')

const Source = z.object({ label: text, url: z.string().optional() })

const Card = z.object({
  title: text,
  body: z.string().default(''),
  bullets: z.array(text).optional(),
})

const Question = z
  .object({
    question: text,
    options: z.array(text).min(2, 'needs at least two options'),
    answer: z.number().int().min(0),
    explanation: z.string().optional(),
  })
  .refine((q) => q.answer < q.options.length, {
    message: '"answer" must be the position of an option (the first option is 0)',
    path: ['answer'],
  })

const base = {
  id,
  title: text,
  subtitle: z.string().default(''),
  color,
  minutes: z.number().positive(),
  status: z.enum(['draft', 'approved']),
  sources: z.array(Source).default([]),
  cards: z.array(Card).min(1, 'needs at least one card'),
  checkpoint: Question.optional(),
}

const Welcome = z.object({
  ...base,
  kind: z.literal('welcome'),
  greeting: text,
  howTo: z.array(text).default([]),
})

const Company = z.object({
  ...base,
  kind: z.literal('company'),
  milestones: z.array(z.object({ year: text, title: text, text })).min(1),
})

const Credo = z.object({
  ...base,
  kind: z.literal('credo'),
  officialText: z.string().default(''),
  responsibilities: z
    .array(z.object({ id, title: text, summary: text, inPractice: z.array(text).default([]) }))
    .length(4, 'Our Credo has exactly four responsibilities'),
})

const iconKinds = z.enum(['heart', 'instrument', 'lens', 'joint'])

const Divisions = z.object({
  ...base,
  kind: z.literal('divisions'),
  hubLabel: text,
  units: z
    .array(
      z.object({
        id,
        name: text,
        color,
        icon: iconKinds,
        tagline: text,
        description: text,
        focusAreas: z.array(text).default([]),
        note: z.string().optional(),
      }),
    )
    .min(1)
    .max(6),
})

const Organization = z.object({
  ...base,
  kind: z.literal('organization'),
  hubLabel: text,
  operatingModel: text,
  functions: z
    .array(
      z.object({
        id,
        name: text,
        lane: z.enum(['core', 'support']),
        role: text,
        teams: z.array(text).default([]),
        workWith: z.string().default(''),
      }),
    )
    .min(2),
  flow: z.array(id).min(2),
  flowEndLabel: text,
})

export const demoIds = ['optics', 'heart', 'knee', 'lifecycle'] as const

const Technology = z.object({
  ...base,
  kind: z.literal('technology'),
  demos: z
    .array(z.object({ id: z.enum(demoIds), title: text, text, points: z.array(text).default([]) }))
    .min(1),
  lifecycle: z.array(z.object({ id, title: text, text })).min(2).max(8),
})

export const productModels = [
  'mapping-system',
  'ablation-catheter',
  'heart-pump',
  'ivl-catheter',
  'stapler',
  'energy-device',
  'suture',
  'robot',
  'contact-lens',
  'iol',
  'knee-implant',
] as const

const Products = z.object({
  ...base,
  kind: z.literal('products'),
  disclaimer: z.string().default(''),
  products: z
    .array(
      z.object({
        id,
        name: text,
        unit: id,
        model: z.enum(productModels),
        what: text,
        who: text,
        technology: text,
      }),
    )
    .min(1)
    .max(14),
})

const Site = z.object({
  ...base,
  kind: z.literal('site'),
  siteName: text,
  location: text,
  role: text,
  buildings: z
    .array(
      z.object({
        id,
        name: text,
        x: z.number().min(-5).max(5),
        z: z.number().min(-3.5).max(3.5),
        width: z.number().positive().max(6),
        depth: z.number().positive().max(5),
        height: z.number().positive().max(3),
        color,
      }),
    )
    .default([]),
  hotspots: z
    .array(
      z.object({
        id,
        name: text,
        x: z.number().min(-5).max(5),
        z: z.number().min(-3.5).max(3.5),
        text,
      }),
    )
    .default([]),
  safety: z.array(text).default([]),
  contacts: z.array(z.object({ role: text, name: text, contact: z.string().default('') })).default([]),
  checklist: z.array(z.object({ id, text })).default([]),
})

const Finish = z.object({
  ...base,
  kind: z.literal('finish'),
  passMark: z.number().min(0).max(1),
  questions: z.array(Question).min(1),
  nextSteps: z.array(text).default([]),
  certificateTitle: text,
  certificateText: text,
})

export const StationSchema = z.discriminatedUnion('kind', [
  Welcome,
  Company,
  Credo,
  Divisions,
  Organization,
  Technology,
  Products,
  Site,
  Finish,
])

const Meta = z.object({
  appTitle: text,
  organizationLabel: text,
  version: text,
  releaseDate: text,
  allowFreeOrder: z.boolean().default(false),
})

export const ContentSchema = z
  .object({ meta: Meta, stations: z.array(StationSchema).min(1) })
  .superRefine((content, ctx) => {
    const seenIds = new Set<string>()
    const seenKinds = new Set<string>()
    content.stations.forEach((station, index) => {
      if (seenIds.has(station.id)) {
        ctx.addIssue({ code: 'custom', message: `station id "${station.id}" is used twice`, path: ['stations', index, 'id'] })
      }
      if (seenKinds.has(station.kind)) {
        ctx.addIssue({ code: 'custom', message: `only one "${station.kind}" station is allowed`, path: ['stations', index, 'kind'] })
      }
      seenIds.add(station.id)
      seenKinds.add(station.kind)
    })

    const divisions = content.stations.find((s) => s.kind === 'divisions')
    const unitIds = new Set(divisions?.units.map((u) => u.id) ?? [])
    content.stations.forEach((station, index) => {
      if (station.kind === 'products') {
        station.products.forEach((product, p) => {
          if (!unitIds.has(product.unit)) {
            ctx.addIssue({
              code: 'custom',
              message: `product "${product.name}" refers to unknown business unit "${product.unit}"`,
              path: ['stations', index, 'products', p, 'unit'],
            })
          }
        })
      }
      if (station.kind === 'organization') {
        const functionIds = new Set(station.functions.map((f) => f.id))
        station.flow.forEach((step, f) => {
          if (!functionIds.has(step)) {
            ctx.addIssue({ code: 'custom', message: `flow step "${step}" is not a function id`, path: ['stations', index, 'flow', f] })
          }
        })
      }
    })
  })

export type Content = z.infer<typeof ContentSchema>
export type Station = z.infer<typeof StationSchema>
export type StationKind = Station['kind']
export type StationOf<K extends StationKind> = Extract<Station, { kind: K }>
export type QuestionT = z.infer<typeof Question>
export type ProductModel = (typeof productModels)[number]
export type DemoId = (typeof demoIds)[number]

/** Turns zod issues into readable lines, naming the station instead of its array index. */
export function formatIssues(error: z.ZodError, raw: unknown): string[] {
  const stations = (raw as { stations?: { id?: string }[] } | null)?.stations
  return error.issues.map((issue) => {
    const parts = issue.path.map((part, i) => {
      if (issue.path[i - 1] === 'stations' && typeof part === 'number') {
        const stationId = stations?.[part]?.id
        return stationId ? `station "${stationId}"` : `station #${part + 1}`
      }
      return typeof part === 'number' ? `#${part + 1}` : String(part)
    })
    return `${parts.filter((p) => p !== 'stations').join(' › ') || 'content'}: ${issue.message}`
  })
}
