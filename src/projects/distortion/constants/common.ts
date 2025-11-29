export interface SliderRange {
  min: number
  max: number
  step?: number
}

export const INTENSITY_RANGE: SliderRange = { min: 0, max: 600 }
export const RADIUS_RANGE: SliderRange = { min: 10, max: 1500 }
export const BLOCK_SIZE_RANGE: SliderRange = { min: 2, max: 300, step: 1 }
