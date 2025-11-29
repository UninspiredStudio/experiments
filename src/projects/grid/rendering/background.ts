import type { GridState } from '../types'

export interface BackgroundRenderContext {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
}

export function drawBackground(state: GridState, { ctx, canvas }: BackgroundRenderContext): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const bg = state.bgImageForDrawing
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)
  }

  state.bgPixelData = null
}
