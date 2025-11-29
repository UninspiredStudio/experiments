export type CellType = 'image' | 'letter'

export interface CellData {
  type: CellType
  content: HTMLImageElement | string
  fg?: string
  bg?: string
}
