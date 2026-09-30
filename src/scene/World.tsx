import { Environment, Grid, Lightformer } from '@react-three/drei'
import { useLayoutEffect, useRef } from 'react'
import type { DirectionalLight, Object3D } from 'three'
import { useStore } from '../state/store'
import { stationPosition } from './layout'

export const BACKGROUND = '#eef1f5'

/** Studio lighting (generated in code – no downloads), ground, grid and a shadow light that follows the camera. */
export function World({ shadows, shadowMapSize }: { shadows: boolean; shadowMapSize: number }) {
  const current = useStore((s) => s.current)
  const light = useRef<DirectionalLight>(null)
  const target = useRef<Object3D>(null)
  const [x, , z] = stationPosition(current)

  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current
  }, [])

  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      {/* Near/far are adjusted every frame to the camera distance (see CameraRig). */}
      <fog attach="fog" args={[BACKGROUND, 60, 140]} />
      <hemisphereLight args={['#ffffff', '#cfd6de', 0.42]} />
      <object3D ref={target} position={[x, 0, z]} />
      <directionalLight
        ref={light}
        position={[x + 9, 16, z + 9]}
        intensity={2.6}
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-11, 11, 11, -11, 1, 60]} />
      </directionalLight>
      <Environment resolution={512} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[0, 6, -8]} scale={[14, 5, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-8, 3, 2]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[8, 3, 2]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="circle" intensity={3} position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={6} />
        <Lightformer form="rect" intensity={0.8} color="#ffd9d2" position={[0, 2, 9]} rotation-y={Math.PI} scale={[12, 3, 1]} />
      </Environment>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.4} receiveShadow>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#e8ecf1" roughness={0.95} />
      </mesh>
      <Grid
        infiniteGrid
        position-y={-0.39}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#d6dce3"
        sectionSize={6}
        sectionThickness={1}
        sectionColor="#c2cad3"
        fadeDistance={75}
        fadeStrength={1.6}
      />
    </>
  )
}
