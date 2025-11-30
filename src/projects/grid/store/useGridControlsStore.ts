import { create } from 'zustand'

import { GRID_CONTROL_DEFAULTS } from '../constants/defaults'
import { gridState } from '../core/state'
import {
  mapBrightnessThresholdToNormalized,
  mapNoiseThresholdToFillNormalized,
  mapTimeStepToNormalizedSpeed,
} from '../core/mappings'
import { updateGridParams } from '../core/canvas'
import {
  applyBrightnessFromSliderDetail,
  applyFillFromSliderDetail,
  applySpeedFromSliderDetail,
} from '../ui/state-adapters'
import type { AnimationAreaMode, GridControlConfig, GridState } from '../types'
import { clamp01 } from '@shared/utils/math'

function applyValuesToGridState(values: GridControlConfig, canvas?: HTMLCanvasElement | null): void {
  const {
    speed,
    gridAmount,
    fill,
    brightness,
    animationArea,
    isSimplified,
    overallDuration,
    fadeInDuration,
    fadeOutDuration,
    letters,
    letterColor,
    letterBgColor,
    startEnabled,
    endEnabled,
  } = values

  const normalizedSpeed = clamp01(speed)
  const normalizedFill = clamp01(fill)
  const normalizedBrightness = clamp01(brightness)
  const safeGridAmount = Math.max(2, Math.round(gridAmount))

  applySpeedFromSliderDetail(gridState, { value: normalizedSpeed, displayValue: normalizedSpeed })
  applyFillFromSliderDetail(gridState, { value: normalizedFill, displayValue: normalizedFill })
  applyBrightnessFromSliderDetail(gridState, { value: normalizedBrightness, displayValue: normalizedBrightness })
  gridState.animationAreaMode = animationArea
  gridState.isSimplified = isSimplified

  const safeOverall = Number.isFinite(overallDuration) && overallDuration > 0 ? overallDuration : gridState.overallDuration
  const safeFadeIn = Number.isFinite(fadeInDuration) && fadeInDuration > 0 ? fadeInDuration : gridState.startAnimationDuration
  const safeFadeOut = Number.isFinite(fadeOutDuration) && fadeOutDuration > 0 ? fadeOutDuration : gridState.endAnimationDuration

  gridState.overallDuration = safeOverall
  gridState.startAnimationDuration = safeFadeIn
  gridState.endAnimationDuration = safeFadeOut

  gridState.currentLetters = letters
  gridState.letterColor = letterColor
  gridState.letterBgColor = letterBgColor

  gridState.startAnimationEnabled = startEnabled
  gridState.endAnimationEnabled = endEnabled

  if (canvas) {
    updateGridParams(gridState, canvas, safeGridAmount)
  } else {
    gridState.gridAmount = safeGridAmount
  }
}

export interface GridControlsStore extends GridControlConfig {
  setSpeed: (value: number) => void
  setGridAmount: (value: number, canvas?: HTMLCanvasElement | null) => void
  setFill: (value: number) => void
  setBrightness: (value: number) => void
  setAnimationArea: (mode: AnimationAreaMode) => void
  setSimplified: (value: boolean) => void
  setDurations: (overall: number, fadeIn: number, fadeOut: number) => void
  setLetters: (value: string) => void
  setLetterColor: (value: string) => void
  setLetterBgColor: (value: string) => void
  setStartEnabled: (value: boolean) => void
  setEndEnabled: (value: boolean) => void
  applyToGridState: (canvas?: HTMLCanvasElement | null) => void
  hydrateFromGrid: (source?: GridState) => void
  reset: (canvas?: HTMLCanvasElement | null) => void
  randomize: (canvas?: HTMLCanvasElement | null) => void
}

