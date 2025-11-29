export function robustModulo(value: number, modulus: number): number {
  if (modulus === 0 || !Number.isFinite(modulus)) {
    return 0
  }
  const positiveModulus = Math.abs(modulus)
  return ((value % positiveModulus) + positiveModulus) % positiveModulus
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function createJaggedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amplitude: number,
  freq: number,
): void {
  const safeFreq = freq <= 0 ? 0.001 : freq
  ctx.beginPath()
  ctx.moveTo(x, y)
  let cX = x
  let cY = y
  let s: number

  while (cX < x + w) {
    s = Math.min(1 / safeFreq, x + w - cX)
    cX += s
    ctx.lineTo(cX, y + (Math.random() - 0.5) * 2 * amplitude)
  }

  ctx.lineTo(x + w, y)

  while (cY < y + h) {
    s = Math.min(1 / safeFreq, y + h - cY)
    cY += s
    ctx.lineTo(x + w + (Math.random() - 0.5) * 2 * amplitude, cY)
  }

  ctx.lineTo(x + w, y + h)

  while (cX > x) {
    s = Math.min(1 / safeFreq, cX - x)
    cX -= s
    ctx.lineTo(cX, y + h + (Math.random() - 0.5) * 2 * amplitude)
  }

  ctx.lineTo(x, y + h)

  while (cY > y) {
    s = Math.min(1 / safeFreq, cY - y)
    cY -= s
    ctx.lineTo(x + (Math.random() - 0.5) * 2 * amplitude, cY)
  }

  ctx.lineTo(x, y)
  ctx.closePath()
}

export function drawTiledImageSection(
  targetCtx: CanvasRenderingContext2D,
  sourceImg: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  if (!sourceImg || sourceImg.width <= 0 || sourceImg.height <= 0 || sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) {
    return
  }

  const imgW = sourceImg.width
  const imgH = sourceImg.height

  let currentSX = robustModulo(sx, imgW)
  const currentSY = robustModulo(sy, imgH)

  targetCtx.save()
  targetCtx.clearRect(dx, dy, dw, dh)

  const scaleX = dw / sw
  const scaleY = dh / sh

  let remainingSW = sw
  let currentDX = dx

  while (remainingSW > 0) {
    const segmentW = Math.min(remainingSW, imgW - currentSX)
    const segmentDW = segmentW * scaleX

    let remainingSH = sh
    let currentSYSegment = currentSY
    let currentDY = dy

    while (remainingSH > 0) {
      const segmentH = Math.min(remainingSH, imgH - currentSYSegment)
      const segmentDH = segmentH * scaleY

      try {
        targetCtx.drawImage(
          sourceImg,
          currentSX,
          currentSYSegment,
          segmentW,
          segmentH,
          currentDX,
          currentDY,
          segmentDW,
          segmentDH,
        )
      } catch (e) {
         
        console.warn('Error in drawTiledImageSection drawImage:', e)
      }

      remainingSH -= segmentH
      currentSYSegment = (currentSYSegment + segmentH) % imgH
      currentDY += segmentDH
    }

    remainingSW -= segmentW
    currentSX = (currentSX + segmentW) % imgW
    currentDX += segmentDW
  }

  targetCtx.restore()
}
