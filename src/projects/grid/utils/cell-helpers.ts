import type { GridState } from '../types'

export function assignCellData(state: GridState, cellX: number, cellY: number, cellKey: string): void {
  const imagesAvailable = state.cellImages.length > 0 && !state.isCellImageLoading
  const lettersAvailable = state.currentLetters.length > 0

  let assignedType: 'image' | 'letter' | null = null
  let assignedContent: HTMLImageElement | string | null = null
  let assignedFg: string | null = null
  let assignedBg: string | null = null

  if (imagesAvailable && lettersAvailable) {
    assignedType = Math.random() < 0.5 ? 'image' : 'letter'
  } else if (imagesAvailable) {
    assignedType = 'image'
  } else if (lettersAvailable) {
    assignedType = 'letter'
  }

  if (assignedType === 'image') {
    const imgIndex = Math.floor(Math.random() * state.cellImages.length)
    assignedContent = state.cellImages[imgIndex]
  } else if (assignedType === 'letter') {
    const letterIndex = Math.floor(Math.random() * state.currentLetters.length)
    assignedContent = state.currentLetters[letterIndex]
    assignedFg = state.letterColor
    assignedBg = state.letterBgColor
  }

  if (assignedType && assignedContent !== null) {
    state.assignedCellData.set(cellKey, {
      type: assignedType,
      content: assignedContent,
      fg: assignedFg ?? undefined,
      bg: assignedBg ?? undefined,
    })
  }
}
