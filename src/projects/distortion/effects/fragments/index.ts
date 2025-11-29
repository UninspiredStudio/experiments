// Fragments mode helper functions will live here.

export interface FragmentsParams {
  radius: number
  intensity: number
  blockSize: number
  isPersistentMode: boolean
  isAnimationEnabled: boolean
}

export interface FragmentsEffectDeps {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  getOriginalImageData: () => ImageData | null
  getParams: () => FragmentsParams
}

export interface FragmentsEffect {
  apply(effectX: number, effectY: number): void
}

export function createFragmentsEffect(deps: FragmentsEffectDeps): FragmentsEffect {
  const { canvas, ctx, getOriginalImageData, getParams } = deps

  function copyBlock(
    src: Uint8ClampedArray,
    dest: Uint8ClampedArray,
    width: number,
    height: number,
    sx: number,
    sy: number,
    dx: number,
    dy: number,
    block: number,
  ): void {
    const maxX = Math.min(block, width - sx)
    const maxY = Math.min(block, height - sy)
    for (let y = 0; y < maxY; y += 1) {
      for (let x = 0; x < maxX; x += 1) {
        const srcIndex = ((sy + y) * width + (sx + x)) * 4
        const destIndex = ((dy + y) * width + (dx + x)) * 4
        dest[destIndex] = src[srcIndex]
        dest[destIndex + 1] = src[srcIndex + 1]
        dest[destIndex + 2] = src[srcIndex + 2]
        dest[destIndex + 3] = src[srcIndex + 3]
      }
    }
  }

  function apply(effectX: number, effectY: number): void {
    const originalImageData = getOriginalImageData()
    if (!originalImageData) {return}

    const width = canvas.width
    const height = canvas.height

    const { radius, intensity, blockSize, isPersistentMode, isAnimationEnabled } = getParams()

    const sourceImageData = isPersistentMode ? ctx.getImageData(0, 0, width, height) : originalImageData

    const output = ctx.createImageData(width, height)
    const outData = output.data
    const srcData = sourceImageData.data
    outData.set(srcData)

    const radiusSq = radius * radius
    if (blockSize < 1) {return}

    const startX = Math.max(0, Math.floor(effectX - radius))
    const endX = Math.min(width, Math.ceil(effectX + radius))
    const startY = Math.max(0, Math.floor(effectY - radius))
    const endY = Math.min(height, Math.ceil(effectY + radius))

    for (let y = startY; y < endY; y += blockSize) {
      for (let x = startX; x < endX; x += blockSize) {
        const centerX = x + blockSize / 2
        const centerY = y + blockSize / 2
        const dx = centerX - effectX
        const dy = centerY - effectY
        const distSq = dx * dx + dy * dy
        if (distSq < radiusSq) {
          const dist = Math.sqrt(distSq)
          const strength = 1 - dist / radius

          let offsetX: number
          let offsetY: number
          if (isPersistentMode) {
            offsetX = Math.floor(strength * Math.sin(x * 0.1) * intensity * 2)
            offsetY = Math.floor(strength * Math.cos(y * 0.1) * intensity * 2)
          } else if (isAnimationEnabled) {
            const time = Date.now() * 0.002
            offsetX = Math.floor(strength * Math.sin(time + x * 0.1) * intensity * 2)
            offsetY = Math.floor(strength * Math.cos(time + y * 0.1) * intensity * 2)
          } else {
            offsetX = Math.floor(strength * Math.sin(x * 0.1) * intensity * 2)
            offsetY = Math.floor(strength * Math.cos(y * 0.1) * intensity * 2)
          }

          const srcX = Math.max(0, Math.min(width - blockSize, x + offsetX))
          const srcY = Math.max(0, Math.min(height - blockSize, y + offsetY))
          copyBlock(srcData, outData, width, height, srcX, srcY, x, y, blockSize)
        }
      }
    }

    ctx.putImageData(output, 0, 0)
  }

  return {
    apply,
  }
}
