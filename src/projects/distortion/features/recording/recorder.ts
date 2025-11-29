import type { RecordingHandle, RecordingOptions } from './types'

const DEFAULT_CODECS = [
  'video/webm; codecs="vp9, opus"',
  'video/webm; codecs="vp8, opus"',
  'video/webm',
]

export function startCanvasRecording(
  canvas: HTMLCanvasElement,
  { durationMs, fps = 60 }: RecordingOptions,
): RecordingHandle | null {
  if (!('MediaRecorder' in window)) {return null}

  const stream = canvas.captureStream(fps)
  const MediaRecorderCtor = window.MediaRecorder

  let recorder: MediaRecorder | null = null
  for (const codec of DEFAULT_CODECS) {
    if (typeof MediaRecorderCtor.isTypeSupported === 'function' && MediaRecorderCtor.isTypeSupported(codec)) {
      recorder = new MediaRecorder(stream, { mimeType: codec })
      break
    }
  }

  if (!recorder) {
    recorder = new MediaRecorder(stream)
  }

  const chunks: Blob[] = []
  recorder.ondataavailable = event => {
    if (event.data.size > 0) {chunks.push(event.data)}
  }

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: chunks[0]?.type ?? 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'distortion-recording.webm'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  recorder.start()

  const timeoutId = window.setTimeout(() => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
  }, durationMs)

  return {
    stop: () => {
      window.clearTimeout(timeoutId)
      if (recorder && recorder.state === 'recording') {
        recorder.stop()
      }
    },
  }
}
