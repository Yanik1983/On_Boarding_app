import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/** Post-processing: anti-aliasing, subtle glow and neutral tone mapping. */
export function Effects({ full }: { full: boolean }) {
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
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.55} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.32} darkness={0.32} />
    </EffectComposer>
  )
}
