import { createShiftRecorder } from './shift-recording'
import { coordsFromMouse } from '../core/image-loader'
import { createShiftEffect } from '../effects/shift'

export function initShiftUI() {
  // TODO: move DOM lookups and event wiring from legacy shift.js here
  const imageLoader = document.getElementById('imageLoader') as HTMLInputElement | null
  const canvas = document.getElementById('imageCanvas') as HTMLCanvasElement
  const canvasContainer = document.querySelector('.canvas-container') as HTMLDivElement

  const radiusSlider = document.getElementById('radiusSlider') as HTMLInputElement | null
  const intensitySlider = document.getElementById('intensitySlider') as HTMLInputElement | null
  const fragmentationSlider = document.getElementById('fragmentationSlider') as HTMLInputElement | null
  const brightnessInfluenceSlider = document.getElementById('brightnessInfluenceSlider') as HTMLInputElement | null

  const radiusValueSpan = document.getElementById('radiusValue')
  const intensityValueSpan = document.getElementById('intensityValue')
  const fragmentationValueSpan = document.getElementById('fragmentationValue')
  const brightnessInfluenceValueSpan = document.getElementById('brightnessInfluenceValue')

  const dirHorizontalBtn = document.getElementById('dirHorizontalBtn') as HTMLButtonElement | null
  const dirVerticalBtn = document.getElementById('dirVerticalBtn') as HTMLButtonElement | null
  const dirRadialBtn = document.getElementById('dirRadialBtn') as HTMLButtonElement | null

  const pixelDeleteEnabled = document.getElementById('pixelDeleteEnabled') as HTMLInputElement | null
  const pixelDeleteThresholdContainer = document.getElementById('pixelDeleteThresholdContainer') as HTMLDivElement | null
  const pixelDeleteThresholdSlider = document.getElementById('pixelDeleteThresholdSlider') as HTMLInputElement | null
  const pixelDeleteThresholdValueSpan = document.getElementById('pixelDeleteThresholdValue')

  const brightnessInfluenceDeleteEnabled = document.getElementById('brightnessInfluenceDeleteEnabled') as HTMLInputElement | null
  const brightnessInfluenceDeleteThresholdContainer = document.getElementById(
    'brightnessInfluenceDeleteThresholdContainer',
  ) as HTMLDivElement | null
  const brightnessInfluenceDeleteThresholdSlider = document.getElementById(
    'brightnessInfluenceDeleteThresholdSlider',
  ) as HTMLInputElement | null
  const brightnessInfluenceDeleteThresholdValueSpan = document.getElementById(
    'brightnessInfluenceDeleteThresholdValue',
  )

  const pointCountSpan = document.getElementById('pointCount')
  const clearPointsBtn = document.getElementById('clearPointsBtn') as HTMLButtonElement | null
  const togglePersistentBtn = document.getElementById('togglePersistentBtn') as HTMLButtonElement | null

  const saveImageBtn = document.getElementById('saveImageBtn') as HTMLButtonElement | null

  const startRecordingBtn = document.getElementById('startRecordingBtn') as HTMLButtonElement | null
  const recordingStatus = document.getElementById('recordingStatus')
  const recordingDurationInput = document.getElementById('recordingDurationInput') as HTMLInputElement | null
  const recordingCountdown = document.getElementById('recordingCountdown')
  const countdownText = document.getElementById('countdownText')

  if (
    !imageLoader ||
    !canvas ||
    !canvasContainer ||
    !radiusSlider ||
    !intensitySlider ||
    !fragmentationSlider ||
    !brightnessInfluenceSlider ||
    !radiusValueSpan ||
    !intensityValueSpan ||
    !fragmentationValueSpan ||
    !brightnessInfluenceValueSpan ||
    !dirHorizontalBtn ||
    !dirVerticalBtn ||
    !dirRadialBtn ||
    !pixelDeleteEnabled ||
    !pixelDeleteThresholdContainer ||
    !pixelDeleteThresholdSlider ||
    !pixelDeleteThresholdValueSpan ||
    !brightnessInfluenceDeleteEnabled ||
    !brightnessInfluenceDeleteThresholdContainer ||
    !brightnessInfluenceDeleteThresholdSlider ||
    !brightnessInfluenceDeleteThresholdValueSpan ||
    !pointCountSpan ||
    !clearPointsBtn ||
    !togglePersistentBtn ||
    !saveImageBtn ||
    !startRecordingBtn ||
    !recordingStatus ||
    !recordingDurationInput ||
    !recordingCountdown ||
    !countdownText
  ) {
    throw new Error('Shift UI: missing required DOM elements')
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  if (!ctx) {
    throw new Error('Shift UI: 2D context not available')
  }

  const recorder = createShiftRecorder({
    canvas,
    startRecordingBtn,
    recordingStatus,
    recordingDurationInput,
    recordingCountdown,
    countdownText,
  })

  let originalImageData: ImageData | null = null
  let img = new Image()

  let currentRadius = Number.parseFloat(radiusSlider.value)
  let currentIntensity = Number.parseFloat(intensitySlider.value)
  let currentFragmentation = Number.parseFloat(fragmentationSlider.value)
  let currentBrightnessInfluence = Number.parseFloat(brightnessInfluenceSlider.value)
  let currentShiftDirection: 'horizontal' | 'vertical' | 'radial' = 'horizontal'

  let isPixelDeleteEnabled = false
  let currentPixelDeleteThreshold = 0.5
  let isBrightnessInfluenceDeleteEnabled = false
  let currentBrightnessInfluenceDeleteThreshold = 10

  let isPersistentMode = false
  const persistentPoints: { x: number; y: number }[] = []
  let persistentAnimationId: number | null = null
  let currentMousePosition: { x: number; y: number } | null = null

  const effect = createShiftEffect({
    canvas,
    ctx,
    getOriginalImageData: () => originalImageData,
    getParams: () => ({
      radius: currentRadius,
      intensity: currentIntensity,
      fragmentation: currentFragmentation,
      brightnessInfluence: currentBrightnessInfluence,
      direction: currentShiftDirection,
      isPixelDeleteEnabled,
      pixelDeleteThreshold: currentPixelDeleteThreshold,
      isBrightnessInfluenceDeleteEnabled,
      brightnessInfluenceDeleteThreshold: currentBrightnessInfluenceDeleteThreshold,
    }),
  })

  function updatePointCount(): void {
    if (!pointCountSpan) {
      return
    }
    pointCountSpan.textContent = String(persistentPoints.length)
  }

  function setShiftDirection(dir: 'horizontal' | 'vertical' | 'radial'): void {
    currentShiftDirection = dir
    if (!dirHorizontalBtn || !dirVerticalBtn || !dirRadialBtn) {
      return
    }
    dirHorizontalBtn.classList.toggle('active', dir === 'horizontal')
    dirVerticalBtn.classList.toggle('active', dir === 'vertical')
    dirRadialBtn.classList.toggle('active', dir === 'radial')
    updatePersistent()
  }

  function clearAllPoints(): void {
    persistentPoints.length = 0
    updatePointCount()
    stopPersistentAnimation()
    if (originalImageData) {ctx.putImageData(originalImageData, 0, 0)}
  }

  function togglePersistentMode(): void {
    isPersistentMode = !isPersistentMode
    if (!togglePersistentBtn) {
      return
    }
    togglePersistentBtn.textContent = isPersistentMode ? 'Disable Persistent Mode' : 'Enable Persistent Mode'
    canvas.classList.toggle('persistent-mode', isPersistentMode)
    if (!isPersistentMode) {
      stopPersistentAnimation()
      if (originalImageData) {ctx.putImageData(originalImageData, 0, 0)}
    } else if (persistentPoints.length > 0) {
      startPersistentAnimation()
    }
  }

  function updatePersistent(): void {
    if (isPersistentMode && persistentPoints.length > 0) {
      startPersistentAnimation()
    }
  }

  function handleImage(e: Event): void {
    stopPersistentAnimation()
    originalImageData = null
    persistentPoints.length = 0
    updatePointCount()
    currentMousePosition = null
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    canvas.width = 1
    canvas.height = 1

    const target = e.target as HTMLInputElement | null
    const file = target?.files?.[0]
    if (!file) {return}

    const reader = new FileReader()
    reader.onload = event => {
      const result = (event.target)?.result
      if (!result) {return}

      img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        try {
          originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        } catch (error) {
           
          console.error('Error getting image data:', error)
          originalImageData = null
        }
      }
      img.src = typeof result === 'string' ? result : ''
    }
    reader.readAsDataURL(file)
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!originalImageData || isPersistentMode) {return}
    const { x, y } = coordsFromMouse(canvas, e)
    currentMousePosition = { x, y }
    effect.apply(x, y)
  }

  function handleMouseOut(): void {
    if (!originalImageData || isPersistentMode) {return}
    ctx.putImageData(originalImageData, 0, 0)
  }

  function handleCanvasClick(e: MouseEvent): void {
    if (!originalImageData || !isPersistentMode) {return}
    const { x, y } = coordsFromMouse(canvas, e)
    persistentPoints.push({ x, y })
    updatePointCount()
    startPersistentAnimation()
  }

  function startPersistentAnimation(): void {
    stopPersistentAnimation()
    function loop() {
      if (!isPersistentMode || !originalImageData) {return}
      ctx.putImageData(originalImageData, 0, 0)
      persistentPoints.forEach(p => effect.apply(p.x, p.y))
      drawPointIndicators()
      persistentAnimationId = window.requestAnimationFrame(loop)
    }
    loop()
  }

  function stopPersistentAnimation(): void {
    if (persistentAnimationId !== null) {window.cancelAnimationFrame(persistentAnimationId)}
    persistentAnimationId = null
  }

  function drawPointIndicators(): void {
    ctx.fillStyle = 'rgba(255,0,0,0.6)'
    persistentPoints.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  function saveCanvasAsImage(): void {
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
    } else if (currentMousePosition && !isPersistentMode && originalImageData) {
      effect.apply(currentMousePosition.x, currentMousePosition.y)
    } else if (originalImageData) {
      ctx.putImageData(originalImageData, 0, 0)
    }
  }

  radiusSlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) {return}
    currentRadius = Number.parseFloat(target.value)
    radiusValueSpan.textContent = String(currentRadius)
    updatePersistent()
  })

  intensitySlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) {return}
    currentIntensity = Number.parseFloat(target.value)
    intensityValueSpan.textContent = String(currentIntensity)
    updatePersistent()
  })

  fragmentationSlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) {return}
    currentFragmentation = Number.parseFloat(target.value)
    fragmentationValueSpan.textContent = String(currentFragmentation)
    updatePersistent()
  })

  brightnessInfluenceSlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) {return}
    currentBrightnessInfluence = Number.parseFloat(target.value)
    brightnessInfluenceValueSpan.textContent = currentBrightnessInfluence.toFixed(2)
    updatePersistent()
  })

  dirHorizontalBtn.addEventListener('click', () => setShiftDirection('horizontal'))
  dirVerticalBtn.addEventListener('click', () => setShiftDirection('vertical'))
  dirRadialBtn.addEventListener('click', () => setShiftDirection('radial'))

  pixelDeleteEnabled.addEventListener('change', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) {return}
    isPixelDeleteEnabled = target.checked
    pixelDeleteThresholdContainer.classList.toggle('hidden', !isPixelDeleteEnabled)
    updatePersistent()
  })

  pixelDeleteThresholdSlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) {return}
    currentPixelDeleteThreshold = Number.parseFloat(target.value)
    pixelDeleteThresholdValueSpan.textContent = currentPixelDeleteThreshold.toFixed(2)
    updatePersistent()
  })

  brightnessInfluenceDeleteEnabled.addEventListener('change', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) {return}
    isBrightnessInfluenceDeleteEnabled = target.checked
    brightnessInfluenceDeleteThresholdContainer.classList.toggle('hidden', !isBrightnessInfluenceDeleteEnabled)
    updatePersistent()
  })

  brightnessInfluenceDeleteThresholdSlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) {return}
    currentBrightnessInfluenceDeleteThreshold = Number.parseFloat(target.value)
    brightnessInfluenceDeleteThresholdValueSpan.textContent = currentBrightnessInfluenceDeleteThreshold.toFixed(0)
    updatePersistent()
  })

  canvasContainer.addEventListener('mousemove', handleMouseMove)
  canvasContainer.addEventListener('mouseleave', handleMouseOut)
  canvas.addEventListener('click', handleCanvasClick)

  clearPointsBtn.addEventListener('click', clearAllPoints)
  togglePersistentBtn.addEventListener('click', togglePersistentMode)
  saveImageBtn.addEventListener('click', saveCanvasAsImage)

  startRecordingBtn.addEventListener('click', () => recorder.startRecording())
  imageLoader.addEventListener('change', handleImage, false)

  radiusValueSpan.textContent = String(currentRadius)
  intensityValueSpan.textContent = String(currentIntensity)
  fragmentationValueSpan.textContent = String(currentFragmentation)
  brightnessInfluenceValueSpan.textContent = currentBrightnessInfluence.toFixed(2)
}
