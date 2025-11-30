import type { GridControlConfig } from '../types'

export const GRID_CONTROL_DEFAULTS = {
  speed: 0.3684,
  gridAmount: 10,
  fill: 0.5,
  brightness: 0.5,
  animationArea: 'dark',
  isSimplified: false,
  overallDuration: 5,
  fadeInDuration: 1,
  fadeOutDuration: 1,
  startEnabled: false,
  endEnabled: false,
  letterColor: '#FFFFFF',
  letterBgColor: '#000000',
  letters: '',
} satisfies GridControlConfig
