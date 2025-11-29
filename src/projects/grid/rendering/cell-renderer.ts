import type { CellData } from '../types'
import { OVERLAP_FIX, DEFAULT_LETTER_BG_COLOR, DEFAULT_LETTER_COLOR } from '../constants'
import type { GridState } from '../types'

export interface GridRenderContext {
  ctx: CanvasRenderingContext2D
}

export function drawCell(
  state: GridState,
  { ctx }: GridRenderContext,
  cellX: number,
  cellY: number,
  data: CellData | null,
): void {
  if (!data) {return}

  const drawX = cellX * state.calculatedCellSize
  const drawY = cellY * state.calculatedCellSize
  const size = state.calculatedCellSize

  if (data.type === 'image') {
    const img = data.content as HTMLImageElement
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        0,
        0,
        img.naturalWidth,
        img.naturalHeight,
        drawX,
        drawY,
        size + OVERLAP_FIX,
        size + OVERLAP_FIX,
      )
    }
    return
  }

  if (data.type === 'letter') {
    const letter = data.content as string
    const fg = data.fg ?? DEFAULT_LETTER_COLOR
    const bg = data.bg ?? DEFAULT_LETTER_BG_COLOR

    ctx.fillStyle = bg
    ctx.fillRect(drawX, drawY, size + OVERLAP_FIX, size + OVERLAP_FIX)

    ctx.fillStyle = fg
    const fontSize = Math.max(8, size * 0.75)
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(letter, drawX + size / 2, drawY + size / 2 + fontSize * 0.05)
  }
}
