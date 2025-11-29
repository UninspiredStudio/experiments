import type { DistortionStateBase, PersistentPoint } from './distortion'

export interface FragmentsState extends DistortionStateBase {
  originalImageData: ImageData | null
  persistentPoints: PersistentPoint[]
  isAnimationEnabled: boolean
}
