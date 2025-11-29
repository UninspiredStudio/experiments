import { particleState } from '../core/state'
import { drawFrame } from '../rendering/renderer'
import { PARTICLE_ANIMATION_FPS } from '../constants/animation'

let animationFrameId: number | null = null
let lastTimestamp: number | null = null
const FRAME_INTERVAL_MS = 1000 / PARTICLE_ANIMATION_FPS

interface LoopContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

let loopContext: LoopContext | null = null

export function startAnimationLoop(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  if (typeof window === 'undefined') {
    return
  }

  if (animationFrameId !== null) {
    return
  }

  loopContext = { canvas, ctx }
  particleState.ctx = ctx
  lastTimestamp = null

  const step = (timestamp: number) => {
    if (!loopContext) {
      animationFrameId = null
      return
    }

    if (lastTimestamp === null) {
      lastTimestamp = timestamp
    }

    const deltaMs = timestamp - lastTimestamp

    if (deltaMs >= FRAME_INTERVAL_MS) {
      lastTimestamp = timestamp

      for (const particle of particleState.particles) {
        particle.update()
      }

      drawFrame({
        ctx: loopContext.ctx,
        canvas: loopContext.canvas,
      })
    }

    animationFrameId = window.requestAnimationFrame(step)
  }

  animationFrameId = window.requestAnimationFrame(step)
}

export function stopAnimationLoop(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  loopContext = null
  lastTimestamp = null
}