export const useGridControlsStore = create<GridControlsStore>()((set, get) => ({
  ...GRID_CONTROL_DEFAULTS,
  setSpeed: (value) => {
    const normalized = clamp01(value)
    applySpeedFromSliderDetail(gridState, { value: normalized, displayValue: normalized })
    set({ speed: normalized })
  },
  setGridAmount: (value, canvas) => {
    const amount = Math.max(2, Math.round(value))
    if (canvas) {
      updateGridParams(gridState, canvas, amount)
    } else {
      gridState.gridAmount = amount
    }
    set({ gridAmount: amount })
  },
  setFill: (value) => {
    const normalized = clamp01(value)
    applyFillFromSliderDetail(gridState, { value: normalized, displayValue: normalized })
    set({ fill: normalized })
  },
  setBrightness: (value) => {
    const normalized = clamp01(value)
    applyBrightnessFromSliderDetail(gridState, { value: normalized, displayValue: normalized })
    set({ brightness: normalized })
  },
  setAnimationArea: (mode) => {
    gridState.animationAreaMode = mode
    set({ animationArea: mode })
  },
  setSimplified: (value) => {
    gridState.isSimplified = value
    set({ isSimplified: value })
  },
  setDurations: (overall, fadeIn, fadeOut) => {
    const { overallDuration, fadeInDuration, fadeOutDuration } = get()
    const safeOverall = Number.isFinite(overall) && overall > 0 ? overall : overallDuration
    const safeFadeIn = Number.isFinite(fadeIn) && fadeIn > 0 ? fadeIn : fadeInDuration
    const safeFadeOut = Number.isFinite(fadeOut) && fadeOut > 0 ? fadeOut : fadeOutDuration

    gridState.overallDuration = safeOverall
    gridState.startAnimationDuration = safeFadeIn
    gridState.endAnimationDuration = safeFadeOut

    set({
      overallDuration: safeOverall,
      fadeInDuration: safeFadeIn,
      fadeOutDuration: safeFadeOut,
    })
  },
  setLetters: (value) => {
    gridState.currentLetters = value
    set({ letters: value })
  },
  setLetterColor: (value) => {
    gridState.letterColor = value
    set({ letterColor: value })
  },
  setLetterBgColor: (value) => {
    gridState.letterBgColor = value
    set({ letterBgColor: value })
  },
  setStartEnabled: (value) => {
    const enabled = Boolean(value)
    gridState.startAnimationEnabled = enabled
    set({ startEnabled: enabled })
  },
  setEndEnabled: (value) => {
    const enabled = Boolean(value)
    gridState.endAnimationEnabled = enabled
    set({ endEnabled: enabled })
  },
  applyToGridState: (canvas) => {
    applyValuesToGridState(get(), canvas ?? null)
  },
  hydrateFromGrid: (source) => {
    const state = source ?? gridState
    const speed = mapTimeStepToNormalizedSpeed(state.timeStep)
    const fill = mapNoiseThresholdToFillNormalized(state.noiseThreshold)
    const brightness = mapBrightnessThresholdToNormalized(state.brightnessThreshold)

    set({
      speed,
      gridAmount: state.gridAmount,
      fill,
      brightness,
      animationArea: state.animationAreaMode,
      isSimplified: state.isSimplified,
      overallDuration: state.overallDuration,
      fadeInDuration: state.startAnimationDuration,
      fadeOutDuration: state.endAnimationDuration,
      letters: state.currentLetters,
      letterColor: state.letterColor,
      letterBgColor: state.letterBgColor,
      startEnabled: state.startAnimationEnabled,
      endEnabled: state.endAnimationEnabled,
    })
  },
  reset: (canvas) => {
    applyValuesToGridState(GRID_CONTROL_DEFAULTS, canvas ?? null)
    set({ ...GRID_CONTROL_DEFAULTS })
  },
  randomize: (canvas) => {
    const nextSpeed = clamp01(Math.random())
    const nextGridAmount = Math.max(2, Math.round(5 + Math.random() * 50))
    const nextFill = clamp01(Math.random())
    const nextBrightness = clamp01(Math.random())
    const nextAnimationArea = (['everywhere', 'light', 'dark'] as AnimationAreaMode[])[Math.floor(Math.random() * 3)]
    const nextSimplified = Math.random() > 0.5
    const targetCanvas = canvas ?? null

    applySpeedFromSliderDetail(gridState, { value: nextSpeed, displayValue: nextSpeed })
    applyFillFromSliderDetail(gridState, { value: nextFill, displayValue: nextFill })
    applyBrightnessFromSliderDetail(gridState, { value: nextBrightness, displayValue: nextBrightness })
    gridState.animationAreaMode = nextAnimationArea
    gridState.isSimplified = nextSimplified

    if (targetCanvas) {
      updateGridParams(gridState, targetCanvas, nextGridAmount)
    } else {
      gridState.gridAmount = nextGridAmount
    }

    set({
      speed: nextSpeed,
      gridAmount: nextGridAmount,
      fill: nextFill,
      brightness: nextBrightness,
      animationArea: nextAnimationArea,
      isSimplified: nextSimplified,
    })
  },
}))
