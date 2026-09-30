import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import type { Tier } from '../state/perf'

/**
 * Post-processing for the Balanced and Ultra tiers (Smooth renders directly, without this chain).
 * Balanced uses light single-pass anti-aliasing (SMAA) instead of multisampling, which is much cheaper on
 * laptop graphics; its ambient occlusion runs at half resolution.
 */
export function Effects({ tier }: { tier: Exclude<Tier, 'smooth'> }) {
  if (tier === 'balanced') {
    return (
      <EffectComposer multisampling={0}>
        <N8AO aoRadius={1.1} distanceFalloff={0.6} intensity={2.4} quality="performance" halfRes />
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.45} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette offset={0.35} darkness={0.22} />
        <SMAA />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={1.1} distanceFalloff={0.6} intensity={2.4} quality="high" />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.45} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.35} darkness={0.22} />
    </EffectComposer>
  )
}
