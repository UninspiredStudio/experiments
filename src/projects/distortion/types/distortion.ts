export type DistortionMode = 'displacement' | 'fragments' | 'shift'

export type SliderValue = number

export type ToggleValue = boolean

export interface PersistentPoint {
  x: number
  y: number
}

export interface DistortionStateBase {
  canvas: HTMLCanvasElement | null
  context: CanvasRenderingContext2D | null
}
