import type { GridState } from '../types'

export interface SliderChangeDetail {
  value: number
  displayValue: number
}

interface BasicSliderElement extends HTMLElement {
  value?: number
  _getDisplayValue?: (normalizedValue: number) => number
}

export function getNormalizedValueFromSlider(element: HTMLElement | null): number {
  if (!element) {return 0}
  const slider = element as BasicSliderElement

  if (typeof slider.value === 'number' && Number.isFinite(slider.value)) {
    return slider.value
  }

  const attr = element.getAttribute('value')
  if (!attr) {return 0}

  const parsed = Number.parseFloat(attr)
  if (Number.isFinite(parsed)) {
    return parsed
  }

  return 0
}

export function getGridAmountFromSlider(element: HTMLElement | null): number {
  if (!element) {return 10}
  const slider = element as BasicSliderElement

  const normalized = getNormalizedValueFromSlider(element)

  if (typeof slider._getDisplayValue === 'function') {
    const display = slider._getDisplayValue(normalized)
    const rounded = Math.round(display)
    return Number.isFinite(rounded) && rounded > 0 ? rounded : 10
  }

  const minAttr = element.getAttribute('min')
  const fallback = minAttr ? Number.parseFloat(minAttr) : 10
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 10
}

export function mapSpeedNormalizedToTimeStep(normalized: number): number {
  const clamped = Math.max(0, Math.min(1, normalized))
  const minTimeStep = 0.001
  const maxTimeStep = 0.02
  return clamped * (maxTimeStep - minTimeStep) + minTimeStep
}

export function mapFillNormalizedToNoiseThreshold(normalized: number): number {
  const clamped = Math.max(0, Math.min(1, normalized))
  return 1 - clamped
}

export function mapBrightnessNormalizedToThreshold(normalized: number): number {
  const clamped = Math.max(0, Math.min(1, normalized))
  const value = Math.round(clamped * 255)
  return Math.max(0, Math.min(255, value))
}

export function applySpeedFromSliderDetail(state: GridState, detail: SliderChangeDetail | null): void {
  if (!detail) {return}
  state.timeStep = mapSpeedNormalizedToTimeStep(detail.value)
}

export function applyFillFromSliderDetail(state: GridState, detail: SliderChangeDetail | null): void {
  if (!detail) {return}
  state.noiseThreshold = mapFillNormalizedToNoiseThreshold(detail.value)
}

export function applyBrightnessFromSliderDetail(state: GridState, detail: SliderChangeDetail | null): void {
  if (!detail) {return}
  state.brightnessThreshold = mapBrightnessNormalizedToThreshold(detail.value)
}
