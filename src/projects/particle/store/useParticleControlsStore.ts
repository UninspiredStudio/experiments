import { create } from 'zustand'

import { PARTICLE_CONTROL_DEFAULTS, PARTICLE_FONT_OPTIONS } from '../constants/defaults'
import { particleState } from '../core/state'
import { updateParticleCharacters } from '../core/particles'
import type { InteractionMode, ParticleShape } from '../types/state'
import type { ParticleControlConfig } from '../types/config'
import { clamp } from '@shared/utils/math'

export interface ParticleControlsStore extends ParticleControlConfig {
  currentImageName: string
  loadingImage: boolean
  setDensity: (value: number) => void
  setRadius: (value: number) => void
  setSpeed: (value: number) => void
  setParticleSize: (value: number) => void
  setShape: (value: ParticleShape) => void
  setInteraction: (value: InteractionMode) => void
  setCharacters: (value: string) => void
  setFont: (value: string) => void
  setCurrentImageName: (value: string) => void
  setLoadingImage: (value: boolean) => void
  applyToParticleState: () => void
  reset: () => void
  randomize: () => void
}

export const useParticleControlsStore = create<ParticleControlsStore>()((set, get) => ({
  density: PARTICLE_CONTROL_DEFAULTS.density,
  radius: PARTICLE_CONTROL_DEFAULTS.radius,
  speed: PARTICLE_CONTROL_DEFAULTS.speed,
  particleSize: PARTICLE_CONTROL_DEFAULTS.particleSize,
  shape: PARTICLE_CONTROL_DEFAULTS.shape,
  interaction: PARTICLE_CONTROL_DEFAULTS.interaction,
  characters: PARTICLE_CONTROL_DEFAULTS.characters,
  font: PARTICLE_CONTROL_DEFAULTS.font,
  currentImageName: 'Placeholder',
  loadingImage: false,
  setDensity: (value) => {
    const next = clamp(Math.round(value), 2, 32)
    particleState.particleDensity = next
    set({ density: next })
  },
  setRadius: (value) => {
    const next = clamp(Math.round(value), 40, 900)
    particleState.mouse.radius = next
    set({ radius: next })
  },
  setSpeed: (value) => {
    const next = clamp(Math.round(value), 1, 120)
    particleState.mouseEffectSpeedFactor = next
    set({ speed: next })
  },
  setParticleSize: (value) => {
    const next = clamp(Number(value), 0.5, 15)
    particleState.particleSize = next
    set({ particleSize: next })
  },
  setShape: (value) => {
    particleState.particleShape = value
    set({ shape: value })
  },
  setInteraction: (value) => {
    particleState.interactionMode = value
    set({ interaction: value })
  },
  setCharacters: (value) => {
    const next = value || '?'
    particleState.particleCharacter = next
    updateParticleCharacters()
    set({ characters: next })
  },
  setFont: (value) => {
    particleState.particleFont = value
    updateParticleCharacters()
    set({ font: value })
  },
  setCurrentImageName: (value) => {
    set({ currentImageName: value })
  },
  setLoadingImage: (value) => {
    set({ loadingImage: value })
  },
  applyToParticleState: () => {
    const {
      density,
      radius,
      speed,
      particleSize,
      shape,
      interaction,
      characters,
      font,
    } = get()

    particleState.particleDensity = density
    particleState.mouse.radius = radius
    particleState.mouseEffectSpeedFactor = speed
    particleState.particleSize = particleSize
    particleState.particleShape = shape
    particleState.interactionMode = interaction
    particleState.particleCharacter = characters
    particleState.particleFont = font
    updateParticleCharacters()
  },
  reset: () => {
    particleState.particleDensity = PARTICLE_CONTROL_DEFAULTS.density
    particleState.mouse.radius = PARTICLE_CONTROL_DEFAULTS.radius
    particleState.mouseEffectSpeedFactor = PARTICLE_CONTROL_DEFAULTS.speed
    particleState.particleSize = PARTICLE_CONTROL_DEFAULTS.particleSize
    particleState.particleShape = PARTICLE_CONTROL_DEFAULTS.shape
    particleState.interactionMode = PARTICLE_CONTROL_DEFAULTS.interaction
    particleState.particleCharacter = PARTICLE_CONTROL_DEFAULTS.characters
    particleState.particleFont = PARTICLE_CONTROL_DEFAULTS.font
    updateParticleCharacters()

    set({
      density: PARTICLE_CONTROL_DEFAULTS.density,
      radius: PARTICLE_CONTROL_DEFAULTS.radius,
      speed: PARTICLE_CONTROL_DEFAULTS.speed,
      particleSize: PARTICLE_CONTROL_DEFAULTS.particleSize,
      shape: PARTICLE_CONTROL_DEFAULTS.shape,
      interaction: PARTICLE_CONTROL_DEFAULTS.interaction,
      characters: PARTICLE_CONTROL_DEFAULTS.characters,
      font: PARTICLE_CONTROL_DEFAULTS.font,
    })
  },
  randomize: () => {
    const nextDensity = clamp(Math.round(4 + Math.random() * 20), 2, 32)
    const nextSize = clamp(parseFloat((0.8 + Math.random() * 9).toFixed(1)), 0.5, 15)
    const nextRadius = clamp(Math.round(80 + Math.random() * 520), 40, 900)
    const nextSpeed = clamp(Math.round(4 + Math.random() * 80), 1, 120)
    const nextShape: ParticleShape = ['circle', 'square', 'character'][Math.floor(Math.random() * 3)] as ParticleShape
    const nextInteraction: InteractionMode = Math.random() > 0.5 ? 'repel' : 'attract'
    const charSets = ['0123456789', 'abcdef', '∆≈≠', '?', '★☆✦', 'code']
    const nextFont = PARTICLE_FONT_OPTIONS[Math.floor(Math.random() * PARTICLE_FONT_OPTIONS.length)]
    const nextChars = charSets[Math.floor(Math.random() * charSets.length)]

    particleState.particleDensity = nextDensity
    particleState.mouse.radius = nextRadius
    particleState.mouseEffectSpeedFactor = nextSpeed
    particleState.particleSize = nextSize
    particleState.particleShape = nextShape
    particleState.interactionMode = nextInteraction
    particleState.particleCharacter = nextChars
    particleState.particleFont = nextFont
    updateParticleCharacters()

    set({
      density: nextDensity,
      radius: nextRadius,
      speed: nextSpeed,
      particleSize: nextSize,
      shape: nextShape,
      interaction: nextInteraction,
      characters: nextChars,
      font: nextFont,
    })
  },
}))
