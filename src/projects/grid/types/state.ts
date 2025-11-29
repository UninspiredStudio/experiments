import type { CellData } from './cell'

export type AnimationAreaMode = 'everywhere' | 'light' | 'dark'

export interface GridState {
  // Time and animation
  time: number
  timeStep: number

  // Grid parameters
  gridAmount: number
  calculatedCellSize: number
  numCellsX: number
  numCellsY: number

  // Noise and fill
  noiseThreshold: number
  isSimplified: boolean

  // Image handling
  cellImages: HTMLImageElement[]
  isCellImageLoading: boolean
  bgImage: HTMLImageElement | null
  bgImageForDrawing: HTMLImageElement | null
  bgPixelData: Uint8ClampedArray | null
  bgPixelDataWidth: number

  // Animation area
  animationAreaMode: AnimationAreaMode
  brightnessThreshold: number

  // Letter cell state
  currentLetters: string
  letterColor: string
  letterBgColor: string

  // Animation sequence state
  isStarting: boolean
  isMainLoopActive: boolean
  isEnding: boolean
  isBackgroundLoopActive: boolean

  // Animation control
  startAnimationEnabled: boolean
  endAnimationEnabled: boolean
  startAnimationDuration: number
  endAnimationDuration: number
  overallDuration: number

  // Timestamps for sequence control
  startAnimationStartTime: number
  mainAnimationStartTime: number
  mainAnimationEndTime: number
  fadeOutStartTime: number

  // requestAnimationFrame IDs
  startAnimationFrameId: number | null
  animationFrameId: number | null
  fadeOutFrameId: number | null
  backgroundFrameId: number | null

  // Fade-out helpers
  initialVisibleCount: number

  // Cell data map
  assignedCellData: Map<string, CellData>

  // Recording state
  mediaRecorder: MediaRecorder | null
  recordedChunks: Blob[]
  isRecording: boolean
  isSequenceRecording: boolean
  mediaStream: MediaStream | null
}
