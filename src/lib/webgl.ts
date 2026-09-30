import { describeRenderer } from '../state/perf'

export interface WebGLProbe {
  available: boolean
  renderer: string
  /** 3D is drawn without graphics acceleration (software rendering). */
  software: boolean
}

let cached: WebGLProbe | undefined

/** Checks once, before the 3D view starts, whether WebGL2 works and whether it is hardware accelerated. */
export function probeWebGL(): WebGLProbe {
  if (cached) return cached
  cached = { available: false, renderer: '', software: false }
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (gl) {
      const info = describeRenderer(gl)
      cached = { available: true, renderer: info.name, software: info.software }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    // WebGL unavailable
  }
  return cached
}

export const hasWebGL = () => probeWebGL().available
