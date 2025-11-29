import type { JSZipConstructor } from './features/recording/jszip-provider'
import { createJSZipInstance } from './features/recording/jszip-provider'
import { particleState } from './core/state'
import { createImageParticleDefinitions } from './core/image-loader'
import { createParticleFromDefinition } from './core/particles'
import { drawFrame } from './rendering/renderer'
import { startAnimationLoop } from './animation/loop'
import { initializeControls } from './ui/controls'

let jszipCtor: JSZipConstructor | null = null

function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const parent = canvas.parentElement
  const rect = parent?.getBoundingClientRect()
  const width = rect?.width && rect.width > 0 ? rect.width : 800
  const height = rect?.height && rect.height > 0 ? rect.height : 600

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  return ctx
}

function createParticlesFromImage(img: HTMLImageElement): void {
  const definitions = createImageParticleDefinitions(img)

  const particles = definitions.map((def) => createParticleFromDefinition(def))
  particleState.particles = particles
}

function loadPlaceholderImage(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const img = new Image()
  img.onload = () => {
    createParticlesFromImage(img)
    drawFrame({
      ctx,
      canvas,
    })
  }
  img.src = '/img-placeholder/1.jpeg'
}

function wireImageUpload(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const input = document.getElementById('imageUpload') as HTMLInputElement | null
  if (!input) {return}

  input.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement
    const file = target.files && target.files[0]
    if (!file) {return}

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        createParticlesFromImage(img)
        drawFrame({
          ctx,
          canvas,
        })
      }
      if (typeof reader.result === 'string') {
        img.src = reader.result
      }
    }
    reader.readAsDataURL(file)
    target.value = ''
  })
}

export function bootstrapParticle(): void {
  if (typeof window !== 'undefined' && jszipCtor === null) {
    jszipCtor = createJSZipInstance()
  }
  // TODO: implement particle experiment logic in TypeScript modules under src/projects/particle

  const canvas = document.getElementById('particleCanvas') as HTMLCanvasElement | null
  if (!canvas) {return}

  const ctx = setupCanvas(canvas)
  if (!ctx) {return}

   particleState.ctx = ctx
   initializeControls()
   startAnimationLoop(canvas, ctx)

  loadPlaceholderImage(canvas, ctx)
  wireImageUpload(canvas, ctx)
}

if (typeof window !== 'undefined') {
  bootstrapParticle()
}
