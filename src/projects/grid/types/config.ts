import type { AnimationAreaMode } from './state'

export interface GridControlConfig {
  speed: number
  gridAmount: number
  fill: number
  brightness: number
  animationArea: AnimationAreaMode
  isSimplified: boolean
  overallDuration: number
  fadeInDuration: number
  fadeOutDuration: number
  letters: string
  letterColor: string
  letterBgColor: string
  startEnabled: boolean
  endEnabled: boolean
}
