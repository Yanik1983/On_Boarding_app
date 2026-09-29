let cached: boolean | undefined

/** Checks once whether this browser can create a WebGL2 context (needed for the 3D view). */
export function hasWebGL(): boolean {
  if (cached !== undefined) return cached
  try {
    const canvas = document.createElement('canvas')
    cached = Boolean(canvas.getContext('webgl2'))
  } catch {
    cached = false
  }
  return cached
}
