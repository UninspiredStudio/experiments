import type { DistortionStateBase, PersistentPoint } from './distortion'

export interface ShiftState extends DistortionStateBase {
  originalImageData: ImageData | null
  persistentPoints: PersistentPoint[]
}
