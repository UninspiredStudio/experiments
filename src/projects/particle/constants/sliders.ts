import type { SliderConfig } from '@/types'
import { PARTICLE_CONTROL_DEFAULTS } from './defaults'

export const PARTICLE_SLIDERS: Record<'density' | 'particleSize' | 'radius' | 'speed', SliderConfig> = {
  density: {
    id: 'density',
    label: 'Density',
    min: 2,
    max: 32,
    step: 1,
    defaultValue: PARTICLE_CONTROL_DEFAULTS.density,
  },
  particleSize: {
    id: 'particleSize',
    label: 'Particle size',
    min: 0.5,
    max: 15,
    step: 0.1,
    defaultValue: PARTICLE_CONTROL_DEFAULTS.particleSize,
  },
  radius: {
    id: 'radius',
    label: 'Interaction radius',
    min: 40,
    max: 900,
    step: 5,
    defaultValue: PARTICLE_CONTROL_DEFAULTS.radius,
  },
  speed: {
    id: 'speed',
    label: 'Effect speed',
    min: 1,
    max: 120,
    step: 1,
    defaultValue: PARTICLE_CONTROL_DEFAULTS.speed,
  },
}
