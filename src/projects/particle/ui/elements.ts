export interface ParticleDomElements {
  canvas: HTMLCanvasElement
  imageUpload: HTMLInputElement
  imageListDiv: HTMLElement | null
  densitySlider: HTMLInputElement
  densityValueSpan: HTMLElement | null
  mouseRadiusSlider: HTMLInputElement
  radiusValueSpan: HTMLElement | null
  transitionSpeedSlider: HTMLInputElement
  speedValueSpan: HTMLElement | null
  body: HTMLBodyElement
  recordPathBtn: HTMLButtonElement
  replayPathBtn: HTMLButtonElement
  trackingDurationInput: HTMLInputElement
  showReplayPathCheckbox: HTMLInputElement
  countdownDisplay: HTMLElement
  downloadSvgBtn: HTMLButtonElement
  randomizeButton: HTMLButtonElement
  recordAnimationDurationInput: HTMLInputElement
  recordAnimationBtn: HTMLButtonElement | null
  recordWithReplayBtn: HTMLButtonElement | null
  downloadRecordingBtn: HTMLButtonElement | null
  animationRecordingStatus: HTMLElement
  particleSizeSlider: HTMLInputElement
  particleSizeValue: HTMLElement | null
  particleShapeRadios: NodeListOf<HTMLInputElement>
  interactionModeRadios: NodeListOf<HTMLInputElement>
  videoRecordingDurationInput: HTMLInputElement
  recordVideoBtn: HTMLButtonElement
  downloadVideoBtn: HTMLButtonElement
  videoRecordingStatus: HTMLElement
  optimizedRecordingCheckbox: HTMLInputElement
  characterSettings: HTMLElement
  particleCharacterInput: HTMLInputElement
  particleFontSelect: HTMLSelectElement
  controlsToDisable: (HTMLElement | HTMLInputElement | HTMLButtonElement | NodeListOf<HTMLInputElement> | null)[]
}

function getElementById<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) {
    throw new Error(`Element with id ${id} not found`)
  }
  return el as T
}

export const domElements: ParticleDomElements = {
  canvas: getElementById<HTMLCanvasElement>('particleCanvas'),
  imageUpload: getElementById<HTMLInputElement>('imageUpload'),
  imageListDiv: document.getElementById('imageList'),
  densitySlider: getElementById<HTMLInputElement>('particleDensity'),
  densityValueSpan: document.getElementById('densityValue'),
  mouseRadiusSlider: getElementById<HTMLInputElement>('mouseRadius'),
  radiusValueSpan: document.getElementById('radiusValue'),
  transitionSpeedSlider: getElementById<HTMLInputElement>('transitionSpeed'),
  speedValueSpan: document.getElementById('speedValue'),
  body: document.body as HTMLBodyElement,
  recordPathBtn: getElementById<HTMLButtonElement>('recordPathBtn'),
  replayPathBtn: getElementById<HTMLButtonElement>('replayPathBtn'),
  trackingDurationInput: getElementById<HTMLInputElement>('trackingDurationInput'),
  showReplayPathCheckbox: getElementById<HTMLInputElement>('showReplayPathCheckbox'),
  countdownDisplay: getElementById<HTMLElement>('countdownDisplay'),
  downloadSvgBtn: getElementById<HTMLButtonElement>('downloadSvgBtn'),
  randomizeButton: getElementById<HTMLButtonElement>('randomizeButton'),
  recordAnimationDurationInput: getElementById<HTMLInputElement>('recordAnimationDurationInput'),
  recordAnimationBtn: document.getElementById('recordAnimationBtn') as HTMLButtonElement | null,
  recordWithReplayBtn: document.getElementById('recordWithReplayBtn') as HTMLButtonElement | null,
  downloadRecordingBtn: document.getElementById('downloadRecordingBtn') as HTMLButtonElement | null,
  animationRecordingStatus: getElementById<HTMLElement>('animationRecordingStatus'),
  particleSizeSlider: getElementById<HTMLInputElement>('particleSizeSlider'),
  particleSizeValue: document.getElementById('particleSizeValue'),
  particleShapeRadios: document.querySelectorAll<HTMLInputElement>('input[name="particleShape"]'),
  interactionModeRadios: document.querySelectorAll<HTMLInputElement>('input[name="interactionMode"]'),
  videoRecordingDurationInput: getElementById<HTMLInputElement>('videoRecordingDurationInput'),
  recordVideoBtn: getElementById<HTMLButtonElement>('recordVideoBtn'),
  downloadVideoBtn: getElementById<HTMLButtonElement>('downloadVideoBtn'),
  videoRecordingStatus: getElementById<HTMLElement>('videoRecordingStatus'),
  optimizedRecordingCheckbox: getElementById<HTMLInputElement>('optimizedRecordingCheckbox'),
  characterSettings: getElementById<HTMLElement>('characterSettings'),
  particleCharacterInput: getElementById<HTMLInputElement>('particleCharacter'),
  particleFontSelect: getElementById<HTMLSelectElement>('particleFont'),
  controlsToDisable: [],
}

domElements.controlsToDisable = [
  domElements.imageUpload,
  domElements.densitySlider,
  domElements.mouseRadiusSlider,
  domElements.transitionSpeedSlider,
  domElements.recordPathBtn,
  domElements.replayPathBtn,
  domElements.recordAnimationBtn,
  domElements.recordWithReplayBtn,
  domElements.downloadRecordingBtn,
  domElements.downloadSvgBtn,
  domElements.recordVideoBtn,
  domElements.downloadVideoBtn,
  domElements.particleSizeSlider,
  domElements.particleShapeRadios,
  domElements.interactionModeRadios,
  domElements.particleCharacterInput,
  domElements.particleFontSelect,
  domElements.randomizeButton,
]

