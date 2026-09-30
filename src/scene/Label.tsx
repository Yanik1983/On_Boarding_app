import { Billboard, Text } from '@react-three/drei'
import type { ComponentProps } from 'react'
import { coveredText } from './fontCoverage'
import { fonts } from './fonts'

type TextProps = ComponentProps<typeof Text>

export const SDF_GLYPH_SIZE = 64

/** SDF text with the bundled font – sharp at any resolution. */
export function Label({ weight = 'semibold', children, ...props }: TextProps & { weight?: keyof typeof fonts }) {
  // Only characters the bundled font covers (see fontCoverage) – never trigger online font downloads.
  const text = typeof children === 'string' ? coveredText(children) : children
  return (
    <Text font={fonts[weight]} sdfGlyphSize={SDF_GLYPH_SIZE} anchorX="center" anchorY="middle" color="#14171b" {...props}>
      {text}
    </Text>
  )
}

/** Text that always faces the camera. */
export function BillboardLabel({ position, ...props }: TextProps & { weight?: keyof typeof fonts }) {
  return (
    <Billboard position={position}>
      <Label outlineWidth="7%" outlineColor="#ffffff" outlineOpacity={0.85} {...props} />
    </Billboard>
  )
}
