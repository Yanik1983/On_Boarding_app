// Pure layout functions shared by the 3D scene and the panel (no three.js imports).
import type { Vec3 } from '../state/store'

export function podPosition(index: number, count: number): Vec3 {
  const angle = Math.PI * 0.12 + (index / count) * Math.PI * 2
  return [Math.cos(angle) * 4.4, 1.6, Math.sin(angle) * 3.6]
}

export function pedestalPosition(i: number, count: number): Vec3 {
  if (count === 1) return [0, 0, 0]
  const step = count <= 4 ? 0.62 : count <= 6 ? 0.5 : 0.36
  const spread = Math.min(Math.PI * 1.05, step * (count - 1))
  const angle = -Math.PI / 2 - spread / 2 + (i / (count - 1)) * spread
  const radius = count > 6 ? 5.4 : 4.4
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.75 + 1.2]
}

/** Bigger pedestals when fewer products are shown. */
export const pedestalScale = (count: number) => (count <= 4 ? 1.45 : count <= 6 ? 1.2 : 0.95)

/** Products filter: unset means the first business unit, 'all' shows everything. */
export function resolveProductFilter(value: string | null, firstUnit: string | undefined): string | null {
  if (value === 'all') return null
  return value ?? firstUnit ?? null
}

export const podFocusPoint = (p: Vec3): Vec3 => [p[0], 1.9, p[2]]
export const pedestalFocusPoint = (p: Vec3, scale = 1): Vec3 => [p[0], 1.55 * scale, p[2]]
export const PRODUCT_FILTER_KEY = 'products:filter'
