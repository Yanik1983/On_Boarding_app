import { useThree } from '@react-three/fiber'
import type { ReactNode } from 'react'
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

/** Shared exhibit platform: satin disc, glowing rim and a 3D title. */
export function Station({ info, number, title, color, children }: Props) {
  // On phones the text panel already shows the title, and there is no room for it above the scene.
  const showTitle = useThree((s) => !isSheetLayout(s.size.width, s.size.height))
  return (
    <StationContext.Provider value={info}>
      <group position={stationPosition(info.index)} visible={info.visible}>
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <cylinderGeometry args={[7.5, 7.8, 0.4, 96]} />
          <meshStandardMaterial color="#fbfbfc" roughness={0.38} metalness={0.05} />
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
