export interface RecordingOptions {
  fps?: number
  durationMs: number
}

export interface RecordingHandle {
  stop: () => void
}
