import type { Noise3DFn } from '@shared/utils/noise'
import { createNoise3DInstance } from '@shared/utils/noise'

import type { GridState } from '../types'
import { INITIAL_CANVAS_SIZE } from '../constants'

export function createInitialState(): GridState {
  return {
    time: 0,
    timeStep: 0.001,

    gridAmount: 10,
    calculatedCellSize: INITIAL_CANVAS_SIZE / 10,
    numCellsX: 10,
    numCellsY: 10,

    noiseThreshold: 0.5,
    isSimplified: false,

    cellImages: [],
    isCellImageLoading: false,
    bgImage: null,
    bgImageForDrawing: null,
    bgPixelData: null,
    bgPixelDataWidth: 0,

    animationAreaMode: 'dark',
    brightnessThreshold: 128,

    currentLetters: '',
    letterColor: '#FFFFFF',
    letterBgColor: '#000000',

    isStarting: false,
    isMainLoopActive: false,
    isEnding: false,
    isBackgroundLoopActive: false,

    startAnimationEnabled: false,
    endAnimationEnabled: false,
    startAnimationDuration: 1,
    endAnimationDuration: 1,
    overallDuration: 5,

    startAnimationStartTime: 0,
    mainAnimationStartTime: 0,
    mainAnimationEndTime: 0,
    fadeOutStartTime: 0,

    startAnimationFrameId: null,
    animationFrameId: null,
    fadeOutFrameId: null,
    backgroundFrameId: null,

    initialVisibleCount: 0,

    assignedCellData: new Map(),

    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,
    isSequenceRecording: false,
    mediaStream: null,
  }
}

export const gridState: GridState = createInitialState()
export const noise3D: Noise3DFn = createNoise3DInstance()
