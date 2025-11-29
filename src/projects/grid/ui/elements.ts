export interface GridUiElements {
  loadingMessage: HTMLElement | null
  speedControl: HTMLElement | null
  gridAmountControl: HTMLElement | null
  fillControl: HTMLElement | null
  brightnessThresholdControl: HTMLElement | null
  simplifyPatternRadios: NodeListOf<HTMLInputElement>
  animAreaRadios: NodeListOf<HTMLInputElement>
  overallLengthRadios: NodeListOf<HTMLInputElement>
  fadeInRadios: NodeListOf<HTMLInputElement>
  fadeOutRadios: NodeListOf<HTMLInputElement>
  startAnimationToggle: HTMLInputElement | null
  endAnimationToggle: HTMLInputElement | null
  bgUploadInput: HTMLInputElement | null
  cellImgUploadInput: HTMLInputElement | null
  startButton: HTMLButtonElement | null
  restartButton: HTMLButtonElement | null
  startRecordButton: HTMLButtonElement | null
  stopRecordButton: HTMLButtonElement | null
  randomizeButton: HTMLButtonElement | null
  letterInput: HTMLInputElement | null
  letterColorInput: HTMLInputElement | null
  letterBgColorInput: HTMLInputElement | null
  bgPreviewContainer: HTMLDivElement | null
  bgPreviewImage: HTMLImageElement | null
  bgDeleteButton: HTMLButtonElement | null
  cellPreviewContainer: HTMLDivElement | null
}

export function queryGridUiElements(): GridUiElements {

  const loadingMessage = document.getElementById('loading')
  const speedControl = document.getElementById('speedControl')
  const gridAmountControl = document.getElementById('gridAmountControl')
  const fillControl = document.getElementById('fillControl')
  const brightnessThresholdControl = document.getElementById('brightnessThresholdControl')
  const simplifyPatternRadios = document.querySelectorAll<HTMLInputElement>('input[name="simplifyPattern"]')
  const animAreaRadios = document.querySelectorAll<HTMLInputElement>('input[name="animArea"]')
  const overallLengthRadios = document.querySelectorAll<HTMLInputElement>('input[name="overallLength"]')
  const fadeInRadios = document.querySelectorAll<HTMLInputElement>('input[name="fadeIn"]')
  const fadeOutRadios = document.querySelectorAll<HTMLInputElement>('input[name="fadeOut"]')
  const startAnimationToggle = document.querySelector<HTMLInputElement>('#startAnimationToggle')
  const endAnimationToggle = document.querySelector<HTMLInputElement>('#endAnimationToggle')
  const bgUploadInput = document.querySelector<HTMLInputElement>('#bgUpload')
  const cellImgUploadInput = document.querySelector<HTMLInputElement>('#cellImgUpload')
  const startButton = document.querySelector<HTMLButtonElement>('#startButton')
  const restartButton = document.querySelector<HTMLButtonElement>('#restartButton')
  const startRecordButton = document.querySelector<HTMLButtonElement>('#startRecordButton')
  const stopRecordButton = document.querySelector<HTMLButtonElement>('#stopRecordButton')
  const randomizeButton = document.querySelector<HTMLButtonElement>('#randomizeButton')
  const letterInput = document.querySelector<HTMLInputElement>('#letterInput')
  const letterColorInput = document.querySelector<HTMLInputElement>('#letterColorInput')
  const letterBgColorInput = document.querySelector<HTMLInputElement>('#letterBgColorInput')
  const bgPreviewContainer = document.querySelector<HTMLDivElement>('#bgPreviewContainer')
  const bgPreviewImage = document.querySelector<HTMLImageElement>('#bgPreviewImage')
  const bgDeleteButton = document.querySelector<HTMLButtonElement>('#bgDeleteButton')
  const cellPreviewContainer = document.querySelector<HTMLDivElement>('#cellPreviewContainer')

  return {
    loadingMessage,
    speedControl,
    gridAmountControl,
    fillControl,
    brightnessThresholdControl,
    simplifyPatternRadios,
    animAreaRadios,
    overallLengthRadios,
    fadeInRadios,
    fadeOutRadios,
    startAnimationToggle,
    endAnimationToggle,
    bgUploadInput,
    cellImgUploadInput,
    startButton,
    restartButton,
    startRecordButton,
    stopRecordButton,
    randomizeButton,
    letterInput,
    letterColorInput,
    letterBgColorInput,
    bgPreviewContainer,
    bgPreviewImage,
    bgDeleteButton,
    cellPreviewContainer,
  }
}
