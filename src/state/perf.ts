import { create } from 'zustand'

/** The graphics level actually in use (Auto resolves to Smooth or Balanced after a quick check). */
export type Tier = 'smooth' | 'balanced' | 'ultra'

interface PerfState {
  tier: Tier | null
  fps: number | null
  /** Graphics chip as reported by the browser, e.g. "Intel(R) Iris(R) Xe Graphics". */
  renderer: string
  /** True when the browser draws 3D without graphics acceleration (software rendering). */
  software: boolean
  noticeDismissed: boolean
  set: (patch: Partial<Omit<PerfState, 'set'>>) => void
}

/** Live performance information, kept separate from the saved app state (it changes every second). */
export const usePerf = create<PerfState>()((set) => ({
  tier: null,
  fps: null,
  renderer: '',
  software: false,
  noticeDismissed: false,
  set: (patch) => set(patch),
}))

const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i

export function describeRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  const raw = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
  // "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 ...)" -> "Intel(R) Iris(R) Xe Graphics"
  const match = raw.match(/ANGLE \([^,]*,\s*([^,(]+?)(?:\s+Direct3D|\s+OpenGL|\s+\(|,|\))/)
  return { name: (match?.[1] ?? raw).trim(), software: SOFTWARE_RENDERERS.test(raw) }
}
