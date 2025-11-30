import type { InteractionMode, ParticleShape } from './state'

export interface ParticleControlConfig {
  density: number
  radius: number
  speed: number
  particleSize: number
  shape: ParticleShape
  interaction: InteractionMode
  characters: string
  font: string
}
