import type { GridState } from '../types'
import type { Noise3DFn } from '@shared/utils/noise'
import { computeEffectiveFrequency, sampleNoise } from '../utils/noise-helpers'
import type { GridCanvasContext } from '../core/canvas'
import { drawCell } from './cell-renderer'
import { drawBackground } from './background'
import { assignCellData } from '../utils/cell-helpers'
import { getBgPixelBrightness } from '../core/canvas'

export function drawFrame(
  state: GridState,
  ctx: GridCanvasContext,
  noise3D: Noise3DFn,
  currentNoiseThreshold: number,
): void {
  state.time += state.timeStep

  const frequency = computeEffectiveFrequency(state)

  drawBackground(state, ctx)

  for (let cellY = 0; cellY < state.numCellsY; cellY += 1) {
    for (let cellX = 0; cellX < state.numCellsX; cellX += 1) {
      const sampleX = (cellX + 0.5) * state.calculatedCellSize
      const sampleY = (cellY + 0.5) * state.calculatedCellSize

      let shouldAnimate = true
      if (state.animationAreaMode !== 'everywhere' && state.bgImage) {
        const brightness = getBgPixelBrightness(state, ctx, sampleX, sampleY)
        if (state.animationAreaMode === 'light' && brightness <= state.brightnessThreshold) {
          shouldAnimate = false
        }
        if (state.animationAreaMode === 'dark' && brightness > state.brightnessThreshold) {
          shouldAnimate = false
        }
      }
      if (!shouldAnimate) {continue}

      const normalizedNoise = sampleNoise(noise3D, frequency, sampleX, sampleY, state.time)
      const isOn = normalizedNoise > currentNoiseThreshold
      const cellKey = `${cellX},${cellY}`
      let cellDataToDraw = state.assignedCellData.get(cellKey) ?? null

      if (isOn) {
        if (!cellDataToDraw) {
          assignCellData(state, cellX, cellY, cellKey)
          cellDataToDraw = state.assignedCellData.get(cellKey) ?? null
        } else if (cellDataToDraw.type === 'letter') {
          cellDataToDraw.fg = state.letterColor
          cellDataToDraw.bg = state.letterBgColor
        }

        if (cellDataToDraw) {
          drawCell(state, ctx, cellX, cellY, cellDataToDraw)
        }
      } else if (state.assignedCellData.has(cellKey)) {
        state.assignedCellData.delete(cellKey)
      }
    }
  }
}
