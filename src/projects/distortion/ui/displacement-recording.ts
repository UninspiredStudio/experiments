interface DisplacementRecordingDeps {
  canvas: HTMLCanvasElement
  recordButton: HTMLButtonElement
  durationInput: HTMLInputElement
}

export function createDisplacementRecorder(deps: DisplacementRecordingDeps) {
  const { canvas, recordButton, durationInput } = deps

  let mediaRecorder: MediaRecorder | null = null
  let recordedChunks: Blob[] = []
  let selectedMimeType = ''

  function getSupportedMimeType(): string | null {
    const codecs = [
      'video/mp4; codecs="avc1.42E01E"',
      'video/mp4; codecs="hvc1.1.6.L93.B0"',
      'video/mp4; codecs="hev1.1.6.L93.B0"',
      'video/webm; codecs="vp9, opus"',
      'video/webm; codecs="vp8, opus"',
      'video/mp4',
    ]

    const MediaRecorderCtor = window.MediaRecorder
    if (!MediaRecorderCtor || typeof MediaRecorderCtor.isTypeSupported !== 'function') {return null}

    for (const codec of codecs) {
      if (MediaRecorderCtor.isTypeSupported(codec)) {
        return codec
      }
    }
    return null
  }

  function startRecording(): void {
    if (!('MediaRecorder' in window)) {
      alert('MediaRecorder not supported in this browser.')
      return
    }

    const mimeType = getSupportedMimeType()
    if (!mimeType) {
      alert('No supported video format found for recording.')
      return
    }
    selectedMimeType = mimeType

    const durationSeconds = Number.parseInt(durationInput.value, 10)
    const durationMs = Number.isNaN(durationSeconds) ? 0 : durationSeconds * 1000
    if (!Number.isFinite(durationSeconds) || durationMs <= 0) {
      alert('Please enter a valid duration.')
      return
    }

    const originalLabel = recordButton.textContent ?? ''
    recordButton.disabled = true

    let countdown = 3
    recordButton.textContent = `Recording starts in ${countdown}...`

    const countdownInterval = window.setInterval(() => {
      countdown -= 1
      if (countdown > 0) {
        recordButton.textContent = `Recording starts in ${countdown}...`
      } else {
        window.clearInterval(countdownInterval)
        recordButton.textContent = 'Recording in progress...'

        const stream = canvas.captureStream(60)
        recordedChunks = []

        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType })
        } catch (error) {
          console.error('Exception while creating MediaRecorder:', error)
          alert(`Error creating MediaRecorder: ${(error as Error).message}`)
          recordButton.disabled = false
          recordButton.textContent = originalLabel
          return
        }

        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, {
            type: selectedMimeType,
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          document.body.appendChild(a)
          a.style.display = 'none'
          a.href = url
          a.download = 'displacement-recording.mp4'
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          recordedChunks = []
          recordButton.disabled = false
          recordButton.textContent = originalLabel
        }

        mediaRecorder.start()

        window.setTimeout(() => {
          stopRecording()
        }, durationMs)
      }
    }, 1000)
  }

  function stopRecording(): void {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      recordButton.textContent = 'Processing...'
    }
  }

  return { startRecording }
}
