import { loadImageFromFile, coordsFromMouse } from '../core/image-loader'
import { createDisplacementEffect, type DisplacementDirection } from '../effects/displacement'
import { createDisplacementRecorder } from './displacement-recording'

export function initDisplacementUI() {
  // TODO: move DOM lookups and event wiring from legacy displacement.js here

  const imageLoader = document.querySelector<HTMLInputElement>('#imageLoader')
  const displacementLoader = document.querySelector<HTMLInputElement>('#displacementLoader')
  const canvas = document.querySelector<HTMLCanvasElement>('#imageCanvas')
  const canvasContainer = document.querySelector<HTMLDivElement>('.canvas-container')

  const radiusSlider = document.querySelector<HTMLInputElement>('#radiusSlider')
  const intensitySlider = document.querySelector<HTMLInputElement>('#intensitySlider')
  const displacementScaleSlider = document.querySelector<HTMLInputElement>('#displacementScaleSlider')

  const radiusValueSpan = document.querySelector<HTMLSpanElement>('#radiusValue')
  const intensityValueSpan = document.querySelector<HTMLSpanElement>('#intensityValue')
  const displacementScaleValueSpan = document.querySelector<HTMLSpanElement>('#displacementScaleValue')

  const dispDirHorizontalBtn = document.querySelector<HTMLButtonElement>('#dispDirHorizontalBtn')
  const dispDirVerticalBtn = document.querySelector<HTMLButtonElement>('#dispDirVerticalBtn')
  const dispDirBothBtn = document.querySelector<HTMLButtonElement>('#dispDirBothBtn')
  const dispDirRadialBtn = document.querySelector<HTMLButtonElement>('#dispDirRadialBtn')

  const pointCountSpan = document.getElementById('pointCount')
  const clearPointsBtn = document.querySelector<HTMLButtonElement>('#clearPointsBtn')
  const togglePersistentBtn = document.querySelector<HTMLButtonElement>('#togglePersistentBtn')

  const recordBtn = document.querySelector<HTMLButtonElement>('#recordBtn')
  const durationInput = document.querySelector<HTMLInputElement>('#durationInput')

  if (
    !imageLoader ||
    !displacementLoader ||
    !canvas ||
    !canvasContainer ||
    !radiusSlider ||
    !intensitySlider ||
    !displacementScaleSlider ||
    !radiusValueSpan ||
    !intensityValueSpan ||
    !displacementScaleValueSpan ||
    !dispDirHorizontalBtn ||
    !dispDirVerticalBtn ||
    !dispDirBothBtn ||
    !dispDirRadialBtn ||
    !pointCountSpan ||
    !clearPointsBtn ||
    !togglePersistentBtn ||
    !recordBtn ||
    !durationInput
  ) {
    throw new Error('Displacement UI: missing required DOM elements')
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
  if (!ctx) {
    throw new Error('Displacement UI: 2D context not available')
  }

  let originalImageData: ImageData | null = null
  let displacementImageData: ImageData | null = null

  let currentRadius = Number.parseFloat(radiusSlider.value)
  let currentIntensity = Number.parseFloat(intensitySlider.value)
  let currentDisplacementScale = Number.parseFloat(displacementScaleSlider.value)
  let currentDirection: DisplacementDirection = 'horizontal'

  let isPersistentMode = false
  const persistentPoints: { x: number; y: number }[] = []
  let persistentAnimationId: number | null = null

  const effect = createDisplacementEffect({
    canvas,
    ctx,
    getOriginalImageData: () => originalImageData,
    getDisplacementImageData: () => displacementImageData,
    getParams: () => ({
      radius: currentRadius,
      intensity: currentIntensity,
      displacementScale: currentDisplacementScale,
      direction: currentDirection,
    }),
  })

  const recorder = createDisplacementRecorder({
    canvas,
    recordButton: recordBtn,
    durationInput,
  })

  function updatePointCount(): void {
    if (!pointCountSpan) {
      return
    }
    pointCountSpan.textContent = String(persistentPoints.length)
  }

  function setDispDirection(dir: DisplacementDirection): void {
    currentDirection = dir
    if (!dispDirHorizontalBtn || !dispDirVerticalBtn || !dispDirBothBtn || !dispDirRadialBtn) {
      return
    }
    dispDirHorizontalBtn.classList.toggle('active', dir === 'horizontal')
    dispDirVerticalBtn.classList.toggle('active', dir === 'vertical')
    dispDirBothBtn.classList.toggle('active', dir === 'both')
    dispDirRadialBtn.classList.toggle('active', dir === 'radial')
    updatePersistent()
  }

  function clearAllPoints(): void {
    persistentPoints.length = 0
    updatePointCount()
    stopPersistentAnimation()
    if (originalImageData) {
      ctx.putImageData(originalImageData, 0, 0)
    }
  }

  function togglePersistentMode(): void {
    isPersistentMode = !isPersistentMode
    if (!togglePersistentBtn) {
      return
    }
    togglePersistentBtn.textContent = isPersistentMode ? 'Disable Persistent Mode' : 'Enable Persistent Mode'
    if (!canvas) { return }
    canvas.classList.toggle('persistent-mode', isPersistentMode)
    if (!isPersistentMode) {
      stopPersistentAnimation()
      if (originalImageData) {
        ctx.putImageData(originalImageData, 0, 0)
      }
    } else if (persistentPoints.length > 0) {
      startPersistentAnimation()
    }
  }

  function updatePersistent(): void {
    if (isPersistentMode && persistentPoints.length > 0) {
      startPersistentAnimation()
    }
  }

  function startPersistentAnimation(): void {
    stopPersistentAnimation()
    function loop() {
      if (!isPersistentMode || !originalImageData || !displacementImageData) {
        return
      }
      ctx.putImageData(originalImageData, 0, 0)
      effect.applyPersistent(persistentPoints)
      drawPointIndicators()
      persistentAnimationId = window.requestAnimationFrame(loop)
    }
    loop()
  }

  function stopPersistentAnimation(): void {
    if (persistentAnimationId !== null) {
      window.cancelAnimationFrame(persistentAnimationId)
    }
    persistentAnimationId = null
  }

  function drawPointIndicators(): void {
    ctx.fillStyle = 'rgba(0,255,0,0.6)'
    persistentPoints.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  async function handleImageChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null
    const file = target?.files?.[0]
    if (!file) { return }

    if (!canvas) { return }

    originalImageData = null
    persistentPoints.length = 0
    updatePointCount()
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

  async function handleDisplacementChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement | null
    const file = target?.files?.[0]
    if (!file) { return }

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

  function handleMouseMove(event: MouseEvent): void {
    if (!originalImageData || !displacementImageData || isPersistentMode) { return }
    if (!canvas) { return }
    const { x, y } = coordsFromMouse(canvas, event)
    effect.apply(x, y)
  }

  function handleMouseOut(): void {
    if (!originalImageData || isPersistentMode) { return }
    ctx.putImageData(originalImageData, 0, 0)
  }

  function handleCanvasClick(event: MouseEvent): void {
    if (!originalImageData || !displacementImageData || !isPersistentMode) { return }
    if (!canvas) { return }
    const { x, y } = coordsFromMouse(canvas, event)
    persistentPoints.push({ x, y })
    updatePointCount()
    startPersistentAnimation()
  }

  radiusSlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) { return }
    currentRadius = Number.parseFloat(target.value)
    radiusValueSpan.textContent = String(currentRadius)
    updatePersistent()
  })

  intensitySlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) { return }
    currentIntensity = Number.parseFloat(target.value)
    intensityValueSpan.textContent = String(currentIntensity)
    updatePersistent()
  })

  displacementScaleSlider.addEventListener('input', e => {
    const target = e.target as HTMLInputElement | null
    if (!target) { return }
    currentDisplacementScale = Number.parseFloat(target.value)
    displacementScaleValueSpan.textContent = currentDisplacementScale.toFixed(1)
    updatePersistent()
  })

  dispDirHorizontalBtn.addEventListener('click', () => setDispDirection('horizontal'))
  dispDirVerticalBtn.addEventListener('click', () => setDispDirection('vertical'))
  dispDirBothBtn.addEventListener('click', () => setDispDirection('both'))
  dispDirRadialBtn.addEventListener('click', () => setDispDirection('radial'))

  clearPointsBtn.addEventListener('click', () => {
    clearAllPoints()
  })
  togglePersistentBtn.addEventListener('click', () => {
    togglePersistentMode()
  })

  canvasContainer.addEventListener('mousemove', handleMouseMove)
  canvasContainer.addEventListener('mouseleave', handleMouseOut)
  canvas.addEventListener('click', handleCanvasClick)

  imageLoader.addEventListener('change', event => {
    void handleImageChange(event)
  })
  displacementLoader.addEventListener('change', event => {
    void handleDisplacementChange(event)
  })

  recordBtn.addEventListener('click', () => {
    recorder.startRecording()
  })

  radiusValueSpan.textContent = String(currentRadius)
  intensityValueSpan.textContent = String(currentIntensity)
  displacementScaleValueSpan.textContent = currentDisplacementScale.toFixed(1)
}
