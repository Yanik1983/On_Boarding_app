import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { isHandheld } from '../lib/responsive'
import type { QualityLevel } from './Scene'

/**
 * Post-processing by quality level (see Scene): ambient occlusion (soft contact shading that gives
 * shapes depth), anti-aliasing, a subtle glow on light elements and neutral tone mapping.
 */
export function Effects({ level, ultra }: { level: QualityLevel; ultra: boolean }) {
  if (level >= 2) {
    return (
      <EffectComposer multisampling={0}>
        <SMAA />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    )
  }
  if (level === 1) {
    return (
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.45} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette offset={0.35} darkness={0.22} />
      </EffectComposer>
    )
  }
  const handheld = isHandheld()
  return (
    <EffectComposer multisampling={4}>
      {/* Half-resolution ambient occlusion is visually identical at this strength and far cheaper. */}
      <N8AO aoRadius={1.1} distanceFalloff={0.6} intensity={2.4} quality={ultra ? 'high' : handheld ? 'low' : 'medium'} halfRes={!ultra} />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.45} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.35} darkness={0.22} />
    </EffectComposer>
  )
}
