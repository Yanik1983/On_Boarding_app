import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * Post-processing: ambient occlusion (soft contact shading that gives shapes depth and definition),
 * anti-aliasing, a subtle glow on light elements and neutral tone mapping.
 */
export function Effects({ full, handheld }: { full: boolean; handheld: boolean }) {
  if (!full) {
    return (
      <EffectComposer multisampling={0}>
        <SMAA />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={1.1} distanceFalloff={0.6} intensity={2.4} quality={handheld ? 'low' : 'medium'} halfRes={handheld} />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.45} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.35} darkness={0.22} />
    </EffectComposer>
  )
}
