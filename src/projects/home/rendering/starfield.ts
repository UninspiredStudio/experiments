import { getCssVariable, hexToRgb } from '@shared/utils/color'

interface Star {
  x: number
  y: number
  z: number
  pz: number
}

function resetStarPosition(star: Star, width: number, height: number): void {
  star.z = Math.random() * width
  const initialFactor = width / star.z
  star.x = (Math.random() - 0.5) * width * 1.5 * initialFactor
  star.y = (Math.random() - 0.5) * height * 1.5 * initialFactor
  star.pz = star.z
}

function createStar(width: number, height: number): Star {
  const star: Star = {
    x: 0,
    y: 0,
    z: 0,
    pz: 0,
  }

  resetStarPosition(star, width, height)
  return star
}

function updateStar(star: Star, warpSpeed: number, width: number, height: number): void {
  star.z -= warpSpeed * 5
  if (star.z < 1) {
    resetStarPosition(star, width, height)
  }
}

function drawStar(
  star: Star,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  starColor: string,
): void {
  if (star.z <= 0) {
    return
  }

  const factor = width / star.z
  const sx = star.x * factor + width / 2
  const sy = star.y * factor + height / 2

  const radius = Math.max(0.1, (1 - star.z / width) * 2.5)

  if (sx + radius < 0 || sx - radius > width || sy + radius < 0 || sy - radius > height) {
    return
  }

  ctx.fillStyle = starColor
  ctx.beginPath()
  ctx.arc(sx, sy, radius, 0, Math.PI * 2)
  ctx.fill()

  if (star.pz <= 0) {
    star.pz = star.z
    return
  }

  const previousFactor = width / star.pz
  const px = star.x * previousFactor + width / 2
  const py = star.y * previousFactor + height / 2

  if (Math.abs(sx - px) > 0.1 || Math.abs(sy - py) > 0.1) {
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(sx, sy)

    const opacity = Math.min(0.8, 1 - star.z / width)
    ctx.strokeStyle = `rgba(200, 200, 255, ${opacity})`
    ctx.lineWidth = radius * 1.2
    ctx.stroke()
  }

  star.pz = star.z
}

export interface StarfieldController {
  start(): void
  stop(): void
  setWarpSpeed(value: number): void
  getWarpSpeed(): number
  triggerVisibilityRamp(): void
}

export interface StarfieldOptions {
  canvas: HTMLCanvasElement
  numStars?: number
  baseWarpSpeed?: number
  starAnimationDurationMs?: number
}

export function createStarfield(options: StarfieldOptions): StarfieldController {
  const { canvas, numStars = 1500, baseWarpSpeed = 0.2, starAnimationDurationMs = 1000 } = options

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  if (ctx === null) {
    throw new Error('2D rendering context not available for starfield canvas')
  }

  let width = 0
  let height = 0
  let stars: Star[] = []
  let currentWarpSpeed = baseWarpSpeed
  let animationFrameId: number | null = null
  let visibleStarsRatio = 0
  let starAnimationStartTime: number | null = null

  const resizeHandler = (): void => {
    init()
  }

  function init(): void {
    visibleStarsRatio = 0
    starAnimationStartTime = null

    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight

    stars = []
    for (let i = 0; i < numStars; i += 1) {
      const star = createStar(width, height)
      stars.push(star)
    }
  }

  function animate(): void {
    if (starAnimationStartTime !== null) {
      const elapsed = performance.now() - starAnimationStartTime
      visibleStarsRatio = Math.min(1, elapsed / starAnimationDurationMs)
      if (visibleStarsRatio === 1) {
        starAnimationStartTime = null
      }
    }

    const bgCanvasColorHex = getCssVariable(document.documentElement, '--us-bg-canvas') || '#000000'
    const bgCanvasRgb = hexToRgb(bgCanvasColorHex) ?? { r: 0, g: 0, b: 0 }

    const clearAlpha = Math.min(0.5, 0.1 + currentWarpSpeed * 0.05)
    ctx.fillStyle = `rgba(${bgCanvasRgb.r}, ${bgCanvasRgb.g}, ${bgCanvasRgb.b}, ${clearAlpha})`
    ctx.fillRect(0, 0, width, height)

    const starColor = getCssVariable(document.documentElement, '--us-bg-invert-canvas') || 'white'

    const starsToDraw = Math.floor(numStars * visibleStarsRatio)
    for (let i = 0; i < starsToDraw; i += 1) {
      const star = stars[i]
      if (star !== undefined) {
        updateStar(star, currentWarpSpeed, width, height)
        drawStar(star, ctx, width, height, starColor)
      }
    }

    animationFrameId = window.requestAnimationFrame(animate)
  }

  function start(): void {
    if (animationFrameId !== null) {
      return
    }

    init()
    animationFrameId = window.requestAnimationFrame(animate)
    window.addEventListener('resize', resizeHandler)
  }

  function stop(): void {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    window.removeEventListener('resize', resizeHandler)
  }

  function setWarpSpeed(value: number): void {
    currentWarpSpeed = value
  }

  function getWarpSpeed(): number {
    return currentWarpSpeed
  }

  function triggerVisibilityRamp(): void {
    if (visibleStarsRatio >= 1 || starAnimationStartTime !== null) {
      return
    }

    starAnimationStartTime = performance.now()
  }

  return {
    start,
    stop,
    setWarpSpeed,
    getWarpSpeed,
    triggerVisibilityRamp,
  }
}
