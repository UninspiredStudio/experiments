import type { SliceRecordingState } from './types'

export function createInitialRecordingState(): SliceRecordingState {
  return {
    isRecording: false,
    mode: 'optimized',
  }
}
