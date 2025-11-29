import type { DistortionStateBase } from '../types'

export function createInitialDistortionState(): DistortionStateBase {
  return {
    canvas: null,
    context: null,
  }
}
