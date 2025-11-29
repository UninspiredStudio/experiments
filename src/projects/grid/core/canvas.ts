import type { GridState } from '../types'
import type { BackgroundRenderContext } from '../rendering/background'
import type { GridRenderContext } from '../rendering/cell-renderer'

export interface GridCanvasContext extends GridRenderContext, BackgroundRenderContext {}

export function initializeCanvas(state: GridState, canvas: HTMLCanvasElement, hiddenBgCanvas: HTMLCanvasElement): void {
  canvas.width = state.gridAmount
  canvas.height = state.gridAmount
  hiddenBgCanvas.width = canvas.width
  hiddenBgCanvas.height = canvas.height
}

export function updateGridParams(
  state: GridState,
  canvas: HTMLCanvasElement,
  gridAmount: number,
): void {
  const value = Number.isFinite(gridAmount) && gridAmount > 0 ? gridAmount : 10

  state.gridAmount = value
  state.calculatedCellSize = canvas.width / state.gridAmount
  state.numCellsX = state.gridAmount
  state.numCellsY = Math.ceil(canvas.height / state.calculatedCellSize)
  state.bgPixelData = null
  state.assignedCellData.clear()
}

export function getBgPixelBrightness(
  state: GridState,
  { canvas }: BackgroundRenderContext,
  canvasX: number,
  canvasY: number,
): number {
  if (!state.bgImage || !canvas.width || !canvas.height) {
    return 128
  }

  if (!state.bgPixelData || state.bgPixelDataWidth !== canvas.width) {
    const hiddenCtx = (document.getElementById('hiddenBgCanvas') as HTMLCanvasElement | null)?.getContext(
      '2d',
      { willReadFrequently: true },
    )
    const hiddenCanvas = document.getElementById('hiddenBgCanvas') as HTMLCanvasElement | null

    if (!hiddenCtx || !hiddenCanvas || !hiddenCanvas.width || !hiddenCanvas.height) {
      state.bgPixelData = null
      return 128
    }

    try {
      const imageData = hiddenCtx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height)
      state.bgPixelData = imageData.data
      state.bgPixelDataWidth = hiddenCanvas.width
    } catch {
      state.bgPixelData = null
      return 128
    }
  }

  if (!state.bgPixelData) {return 128}

  const x = Math.max(0, Math.min(Math.floor(canvasX), canvas.width - 1))
  const y = Math.max(0, Math.min(Math.floor(canvasY), canvas.height - 1))
  const index = (y * state.bgPixelDataWidth + x) * 4
  const r = state.bgPixelData[index]
  const g = state.bgPixelData[index + 1]
  const b = state.bgPixelData[index + 2]

  return 0.299 * r + 0.587 * g + 0.114 * b
}
