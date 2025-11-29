import { createStarfield } from './rendering/starfield'
import { initHomePageTransitions } from './ui/transitions'

export function initHomeLanding(): void {
  const canvasElement = document.getElementById('warpCanvas')

  if (!(canvasElement instanceof HTMLCanvasElement)) {
    return
  }

  const starfield = createStarfield({ canvas: canvasElement })

  starfield.start()
  initHomePageTransitions(starfield)
}

function bootstrapHome(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initHomeLanding()
    })
  } else {
    initHomeLanding()
  }
}

bootstrapHome()

export default initHomeLanding
