import type { Noise3DFn } from '@shared/utils/noise'
import { createNoise3DInstance } from '@shared/utils/noise'

import type { GridState } from '../types'
import { INITIAL_CANVAS_SIZE } from '../constants'
import { GRID_CONTROL_DEFAULTS } from '../constants/defaults'
import {
  mapBrightnessNormalizedToThreshold,
  mapFillNormalizedToNoiseThreshold,
  mapSpeedNormalizedToTimeStep,
} from './mappings'

export function createInitialState(): GridState {
  const {
    gridAmount,
    speed,
    fill,
    brightness,
    animationArea,
    isSimplified,
    overallDuration,
    fadeInDuration,
    fadeOutDuration,
    startEnabled,
    endEnabled,
    letterColor,
    letterBgColor,
    letters,
  } = GRID_CONTROL_DEFAULTS

  const timeStep = mapSpeedNormalizedToTimeStep(speed)
  const noiseThreshold = mapFillNormalizedToNoiseThreshold(fill)
  const brightnessThreshold = mapBrightnessNormalizedToThreshold(brightness)

  return {
    time: 0,
    timeStep,

    gridAmount,
    calculatedCellSize: INITIAL_CANVAS_SIZE / gridAmount,
    numCellsX: gridAmount,
    numCellsY: gridAmount,

    noiseThreshold,
    isSimplified,

    cellImages: [],
    isCellImageLoading: false,
    bgImage: null,
    bgImageForDrawing: null,
    bgPixelData: null,
    bgPixelDataWidth: 0,

    animationAreaMode: animationArea,
    brightnessThreshold,

    currentLetters: letters,
    letterColor,
    letterBgColor,

    isStarting: false,
    isMainLoopActive: false,
    isEnding: false,
    isBackgroundLoopActive: false,

    startAnimationEnabled: startEnabled,
    endAnimationEnabled: endEnabled,
    startAnimationDuration: fadeInDuration,
    endAnimationDuration: fadeOutDuration,
    overallDuration,

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
