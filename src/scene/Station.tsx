import { useThree } from '@react-three/fiber'
import { useMemo, type ReactNode } from 'react'
import { LatheGeometry, Vector2 } from 'three'
import { isSheetLayout } from '../lib/responsive'
import { stationPosition } from './layout'
import { Label } from './Label'
import { StationContext, type StationInfo } from './StationContext'

interface Props {
  info: StationInfo
  number: number
  title: string
  color: string
  children: ReactNode
}

/** Platform profile (radius, height) with a rounded, bevelled edge – spun into a disc. */
function platformGeometry() {
  // Listed bottom-to-top so the lathe's faces point outwards (visible from above).
  const profile: [number, number][] = [
    [0, -0.4],
    [7.78, -0.4],
    [7.75, -0.24],
    [7.72, -0.14],
    [7.66, -0.07],
    [7.56, -0.02],
    [7.42, 0],
    [0, 0],
  ]
  return new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r, y)),
    160,
  )
}

/** Shared exhibit platform: satin disc with a bevelled edge, chrome trim, glowing rim and a 3D title. */
export function Station({ info, number, title, color, children }: Props) {
  // On phones the text panel already shows the title, and there is no room for it above the scene.
  const showTitle = useThree((s) => !isSheetLayout(s.size.width, s.size.height))
  const platform = useMemo(platformGeometry, [])
  return (
    <StationContext.Provider value={info}>
      <group position={stationPosition(info.index)} visible={info.visible}>
        <mesh geometry={platform} receiveShadow castShadow>
          <meshPhysicalMaterial color="#fbfbfc" roughness={0.34} clearcoat={0.35} clearcoatRoughness={0.3} />
        </mesh>
        <mesh position={[0, -0.28, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[7.77, 0.03, 12, 192]} />
          <meshPhysicalMaterial color="#d9dee4" metalness={1} roughness={0.18} anisotropy={0.6} />
        </mesh>
        <mesh position={[0, 0.003, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <ringGeometry args={[3.2, 3.23, 128]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} />
        </mesh>
        <mesh position={[0, 0.006, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[7.08, 7.32, 128]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.004, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <ringGeometry args={[6.2, 6.24, 128]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} />
        </mesh>
        <group position={[0, 7.1, -5.6]} visible={showTitle}>
          <Label fontSize={0.34} color={color} letterSpacing={0.18} position={[0, 0.78, 0]}>
            {`STATION ${number}`}
          </Label>
          <Label fontSize={0.95} weight="bold" letterSpacing={-0.01}>
            {title}
          </Label>
        </group>
        {info.visible && children}
      </group>
    </StationContext.Provider>
  )
}
