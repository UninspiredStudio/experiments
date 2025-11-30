import { gridState, noise3D } from './core/state'
import type { GridCanvasContext } from './core/canvas'
import { updateGridParams } from './core/canvas'
import { INITIAL_CANVAS_SIZE, MAX_INTERNAL_RESOLUTION } from './constants'
import { startBackgroundAnimation, stopAllAnimations } from './animation/sequence'
import { useGridControlsStore } from './store/useGridControlsStore'
import { DEFAULT_PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGES } from '@/config/assets'

export interface GridBootstrapOptions {
  canvas: HTMLCanvasElement
  hiddenBgCanvas: HTMLCanvasElement
}

function setupCanvasDimensions(canvas: HTMLCanvasElement, hiddenBgCanvas: HTMLCanvasElement): void {
  const size = Math.min(INITIAL_CANVAS_SIZE, MAX_INTERNAL_RESOLUTION)
  canvas.width = size
  canvas.height = size
  hiddenBgCanvas.width = size
  hiddenBgCanvas.height = size
}

function resizeCanvasToImage(
  canvas: HTMLCanvasElement,
  hiddenBgCanvas: HTMLCanvasElement,
  img: HTMLImageElement,
): void {
  const imgWidth = img.naturalWidth || img.width
  const imgHeight = img.naturalHeight || img.height

  if (!imgWidth || !imgHeight) {
    return
  }

  const aspectRatio = imgWidth / imgHeight

  let targetWidth = imgWidth
  let targetHeight = imgHeight

  if (targetWidth > MAX_INTERNAL_RESOLUTION) {
    targetWidth = MAX_INTERNAL_RESOLUTION
    targetHeight = targetWidth / aspectRatio
  }

  if (targetHeight > MAX_INTERNAL_RESOLUTION) {
    targetHeight = MAX_INTERNAL_RESOLUTION
    targetWidth = targetHeight * aspectRatio
  }

  const width = Math.round(targetWidth)
  const height = Math.round(targetHeight)

  canvas.width = width
  canvas.height = height
  hiddenBgCanvas.width = width
  hiddenBgCanvas.height = height
}

function loadDefaultImages(
  canvas: HTMLCanvasElement,
  hiddenBgCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): void {
  const hiddenCtx = hiddenBgCanvas.getContext('2d', { willReadFrequently: true })
  if (!hiddenCtx) {return}

  const bgImg = new Image()
  bgImg.onload = () => {
    gridState.bgImage = bgImg
    gridState.bgImageForDrawing = bgImg

    resizeCanvasToImage(canvas, hiddenBgCanvas, bgImg)

    hiddenCtx.clearRect(0, 0, hiddenBgCanvas.width, hiddenBgCanvas.height)
    hiddenCtx.drawImage(bgImg, 0, 0, hiddenBgCanvas.width, hiddenBgCanvas.height)
    gridState.bgPixelData = null

    updateGridParams(gridState, canvas, gridState.gridAmount)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
    useGridControlsStore.getState().hydrateFromGrid(gridState)
  }
  bgImg.src = DEFAULT_PLACEHOLDER_IMAGE

  const defaultCellPaths = PLACEHOLDER_IMAGES.slice(1)

  Promise.all(
    defaultCellPaths.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error(`Failed to load default cell image: ${src}`))
          img.src = src
        }),
    ),
  )
    .then((images) => {
      gridState.cellImages = images
      gridState.assignedCellData.clear()
    })
    .catch(() => {})
}

export function bootstrapGridApp(options: GridBootstrapOptions): () => void {
  const { canvas, hiddenBgCanvas } = options
  const ctx = canvas.getContext('2d')
  if (!ctx) { return () => {} }

  setupCanvasDimensions(canvas, hiddenBgCanvas)

  loadDefaultImages(canvas, hiddenBgCanvas, ctx)

  const initialContext: GridCanvasContext = {
    ctx,
    canvas,
  }

  updateGridParams(gridState, canvas, gridState.gridAmount)
  useGridControlsStore.getState().hydrateFromGrid(gridState)

  startBackgroundAnimation(gridState, initialContext, noise3D)

  const handleBeforeUnload = () => {
    stopAllAnimations(gridState, false)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  return () => {
    stopAllAnimations(gridState, false)
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }
}

// Legacy bootstrap removed; React handles grid UI wiring.
