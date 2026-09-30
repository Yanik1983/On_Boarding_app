import { Billboard, Text } from '@react-three/drei'
import type { ComponentProps } from 'react'
import { fonts } from './fonts'

type TextProps = ComponentProps<typeof Text>

/** SDF text with the bundled font – sharp at any resolution. */
export function Label({ weight = 'semibold', ...props }: TextProps & { weight?: keyof typeof fonts }) {
  return <Text font={fonts[weight]} sdfGlyphSize={128} anchorX="center" anchorY="middle" color="#14171b" {...props} />
}

/** Text that always faces the camera. */
export function BillboardLabel({ position, ...props }: TextProps & { weight?: keyof typeof fonts }) {
  return (
    <Billboard position={position}>
      <Label outlineWidth="7%" outlineColor="#ffffff" outlineOpacity={0.85} {...props} />
    </Billboard>
  )
}
