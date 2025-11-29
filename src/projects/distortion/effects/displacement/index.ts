// Displacement mode helper functions will live here.

import type { PersistentPoint } from '../../types'

export type DisplacementDirection = 'horizontal' | 'vertical' | 'both' | 'radial'

export interface DisplacementParams {
  radius: number
  intensity: number
  displacementScale: number
  direction: DisplacementDirection
}

export interface DisplacementEffectDeps {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  getOriginalImageData: () => ImageData | null
  getDisplacementImageData: () => ImageData | null
  getParams: () => DisplacementParams
}

export interface DisplacementEffect {
  apply(effectX: number, effectY: number): void
  applyPersistent(points: PersistentPoint[]): void
}

export function createDisplacementEffect(deps: DisplacementEffectDeps): DisplacementEffect {
  const { canvas, ctx, getOriginalImageData, getDisplacementImageData, getParams } = deps

  function apply(effectX: number, effectY: number): void {
    const originalImageData = getOriginalImageData()
    const displacementImageData = getDisplacementImageData()
    if (!originalImageData || !displacementImageData) {return}

    const width = canvas.width
    const height = canvas.height

    const output = ctx.createImageData(width, height)
    const outData = output.data
    const srcData = originalImageData.data
    outData.set(srcData)

    const { radius, intensity, displacementScale, direction } = getParams()
    if (radius <= 0) {
      ctx.putImageData(originalImageData, 0, 0)
      return
    }

    const radiusSq = radius * radius

    const dispWidth = displacementImageData.width
    const dispHeight = displacementImageData.height
    const dispData = displacementImageData.data

    const startX = Math.max(0, Math.floor(effectX - radius))
    const endX = Math.min(width, Math.ceil(effectX + radius))
    const startY = Math.max(0, Math.floor(effectY - radius))
    const endY = Math.min(height, Math.ceil(effectY + radius))

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const idx = (y * width + x) * 4
        const dx = x - effectX
        const dy = y - effectY
        const distSq = dx * dx + dy * dy
        if (distSq < radiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq)
          const strength = 1 - dist / radius

          const u = Math.floor((x / width) * dispWidth)
          const v = Math.floor((y / height) * dispHeight)
          const dispIdx = (v * dispWidth + u) * 4
          const displacement = dispData[dispIdx] / 255
          const dispAmt = (displacement - 0.5) * intensity * displacementScale * strength

          let offX = 0
          let offY = 0
          if (direction === 'horizontal') {
            offX = dispAmt
          } else if (direction === 'vertical') {
            offY = dispAmt
          } else if (direction === 'both') {
            offX = dispAmt
            offY = dispAmt
          } else if (direction === 'radial') {
            const normX = dx / dist
            const normY = dy / dist
            offX = normX * dispAmt
            offY = normY * dispAmt
          }

          const srcX = Math.max(0, Math.min(width - 1, Math.floor(x + offX)))
          const srcY = Math.max(0, Math.min(height - 1, Math.floor(y + offY)))
          const srcIndex = (srcY * width + srcX) * 4
          outData[idx] = srcData[srcIndex]
          outData[idx + 1] = srcData[srcIndex + 1]
          outData[idx + 2] = srcData[srcIndex + 2]
          outData[idx + 3] = srcData[srcIndex + 3]
        }
      }
    }

    ctx.putImageData(output, 0, 0)
  }

  function applyPersistent(points: PersistentPoint[]): void {
    if (!points.length) {return}
    const originalImageData = getOriginalImageData()
    const displacementImageData = getDisplacementImageData()
    if (!originalImageData || !displacementImageData) {return}

    points.forEach(point => {
      apply(point.x, point.y)
    })
  }

  return {
    apply,
    applyPersistent,
  }
}
