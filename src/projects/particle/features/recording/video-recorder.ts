import { particleState } from '../../core/state'
import { domElements } from '../../ui/elements'
import { PARTICLE_VIDEO_RECORDING_FPS } from '../../constants/recording'
import type { MediaRecorderWithCodec } from '../../types/state'

function setVideoRecordingStatus(message: string): void {
  if (!domElements.videoRecordingStatus) {
    return
  }
  domElements.videoRecordingStatus.textContent = message
}

function getRecordingCanvas(): HTMLCanvasElement | null {
  return domElements.canvas
}

export function startVideoRecording(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (particleState.isRecordingVideo) {
    return
  }

  const canvas = getRecordingCanvas()
  if (!canvas) {
    setVideoRecordingStatus('Error: Canvas not found')
    return
  }

  interface WindowWithMediaRecorder extends Window {
    MediaRecorder?: typeof MediaRecorder
  }

  const MediaRecorderCtor = (window as WindowWithMediaRecorder).MediaRecorder

  if (!MediaRecorderCtor) {
    setVideoRecordingStatus('Error: MediaRecorder not supported')
    return
  }

  type CanvasWithCapture = {
    captureStream?: (frameRate?: number) => MediaStream
  }

  const captureStream = (canvas as unknown as CanvasWithCapture).captureStream?.bind(canvas)
  if (!captureStream) {
    setVideoRecordingStatus('Error: captureStream not available on canvas')
    return
  }

  const stream = captureStream(PARTICLE_VIDEO_RECORDING_FPS)
  if (!stream) {
    setVideoRecordingStatus('Error: Failed to capture canvas stream')
    return
  }

  const codecCandidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]

  interface MediaRecorderConstructor {
    new(stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder
    isTypeSupported?(type: string): boolean
  }

  let mimeType = ''
  for (const candidate of codecCandidates) {
    if ((MediaRecorderCtor as unknown as MediaRecorderConstructor).isTypeSupported?.(candidate)) {
      mimeType = candidate
      break
    }
  }

  const options: MediaRecorderOptions = {}
  if (mimeType) {
    options.mimeType = mimeType
  }

  let mediaRecorder: MediaRecorderWithCodec

  try {
    mediaRecorder = new MediaRecorderCtor(stream, options) as MediaRecorderWithCodec
  } catch {
    try {
      mediaRecorder = new MediaRecorderCtor(stream) as MediaRecorderWithCodec
      mimeType = mediaRecorder.mimeType || ''
    } catch {
      setVideoRecordingStatus('Error: Failed to create MediaRecorder')
      stream.getTracks().forEach((t) => t.stop())
      return
    }
  }

  particleState.mediaRecorder = mediaRecorder
  particleState.recordedVideoChunks = []
  particleState.hasRecordedVideo = false
  particleState.recordedVideoBlob = null

  mediaRecorder.selectedCodec = {
    description: mimeType || 'browser default',
  }

  mediaRecorder.ondataavailable = (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      particleState.recordedVideoChunks.push(event.data)
    }
  }

  mediaRecorder.onstop = () => {
    if (particleState.recordedVideoChunks.length > 0) {
      const effectiveType = mediaRecorder.mimeType || 'video/webm'
      const blob = new Blob(particleState.recordedVideoChunks, {
        type: effectiveType,
      })
      particleState.recordedVideoBlob = blob
      particleState.hasRecordedVideo = true
      setVideoRecordingStatus('Video recorded. Ready to download.')
    } else {
      particleState.recordedVideoBlob = null
      particleState.hasRecordedVideo = false
      setVideoRecordingStatus('Recording finished. No video data captured.')
    }

    type RecorderWithStream = {
      stream?: MediaStream
    }
    const recorderWithStream = mediaRecorder as unknown as RecorderWithStream
    const recStream = recorderWithStream.stream
    if (recStream) {
      recStream.getTracks().forEach((t) => t.stop())
    }

    particleState.mediaRecorder = null
    particleState.isRecordingVideo = false
  }

  mediaRecorder.onerror = () => {
    setVideoRecordingStatus('Recording error')
    stopVideoRecording()
  }

  const seconds = parseFloat(domElements.videoRecordingDurationInput.value)
  const durationMs = !Number.isNaN(seconds) && seconds > 0 ? seconds * 1000 : 0

  particleState.isRecordingVideo = true
  particleState.videoRecordingDuration = durationMs
  particleState.videoRecordingStartTime = performance.now()

  try {
    mediaRecorder.start(100)
  } catch {
    setVideoRecordingStatus('Error: Failed to start recording')
    particleState.isRecordingVideo = false
    type RecorderWithStream = {
      stream?: MediaStream
    }
    const recorderWithStream = mediaRecorder as unknown as RecorderWithStream
    const recStream = recorderWithStream.stream
    if (recStream) {
      recStream.getTracks().forEach((t) => t.stop())
    }
    particleState.mediaRecorder = null
    return
  }

  if (particleState.videoRecordingTimeoutId !== null) {
    window.clearTimeout(particleState.videoRecordingTimeoutId)
  }

  if (durationMs > 0) {
    const timeoutId = window.setTimeout(() => {
      stopVideoRecording()
    }, durationMs)
    particleState.videoRecordingTimeoutId = timeoutId
  } else {
    particleState.videoRecordingTimeoutId = null
  }

  setVideoRecordingStatus('Recording video...')
}

export function stopVideoRecording(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!particleState.isRecordingVideo || !particleState.mediaRecorder) {
    return
  }

  if (particleState.videoRecordingTimeoutId !== null) {
    window.clearTimeout(particleState.videoRecordingTimeoutId)
    particleState.videoRecordingTimeoutId = null
  }

  const mediaRecorder = particleState.mediaRecorder

  if (mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }

  setVideoRecordingStatus('Stopping recording...')
}

export function downloadRecordedVideo(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!particleState.hasRecordedVideo || !particleState.recordedVideoBlob) {
    return
  }

  const blob = particleState.recordedVideoBlob
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url

  let extension = 'webm'
  if (blob.type.includes('mp4')) {
    extension = 'mp4'
  }

  const timestamp = Date.now()
  a.download = `particle-video_${timestamp}.${extension}`

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  setVideoRecordingStatus('Video downloaded.')
}
