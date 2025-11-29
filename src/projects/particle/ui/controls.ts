import { domElements } from './elements'
import { particleState } from '../core/state'
import type { InteractionMode, ParticleShape } from '../types/state'
import { updateParticleCharacters } from '../core/particles'
import { startPathCountdown } from '../features/replay/recorder'
import { triggerReplay } from '../features/replay/player'
import { downloadPathSvg } from '../features/export/svg'
import {
  startFrameRecording,
  stopFrameRecording,
  downloadRecordedFramesZip,
} from '../features/recording/frames-recorder'
import {
  startVideoRecording,
  stopVideoRecording,
  downloadRecordedVideo,
} from '../features/recording/video-recorder'

let controlsInitialized = false

function handleMouseMove(event: MouseEvent): void {
  const rect = domElements.canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  particleState.actualMouse.x = x
  particleState.actualMouse.y = y

  if (!particleState.isReplaying) {
    particleState.mouse.x = x
    particleState.mouse.y = y
  }

  if (particleState.isRecording) {
    particleState.recordedPath.push({
      x,
      y,
      timestamp: performance.now(),
    })
  }
}

function handleMouseLeave(): void {
  particleState.actualMouse.x = null
  particleState.actualMouse.y = null

  if (!particleState.isReplaying) {
    particleState.mouse.x = null
    particleState.mouse.y = null
  }
}

function setupMouseControls(): void {
  domElements.canvas.addEventListener('mousemove', handleMouseMove)
  domElements.canvas.addEventListener('mouseleave', handleMouseLeave)
}

function setupSliderControls(): void {
  const densitySlider = domElements.densitySlider
  const radiusSlider = domElements.mouseRadiusSlider
  const speedSlider = domElements.transitionSpeedSlider
  const sizeSlider = domElements.particleSizeSlider

  const densityValueSpan = domElements.densityValueSpan
  const radiusValueSpan = domElements.radiusValueSpan
  const speedValueSpan = domElements.speedValueSpan
  const sizeValueSpan = domElements.particleSizeValue

  const updateDensity = () => {
    const value = parseInt(densitySlider.value, 10)
    if (!Number.isNaN(value)) {
      particleState.particleDensity = value
      if (densityValueSpan) {
        densityValueSpan.textContent = String(value)
      }
    }
  }

  const updateRadius = () => {
    const value = parseInt(radiusSlider.value, 10)
    if (!Number.isNaN(value)) {
      particleState.mouse.radius = value
      if (radiusValueSpan) {
        radiusValueSpan.textContent = String(value)
      }
    }
  }

  const updateSpeed = () => {
    const value = parseInt(speedSlider.value, 10)
    if (!Number.isNaN(value)) {
      particleState.mouseEffectSpeedFactor = value
      if (speedValueSpan) {
        speedValueSpan.textContent = String(value)
      }
    }
  }

  const updateSize = () => {
    const value = parseFloat(sizeSlider.value)
    if (!Number.isNaN(value)) {
      particleState.particleSize = value
      if (sizeValueSpan) {
        sizeValueSpan.textContent = value.toFixed(1)
      }
    }
  }

  updateDensity()
  updateRadius()
  updateSpeed()
  updateSize()

  densitySlider.addEventListener('input', updateDensity)
  radiusSlider.addEventListener('input', updateRadius)
  speedSlider.addEventListener('input', updateSpeed)
  sizeSlider.addEventListener('input', updateSize)
}

function setupShapeAndInteractionControls(): void {
  domElements.particleShapeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) {
        return
      }

      const value = radio.value as ParticleShape
      particleState.particleShape = value

      if (domElements.characterSettings) {
        domElements.characterSettings.style.display = value === 'character' ? 'block' : 'none'
      }
    })
  })

  domElements.interactionModeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) {
        return
      }

      const value = radio.value as InteractionMode
      particleState.interactionMode = value
    })
  })

  const updateCharactersFromInput = () => {
    const value = domElements.particleCharacterInput.value || '?'
    particleState.particleCharacter = value
    updateParticleCharacters()
  }

  const updateFontFromSelect = () => {
    particleState.particleFont = domElements.particleFontSelect.value
  }

  updateCharactersFromInput()
  updateFontFromSelect()

  domElements.particleCharacterInput.addEventListener('input', updateCharactersFromInput)
  domElements.particleFontSelect.addEventListener('change', updateFontFromSelect)
}

function setupPathControls(): void {
  domElements.recordPathBtn.addEventListener('click', () => {
    startPathCountdown()
  })

  domElements.replayPathBtn.addEventListener('click', () => {
    triggerReplay()
  })

  domElements.showReplayPathCheckbox.addEventListener('change', () => {
    particleState.showReplayPath = domElements.showReplayPathCheckbox.checked
  })

  domElements.downloadSvgBtn.addEventListener('click', () => {
    downloadPathSvg()
  })
}

function setupFrameRecordingControls(): void {
  if (domElements.recordAnimationBtn) {
    domElements.recordAnimationBtn.addEventListener('click', () => {
      if (!particleState.isRecordingAnimation) {
        const seconds = parseFloat(domElements.recordAnimationDurationInput.value)
        const durationSeconds = !Number.isNaN(seconds) && seconds > 0 ? seconds : 0
        startFrameRecording(durationSeconds)
      } else {
        stopFrameRecording()
      }
    })
  }

  if (domElements.recordWithReplayBtn) {
    domElements.recordWithReplayBtn.addEventListener('click', () => {
      if (!particleState.hasRecordedPath) {
        return
      }

      if (!particleState.isRecordingAnimation) {
        const seconds = parseFloat(domElements.recordAnimationDurationInput.value)
        const durationSeconds = !Number.isNaN(seconds) && seconds > 0 ? seconds : 0
        startFrameRecording(durationSeconds)
      }

      triggerReplay()
    })
  }

  if (domElements.downloadRecordingBtn) {
    domElements.downloadRecordingBtn.addEventListener('click', () => {
      void downloadRecordedFramesZip()
    })
  }
}

function setupVideoRecordingControls(): void {
  domElements.recordVideoBtn.addEventListener('click', () => {
    if (!particleState.isRecordingVideo) {
      startVideoRecording()
    } else {
      stopVideoRecording()
    }
  })

  domElements.downloadVideoBtn.addEventListener('click', () => {
    downloadRecordedVideo()
  })
}

export function initializeControls(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (controlsInitialized) {
    return
  }

  controlsInitialized = true

  setupMouseControls()
  setupSliderControls()
  setupShapeAndInteractionControls()
  setupPathControls()
  setupFrameRecordingControls()
  setupVideoRecordingControls()
}
