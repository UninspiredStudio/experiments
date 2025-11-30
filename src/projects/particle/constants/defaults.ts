import type { ParticleControlConfig } from '../types/config'

export const PARTICLE_CONTROL_DEFAULTS: ParticleControlConfig = {
  density: 12,
  radius: 300,
  speed: 10,
  particleSize: 6.4,
  shape: 'character',
  interaction: 'repel',
  characters: '?',
  font: 'Arial',
}

export const PARTICLE_FONT_OPTIONS = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Helvetica',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Comic Sans MS',
  'Impact',
  'Lucida Console',
  'Tahoma',
  'Palatino',
]
