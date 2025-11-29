import type { Noise3DFn } from '@shared/utils/noise'

import type { GridState } from '../types'
import type { GridCanvasContext } from '../core/canvas'
import { updateGridParams } from '../core/canvas'
import { startBackgroundAnimation, startSequence, stopAllAnimations, isSequenceActive } from '../animation/sequence'
import { startManualRecording, startRecordingSequence, stopRecording } from '../features/recording'
import { drawBackground } from '../rendering/background'
import { queryGridUiElements } from './elements'
import type { SliderChangeDetail } from './state-adapters'
import {
  applyBrightnessFromSliderDetail,
  applyFillFromSliderDetail,
  applySpeedFromSliderDetail,
  getGridAmountFromSlider,
  getNormalizedValueFromSlider,
} from './state-adapters'

function getSelectedRadioValue(radios: NodeListOf<HTMLInputElement>): string | null {
  for (const radio of Array.from(radios)) {
    if (radio.checked) {
      return radio.value
    }
  }
  return null
}

function updateBrightnessThresholdVisibility(state: GridState): void {
  const ui = queryGridUiElements()
  const container = ui.brightnessThresholdControl?.closest('.control-item') as HTMLElement | null

  if (!container) { return }

  if (state.animationAreaMode === 'everywhere') {
    container.style.display = 'none'
  } else {
    container.style.display = 'flex'
  }
}

