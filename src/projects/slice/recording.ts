interface SliceRecordingDeps {
  canvas: HTMLCanvasElement
  startButton: HTMLButtonElement
  stopButton: HTMLButtonElement
  recordingStatus: HTMLElement
  optimizedRecordingCheckbox: HTMLInputElement
  getTargetFps: () => number
  getCanvasSize: () => { width: number; height: number }
  getImageContentBounds: () => { x: number; y: number; width: number; height: number } | null
  getBackgroundConfig: () => { exportBackgroundColor: string; useTransparentBackground: boolean }
}

interface RecordingSetup {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  bounds: { x: number; y: number; width: number; height: number }
  padding: number
}

interface SelectedCodec {
  mimeType: string
  videoBitsPerSecond: number
  description: string
}

interface MediaRecorderErrorEvent extends Event {
  error: DOMException
}

export function createSliceRecorder(deps: SliceRecordingDeps) {
  const recorderCodecMap = new WeakMap<MediaRecorder, SelectedCodec>()
  let mediaRecorder: MediaRecorder | null = null
  let recordedChunks: Blob[] = []
  let isRecording = false
  let canvasStream: MediaStream | null = null
  let recordingSetup: RecordingSetup | null = null
  let recordingCanvas: HTMLCanvasElement | null = null
  let isOptimizedRecording = false

  function createOptimizedRecordingCanvas(): RecordingSetup | null {
    if (!deps.optimizedRecordingCheckbox || !deps.optimizedRecordingCheckbox.checked) {
       
      console.log('Optimized recording is disabled, using full canvas')
      return null
    }

    const bounds = deps.getImageContentBounds()
    if (!bounds) {
       
      console.warn('Could not calculate image bounds for optimized recording')
      return null
    }

    const { width: canvasWidth, height: canvasHeight } = deps.getCanvasSize()

    const extraPadding = 20
    const recordingWidth = bounds.width + extraPadding * 2
    const recordingHeight = bounds.height + extraPadding * 2

    const recCanvas = document.createElement('canvas')
    recCanvas.width = recordingWidth
    recCanvas.height = recordingHeight
    const recCtx = recCanvas.getContext('2d')

    if (!recCtx) {
       
      console.warn('Could not get 2D context for optimized recording canvas')
      return null
    }

     
    console.log(
      `Created optimized recording canvas: ${recordingWidth}x${recordingHeight} (vs main canvas ${canvasWidth}x${canvasHeight})`,
    )

    return {
      canvas: recCanvas,
      ctx: recCtx,
      bounds,
      padding: extraPadding,
    }
  }

  function copyFrameToRecordingCanvas(setup: RecordingSetup): void {
    const { canvas: recCanvas, ctx: recCtx, bounds, padding } = setup
    const { exportBackgroundColor, useTransparentBackground } = deps.getBackgroundConfig()

    recCtx.clearRect(0, 0, recCanvas.width, recCanvas.height)

    if (!useTransparentBackground && exportBackgroundColor !== 'transparent') {
      recCtx.fillStyle = exportBackgroundColor
      recCtx.fillRect(0, 0, recCanvas.width, recCanvas.height)
    }

    recCtx.globalCompositeOperation = 'source-over'

    recCtx.drawImage(
      deps.canvas,
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
      0,
      0,
      recCanvas.width,
      recCanvas.height,
    )
  }

  function stopRecordingCleanup(): void {
    if (canvasStream) {
      canvasStream.getTracks().forEach(track => track.stop())
      canvasStream = null
    }

    recordingSetup = null
    recordingCanvas = null
    isOptimizedRecording = false

    mediaRecorder = null
    isRecording = false
    updateRecordingUI()
  }

  function downloadVideo(): void {
    if (recordedChunks.length === 0) {
       
      console.warn('No video data recorded.')
      stopRecordingCleanup()
      return
    }

    const mimeType = recordedChunks[0].type || 'video/mp4'
    const blob = new Blob(recordedChunks, { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style.display = 'none'
    a.href = url

    let fileExtension = 'mp4'
    const slashIndex = mimeType.indexOf('/')
    if (slashIndex >= 0) {
      const subtype = mimeType.slice(slashIndex + 1)
      const semicolonIndex = subtype.indexOf(';')
      fileExtension = (semicolonIndex >= 0 ? subtype.slice(0, semicolonIndex) : subtype) || 'mp4'
    }

    let codecInfo = ''
    let backgroundInfo = ''

    if (mediaRecorder) {
      const codec = recorderCodecMap.get(mediaRecorder)
      if (codec) {
        const description = codec.description
        if (description.includes('H.265')) {
          codecInfo = '_h265'
        } else if (description.includes('VP9')) {
          codecInfo = '_vp9_alpha'
        } else if (description.includes('H.264')) {
          codecInfo = '_h264'
        }
      }
    }

    const { exportBackgroundColor, useTransparentBackground } = deps.getBackgroundConfig()

    if (useTransparentBackground || exportBackgroundColor === 'transparent') {
      backgroundInfo = '_transparent'
    } else if (exportBackgroundColor === '#00ff00') {
      backgroundInfo = '_greenscreen'
    } else if (exportBackgroundColor === '#0000ff') {
      backgroundInfo = '_bluescreen'
    } else if (exportBackgroundColor === '#ff00ff') {
      backgroundInfo = '_magentascreen'
    } else if (exportBackgroundColor !== '#000000' && exportBackgroundColor !== '#ffffff') {
      backgroundInfo = '_customscreen'
    }

    a.download = `glitch-recording${codecInfo}${backgroundInfo}.${fileExtension}`
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    recordedChunks = []
    stopRecordingCleanup()
  }

  function updateRecordingUI(): void {
    const { exportBackgroundColor, useTransparentBackground } = deps.getBackgroundConfig()

    if (isRecording) {
      deps.startButton.disabled = true
      deps.stopButton.disabled = false

      const recordingType = recordingSetup ? 'optimized' : 'full canvas'
      const dimensions = recordingSetup
        ? `${recordingSetup.canvas.width}x${recordingSetup.canvas.height}`
        : (() => {
            const size = deps.getCanvasSize()
            return `${size.width}x${size.height}`
          })()

      let codecInfo = ''
      if (mediaRecorder) {
        const codec = recorderCodecMap.get(mediaRecorder)
        if (codec) {
          codecInfo = ` - ${codec.description}`
        }
      }

      let backgroundInfo = ''
      if (useTransparentBackground || exportBackgroundColor === 'transparent') {
        backgroundInfo = ' - Transparent bg'
      } else if (exportBackgroundColor === '#00ff00') {
        backgroundInfo = ' - Green screen'
      } else if (exportBackgroundColor === '#0000ff') {
        backgroundInfo = ' - Blue screen'
      } else if (exportBackgroundColor === '#ff00ff') {
        backgroundInfo = ' - Magenta screen'
      } else {
        backgroundInfo = ` - Custom bg (${exportBackgroundColor})`
      }

      deps.recordingStatus.textContent = `🔴 Recording ${recordingType} (${dimensions})${codecInfo}${backgroundInfo}...`
    } else {
      deps.startButton.disabled = false
      deps.stopButton.disabled = true
      deps.recordingStatus.textContent = ''
    }
  }

  function startRecording(): void {
    if (isRecording) {
      return
    }
    if (!('MediaRecorder' in window)) {
       
      alert('MediaRecorder API not supported in this browser.')
      return
    }

    const targetFps = deps.getTargetFps()
    const frameRate = targetFps > 0 ? Math.min(targetFps, 60) : 60

    recordingSetup = createOptimizedRecordingCanvas()
    if (!recordingSetup) {
       
      console.warn('Falling back to main canvas recording')
      recordingCanvas = deps.canvas
      isOptimizedRecording = false
    } else {
      recordingCanvas = recordingSetup.canvas
      isOptimizedRecording = true
    }

    if (!recordingCanvas) {
       
      alert('Could not create recording canvas.')
      return
    }

    canvasStream = recordingCanvas.captureStream(frameRate)
    if (!canvasStream) {
       
      alert('Could not capture canvas stream.')
      return
    }

    const codecOptions: SelectedCodec[] = [
      {
        mimeType: 'video/mp4; codecs="hev1.1.6.L93.B0"',
        videoBitsPerSecond: 150_000_000,
        description: 'H.265 MP4',
      },
      {
        mimeType: 'video/mp4; codecs="hvc1.1.6.L93.B0"',
        videoBitsPerSecond: 150_000_000,
        description: 'H.265 MP4 (alt)',
      },
      {
        mimeType: 'video/webm; codecs="vp9"',
        videoBitsPerSecond: 150_000_000,
        description: 'WebM VP9 (with alpha)',
      },
      {
        mimeType: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
        videoBitsPerSecond: 150_000_000,
        description: 'H.264 MP4 (no alpha)',
      },
      {
        mimeType: 'video/mp4',
        videoBitsPerSecond: 150_000_000,
        description: 'MP4 (default)',
      },
      {
        mimeType: 'video/webm',
        videoBitsPerSecond: 150_000_000,
        description: 'WebM (default)',
      },
    ]

    let selectedCodec: SelectedCodec | null = null
    for (const option of codecOptions) {
      if (MediaRecorder.isTypeSupported(option.mimeType)) {
        selectedCodec = option
        break
      }
    }

    if (!selectedCodec) {
      selectedCodec = {
        mimeType: '',
        videoBitsPerSecond: 150_000_000,
        description: 'Browser default',
      }
    }

     
    console.log(`Using codec: ${selectedCodec.description} (${selectedCodec.mimeType || 'default'})`)
     
    console.log('Target Bitrate:', selectedCodec.videoBitsPerSecond)

    try {
      const options: MediaRecorderOptions = {
        mimeType: selectedCodec.mimeType || undefined,
        videoBitsPerSecond: selectedCodec.videoBitsPerSecond,
      }

      if (!selectedCodec.mimeType) {
         
        delete (options as { mimeType?: string }).mimeType
      }

      mediaRecorder = new MediaRecorder(canvasStream, options)
      recordedChunks = []

      if (selectedCodec) {
        recorderCodecMap.set(mediaRecorder, selectedCodec)
      }

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = downloadVideo
      mediaRecorder.onerror = (event: MediaRecorderErrorEvent) => {
         
        console.error('MediaRecorder error:', event.error)
         
        alert(`Error during recording: ${event.error.name}`)
        stopRecordingCleanup()
      }

      mediaRecorder.start()
      isRecording = true
      updateRecordingUI()
    } catch (e) {
       
      console.error('Error creating MediaRecorder:', e)
       
      alert('Could not start recording. Check console for details.')
      if (canvasStream) {
        canvasStream.getTracks().forEach(track => track.stop())
        canvasStream = null
      }
    }
  }

  function stopRecording(): void {
    if (!isRecording || !mediaRecorder) {
      return
    }
    mediaRecorder.stop()
  }

  function handleFrame(): void {
    if (isOptimizedRecording && recordingSetup && isRecording) {
      copyFrameToRecordingCanvas(recordingSetup)
    }
  }

  function isRecordingActive(): boolean {
    return isRecording
  }

  deps.startButton.addEventListener('click', startRecording)
  deps.stopButton.addEventListener('click', stopRecording)

  return { startRecording, stopRecording, handleFrame, isRecordingActive }
}
