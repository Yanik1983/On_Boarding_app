import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/motion'
import { useStore } from '../state/store'
import { focusView, stationView } from './layout'

/** Flies the camera between stations and to close-ups; lets the user orbit around the current view. */
export function CameraRig() {
  const controls = useRef<CameraControls>(null)
  const current = useStore((s) => s.current)
  const focus = useStore((s) => s.focus)
  const reduced = useReducedMotion()
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height))
  const firstMove = useRef(true)

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
    const view = focus ? focusView(current, focus) : stationView(current, aspect)
    const animate = !reduced && !firstMove.current
    firstMove.current = false
    c.smoothTime = focus ? 0.45 : 0.8
    document.body.dataset.camera = animate ? 'moving' : 'rest'
    void c.setLookAt(...view.position, ...view.target, animate)
  }, [current, focus, aspect, reduced])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={3}
      maxDistance={34}
      minPolarAngle={0.3}
      maxPolarAngle={1.47}
      truckSpeed={0}
      dollySpeed={0.5}
      draggingSmoothTime={0.12}
    />
  )
}
