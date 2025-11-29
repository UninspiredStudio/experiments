interface ShiftRecordingDeps {
  canvas: HTMLCanvasElement
  startRecordingBtn: HTMLButtonElement
  recordingStatus: HTMLElement
  recordingDurationInput: HTMLInputElement
  recordingCountdown: HTMLElement
  countdownText: HTMLElement
}

export function createShiftRecorder(deps: ShiftRecordingDeps) {
  const { canvas, startRecordingBtn, recordingStatus, recordingDurationInput, recordingCountdown, countdownText } = deps

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
    startRecordingBtn.disabled = true

    recordingCountdown.classList.remove('hidden')

    let countdown = 3
    recordingStatus.textContent = `Recording starts in ${countdown}...`
    countdownText.textContent = `Recording starts in ${countdown}...`

    const countdownInterval = window.setInterval(() => {
      countdown -= 1
      if (countdown > 0) {
        recordingStatus.textContent = `Recording starts in ${countdown}...`
        countdownText.textContent = `Recording starts in ${countdown}...`
      } else {
        window.clearInterval(countdownInterval)
        recordingStatus.textContent = 'Status: Recording...'
        countdownText.textContent = 'Recording in progress...'

        window.setTimeout(() => {
          recordingCountdown.classList.add('hidden')
        }, 1000)

        const stream = canvas.captureStream(60)
        recordedChunks = []

        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType })
        } catch (e) {
           
          console.error('Exception while creating MediaRecorder:', e)
           
          alert(`Error creating MediaRecorder: ${(e as Error).message}`)
          startRecordingBtn.disabled = false
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
          a.download = 'shift-recording.mp4'
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          recordedChunks = []
          recordingStatus.textContent = 'Status: Idle'
          startRecordingBtn.disabled = false
        }

        mediaRecorder.start()

        const durationSeconds = Number.parseInt(recordingDurationInput.value, 10)
        const duration = Number.isFinite(durationSeconds) ? durationSeconds * 1000 : 0
        window.setTimeout(() => {
          stopRecording()
        }, duration)
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
