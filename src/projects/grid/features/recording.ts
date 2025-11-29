import { RECORDING_FRAMERATE, RECORDING_MIME_TYPE, RECORDING_VIDEO_BITRATE } from '../constants'
import type { GridState } from '../types'

interface MediaRecorderErrorEvent extends Event {
  error: DOMException
}

export function startRecordingSequence(state: GridState, canvas: HTMLCanvasElement): boolean {
  return startRecording(state, canvas, { isSequence: true })
}

export function startManualRecording(state: GridState, canvas: HTMLCanvasElement): boolean {
  return startRecording(state, canvas, { isSequence: false })
}

function startRecording(
  state: GridState,
  canvas: HTMLCanvasElement,
  { isSequence }: { isSequence: boolean },
): boolean {
  if (state.isRecording) {
    console.warn('Grid recording: already recording.')
    return false
  }

  const anyCanvas = canvas as HTMLCanvasElement & { captureStream?: (frameRate?: number) => MediaStream }

  if (!anyCanvas.captureStream || typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    alert('Recording is not supported in this browser.')
    return false
  }

  if (!MediaRecorder.isTypeSupported(RECORDING_MIME_TYPE)) {
    alert('The configured recording format is not supported by this browser.')
    return false
  }

  let stream: MediaStream
  try {
    stream = anyCanvas.captureStream(RECORDING_FRAMERATE)
  } catch (e) {
    console.error('Grid recording: captureStream failed.', e)
    alert('Could not start canvas capture stream for recording.')
    return false
  }

  if (!stream || stream.getTracks().length === 0) {
    alert('Could not capture any video tracks from the canvas.')
    return false
  }

  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: RECORDING_MIME_TYPE,
      videoBitsPerSecond: RECORDING_VIDEO_BITRATE,
    })
  } catch (e) {
    console.error('Grid recording: error creating MediaRecorder.', e)
    alert('Error creating MediaRecorder for recording.')
    stream.getTracks().forEach((track) => track.stop())
    return false
  }

  state.mediaStream = stream
  state.mediaRecorder = recorder
  state.recordedChunks = []
  state.isRecording = true
  state.isSequenceRecording = isSequence

  recorder.ondataavailable = (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      state.recordedChunks.push(event.data)
    }
  }

  recorder.onstop = () => {
    const chunks = state.recordedChunks

    state.isRecording = false
    state.isSequenceRecording = false

    if (state.mediaStream) {
      try {
        state.mediaStream.getTracks().forEach((track) => track.stop())
      } catch {
        // ignore
      }
      state.mediaStream = null
    }

    state.mediaRecorder = null

    if (!chunks.length) {
      console.warn('Grid recording: no data recorded.')
      return
    }

    try {
      const blob = new Blob(chunks, { type: RECORDING_MIME_TYPE })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      document.body.appendChild(a)
      a.href = url

      const now = new Date()
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate(),
      ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(
        now.getSeconds(),
      ).padStart(2, '0')}`

      a.download = `noise_creation_${ts}.mp4`
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error('Grid recording: error creating/downloading Blob.', e)
      alert('Error processing recorded video.')
    } finally {
      state.recordedChunks = []
    }
  }

  recorder.onerror = (event: MediaRecorderErrorEvent) => {
    console.error('Grid recording: MediaRecorder error.', event.error)
    alert(`Recording error: ${event.error?.name ?? 'Unknown'}`)

    state.isRecording = false
    state.isSequenceRecording = false

    try {
      if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop()
      }
    } catch {
      // ignore
    }

    if (state.mediaStream) {
      try {
        state.mediaStream.getTracks().forEach((track) => track.stop())
      } catch {
        // ignore
      }
      state.mediaStream = null
    }

    state.mediaRecorder = null
  }

  try {
    recorder.start()
  } catch (e) {
    console.error('Grid recording: error starting MediaRecorder.', e)
    alert('Failed to start recording.')

    state.isRecording = false
    state.isSequenceRecording = false

    if (state.mediaStream) {
      try {
        state.mediaStream.getTracks().forEach((track) => track.stop())
      } catch {
        // ignore
      }
      state.mediaStream = null
    }

    state.mediaRecorder = null
    return false
  }

  return true
}

export function stopRecording(state: GridState): void {
  if (!state.isRecording || !state.mediaRecorder) {
    return
  }

  const recorder = state.mediaRecorder

  if (recorder.state === 'inactive') {
    return
  }

  try {
    recorder.stop()
  } catch (e) {
    console.error('Grid recording: error calling mediaRecorder.stop().', e)
    state.isRecording = false
    state.isSequenceRecording = false

    if (state.mediaStream) {
      try {
        state.mediaStream.getTracks().forEach((track) => track.stop())
      } catch {
        // ignore
      }
      state.mediaStream = null
    }

    state.mediaRecorder = null
  }
}
