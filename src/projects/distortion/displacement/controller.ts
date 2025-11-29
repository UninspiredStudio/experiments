import { coordsFromMouse, loadImageFromFile } from '../core/image-loader'
import {
  createDisplacementEffect,
  type DisplacementDirection,
  type DisplacementEffect,
} from '../effects/displacement'
import { startCanvasRecording } from '../features/recording/recorder'
import type { PersistentPoint } from '../types'

export interface DisplacementControllerState {
  persistentEnabled: boolean
  pointCount: number
}

export interface DisplacementController {
  setRadius(value: number): void
  setIntensity(value: number): void
  setDisplacementScale(value: number): void
  setDirection(direction: DisplacementDirection): void
  setPersistentMode(enabled: boolean): void
  clearPoints(): void
  addPersistentPoint(x: number, y: number): void
  handlePointerMove(event: MouseEvent): void
  handlePointerLeave(): void
  handleCanvasClick(event: MouseEvent): void
  loadImageFile(file: File): Promise<void>
  loadDisplacementMapFile(file: File): Promise<void>
  startRecording(durationSeconds: number): void
  destroy(): void
}

interface DisplacementControllerOptions {
  canvas: HTMLCanvasElement
  onStateChange?: (state: DisplacementControllerState) => void
}

export function createDisplacementController(options: DisplacementControllerOptions): DisplacementController {
  const { canvas, onStateChange } = options
  const maybeCtx = canvas.getContext('2d', { willReadFrequently: true })
  if (!maybeCtx) {
    throw new Error('Displacement controller: 2D context unavailable')
  }
  const ctx = maybeCtx

  let originalImageData: ImageData | null = null
  let displacementImageData: ImageData | null = null

  let radius = 800
  let intensity = 30
  let displacementScale = 1.0
  let direction: DisplacementDirection = 'horizontal'
  let persistentEnabled = false

  const persistentPoints: PersistentPoint[] = []
  let persistentAnimationId: number | null = null

  const effect: DisplacementEffect = createDisplacementEffect({
    canvas,
    ctx,
    getOriginalImageData: () => originalImageData,
    getDisplacementImageData: () => displacementImageData,
    getParams: () => ({
      radius,
      intensity,
      displacementScale,
      direction,
    }),
  })

  function notify(): void {
    onStateChange?.({
      persistentEnabled,
      pointCount: persistentPoints.length,
    })
  }

  function drawPointIndicators(): void {
    ctx.fillStyle = 'rgba(0,255,0,0.6)'
    persistentPoints.forEach(point => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  function stopPersistentAnimation(): void {
    if (persistentAnimationId !== null) {
      window.cancelAnimationFrame(persistentAnimationId)
      persistentAnimationId = null
    }
  }

  function startPersistentAnimation(): void {
    stopPersistentAnimation()
    const loop = () => {
      if (!persistentEnabled || !originalImageData || !displacementImageData) {
        return
      }
      ctx.putImageData(originalImageData, 0, 0)
      effect.applyPersistent(persistentPoints)
      drawPointIndicators()
      persistentAnimationId = window.requestAnimationFrame(loop)
    }
    persistentAnimationId = window.requestAnimationFrame(loop)
  }

  function updatePersistent(): void {
    if (persistentEnabled && persistentPoints.length > 0) {
      startPersistentAnimation()
    }
  }

  function clearPoints(): void {
    persistentPoints.length = 0
    stopPersistentAnimation()
    if (originalImageData) {
      ctx.putImageData(originalImageData, 0, 0)
    }
    notify()
  }

  async function loadImageFile(file: File): Promise<void> {
    originalImageData = null
    persistentPoints.length = 0
    notify()
    stopPersistentAnimation()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    canvas.width = 1
    canvas.height = 1

    const img = await loadImageFromFile(file)
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    try {
      originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    } catch {
      originalImageData = null
    }
  }

  async function loadDisplacementMapFile(file: File): Promise<void> {
    displacementImageData = null
    const img = await loadImageFromFile(file)
    const tmp = document.createElement('canvas')
    const tctx = tmp.getContext('2d', { willReadFrequently: true })
    if (!tctx) { return }
    tmp.width = img.naturalWidth
    tmp.height = img.naturalHeight
    tctx.drawImage(img, 0, 0)
    try {
      displacementImageData = tctx.getImageData(0, 0, tmp.width, tmp.height)
    } catch {
      displacementImageData = null
    }
  }

  function handlePointerMove(event: MouseEvent): void {
    if (!originalImageData || !displacementImageData || persistentEnabled) { return }
    const { x, y } = coordsFromMouse(canvas, event)
    effect.apply(x, y)
  }

  function handlePointerLeave(): void {
    if (!originalImageData || persistentEnabled) { return }
    ctx.putImageData(originalImageData, 0, 0)
  }

  function handleCanvasClick(event: MouseEvent): void {
    if (!originalImageData || !displacementImageData || !persistentEnabled) { return }
    const { x, y } = coordsFromMouse(canvas, event)
    persistentPoints.push({ x, y })
    notify()
    startPersistentAnimation()
  }

  function setPersistentMode(enabled: boolean): void {
    persistentEnabled = enabled
    if (!enabled) {
      stopPersistentAnimation()
      if (originalImageData) {
        ctx.putImageData(originalImageData, 0, 0)
      }
    } else if (persistentPoints.length > 0) {
      startPersistentAnimation()
    }
    notify()
  }

  function setRadius(value: number): void {
    radius = Math.max(0, value)
    updatePersistent()
  }

  function setIntensity(value: number): void {
    intensity = Math.max(0, value)
    updatePersistent()
  }

  function setDisplacementScale(value: number): void {
    displacementScale = Math.max(0.1, value)
    updatePersistent()
  }

  function setDirection(next: DisplacementDirection): void {
    direction = next
    updatePersistent()
  }

  function addPersistentPoint(x: number, y: number): void {
    persistentPoints.push({ x, y })
    notify()
    startPersistentAnimation()
  }

  function startRecording(durationSeconds: number): void {
    const ms = durationSeconds * 1000
    if (!Number.isFinite(ms) || ms <= 0) { return }
    startCanvasRecording(canvas, { durationMs: ms, fps: 60 })
  }

  function destroy(): void {
    stopPersistentAnimation()
  }

  return {
    setRadius,
    setIntensity,
    setDisplacementScale,
    setDirection,
    setPersistentMode,
    clearPoints,
    addPersistentPoint,
    handlePointerMove,
    handlePointerLeave,
    handleCanvasClick,
    loadImageFile,
    loadDisplacementMapFile,
    startRecording,
    destroy,
  }
}
