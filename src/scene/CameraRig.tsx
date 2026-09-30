import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Fog, PerspectiveCamera } from 'three'
import { useReducedMotion } from '../lib/motion'
import { useStore } from '../state/store'
import { focusView, stationView } from './layout'

/** Flies the camera between stations and to close-ups; lets the user orbit around the current view. */
export function CameraRig() {
  const controls = useRef<CameraControls>(null)
  const current = useStore((s) => s.current)
  const focus = useStore((s) => s.focus)
  const reduced = useReducedMotion()
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const firstMove = useRef(true)
  const offset = useRef({ value: 0, applied: NaN, width: 0, height: 0 })

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const setState = (value: string) => () => (document.body.dataset.camera = value)
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
    const view = focus ? focusView(current, focus, width, height) : stationView(current, width, height)
    const animate = !reduced && !firstMove.current
    firstMove.current = false
    c.smoothTime = focus ? 0.45 : 0.8
    document.body.dataset.camera = animate ? 'moving' : 'rest'
    void c.setLookAt(...view.position, ...view.target, animate)
  }, [current, focus, width, height, reduced])

  // On phones the text sheet covers the lower part of the screen: shift the rendered image up so
  // the scene is centred in the visible area between the top bar and the sheet.
  useFrame(({ camera, size, scene }, delta) => {
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
