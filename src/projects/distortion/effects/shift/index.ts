// Shift mode helper functions will live here.

export type ShiftDirection = 'horizontal' | 'vertical' | 'radial'

export interface ShiftParams {
  radius: number
  intensity: number
  fragmentation: number
  brightnessInfluence: number
  direction: ShiftDirection
  isPixelDeleteEnabled: boolean
  pixelDeleteThreshold: number
  isBrightnessInfluenceDeleteEnabled: boolean
  brightnessInfluenceDeleteThreshold: number
}

export interface ShiftEffectDeps {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  getOriginalImageData: () => ImageData | null
  getParams: () => ShiftParams
}

export interface ShiftEffect {
  apply(effectX: number, effectY: number): void
}

export function createShiftEffect(deps: ShiftEffectDeps): ShiftEffect {
  const { canvas, ctx, getOriginalImageData, getParams } = deps

  function apply(effectX: number, effectY: number): void {
    const originalImageData = getOriginalImageData()
    if (!originalImageData) {return}

    const width = canvas.width
    const height = canvas.height
    const distortedImageData = ctx.createImageData(width, height)
    const data = distortedImageData.data
    const originalData = originalImageData.data

    const {
      radius,
      intensity,
      fragmentation,
      brightnessInfluence,
      direction,
      isPixelDeleteEnabled,
      pixelDeleteThreshold,
      isBrightnessInfluenceDeleteEnabled,
      brightnessInfluenceDeleteThreshold,
    } = getParams()

    const radiusSq = radius * radius
    data.set(originalData)

    const startX = Math.max(0, Math.floor(effectX - radius))
    const endX = Math.min(width, Math.ceil(effectX + radius))
    const startY = Math.max(0, Math.floor(effectY - radius))
    const endY = Math.min(height, Math.ceil(effectY + radius))

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const index = (y * width + x) * 4
        const dx = x - effectX
        const dy = y - effectY
        const distSq = dx * dx + dy * dy
        if (distSq < radiusSq && distSq > 0) {
          const distance = Math.sqrt(distSq)
          const strength = 1 - distance / radius

          const rOrig = originalData[index]
          const gOrig = originalData[index + 1]
          const bOrig = originalData[index + 2]
          const brightness = (rOrig + gOrig + bOrig) / (3 * 255)

          const brightnessComp = strength * (brightness - 0.5) * intensity * 2
          const brightnessInfluenceOffset = Math.abs(brightnessComp * brightnessInfluence)

          if (isPixelDeleteEnabled && brightness < pixelDeleteThreshold) {
            data[index + 3] = 0
            continue
          }
          if (isBrightnessInfluenceDeleteEnabled && brightnessInfluenceOffset > brightnessInfluenceDeleteThreshold) {
            data[index + 3] = 0
            continue
          }

          const randomComp = strength * (Math.random() - 0.5) * fragmentation * 2
          const totalOffset = brightnessComp * brightnessInfluence + randomComp
          let srcX = x
          let srcY = y
          if (direction === 'horizontal') {srcX = x + totalOffset}
          else if (direction === 'vertical') {srcY = y + totalOffset}
          else if (direction === 'radial') {
            const norm = distance === 0 ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance }
            srcX = x + norm.x * totalOffset
            srcY = y + norm.y * totalOffset
          }
          srcX = Math.max(0, Math.min(width - 1, Math.floor(srcX)))
          srcY = Math.max(0, Math.min(height - 1, Math.floor(srcY)))
          const srcIdx = (srcY * width + srcX) * 4
          data[index] = originalData[srcIdx]
          data[index + 1] = originalData[srcIdx + 1]
          data[index + 2] = originalData[srcIdx + 2]
          data[index + 3] = originalData[srcIdx + 3]
        }
      }
    }

    ctx.putImageData(distortedImageData, 0, 0)
  }

  return {
    apply,
  }
}
