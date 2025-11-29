import type { Particle, ParticleDefinition } from './particle'

export type InteractionMode = 'repel' | 'attract'
export type ParticleShape = 'circle' | 'square' | 'character'

export interface ParticleMouse {
  x: number | null
  y: number | null
  radius: number
}

export interface PathPoint {
  x: number
  y: number
  timestamp: number
}

export interface UploadedImageData {
  img: HTMLImageElement
  name: string
  particleDefinitions: ParticleDefinition[] | null
}

export interface RecordingSetup {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  width: number
  height: number
}

export interface SelectedCodecInfo {
  description?: string
}

export interface MediaRecorderWithCodec extends MediaRecorder {
  selectedCodec?: SelectedCodecInfo
}

export interface ParticleState {
  // Core particle data
  particles: Particle[]
  uploadedImages: UploadedImageData[]
  currentImageIndex: number
  imageCounter: number

  // Mouse / interaction
  mouse: ParticleMouse
  actualMouse: Omit<ParticleMouse, 'radius'>
  particleDensity: number
  mouseEffectSpeedFactor: number

  // Canvas / context
  ctx: CanvasRenderingContext2D | null
  isResizing: boolean
  resizeTimeout: number | null

  // Countdown & path recording
  isCountingDown: boolean
  isRecording: boolean
  isReplaying: boolean
  hasRecordedPath: boolean
  recordedPath: PathPoint[]
  normalizedPath: PathPoint[]
  originalRecordingDuration: number
  totalReplayPathLength: number
  calculatedReplaySpeed: number
  replayProgress: number
  showReplayPath: boolean
  countdownValue: number
  countdownIntervalId: number | null
  countdownType: 'path' | 'video' | null
  trackingTimeoutId: number | null

  // Animation recording (frames → ZIP)
  isRecordingAnimation: boolean
  recordedFrames: Blob[]
  animationRecordingDuration: number
  animationRecordingStartTime: number
  animationRecordingTimeoutId: number | null
  hasRecordedAnimation: boolean
  isProcessingRecording: boolean

  // Particle appearance
  particleSize: number
  particleShape: ParticleShape
  particleCharacter: string
  particleFont: string
  interactionMode: InteractionMode
  lastTimestamp: number

  // Video recording
  isRecordingVideo: boolean
  mediaRecorder: MediaRecorderWithCodec | null
  recordedVideoChunks: Blob[]
  videoRecordingDuration: number
  videoRecordingStartTime: number
  videoRecordingTimeoutId: number | null
  hasRecordedVideo: boolean
  recordedVideoBlob: Blob | null

  // Optimized recording crop state
  recordingSetup: RecordingSetup | null
  recordingCanvas: HTMLCanvasElement | null
  isOptimizedRecording: boolean

  // Export / background settings
  exportBackgroundColor: string
  useTransparentBackground: boolean

  // Thresholds
  particleAlphaThreshold: number
  particleColorThreshold: number
}
