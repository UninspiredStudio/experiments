import { particleState } from '../../core/state'
import { domElements } from '../../ui/elements'
import { PARTICLE_FRAME_RECORDING_FPS } from '../../constants/recording'
import type { JSZipConstructor } from './jszip-provider'
import { createJSZipInstance } from './jszip-provider'

const FRAME_INTERVAL_MS = 1000 / PARTICLE_FRAME_RECORDING_FPS

let lastCaptureTime = 0

function getJSZipCtor(): JSZipConstructor {
  return createJSZipInstance()
}

function setAnimationStatus(message: string): void {
  if (!domElements.animationRecordingStatus) {
    return
  }
  domElements.animationRecordingStatus.textContent = message
}

export function startFrameRecording(durationSeconds: number): void {
  if (typeof window === 'undefined') {
    return
  }

  if (
    particleState.isRecordingAnimation ||
    particleState.isProcessingRecording
  ) {
    return
  }

  particleState.isRecordingAnimation = true
  particleState.hasRecordedAnimation = false
  particleState.recordedFrames = []
  particleState.animationRecordingDuration = Math.max(0, durationSeconds * 1000)
  particleState.animationRecordingStartTime = performance.now()
  lastCaptureTime = 0

  if (particleState.animationRecordingTimeoutId !== null) {
    window.clearTimeout(particleState.animationRecordingTimeoutId)
  }

  if (particleState.animationRecordingDuration > 0) {
    const timeoutId = window.setTimeout(() => {
      stopFrameRecording()
    }, particleState.animationRecordingDuration)
    particleState.animationRecordingTimeoutId = timeoutId
  } else {
    particleState.animationRecordingTimeoutId = null
  }

  setAnimationStatus('Recording animation')
}

export function stopFrameRecording(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!particleState.isRecordingAnimation) {
    return
  }

  if (particleState.animationRecordingTimeoutId !== null) {
    window.clearTimeout(particleState.animationRecordingTimeoutId)
    particleState.animationRecordingTimeoutId = null
  }

  particleState.isRecordingAnimation = false
  particleState.hasRecordedAnimation = particleState.recordedFrames.length > 0

  if (particleState.hasRecordedAnimation) {
    setAnimationStatus(`Recorded ${particleState.recordedFrames.length} frames. Ready to download.`)
  } else {
    setAnimationStatus('Recording finished. No frames captured.')
  }
}

export function captureFrameIfNeeded(canvas: HTMLCanvasElement): void {
  if (!particleState.isRecordingAnimation) {
    return
  }

  const now = performance.now()

  if (lastCaptureTime && now - lastCaptureTime < FRAME_INTERVAL_MS - 1) {
    return
  }

  lastCaptureTime = now

  canvas.toBlob((blob) => {
    if (!blob) {
      return
    }

    if (!particleState.isRecordingAnimation) {
      return
    }

    particleState.recordedFrames.push(blob)
  }, 'image/png')
}

export async function downloadRecordedFramesZip(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  if (
    particleState.isProcessingRecording ||
    !particleState.hasRecordedAnimation ||
    particleState.recordedFrames.length === 0 ||
    particleState.isRecordingAnimation
  ) {
    return
  }

  particleState.isProcessingRecording = true
  setAnimationStatus(`Zipping ${particleState.recordedFrames.length} frames`)

  try {
    const JSZipCtor = getJSZipCtor()
    const zip = new JSZipCtor()

    particleState.recordedFrames.forEach((frame, index) => {
      const frameNumber = String(index + 1).padStart(5, '0')
      const fileName = `frame_${frameNumber}.png`
      zip.file(fileName, frame)
    })

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    const timestamp = Date.now()
    a.download = `particle-recording_${timestamp}.zip`

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setAnimationStatus(`Downloaded ${particleState.recordedFrames.length} frames.`)
  } catch {
    setAnimationStatus('Error creating ZIP file.')
  } finally {
    particleState.isProcessingRecording = false
  }
}
