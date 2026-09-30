import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3, type Fog, type PerspectiveCamera } from 'three'
import { useContent } from '../content/context'
import { useReducedMotion } from '../lib/motion'
import { getSteps } from '../lib/steps'
import { useStore } from '../state/store'
import { focusView, stationPosition, stationView, type View } from './layout'

type V3 = [number, number, number]

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** Rotates a view around the vertical axis through the station centre (keeps the framing, changes the angle). */
function orbit(view: View, center: V3, angle: number): View {
  if (!angle) return view
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const rotate = ([x, y, z]: V3): V3 => {
    const dx = x - center[0]
    const dz = z - center[2]
    return [center[0] + dx * cos + dz * sin, y, center[2] - dx * sin + dz * cos]
  }
  return { position: rotate(view.position), target: rotate(view.target) }
}

interface Flight {
  from: View
  to: View
  start: number
  duration: number
  arc: number
}

/**
 * Camera direction:
 * - between stations: a cinematic, eased flight along a gentle arc (accelerates, glides, settles)
 * - between the pages of a station: a slow orbit to a new viewing angle, so every page feels like a step
 * - close-ups when something is selected, and free orbiting by the user in between
 */
export function CameraRig() {
  const controls = useRef<CameraControls>(null)
  const { stations } = useContent()
  const current = useStore((s) => s.current)
  const focus = useStore((s) => s.focus)
  const station = stations[current]
  const totalSteps = getSteps(station).length
  const step = useStore((s) => Math.min(s.steps[station.id] ?? 0, totalSteps - 1))
  const reduced = useReducedMotion()
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const firstMove = useRef(true)
  const lastStation = useRef(current)
  const flight = useRef<Flight | null>(null)
  const offset = useRef({ value: 0, applied: NaN, width: 0, height: 0 })

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const setState = (value: string) => () => {
      if (!flight.current) document.body.dataset.camera = value
    }
    const moving = setState('moving')
    const rest = setState('rest')
    c.addEventListener('transitionstart', moving)
    c.addEventListener('rest', rest)
    c.addEventListener('sleep', rest)
    return () => {
      c.removeEventListener('transitionstart', moving)
      c.removeEventListener('rest', rest)
      c.removeEventListener('sleep', rest)
    }
  }, [])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    // Each page of a station views the centrepiece from a different angle (sweeping about ±17°).
    const angle = focus || reduced || totalSteps < 2 ? 0 : (step / (totalSteps - 1) - 0.5) * 0.6
    const base = focus ? focusView(current, focus, width, height) : stationView(current, width, height)
    const view = orbit(base, stationPosition(current), angle)
    const animate = !reduced && !firstMove.current
    const stationChanged = lastStation.current !== current
    firstMove.current = false
    lastStation.current = current

    if (stationChanged && animate) {
      const from: View = { position: c.camera.position.toArray() as V3, target: c.getTarget(new Vector3(), false).toArray() as V3 }
      const distance = Math.hypot(...view.position.map((v, i) => v - from.position[i]))
      flight.current = {
        from,
        to: view,
        start: performance.now(),
        duration: Math.min(2800, Math.max(1500, 1300 + distance * 22)),
        arc: Math.min(7, distance * 0.15),
      }
      c.enabled = false
      document.body.dataset.camera = 'moving'
      return
    }
    if (flight.current) {
      flight.current.to = view // destination changed mid-flight (e.g. window resized)
      return
    }
    c.smoothTime = focus ? 0.45 : 0.9
    document.body.dataset.camera = animate ? 'moving' : 'rest'
    void c.setLookAt(...view.position, ...view.target, animate)
  }, [current, focus, step, totalSteps, width, height, reduced])

  // On phones the text sheet covers the lower part of the screen: shift the rendered image up so
  // the scene is centred in the visible area between the top bar and the sheet.
  useFrame(({ camera, size, scene }, delta) => {
    const c = controls.current
    const f = flight.current
    if (c && f) {
      const t = Math.min(1, (performance.now() - f.start) / f.duration)
      const position = lerp3(f.from.position, f.to.position, easeInOutCubic(t))
      position[1] += Math.sin(Math.PI * t) * f.arc
      // The gaze leads the body slightly, like a camera operator looking where they are going.
      const target = lerp3(f.from.target, f.to.target, easeInOutCubic(Math.min(1, t * 1.12)))
      void c.setLookAt(...position, ...target, false)
      if (t >= 1) {
        flight.current = null
        c.enabled = true
        document.body.dataset.camera = 'rest'
      }
    }

    // Fog starts just behind the station being viewed, so it stays crisp even when the camera is far
    // back (phones, close-ups) while neighbouring stations and the horizon fade softly.
    const fog = scene.fog as Fog | null
    const distance = controls.current?.distance
    if (fog && distance) {
      fog.near = distance + 12
      fog.far = distance + 90
    }

    const { top, bottom } = useStore.getState().viewInset
    const target = (bottom - top) / 2
    const o = offset.current
    o.value = reduced ? target : o.value + (target - o.value) * Math.min(1, delta * 6)
    if (Math.abs(o.value - target) < 0.25) o.value = target
    if (o.value === o.applied && size.width === o.width && size.height === o.height) return
    const cam = camera as PerspectiveCamera
    if (Math.abs(o.value) < 0.5) cam.clearViewOffset()
    else cam.setViewOffset(size.width, size.height, 0, o.value, size.width, size.height)
    Object.assign(o, { applied: o.value, width: size.width, height: size.height })
  })

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={3}
      maxDistance={60}
      minPolarAngle={0.3}
      maxPolarAngle={1.47}
      truckSpeed={0}
      dollySpeed={0.5}
      draggingSmoothTime={0.12}
    />
  )
}