export function initGridUI(
  state: GridState,
  canvas: HTMLCanvasElement,
  hiddenBgCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  noise3D: Noise3DFn,
): void {
  const ui = queryGridUiElements()
  const gridContext: GridCanvasContext = {
    ctx,
    canvas,
  }

  if (ui.speedControl) {
    ui.speedControl.addEventListener('change', (event: Event) => {
      const detail = (event as CustomEvent<SliderChangeDetail>).detail ?? null
      applySpeedFromSliderDetail(state, detail)
    })
  }

  if (ui.gridAmountControl) {
    ui.gridAmountControl.addEventListener('change', (event: Event) => {
      const detail = (event as CustomEvent<SliderChangeDetail>).detail ?? null
      let gridAmount: number
      if (detail) {
        const rounded = Math.round(detail.displayValue)
        gridAmount = Number.isFinite(rounded) && rounded > 0 ? rounded : 10
      } else {
        gridAmount = getGridAmountFromSlider(ui.gridAmountControl)
      }
      updateGridParams(state, canvas, gridAmount)
    })
  }

  if (ui.fillControl) {
    ui.fillControl.addEventListener('change', (event: Event) => {
      const detail = (event as CustomEvent<SliderChangeDetail>).detail ?? null
      applyFillFromSliderDetail(state, detail)
    })
  }

  if (ui.brightnessThresholdControl) {
    ui.brightnessThresholdControl.addEventListener('change', (event: Event) => {
      const detail = (event as CustomEvent<SliderChangeDetail>).detail ?? null
      applyBrightnessFromSliderDetail(state, detail)
    })
  }

  ui.simplifyPatternRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const value = getSelectedRadioValue(ui.simplifyPatternRadios)
      state.isSimplified = value === 'simple'
    })
  })

  ui.animAreaRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const value = getSelectedRadioValue(ui.animAreaRadios)
      if (value === 'everywhere' || value === 'light' || value === 'dark') {
        state.animationAreaMode = value
        updateBrightnessThresholdVisibility(state)
      }
    })
  })

  ui.overallLengthRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const value = getSelectedRadioValue(ui.overallLengthRadios)
      if (!value) { return }
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed) && parsed > 0) {
        state.overallDuration = parsed
      }
    })
  })

  ui.fadeInRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const value = getSelectedRadioValue(ui.fadeInRadios)
      if (!value) { return }
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed) && parsed > 0) {
        state.startAnimationDuration = parsed
      }
    })
  })

  ui.fadeOutRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const value = getSelectedRadioValue(ui.fadeOutRadios)
      if (!value) { return }
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed) && parsed > 0) {
        state.endAnimationDuration = parsed
      }
    })
  })

  if (ui.startAnimationToggle) {
    ui.startAnimationToggle.addEventListener('change', () => {
      state.startAnimationEnabled = ui.startAnimationToggle?.checked ?? false
    })
  }

  if (ui.endAnimationToggle) {
    ui.endAnimationToggle.addEventListener('change', () => {
      state.endAnimationEnabled = ui.endAnimationToggle?.checked ?? false
    })
  }

  if (ui.letterInput) {
    ui.letterInput.addEventListener('input', () => {
      state.currentLetters = ui.letterInput?.value ?? ''
    })
  }

  if (ui.letterColorInput) {
    ui.letterColorInput.addEventListener('input', () => {
      state.letterColor = ui.letterColorInput?.value ?? '#FFFFFF'
    })
  }

  if (ui.letterBgColorInput) {
    ui.letterBgColorInput.addEventListener('input', () => {
      state.letterBgColor = ui.letterBgColorInput?.value ?? '#000000'
    })
  }

  if (ui.randomizeButton) {
    ui.randomizeButton.addEventListener('click', () => {
      const randomSpeedValue = Math.random()
      const randomGridValue = Math.random()
      const randomFillValue = Math.random()
      const randomBrightnessValue = Math.random()

      if (ui.speedControl) {
        ui.speedControl.setAttribute('value', randomSpeedValue.toString())
        const normalized = getNormalizedValueFromSlider(ui.speedControl)
        applySpeedFromSliderDetail(state, { value: normalized, displayValue: 0 })
      }

      if (ui.gridAmountControl) {
        ui.gridAmountControl.setAttribute('value', randomGridValue.toString())
        const gridAmount = getGridAmountFromSlider(ui.gridAmountControl)
        updateGridParams(state, canvas, gridAmount)
      }

      if (ui.fillControl) {
        ui.fillControl.setAttribute('value', randomFillValue.toString())
        const normalized = getNormalizedValueFromSlider(ui.fillControl)
        applyFillFromSliderDetail(state, { value: normalized, displayValue: 0 })
      }

      if (ui.brightnessThresholdControl) {
        ui.brightnessThresholdControl.setAttribute('value', randomBrightnessValue.toString())
        const normalized = getNormalizedValueFromSlider(ui.brightnessThresholdControl)
        applyBrightnessFromSliderDetail(state, { value: normalized, displayValue: 0 })
      }
    })
  }

  function handleStartSequence(): void {
    const startButton = ui.startButton
    const startRecordButton = ui.startRecordButton
    const stopRecordButton = ui.stopRecordButton

    if (!startButton || !startRecordButton || !stopRecordButton) {return}

    stopAllAnimations(state, false)
    state.assignedCellData.clear()
    state.time = 0

    const recordingStarted = startRecordingSequence(state, canvas)
    if (!recordingStarted) {
      startBackgroundAnimation(state, gridContext, noise3D)
      return
    }

    startButton.textContent = 'Stop Recording'
    startButton.classList.add('stop-mode')
    startButton.disabled = false

    startRecordButton.disabled = true
    stopRecordButton.disabled = true
    stopRecordButton.style.display = 'none'

    startSequence(state, gridContext, noise3D, {
      onComplete: () => {
        if (state.isRecording && state.isSequenceRecording) {
          stopRecording(state)
        }

        startButton.textContent = 'Record'
        startButton.classList.remove('stop-mode')
        startButton.disabled = false

        if (!state.isRecording) {
          startRecordButton.disabled = false
          stopRecordButton.disabled = true
          stopRecordButton.style.display = 'none'
        }

        startBackgroundAnimation(state, gridContext, noise3D)
      },
    })
  }

  function handleRestart(): void {
    if (!ui.startButton || !ui.startRecordButton || !ui.stopRecordButton) { return }

    const wasSequenceRecording = state.isSequenceRecording
    state.isSequenceRecording = false

    if (state.isRecording && wasSequenceRecording) {
      stopRecording(state)
    }

    stopAllAnimations(state, false)
    drawBackground(state, gridContext)
    state.assignedCellData.clear()
    state.time = 0

    ui.startButton.textContent = 'Record'
    ui.startButton.classList.remove('stop-mode')
    ui.startButton.disabled = false

    if (!state.isRecording) {
      ui.startRecordButton.disabled = false
      ui.stopRecordButton.disabled = true
      ui.stopRecordButton.style.display = 'none'
    }

    startBackgroundAnimation(state, gridContext, noise3D)
  }

  function handleStartManualRecording(): void {
    if (!ui.startRecordButton || !ui.stopRecordButton || !ui.startButton) { return }
    if (isSequenceActive(state)) { return }

    const ok = startManualRecording(state, canvas)
    if (!ok) { return }

    ui.startRecordButton.disabled = true
    ui.stopRecordButton.disabled = false
    ui.stopRecordButton.style.display = 'inline-block'
    ui.startButton.disabled = true
  }

  function handleStopManualRecording(): void {
    if (!ui.startRecordButton || !ui.stopRecordButton || !ui.startButton) { return }

    if (!state.isRecording || state.isSequenceRecording) { return }

    stopRecording(state)

    ui.stopRecordButton.disabled = true
    ui.stopRecordButton.style.display = 'none'
    ui.startRecordButton.disabled = false

    if (!isSequenceActive(state)) {
      ui.startButton.disabled = false
    }
  }

  if (ui.startButton) {
    ui.startButton.addEventListener('click', () => {
      if (isSequenceActive(state)) {
        handleRestart()
      } else {
        handleStartSequence()
      }
    })
  }

  if (ui.restartButton) {
    ui.restartButton.addEventListener('click', () => {
      handleRestart()
    })
  }

  if (ui.startRecordButton) {
    ui.startRecordButton.addEventListener('click', () => {
      handleStartManualRecording()
    })
  }

  if (ui.stopRecordButton) {
    ui.stopRecordButton.addEventListener('click', () => {
      handleStopManualRecording()
    })
  }
}

