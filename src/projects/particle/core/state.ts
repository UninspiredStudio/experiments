import type { ParticleState } from '../types/state'

// Legacy defaults from the original particle script / HTML
const DEFAULT_PARTICLE_DENSITY = 12
const DEFAULT_MOUSE_RADIUS = 300
const DEFAULT_MOUSE_EFFECT_SPEED = 10
const DEFAULT_PARTICLE_SIZE = 6.4
const DEFAULT_PARTICLE_CHARACTER = '?'
const DEFAULT_PARTICLE_FONT = 'Arial'

export const particleState: ParticleState = {
  particles: [],
  uploadedImages: [],
  currentImageIndex: -1,
  imageCounter: 0,

  mouse: {
    x: null,
    y: null,
    radius: DEFAULT_MOUSE_RADIUS,
  },

  actualMouse: {
    x: null,
    y: null,
  },

  particleDensity: DEFAULT_PARTICLE_DENSITY,
  mouseEffectSpeedFactor: DEFAULT_MOUSE_EFFECT_SPEED,

  ctx: null,
  isResizing: false,
  resizeTimeout: null,

  isCountingDown: false,
  isRecording: false,
  isReplaying: false,
  hasRecordedPath: false,
  recordedPath: [],
  normalizedPath: [],
  originalRecordingDuration: 0,
  totalReplayPathLength: 0,
  calculatedReplaySpeed: 0,
  replayProgress: 0,
  showReplayPath: true,
  countdownValue: 3,
  countdownIntervalId: null,
  countdownType: null,
  trackingTimeoutId: null,

  isRecordingAnimation: false,
  recordedFrames: [],
  animationRecordingDuration: 0,
  animationRecordingStartTime: 0,
  animationRecordingTimeoutId: null,
  hasRecordedAnimation: false,
  isProcessingRecording: false,

  particleSize: DEFAULT_PARTICLE_SIZE,
  particleShape: 'character',
  particleCharacter: DEFAULT_PARTICLE_CHARACTER,
  particleFont: DEFAULT_PARTICLE_FONT,
  interactionMode: 'repel',
  lastTimestamp: 0,

  isRecordingVideo: false,
  mediaRecorder: null,
  recordedVideoChunks: [],
  videoRecordingDuration: 0,
  videoRecordingStartTime: 0,
  videoRecordingTimeoutId: null,
  hasRecordedVideo: false,
  recordedVideoBlob: null,

  recordingSetup: null,
  recordingCanvas: null,
  isOptimizedRecording: false,

  exportBackgroundColor: '#00ff00',
  useTransparentBackground: false,

  particleAlphaThreshold: 100,
  particleColorThreshold: 5,
}

export function resetParticleState(): void {
  particleState.particles = []
  particleState.uploadedImages = []
  particleState.currentImageIndex = -1
  particleState.imageCounter = 0

  particleState.mouse.x = null
  particleState.mouse.y = null

  particleState.actualMouse.x = null
  particleState.actualMouse.y = null

  particleState.isCountingDown = false
  particleState.isRecording = false
  particleState.isReplaying = false
  particleState.hasRecordedPath = false
  particleState.recordedPath = []
  particleState.normalizedPath = []
  particleState.originalRecordingDuration = 0
  particleState.totalReplayPathLength = 0
  particleState.calculatedReplaySpeed = 0
  particleState.replayProgress = 0

  particleState.countdownValue = 3
  particleState.countdownIntervalId = null
  particleState.countdownType = null
  particleState.trackingTimeoutId = null

  particleState.isRecordingAnimation = false
  particleState.recordedFrames = []
  particleState.animationRecordingDuration = 0
  particleState.animationRecordingStartTime = 0
  particleState.animationRecordingTimeoutId = null
  particleState.hasRecordedAnimation = false
  particleState.isProcessingRecording = false

  particleState.isRecordingVideo = false
  particleState.mediaRecorder = null
  particleState.recordedVideoChunks = []
  particleState.videoRecordingDuration = 0
  particleState.videoRecordingStartTime = 0
  particleState.videoRecordingTimeoutId = null
  particleState.hasRecordedVideo = false
  particleState.recordedVideoBlob = null

  particleState.recordingSetup = null
  particleState.recordingCanvas = null
  particleState.isOptimizedRecording = false

  particleState.lastTimestamp = 0
}
