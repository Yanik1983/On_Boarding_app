import { isSheetLayout } from '../lib/responsive'
import type { Focus, Vec3 } from '../state/store'

export const STATION_SPACING = 40

export function stationPosition(index: number): Vec3 {
  return [index * STATION_SPACING, 0, Math.sin(index * 1.3) * 8]
}

export interface View {
  position: Vec3
  target: Vec3
}

const HALF_FOV = Math.tan((40 * Math.PI) / 360)

/** How far back the camera must be so a scene of the given half-width fits a narrow screen. */
const fitDistance = (halfWidth: number, aspect: number) => halfWidth / (HALF_FOV * aspect)

/**
 * Default camera for a station.
 * Wide screens: the target is shifted right so the scene sits beside the text panel.
 * Phones: the camera backs off until the whole platform fits the narrow screen; the scene is
 * moved into the space above the text sheet with a view offset (see CameraRig).
 */
export function stationView(index: number, width: number, height: number): View {
  const [x, , z] = stationPosition(index)
  const aspect = width / Math.max(1, height)
  if (isSheetLayout(width, height)) {
    const distance = Math.min(46, Math.max(20, fitDistance(5.9, aspect)))
    return { position: [x, 3 + distance * 0.34, z + distance * 0.94], target: [x, 3, z] }
  }
  return { position: [x + 1.5, 5.8, z + 16.5], target: [x + 3.4, 2.5, z] }
}

export function focusView(index: number, focus: Focus, width: number, height: number): View {
  const [x, , z] = stationPosition(index)
  if (isSheetLayout(width, height)) {
    // Centre the object and back off so it fits the narrow screen.
    const center = focus.center ?? focus.target
    const aspect = width / Math.max(1, height)
    const offset = focus.position.map((p, i) => p - focus.target[i])
    const length = Math.hypot(...offset)
    const scale = Math.max(1, fitDistance(2.2, aspect) / Math.max(0.001, length))
    return {
      position: [x + center[0] + offset[0] * scale, center[1] + offset[1] * scale, z + center[2] + offset[2] * scale],
      target: [x + center[0], center[1], z + center[2]],
    }
  }
  return {
    position: [x + focus.position[0], focus.position[1], z + focus.position[2]],
    target: [x + focus.target[0], focus.target[1], z + focus.target[2]],
  }
}

/** A close-up on a point inside the station, leaving room for the panel on the right. */
export function focusOn(point: Vec3, distance = 6.5, lift = 1.6): Focus {
  const [x, y, z] = point
  const side = distance * 0.2
  return { position: [x + side * 0.4, y + lift, z + distance], target: [x + side, y, z], center: point }
}
