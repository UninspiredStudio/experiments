import { particleState } from '../core/state'

export interface ParticleRenderContext {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
}

export function drawFrame(context: ParticleRenderContext): void {
  const { ctx, canvas } = context

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const particle of particleState.particles) {
    particle.draw(ctx)
  }
}
