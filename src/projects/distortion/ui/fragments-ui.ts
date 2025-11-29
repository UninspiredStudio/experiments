import { setupCustomSlider } from './fragments-sliders'
import { createFragmentsRecorder } from './fragments-recording'
import { coordsFromMouse } from '../core/image-loader'
import { createFragmentsEffect } from '../effects/fragments'

export function initFragmentsUI() {
  // TODO: move DOM lookups and event wiring from legacy fragments.js here
  const startRecordingBtn = document.getElementById('startRecordingBtn') as HTMLButtonElement | null
  const recordingStatus = document.getElementById('recordingStatus')
  const recordingDurationInput = document.getElementById('recordingDurationInput') as HTMLInputElement | null
  const imageLoader = document.getElementById('imageLoader') as HTMLInputElement | null
  const canvas = document.getElementById('imageCanvas') as HTMLCanvasElement
  const canvasContainer = document.querySelector('.canvas-container') as HTMLDivElement
  const radiusSlider = document.getElementById('radiusSlider') as HTMLInputElement | null
  const intensitySlider = document.getElementById('intensitySlider') as HTMLInputElement | null
  const blockSizeSlider = document.getElementById('blockSizeSlider') as HTMLInputElement | null
  const radiusValueSpan = document.getElementById('radiusValue')
  const intensityValueSpan = document.getElementById('intensityValue')
  const blockSizeValueSpan = document.getElementById('blockSizeValue')
  const animationToggle = document.getElementById('animationToggle') as HTMLInputElement | null
  const togglePersistentBtn = document.getElementById('togglePersistentBtn') as HTMLButtonElement | null
  const hoverModeBtn = document.getElementById('hoverModeBtn') as HTMLButtonElement | null
  const pointCountSpan = document.getElementById('pointCount')
  const clearPointsBtn = document.getElementById('clearPointsBtn') as HTMLButtonElement | null
  const saveImageBtn = document.getElementById('saveImageBtn') as HTMLButtonElement | null

  if (
    !startRecordingBtn ||
    !recordingStatus ||
    !recordingDurationInput ||
    !imageLoader ||
    !canvas ||
    !canvasContainer ||
    !radiusSlider ||
    !intensitySlider ||
    !blockSizeSlider ||
    !radiusValueSpan ||
    !intensityValueSpan ||
    !blockSizeValueSpan ||
    !animationToggle ||
    !togglePersistentBtn ||
    !hoverModeBtn ||
    !pointCountSpan ||
    !clearPointsBtn ||
    !saveImageBtn
  ) {
    throw new Error('Fragments UI: missing required DOM elements')
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  if (!ctx) {
    throw new Error('Fragments UI: 2D context not available')
  }

  const recorder = createFragmentsRecorder({
    canvas,
    startRecordingBtn,
    recordingStatus,
    recordingDurationInput,
  })

  let originalImageData: ImageData | null = null
  let img = new Image()

  let currentRadius = Number.parseFloat(radiusSlider.value)
  let currentIntensity = Number.parseFloat(intensitySlider.value)
  let currentBlockSize = Number.parseInt(blockSizeSlider.value, 10)

  let isPersistentMode = false
  let isAnimationEnabled = true
  const persistentPoints: { x: number; y: number }[] = []
  let persistentAnimationId: number | null = null

  const effect = createFragmentsEffect({
    canvas,
    ctx,
    getOriginalImageData: () => originalImageData,
    getParams: () => ({
      radius: currentRadius,
      intensity: currentIntensity,
      blockSize: currentBlockSize,
      isPersistentMode,
      isAnimationEnabled,
    }),
  })

  function updatePointCount(): void {
    if (!pointCountSpan) {
      return
    }
    pointCountSpan.textContent = String(persistentPoints.length)
  }

  setupCustomSlider(radiusSlider, radiusValueSpan, radiusSlider.min, radiusSlider.max, currentRadius, value => {
    currentRadius = Math.round(value)
    return currentRadius
  }, updatePersistent)

  setupCustomSlider(
    intensitySlider,
    intensityValueSpan,
    intensitySlider.min,
    intensitySlider.max,
    currentIntensity,
    value => {
      currentIntensity = Math.round(value)
      return currentIntensity
    },
    updatePersistent,
  )

  setupCustomSlider(
    blockSizeSlider,
    blockSizeValueSpan,
    blockSizeSlider.min,
    blockSizeSlider.max,
    currentBlockSize,
    value => {
      currentBlockSize = Math.round(value)
      return currentBlockSize
    },
    updatePersistent,
  )

  animationToggle.addEventListener('change', event => {
    const target = event.target as HTMLInputElement | null
    if (!target) {return}
    isAnimationEnabled = target.checked
    if (!isPersistentMode) {
      redrawCanvas()
    }
  })

  hoverModeBtn.addEventListener('click', () => {
    if (isPersistentMode) {
      isPersistentMode = false
      updateModeTabs()
      canvas.classList.remove('persistent-mode')
      if (originalImageData) {
        ctx.putImageData(originalImageData, 0, 0)
      }
    }
  })

  togglePersistentBtn.addEventListener('click', () => {
    isPersistentMode = !isPersistentMode
    updateModeTabs()
    canvas.classList.toggle('persistent-mode', isPersistentMode)

    if (!isPersistentMode) {
      stopPersistentAnimation()
      if (originalImageData) {
        ctx.putImageData(originalImageData, 0, 0)
      }
    } else if (persistentPoints.length > 0) {
      startPersistentAnimation()
    }
  })

  canvasContainer.addEventListener('mousemove', event => {
    if (!originalImageData || isPersistentMode) {return}
    const { x, y } = coordsFromMouse(canvas, event)
    effect.apply(x, y)
  })

  canvasContainer.addEventListener('mouseleave', () => {
    if (!originalImageData || isPersistentMode) {return}
    redrawCanvas()
  })

  canvas.addEventListener('click', event => {
    if (!originalImageData || !isPersistentMode) {return}
    const { x, y } = coordsFromMouse(canvas, event)
    persistentPoints.push({ x, y })
    updatePointCount()
    startPersistentAnimation()
  })

  clearPointsBtn.addEventListener('click', () => {
    persistentPoints.length = 0
    updatePointCount()
    stopPersistentAnimation()
    if (originalImageData) {
      ctx.putImageData(originalImageData, 0, 0)
    }
  })

  saveImageBtn.addEventListener('click', () => {
    if (!originalImageData) {
       
      alert('Please upload an image first.')
      return
    }

    if (isPersistentMode && persistentPoints.length > 0) {
      ctx.putImageData(originalImageData, 0, 0)
      persistentPoints.forEach(p => effect.apply(p.x, p.y))
    }

    const link = document.createElement('a')
    link.download = 'distorted-image.png'
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (isPersistentMode && persistentPoints.length > 0) {
      drawPointIndicators()
    } else {
      redrawCanvas()
    }
  })

  startRecordingBtn.addEventListener('click', () => {
    recorder.startRecording()
  })

  imageLoader.addEventListener('change', event => {
    handleImage(event)
  })

  radiusValueSpan.textContent = String(currentRadius)
  intensityValueSpan.textContent = String(currentIntensity)
  blockSizeValueSpan.textContent = String(currentBlockSize)

  window.addEventListener('load', () => {
    img = new Image()
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      try {
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      } catch (err) {
        console.error('Error getting image data', err)
      }
    }
    img.onerror = () => {
      console.error('Error loading the default image')
    }
    img.src = '/img-placeholder/12.jpeg'
  })

  function handleImage(event: Event): void {
    const target = event.target as HTMLInputElement | null
    if (!target || !target.files || target.files.length === 0) {return}

    originalImageData = null
    persistentPoints.length = 0
    updatePointCount()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    canvas.width = 1
    canvas.height = 1

    const file = target.files[0]
    const reader = new FileReader()

    reader.onload = loadEvent => {
      const result = loadEvent.target?.result
      if (typeof result !== 'string') {return}

      img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)
        try {
          originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        } catch (err) {
          console.error('Error getting image data', err)
        }
      }
      img.onerror = () => {
        console.error('Error loading the image')
      }
      img.src = result
    }

    reader.onerror = error => {
      console.error('Error reading image file', error)
    }

    reader.readAsDataURL(file)
  }

  function updateModeTabs(): void {
    if (!hoverModeBtn || !togglePersistentBtn) {
      return
    }
    hoverModeBtn.classList.toggle('active', !isPersistentMode)
    togglePersistentBtn.classList.toggle('active', isPersistentMode)
  }

  function updatePersistent(): void {
    if (isPersistentMode && persistentPoints.length > 0) {
      startPersistentAnimation()
    }
  }

  function startPersistentAnimation(): void {
    stopPersistentAnimation()
    if (!isPersistentMode || !originalImageData) {return}
    redrawCanvas()
  }

  function stopPersistentAnimation(): void {
    if (persistentAnimationId !== null) {
      cancelAnimationFrame(persistentAnimationId)
    }
    persistentAnimationId = null
  }

  function drawPointIndicators(): void {
    ctx.fillStyle = 'rgba(0,0,255,0.6)'
    persistentPoints.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  function redrawCanvas(): void {
    if (!originalImageData) {return}

    if (isPersistentMode && persistentPoints.length > 0) {
      ctx.putImageData(originalImageData, 0, 0)
      persistentPoints.forEach(p => effect.apply(p.x, p.y))
    } else {
      ctx.putImageData(originalImageData, 0, 0)
    }

    if (isPersistentMode && persistentPoints.length > 0) {
      drawPointIndicators()
    }
  }

}
