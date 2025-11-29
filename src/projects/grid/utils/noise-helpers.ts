import type { GridState } from '../types'
import { BASE_FREQ, FREQ_AMPLITUDE, FREQ_OSC_FREQ, MIN_FREQ, SIMPLIFY_FACTOR } from '../constants'
import type { Noise3DFn } from '@shared/utils/noise'

export function computeEffectiveFrequency(state: GridState): number {
  let currentFreq =
    BASE_FREQ + FREQ_AMPLITUDE * Math.sin(FREQ_OSC_FREQ * state.time * 2 * Math.PI)
  currentFreq = Math.max(MIN_FREQ, currentFreq)
  return state.isSimplified ? BASE_FREQ * SIMPLIFY_FACTOR : currentFreq
}

export function sampleNoise(
  noise3D: Noise3DFn,
  frequency: number,
  x: number,
  y: number,
  z: number,
): number {
  const noiseVal = noise3D(x * frequency, y * frequency, z)
  return (noiseVal + 1) / 2
}
