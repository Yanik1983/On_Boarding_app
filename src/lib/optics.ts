// Simplified paraxial optics for the vision demo. Units are scene units; the
// numbers are chosen so that a typical myopic eye needs about -4 D of correction.
import type { EyeCondition } from '../state/store'

export const OPTICS = {
  rayStartX: -6,
  correctorX: -1.6,
  eyeLensX: 0.8,
  retinaX: 3.55,
  dioptreScale: 0.029,
}

const eyePower: Record<EyeCondition, number> = {
  normal: 1 / (OPTICS.retinaX - OPTICS.eyeLensX),
  myopia: 1 / 2.2,
  hyperopia: 0.3,
}

export interface Ray {
  points: [number, number][]
}

export interface OpticsResult {
  rays: Ray[]
  /** Where the rays cross the axis, or null when they don't converge in view. */
  focusX: number | null
  state: 'sharp' | 'front' | 'behind'
}

export function computeOptics(eye: EyeCondition, dioptres: number, heights = [-0.6, -0.3, 0.3, 0.6]): OpticsResult {
  const corrector = dioptres * OPTICS.dioptreScale
  const pe = eyePower[eye]
  const gap = OPTICS.eyeLensX - OPTICS.correctorX
  const eyeDepth = OPTICS.retinaX - OPTICS.eyeLensX

  const rays = heights.map((h) => {
    const s1 = -h * corrector
    const h2 = h + s1 * gap
    const s2 = s1 - h2 * pe
    const hRetina = h2 + s2 * eyeDepth
    return {
      points: [
        [OPTICS.rayStartX, h],
        [OPTICS.correctorX, h],
        [OPTICS.eyeLensX, h2],
        [OPTICS.retinaX, hRetina],
      ] as [number, number][],
    }
  })

  // Image distance via vergence (same for every paraxial ray).
  const v1 = corrector
  const v2 = v1 / (1 - gap * v1)
  const v3 = v2 + pe
  const focusX = v3 > 1e-6 ? OPTICS.eyeLensX + 1 / v3 : null
  const error = focusX === null ? Infinity : focusX - OPTICS.retinaX
  const state = Math.abs(error) < 0.06 ? 'sharp' : error < 0 ? 'front' : 'behind'
  return { rays, focusX: focusX !== null && focusX < 8 ? focusX : null, state }
}
