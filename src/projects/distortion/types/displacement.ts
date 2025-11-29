import type { DistortionStateBase, PersistentPoint } from './distortion'

export interface DisplacementState extends DistortionStateBase {
  originalImageData: ImageData | null
  displacementImageData: ImageData | null
  persistentPoints: PersistentPoint[]
}
