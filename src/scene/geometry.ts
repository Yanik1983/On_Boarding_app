import { Quaternion, Shape, Vector3 } from 'three'
import type { Vec3 } from '../state/store'

const up = new Vector3(0, 1, 0)

/** Position, rotation and length for a cylinder spanning two points. */
export function segment(a: Vec3, b: Vec3) {
  const start = new Vector3(...a)
  const end = new Vector3(...b)
  const direction = end.clone().sub(start)
  const length = direction.length()
  const quaternion = new Quaternion().setFromUnitVectors(up, direction.normalize())
  const mid = start.add(end).multiplyScalar(0.5)
  return { position: mid.toArray() as Vec3, quaternion, length }
}

/** Classic heart outline, roughly 1 unit tall, centred at the origin. */
export function heartShape(): Shape {
  const s = new Shape()
  s.moveTo(0, -0.5)
  s.bezierCurveTo(-0.08, -0.4, -0.55, -0.12, -0.55, 0.16)
  s.bezierCurveTo(-0.55, 0.4, -0.36, 0.52, -0.2, 0.52)
  s.bezierCurveTo(-0.08, 0.52, 0, 0.42, 0, 0.32)
  s.bezierCurveTo(0, 0.42, 0.08, 0.52, 0.2, 0.52)
  s.bezierCurveTo(0.36, 0.52, 0.55, 0.4, 0.55, 0.16)
  s.bezierCurveTo(0.55, -0.12, 0.08, -0.4, 0, -0.5)
  return s
}

/** Deterministic pseudo-random numbers so decorations look the same on every load. */
export function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t * 16807) % 2147483647
    return (t - 1) / 2147483646
  }
}
