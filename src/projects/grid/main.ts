import { gridState, noise3D } from './core/state'
import type { GridCanvasContext } from './core/canvas'
import { updateGridParams } from './core/canvas'
import { INITIAL_CANVAS_SIZE, MAX_INTERNAL_RESOLUTION } from './constants'
import { initGridUI, initDefaultControls } from './ui/controls'
import { startBackgroundAnimation, stopAllAnimations } from './animation/sequence'

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

    const bgPreviewImage = document.getElementById('bgPreviewImage') as HTMLImageElement | null
    const bgPreviewContainer = document.getElementById('bgPreviewContainer') as HTMLDivElement | null
    if (bgPreviewImage && bgPreviewContainer) {
      bgPreviewImage.src = bgImg.src
      bgPreviewContainer.style.display = 'block'
    }

    updateGridParams(gridState, canvas, gridState.gridAmount)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
  }
  bgImg.src = '/img-placeholder/1.jpeg'

  const defaultCellPaths = ['/img-placeholder/2.jpeg', '/img-placeholder/3.jpeg', '/img-placeholder/4.jpeg', '/img-placeholder/5.jpeg']
  const cellPreviewContainer = document.getElementById('cellPreviewContainer') as HTMLDivElement | null

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

      if (cellPreviewContainer) {
        cellPreviewContainer.innerHTML = ''
        images.forEach((img) => {
          const wrapper = document.createElement('div')
          wrapper.className = 'preview-item'

          const element = document.createElement('img')
          element.src = img.src
          element.className = 'preview-image'

          wrapper.appendChild(element)
          cellPreviewContainer.appendChild(wrapper)
        })

        cellPreviewContainer.style.display = 'block'
      }
    })
    .catch(() => {})
}

function wireFileInputs(
  canvas: HTMLCanvasElement,
  hiddenBgCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): void {
  const hiddenCtx = hiddenBgCanvas.getContext('2d', { willReadFrequently: true })
  const bgInput = document.getElementById('bgUpload') as HTMLInputElement | null
  const cellInput = document.getElementById('cellImgUpload') as HTMLInputElement | null
  const bgPreviewImage = document.getElementById('bgPreviewImage') as HTMLImageElement | null
  const bgPreviewContainer = document.getElementById('bgPreviewContainer') as HTMLDivElement | null
  const cellPreviewContainer = document.getElementById('cellPreviewContainer') as HTMLDivElement | null
  const bgDeleteButton = document.getElementById('bgDeleteButton') as HTMLButtonElement | null

  if (bgInput && hiddenCtx) {
    bgInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement
      const file = target.files && target.files[0]
      if (!file) {return}

      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          gridState.bgImage = img
          gridState.bgImageForDrawing = img

          resizeCanvasToImage(canvas, hiddenBgCanvas, img)
          hiddenCtx.clearRect(0, 0, hiddenBgCanvas.width, hiddenBgCanvas.height)
          hiddenCtx.drawImage(img, 0, 0, hiddenBgCanvas.width, hiddenBgCanvas.height)
          gridState.bgPixelData = null

          if (bgPreviewImage && bgPreviewContainer) {
            bgPreviewImage.src = img.src
            bgPreviewContainer.style.display = 'block'
          }

          updateGridParams(gridState, canvas, gridState.gridAmount)
        }

        if (typeof reader.result === 'string') {
          img.src = reader.result
        }
      }

      reader.readAsDataURL(file)
      target.value = ''
    })
  }

  if (cellInput) {
    cellInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement
      const files = target.files
      if (!files || files.length === 0) {return}

      const promises: Promise<HTMLImageElement>[] = []

      for (const file of Array.from(files)) {
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error(`Failed to load cell image: ${file.name}`))

            if (typeof reader.result === 'string') {
              img.src = reader.result
            }
          }
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
          reader.readAsDataURL(file)
        })

        promises.push(promise)
      }

      void Promise.allSettled(promises).then((results) => {
        const loadedImages: HTMLImageElement[] = []
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            loadedImages.push(result.value)
          }
        })

        gridState.cellImages = loadedImages
        gridState.assignedCellData.clear()

        if (cellPreviewContainer) {
          cellPreviewContainer.innerHTML = ''

          gridState.cellImages.forEach((img, index) => {
            const wrapper = document.createElement('div')
            wrapper.className = 'preview-item'

            const element = document.createElement('img')
            element.src = img.src
            element.alt = `Cell image ${index + 1}`
            element.className = 'preview-image'

            wrapper.appendChild(element)
            cellPreviewContainer.appendChild(wrapper)
          })

          cellPreviewContainer.style.display = gridState.cellImages.length > 0 ? 'block' : 'none'
        }
      })
    })
  }

  if (bgDeleteButton) {
    bgDeleteButton.addEventListener('click', () => {
      gridState.bgImage = null
      gridState.bgImageForDrawing = null
      gridState.bgPixelData = null

      if (bgPreviewContainer) {
        bgPreviewContainer.style.display = 'none'
      }

      if (hiddenCtx) {
        hiddenCtx.clearRect(0, 0, hiddenBgCanvas.width, hiddenBgCanvas.height)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
    })
  }
}

function bootstrapGrid() {
  if (typeof window === 'undefined') {return}

  const canvas = document.getElementById('noiseCanvas') as HTMLCanvasElement | null
  const hiddenBgCanvas = document.getElementById('hiddenBgCanvas') as HTMLCanvasElement | null
  const loadingEl = document.getElementById('loading')

  if (!canvas || !hiddenBgCanvas) {
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {return}

  setupCanvasDimensions(canvas, hiddenBgCanvas)

  if (loadingEl) {
    loadingEl.style.display = 'none'
  }

  console.log('Grid experiment bootstrap', {
    gridStateInitialized: gridState !== null && gridState !== undefined,
    hasNoise3D: typeof noise3D === 'function',
  })

  wireFileInputs(canvas, hiddenBgCanvas, ctx)
  loadDefaultImages(canvas, hiddenBgCanvas, ctx)

  initGridUI(gridState, canvas, hiddenBgCanvas, ctx, noise3D)

  const initialContext: GridCanvasContext = {
    ctx,
    canvas,
  }

  initDefaultControls(gridState, canvas, initialContext)

  startBackgroundAnimation(gridState, initialContext, noise3D)

  window.addEventListener('beforeunload', () => {
    stopAllAnimations(gridState, false)
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapGrid)
} else {
  bootstrapGrid()
}
