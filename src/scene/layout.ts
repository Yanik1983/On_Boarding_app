import type { Focus, Vec3 } from '../state/store'

export const STATION_SPACING = 40

export function stationPosition(index: number): Vec3 {
  return [index * STATION_SPACING, 0, Math.sin(index * 1.3) * 8]
}

export interface View {
  position: Vec3
  target: Vec3
}

/** Default camera for a station. The target is shifted right so the scene sits beside the text panel. */
export function stationView(index: number, aspect: number): View {
  const [x, , z] = stationPosition(index)
  if (aspect < 0.9) return { position: [x, 9, z + 22], target: [x, 3.6, z] }
  return { position: [x + 1.5, 5.8, z + 16.5], target: [x + 3.4, 2.5, z] }
}

export function focusView(index: number, focus: Focus): View {
  const [x, , z] = stationPosition(index)
  return {
    position: [x + focus.position[0], focus.position[1], z + focus.position[2]],
    target: [x + focus.target[0], focus.target[1], z + focus.target[2]],
  }
}

/** A close-up on a point inside the station, leaving room for the panel on the right. */
export function focusOn(point: Vec3, distance = 6.5, lift = 1.6): Focus {
  const [x, y, z] = point
  const side = distance * 0.2
  return { position: [x + side * 0.4, y + lift, z + distance], target: [x + side, y, z] }
}
