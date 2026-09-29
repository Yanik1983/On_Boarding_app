import { Billboard, Text } from '@react-three/drei'
import type { ComponentProps } from 'react'
import { fonts } from './fonts'

type TextProps = ComponentProps<typeof Text>

/** SDF text with the bundled font – sharp at any resolution. */
export function Label({ weight = 'semibold', ...props }: TextProps & { weight?: keyof typeof fonts }) {
  return <Text font={fonts[weight]} anchorX="center" anchorY="middle" color="#1b1f24" {...props} />
}

/** Text that always faces the camera. */
export function BillboardLabel({ position, ...props }: TextProps & { weight?: keyof typeof fonts }) {
  return (
    <Billboard position={position}>
      <Label {...props} />
    </Billboard>
  )
}
