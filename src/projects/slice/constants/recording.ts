export interface SliceRecordingSettings {
  // E.g. target FPS, mime type, bitrate, etc.
  targetFps?: number
  mimeType?: string
  videoBitsPerSecond?: number
}

export const DEFAULT_SLICE_RECORDING_SETTINGS: SliceRecordingSettings = {}