export function initDefaultControls(state: GridState, canvas: HTMLCanvasElement, _ctx: GridCanvasContext): void {
  const ui = queryGridUiElements()

  if (ui.speedControl) {
    ui.speedControl.setAttribute('value', '0.3684')
    const normalized = getNormalizedValueFromSlider(ui.speedControl)
    applySpeedFromSliderDetail(state, { value: normalized, displayValue: 0 })
  }

  if (ui.gridAmountControl) {
    ui.gridAmountControl.setAttribute('value', '0.2105')
    const gridAmount = getGridAmountFromSlider(ui.gridAmountControl)
    updateGridParams(state, canvas, gridAmount)
  }

  if (ui.fillControl) {
    ui.fillControl.setAttribute('value', '0.5')
    const normalized = getNormalizedValueFromSlider(ui.fillControl)
    applyFillFromSliderDetail(state, { value: normalized, displayValue: 0 })
  }

  if (ui.brightnessThresholdControl) {
    ui.brightnessThresholdControl.setAttribute('value', '0.5020')
    const normalized = getNormalizedValueFromSlider(ui.brightnessThresholdControl)
    applyBrightnessFromSliderDetail(state, { value: normalized, displayValue: 0 })
  }

  const simplifyValue = getSelectedRadioValue(ui.simplifyPatternRadios)
  state.isSimplified = simplifyValue === 'simple'

  const animAreaValue = getSelectedRadioValue(ui.animAreaRadios)
  if (animAreaValue === 'everywhere' || animAreaValue === 'light' || animAreaValue === 'dark') {
    state.animationAreaMode = animAreaValue
  }
  updateBrightnessThresholdVisibility(state)

  const overallValue = getSelectedRadioValue(ui.overallLengthRadios)
  if (overallValue) {
    const parsed = Number.parseFloat(overallValue)
    if (Number.isFinite(parsed) && parsed > 0) {
      state.overallDuration = parsed
    }
  }

  const fadeInValue = getSelectedRadioValue(ui.fadeInRadios)
  if (fadeInValue) {
    const parsed = Number.parseFloat(fadeInValue)
    if (Number.isFinite(parsed) && parsed > 0) {
      state.startAnimationDuration = parsed
    }
  }

  const fadeOutValue = getSelectedRadioValue(ui.fadeOutRadios)
  if (fadeOutValue) {
    const parsed = Number.parseFloat(fadeOutValue)
    if (Number.isFinite(parsed) && parsed > 0) {
      state.endAnimationDuration = parsed
    }
  }

  if (ui.startAnimationToggle) {
    state.startAnimationEnabled = ui.startAnimationToggle.checked
  }

  if (ui.endAnimationToggle) {
    state.endAnimationEnabled = ui.endAnimationToggle.checked
  }

  if (ui.letterInput) {
    state.currentLetters = ui.letterInput.value
  }

  if (ui.letterColorInput) {
    state.letterColor = ui.letterColorInput.value || '#FFFFFF'
  }

  if (ui.letterBgColorInput) {
    state.letterBgColor = ui.letterBgColorInput.value || '#000000'
  }
}
