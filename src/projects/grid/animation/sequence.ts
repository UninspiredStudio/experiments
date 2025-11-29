import type { Noise3DFn } from '@shared/utils/noise'

import type { GridState } from '../types'
import type { GridCanvasContext } from '../core/canvas'
import { drawFrame } from '../rendering/drawer'
import { computeEffectiveFrequency, sampleNoise } from '../utils/noise-helpers'
import { getBgPixelBrightness } from '../core/canvas'
import { drawBackground } from '../rendering/background'
import { END_THRESHOLD_PERCENT, ACCELERATION_FACTOR, START_ACCELERATION_FACTOR } from '../constants'
import { drawCell } from '../rendering/cell-renderer'

export interface SequenceOptions {
  onComplete?: () => void
}

export function isSequenceActive(state: GridState): boolean {
  return state.isStarting || state.isMainLoopActive || state.isEnding
}

export function stopAllAnimations(state: GridState, keepBackgroundRunning = false): void {
  if (state.startAnimationFrameId !== null) {
    window.cancelAnimationFrame(state.startAnimationFrameId)
    state.startAnimationFrameId = null
  }

  if (state.animationFrameId !== null) {
    window.cancelAnimationFrame(state.animationFrameId)
    state.animationFrameId = null
  }

  if (state.fadeOutFrameId !== null) {
    window.cancelAnimationFrame(state.fadeOutFrameId)
    state.fadeOutFrameId = null
  }

  if (!keepBackgroundRunning && state.backgroundFrameId !== null) {
    window.cancelAnimationFrame(state.backgroundFrameId)
    state.backgroundFrameId = null
  }

  state.isStarting = false
  state.isMainLoopActive = false
  state.isEnding = false
  if (!keepBackgroundRunning) {
    state.isBackgroundLoopActive = false
  }
}

export function startBackgroundAnimation(state: GridState, context: GridCanvasContext, noise3D: Noise3DFn): void {
  if (state.isBackgroundLoopActive || isSequenceActive(state)) {return}

  state.isBackgroundLoopActive = true

  if (state.backgroundFrameId !== null) {
    window.cancelAnimationFrame(state.backgroundFrameId)
  }

  const loop = () => {
    if (!state.isBackgroundLoopActive) {
      if (state.backgroundFrameId !== null) {
        window.cancelAnimationFrame(state.backgroundFrameId)
        state.backgroundFrameId = null
      }
      return
    }

    const threshold = state.noiseThreshold
    drawFrame(state, context, noise3D, threshold)

    state.backgroundFrameId = window.requestAnimationFrame(loop)
  }

  state.backgroundFrameId = window.requestAnimationFrame(loop)
}

export function startSequence(
  state: GridState,
  context: GridCanvasContext,
  noise3D: Noise3DFn,
  options?: SequenceOptions,
): void {
  stopAllAnimations(state, false)
  state.assignedCellData.clear()
  state.time = 0

  if (state.startAnimationEnabled) {
    state.isStarting = true
    state.startAnimationStartTime = performance.now()

    const introStep = (timestamp: number) => {
      if (!state.isStarting || state.startAnimationFrameId === null) {
        if (state.startAnimationFrameId !== null) {
          window.cancelAnimationFrame(state.startAnimationFrameId)
          state.startAnimationFrameId = null
        }
        return
      }

      const elapsedTime = (timestamp - state.startAnimationStartTime) / 1000

      if (elapsedTime >= state.startAnimationDuration) {
        window.cancelAnimationFrame(state.startAnimationFrameId)
        state.startAnimationFrameId = null
        state.isStarting = false
        state.isMainLoopActive = true
        state.mainAnimationStartTime = performance.now()
        state.mainAnimationEndTime = state.mainAnimationStartTime + state.overallDuration * 1000

        if (state.animationFrameId !== null) {
          window.cancelAnimationFrame(state.animationFrameId)
        }
        state.animationFrameId = window.requestAnimationFrame(mainStep)

        return
      }

      const timerProgress = Math.min(1, elapsedTime / state.startAnimationDuration)
      const adjustedNoiseThreshold = 1 - (1 - state.noiseThreshold) * Math.pow(timerProgress, START_ACCELERATION_FACTOR)

      state.startAnimationFrameId = window.requestAnimationFrame(introStep)
      drawFrame(state, context, noise3D, adjustedNoiseThreshold)
    }

    const mainStep = (timestamp: number) => {
      animateInternal(state, context, noise3D, options, timestamp, mainStep)
    }

    state.startAnimationFrameId = window.requestAnimationFrame(introStep)
  } else {
    state.isMainLoopActive = true
    state.mainAnimationStartTime = performance.now()
    state.mainAnimationEndTime = state.mainAnimationStartTime + state.overallDuration * 1000

    const mainStep = (timestamp: number) => {
      animateInternal(state, context, noise3D, options, timestamp, mainStep)
    }

    if (state.animationFrameId !== null) {
      window.cancelAnimationFrame(state.animationFrameId)
    }
    state.animationFrameId = window.requestAnimationFrame(mainStep)
  }
}

