export type SliceRecordingMode = 'optimized' | 'full-canvas'

export interface SliceRecordingState {
  isRecording: boolean
  mode: SliceRecordingMode
}
