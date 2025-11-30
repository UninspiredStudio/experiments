import type { ParticleState } from '../types/state'
import { PARTICLE_CONTROL_DEFAULTS } from '../constants/defaults'

export const particleState: ParticleState = {
  particles: [],
  uploadedImages: [],
  currentImageIndex: -1,
  imageCounter: 0,

  mouse: {
    x: null,
    y: null,
    radius: PARTICLE_CONTROL_DEFAULTS.radius,
  },

  actualMouse: {
    x: null,
    y: null,
  },

  particleDensity: PARTICLE_CONTROL_DEFAULTS.density,
  mouseEffectSpeedFactor: PARTICLE_CONTROL_DEFAULTS.speed,

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

  particleSize: PARTICLE_CONTROL_DEFAULTS.particleSize,
  particleShape: PARTICLE_CONTROL_DEFAULTS.shape,
  particleCharacter: PARTICLE_CONTROL_DEFAULTS.characters,
  particleFont: PARTICLE_CONTROL_DEFAULTS.font,
  interactionMode: PARTICLE_CONTROL_DEFAULTS.interaction,
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

  particleState.particleDensity = PARTICLE_CONTROL_DEFAULTS.density
  particleState.mouse.radius = PARTICLE_CONTROL_DEFAULTS.radius
  particleState.mouseEffectSpeedFactor = PARTICLE_CONTROL_DEFAULTS.speed
  particleState.particleSize = PARTICLE_CONTROL_DEFAULTS.particleSize
  particleState.particleShape = PARTICLE_CONTROL_DEFAULTS.shape
  particleState.particleCharacter = PARTICLE_CONTROL_DEFAULTS.characters
  particleState.particleFont = PARTICLE_CONTROL_DEFAULTS.font
  particleState.interactionMode = PARTICLE_CONTROL_DEFAULTS.interaction
}