function animateInternal(
  state: GridState,
  context: GridCanvasContext,
  noise3D: Noise3DFn,
  options: SequenceOptions | undefined,
  timestamp: number,
  stepFn: (ts: number) => void,
): void {
  if (!state.isMainLoopActive || state.isEnding || state.isStarting || state.animationFrameId === null) {
    if (state.animationFrameId !== null) {
      window.cancelAnimationFrame(state.animationFrameId)
      state.animationFrameId = null
    }
    return
  }

  if (timestamp >= state.mainAnimationEndTime) {
    window.cancelAnimationFrame(state.animationFrameId)
    state.animationFrameId = null
    state.isMainLoopActive = false

    if (state.endAnimationEnabled) {
      startFadeOut(state, context, noise3D, options)
    } else {
      drawBackground(state, context)
      state.assignedCellData.clear()
      options?.onComplete?.()
    }
    return
  }

  state.animationFrameId = window.requestAnimationFrame(stepFn)
  drawFrame(state, context, noise3D, state.noiseThreshold)
}

export function startFadeOut(
  state: GridState,
  context: GridCanvasContext,
  noise3D: Noise3DFn,
  options?: SequenceOptions,
): void {
  if (state.isEnding || !state.endAnimationEnabled) {return}

  state.isEnding = true
  state.isMainLoopActive = false

  if (state.animationFrameId !== null) {
    window.cancelAnimationFrame(state.animationFrameId)
    state.animationFrameId = null
  }

  if (state.fadeOutFrameId !== null) {
    window.cancelAnimationFrame(state.fadeOutFrameId)
    state.fadeOutFrameId = null
  }

  state.initialVisibleCount = state.assignedCellData.size
  state.fadeOutStartTime = performance.now()

  const step = (timestamp: number) => {
    fadeOutStep(state, context, noise3D, options, timestamp, step)
  }

  state.fadeOutFrameId = window.requestAnimationFrame(step)
}

function fadeOutStep(
  state: GridState,
  context: GridCanvasContext,
  noise3D: Noise3DFn,
  options: SequenceOptions | undefined,
  timestamp: number,
  stepFn: (ts: number) => void,
): void {
  if (!state.isEnding || state.fadeOutFrameId === null) {
    if (state.fadeOutFrameId !== null) {
      window.cancelAnimationFrame(state.fadeOutFrameId)
      state.fadeOutFrameId = null
    }
    return
  }

  const elapsedTime = (timestamp - state.fadeOutStartTime) / 1000

  if (elapsedTime >= state.endAnimationDuration) {
    window.cancelAnimationFrame(state.fadeOutFrameId)
    state.fadeOutFrameId = null
    state.isEnding = false

    drawBackground(state, context)
    state.assignedCellData.clear()
    options?.onComplete?.()
    return
  }

  state.fadeOutFrameId = window.requestAnimationFrame(stepFn)

  const timerProgress = Math.min(1, elapsedTime / state.endAnimationDuration)
  const adjustedNoiseThreshold =
    state.noiseThreshold + (1 - state.noiseThreshold) * Math.pow(timerProgress, ACCELERATION_FACTOR)

  state.time += state.timeStep
  const frequency = computeEffectiveFrequency(state)

  drawBackground(state, context)

  let currentVisibleCount = 0
  const cellsToRemove: string[] = []

  state.assignedCellData.forEach((cellData, cellKey) => {
    const [cellXStr, cellYStr] = cellKey.split(',')
    const cellX = Number.parseInt(cellXStr, 10)
    const cellY = Number.parseInt(cellYStr, 10)

    if (!Number.isFinite(cellX) || !Number.isFinite(cellY)) {
      cellsToRemove.push(cellKey)
      return
    }

    const sampleX = (cellX + 0.5) * state.calculatedCellSize
    const sampleY = (cellY + 0.5) * state.calculatedCellSize

    let shouldAnimate = true
    if (state.animationAreaMode !== 'everywhere' && state.bgImage) {
      const brightness = getBgPixelBrightness(state, context, sampleX, sampleY)
      if (state.animationAreaMode === 'light' && brightness <= state.brightnessThreshold) {shouldAnimate = false}
      if (state.animationAreaMode === 'dark' && brightness > state.brightnessThreshold) {shouldAnimate = false}
    }

    if (!shouldAnimate) {
      cellsToRemove.push(cellKey)
      return
    }

    const normalizedNoise = sampleNoise(noise3D, frequency, sampleX, sampleY, state.time)
    const isPotentiallyOn = normalizedNoise > adjustedNoiseThreshold

    if (isPotentiallyOn) {
      if (cellData.type === 'letter') {
        cellData.fg = state.letterColor
        cellData.bg = state.letterBgColor
      }
      drawCell(state, context, cellX, cellY, cellData)
      currentVisibleCount += 1
    } else {
      cellsToRemove.push(cellKey)
    }
  })

  cellsToRemove.forEach((key) => {
    state.assignedCellData.delete(key)
  })

  const thresholdCount = state.initialVisibleCount > 0
    ? Math.floor(state.initialVisibleCount * END_THRESHOLD_PERCENT)
    : 0

  if (
    (currentVisibleCount > 0 && currentVisibleCount <= thresholdCount && state.initialVisibleCount > 0) ||
    currentVisibleCount === 0
  ) {
    if (state.fadeOutFrameId !== null) {
      window.cancelAnimationFrame(state.fadeOutFrameId)
      state.fadeOutFrameId = null
    }
    state.isEnding = false

    drawBackground(state, context)
    state.assignedCellData.clear()
    options?.onComplete?.()
  }
}
