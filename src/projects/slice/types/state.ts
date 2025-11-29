export interface SliceState {
  // Aggregated runtime state for the slice experiment.
  // Will be derived from the legacy script's state variables.
  loadedImage1: HTMLImageElement | null
  loadedImage2: HTMLImageElement | null
  imageAspectRatio1: number
  imageAspectRatio2: number
  hScrollSpeed1: number
  hScrollSpeed2: number
  scrollXOffset1: number
  scrollXOffset2: number
  scrollSpeed1: number
  scrollSpeed2: number
  scrollYOffset1: number
  scrollYOffset2: number
  sliceGapBase: number
  gapVariability: number
  lineGapBase: number
  lineGapVariability: number
  maxRotation: number
  tornEdgeMode: boolean
  jaggednessAmplitude: number
  jaggednessFrequency: number
  vDisplacementMax: number
  targetFps: number
  lineProbability: number
  blockProbability: number
  displacementMax: number
  maxBlockHeight: number
  maxLineWidth: number
  minBlockHeight: number
  mediaRecorder: MediaRecorder | null
  recordedChunks: Blob[]
  isRecording: boolean
  canvasStream: MediaStream | null
  recordingSetup: unknown
  recordingCanvas: HTMLCanvasElement | null
  isOptimizedRecording: boolean
  exportBackgroundColor: string
  useTransparentBackground: boolean
  freezeSlicesMode: boolean
  frozenHorizontalSlices: unknown[]
  frozenVerticalSlices: unknown[]
  fpsInterval: number
  lastTimestamp: number
  timeSinceLastDraw: number
  animationFrameId: number | null
  canvasWidth: number
  canvasHeight: number
  drawWidth: number
  drawHeight: number
  drawX: number
  drawY: number
}
