export interface RGB {
  r: number
  g: number
  b: number
}

export interface ParticleDefinition {
  x: number
  y: number
  initialX: number
  initialY: number
  color: RGB
}

export interface Particle {
  x: number
  y: number
  initialX: number
  initialY: number
  color: RGB
  density: number
  currentAlpha: number
  isRepelled: boolean
  assignedCharacter: string
  update: () => void
  draw: (ctx: CanvasRenderingContext2D) => void
}
