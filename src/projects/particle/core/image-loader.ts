import { domElements } from '../ui/elements'
import { particleState } from './state'
import type { ParticleDefinition } from '../types/particle'

const IMAGE_PADDING_FACTOR = 0.1

export function createImageParticleDefinitions(img: HTMLImageElement): ParticleDefinition[] {
  const canvas = domElements.canvas

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    return []
  }

  if (!img || img.width === 0 || img.height === 0) {
    return []
  }

  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })

  if (!tempCtx) {
    return []
  }

  const imgAspect = img.width / img.height
  const padding = IMAGE_PADDING_FACTOR
  const targetCanvasWidth = canvas.width * (1 - padding * 2)
  const targetCanvasHeight = canvas.height * (1 - padding * 2)

  let drawWidth: number
  let drawHeight: number

  if (imgAspect > targetCanvasWidth / targetCanvasHeight) {
    drawWidth = targetCanvasWidth
    drawHeight = drawWidth / imgAspect
  } else {
    drawHeight = targetCanvasHeight
    drawWidth = drawHeight * imgAspect
  }

  const offsetX = (canvas.width - drawWidth) / 2
  const offsetY = (canvas.height - drawHeight) / 2

  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height

  try {
    tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    const data = imageData.data
    const particleDefinitions: ParticleDefinition[] = []

    const density = particleState.particleDensity
    const alphaThreshold = particleState.particleAlphaThreshold
    const colorThreshold = particleState.particleColorThreshold

    for (let y = 0; y < tempCanvas.height; y += density) {
      for (let x = 0; x < tempCanvas.width; x += density) {
        const index = (y * tempCanvas.width + x) * 4
        const alpha = data[index + 3]
        const r = data[index]
        const g = data[index + 1]
        const b = data[index + 2]

        if (alpha > alphaThreshold) {
          const isBlackPixel = r <= 10 && g <= 10 && b <= 10
          const isColorPixel =
            r > colorThreshold || g > colorThreshold || b > colorThreshold

          if (isColorPixel || isBlackPixel) {
            const color = { r, g, b }
            particleDefinitions.push({ x, y, color, initialX: x, initialY: y })
          }
        }
      }
    }

    if (particleDefinitions.length === 0) {
      const relaxedAlphaThreshold = 25
      const relaxedColorThreshold = 1

      for (let y = 0; y < tempCanvas.height; y += density) {
        for (let x = 0; x < tempCanvas.width; x += density) {
          const index = (y * tempCanvas.width + x) * 4
          const alpha = data[index + 3]
          const r = data[index]
          const g = data[index + 1]
          const b = data[index + 2]

          if (alpha > relaxedAlphaThreshold) {
            const isBlackPixel = r <= 10 && g <= 10 && b <= 10
            const isColorPixel =
              r > relaxedColorThreshold ||
              g > relaxedColorThreshold ||
              b > relaxedColorThreshold

            if (isColorPixel || isBlackPixel) {
              const color = { r, g, b }
              particleDefinitions.push({ x, y, color, initialX: x, initialY: y })
            }
          }
        }
      }
    }

    return particleDefinitions
  } catch (error) {
    console.error('Error processing image data:', error)
    return []
  }
}

