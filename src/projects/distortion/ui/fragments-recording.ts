interface FragmentsRecordingDeps {
  canvas: HTMLCanvasElement
  startRecordingBtn: HTMLButtonElement
  recordingStatus: HTMLElement
  recordingDurationInput: HTMLInputElement
}

export function createFragmentsRecorder(deps: FragmentsRecordingDeps) {
  const { canvas, startRecordingBtn, recordingStatus, recordingDurationInput } = deps

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

    for (const codec of codecs) {
      if (MediaRecorder.isTypeSupported(codec)) {
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

    selectedMimeType = getSupportedMimeType() ?? ''
    if (!selectedMimeType) {
       
      alert('No supported video format found for recording.')
      return
    }

    startRecordingBtn.disabled = true

    let countdown = 3
    recordingStatus.textContent = `Recording starts in ${countdown}...`
    const countdownInterval = window.setInterval(() => {
      countdown -= 1
      if (countdown > 0) {
        recordingStatus.textContent = `Recording starts in ${countdown}...`
      } else {
        window.clearInterval(countdownInterval)
        recordingStatus.textContent = 'Status: Recording...'

        const stream = canvas.captureStream(60)
        recordedChunks = []

        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType })
        } catch (error) {
          console.error('Exception while creating MediaRecorder:', error)
           
          alert(`Error creating MediaRecorder: ${(error as Error).message}`)
          startRecordingBtn.disabled = false
          return
        }

        mediaRecorder.ondataavailable = dataEvent => {
          if (dataEvent.data.size > 0) {
            recordedChunks.push(dataEvent.data)
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
          a.download = 'canvas-recording.mp4'
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          recordedChunks = []
          recordingStatus.textContent = 'Status: Idle'
          startRecordingBtn.disabled = false
        }

        mediaRecorder.start()

        const durationSeconds = Number.parseInt(recordingDurationInput.value, 10)
        const durationMs = Number.isNaN(durationSeconds) ? 0 : durationSeconds * 1000
        window.setTimeout(() => {
          stopRecording()
        }, durationMs)
      }
    }, 1000)
  }

  function stopRecording(): void {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      recordingStatus.textContent = 'Status: Processing...'
    }
  }

  return { startRecording }
}
