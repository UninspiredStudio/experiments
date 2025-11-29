export interface SliceUiElements {
  canvas: HTMLCanvasElement
  canvasContainer: HTMLDivElement
  imageLoader1: HTMLInputElement
  imageLoader2: HTMLInputElement
  tornEdgeCheckbox: HTMLInputElement
  startButton: HTMLButtonElement
  stopButton: HTMLButtonElement
  recordingStatus: HTMLDivElement
  freezeSlicesCheckbox: HTMLInputElement
  randomizeButton: HTMLButtonElement
  backgroundColorPicker: HTMLInputElement
  backgroundPresets: HTMLSelectElement
  optimizedRecordingCheckbox: HTMLInputElement
  speedSlider: HTMLElement
  jaggedAmpSlider: HTMLElement
  jaggedFreqSlider: HTMLElement
  rotationSlider: HTMLElement
  hScrollSpeedSlider1: HTMLElement
  hScrollSpeedSlider2: HTMLElement
  scrollSpeedSlider1: HTMLElement
  scrollSpeedSlider2: HTMLElement
  blockProbSlider: HTMLElement
  maxBlockHeightSlider: HTMLElement
  displacementSlider: HTMLElement
  sliceGapSlider: HTMLElement
  gapVariabilitySlider: HTMLElement
  lineProbSlider: HTMLElement
  maxLineWidthSlider: HTMLElement
  vDisplacementSlider: HTMLElement
  lineGapSlider: HTMLElement
  lineGapVariabilitySlider: HTMLElement
  jaggedAmpControl: HTMLElement
  jaggedFreqControl: HTMLElement
}

/**
 * Queries and returns the core UI elements used by the slice experiment.
 */
export function querySliceUiElements(): SliceUiElements {
  const canvas = document.getElementById('glitchCanvas') as HTMLCanvasElement
  const canvasContainer = document.querySelector('.canvas-container') as HTMLDivElement
  const imageLoader1 = document.getElementById('imageLoader1') as HTMLInputElement
  const imageLoader2 = document.getElementById('imageLoader2') as HTMLInputElement
  const tornEdgeCheckbox = document.getElementById('tornEdgeCheckbox') as HTMLInputElement
  const startButton = document.getElementById('startButton') as HTMLButtonElement
  const stopButton = document.getElementById('stopButton') as HTMLButtonElement
  const recordingStatus = document.getElementById('recordingStatus') as HTMLDivElement
  const freezeSlicesCheckbox = document.getElementById('freezeSlicesCheckbox') as HTMLInputElement
  const randomizeButton = document.getElementById('randomizeButton') as HTMLButtonElement
  const backgroundColorPicker = document.getElementById('backgroundColorPicker') as HTMLInputElement
  const backgroundPresets = document.getElementById('backgroundPresets') as HTMLSelectElement
  const optimizedRecordingCheckbox = document.getElementById('optimizedRecordingCheckbox') as HTMLInputElement
  const speedSlider = document.getElementById('speedSlider') as HTMLElement
  const jaggedAmpSlider = document.getElementById('jaggedAmpSlider') as HTMLElement
  const jaggedFreqSlider = document.getElementById('jaggedFreqSlider') as HTMLElement
  const rotationSlider = document.getElementById('rotationSlider') as HTMLElement
  const hScrollSpeedSlider1 = document.getElementById('hScrollSpeedSlider1') as HTMLElement
  const hScrollSpeedSlider2 = document.getElementById('hScrollSpeedSlider2') as HTMLElement
  const scrollSpeedSlider1 = document.getElementById('scrollSpeedSlider1') as HTMLElement
  const scrollSpeedSlider2 = document.getElementById('scrollSpeedSlider2') as HTMLElement
  const blockProbSlider = document.getElementById('blockProbSlider') as HTMLElement
  const maxBlockHeightSlider = document.getElementById('maxBlockHeightSlider') as HTMLElement
  const displacementSlider = document.getElementById('displacementSlider') as HTMLElement
  const sliceGapSlider = document.getElementById('sliceGapSlider') as HTMLElement
  const gapVariabilitySlider = document.getElementById('gapVariabilitySlider') as HTMLElement
  const lineProbSlider = document.getElementById('lineProbSlider') as HTMLElement
  const maxLineWidthSlider = document.getElementById('maxLineWidthSlider') as HTMLElement
  const vDisplacementSlider = document.getElementById('vDisplacementSlider') as HTMLElement
  const lineGapSlider = document.getElementById('lineGapSlider') as HTMLElement
  const lineGapVariabilitySlider = document.getElementById('lineGapVariabilitySlider') as HTMLElement
  const jaggedAmpControl = document.getElementById('jaggedAmpControl') as HTMLElement
  const jaggedFreqControl = document.getElementById('jaggedFreqControl') as HTMLElement

  return {
    canvas,
    canvasContainer,
    imageLoader1,
    imageLoader2,
    tornEdgeCheckbox,
    startButton,
    stopButton,
    recordingStatus,
    freezeSlicesCheckbox,
    randomizeButton,
    backgroundColorPicker,
    backgroundPresets,
    optimizedRecordingCheckbox,
    speedSlider,
    jaggedAmpSlider,
    jaggedFreqSlider,
    rotationSlider,
    hScrollSpeedSlider1,
    hScrollSpeedSlider2,
    scrollSpeedSlider1,
    scrollSpeedSlider2,
    blockProbSlider,
    maxBlockHeightSlider,
    displacementSlider,
    sliceGapSlider,
    gapVariabilitySlider,
    lineProbSlider,
    maxLineWidthSlider,
    vDisplacementSlider,
    lineGapSlider,
    lineGapVariabilitySlider,
    jaggedAmpControl,
    jaggedFreqControl,
  }
}
