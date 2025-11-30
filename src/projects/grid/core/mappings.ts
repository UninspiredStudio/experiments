const MIN_TIME_STEP = 0.001
const MAX_TIME_STEP = 0.02

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value))

export function mapSpeedNormalizedToTimeStep(normalized: number): number {
  const clamped = clamp(normalized)
  return clamped * (MAX_TIME_STEP - MIN_TIME_STEP) + MIN_TIME_STEP
}

export function mapTimeStepToNormalizedSpeed(timeStep: number): number {
  if (!Number.isFinite(timeStep) || timeStep <= MIN_TIME_STEP) {
    return 0
  }
  if (timeStep >= MAX_TIME_STEP) {
    return 1
  }
  return clamp((timeStep - MIN_TIME_STEP) / (MAX_TIME_STEP - MIN_TIME_STEP))
}

export function mapFillNormalizedToNoiseThreshold(normalized: number): number {
  return 1 - clamp(normalized)
}

export function mapNoiseThresholdToFillNormalized(threshold: number): number {
  if (!Number.isFinite(threshold)) {
    return 0.5
  }
  return clamp(1 - threshold)
}

export function mapBrightnessNormalizedToThreshold(normalized: number): number {
  const clamped = clamp(normalized)
  const value = Math.round(clamped * 255)
  return clamp(value, 0, 255)
}

export function mapBrightnessThresholdToNormalized(threshold: number): number {
  if (!Number.isFinite(threshold)) {
    return 0.5
  }
  return clamp(threshold / 255)
}
