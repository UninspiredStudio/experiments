// ui.js - Manages UI elements and control interactions

import { state } from './state.js';

// Cache UI element references
export const ui = {
    // Canvas elements
    canvas: document.getElementById('noiseCanvas'),
    ctx: document.getElementById('noiseCanvas').getContext('2d'),
    hiddenBgCanvas: document.getElementById('hiddenBgCanvas'),
    hiddenCtx: document.getElementById('hiddenBgCanvas').getContext('2d', { willReadFrequently: true }),
    
    // UI controls
    loadingMessage: document.getElementById('loading'),
    speedControl: document.getElementById('speedControl'),
    gridAmountControl: document.getElementById('gridAmountControl'),
    fillControl: document.getElementById('fillControl'),
    simplifyControl: document.getElementById('simplifyControl'),
    bgUploadInput: document.getElementById('bgUpload'),
    cellImgUploadInput: document.getElementById('cellImgUpload'),
    animAreaRadios: document.querySelectorAll('input[name="animArea"]'),
    startButton: document.getElementById('startButton'),
    overallDurationInput: document.getElementById('overallDurationInput'),
    startAnimationControl: document.getElementById('startAnimationControl'),
    startDurationInput: document.getElementById('startDurationInput'),
    endAnimationControl: document.getElementById('endAnimationControl'),
    endDurationInput: document.getElementById('endDurationInput'),
    startRecordButton: document.getElementById('startRecordButton'),
    stopRecordButton: document.getElementById('stopRecordButton'),
    letterInput: document.getElementById('letterInput'),
    letterColorInput: document.getElementById('letterColorInput'),
    letterBgColorInput: document.getElementById('letterBgColorInput')
};

// References to imported functions to avoid circular dependencies
let updateGridParamsFn;
let handleBgUploadFn;
let handleCellImgUploadFn;
let handleStartSequenceFn;
let handleRestartFn;
let handleStartRecordingFn;
let handleStopRecordingFn;
let startBackgroundAnimationFn;
let stopAllAnimationsFn;

// Function to set external dependencies (called from main.js)
export function setDependencies(deps) {
    updateGridParamsFn = deps.updateGridParams;
    handleBgUploadFn = deps.handleBgUpload;
    handleCellImgUploadFn = deps.handleCellImgUpload;
    handleStartSequenceFn = deps.handleStartSequence;
    handleRestartFn = deps.handleRestart;
    handleStartRecordingFn = deps.handleStartRecording;
    handleStopRecordingFn = deps.handleStopRecording;
    startBackgroundAnimationFn = deps.startBackgroundAnimation;
    stopAllAnimationsFn = deps.stopAllAnimations;
}

// UI update functions
export function updateSpeed(event) {
    // Basic slider provides value between 0 and 1 in event.detail.value
    // Map normalized value (0-1) to the desired range (0.001 to 0.020)
    const minTimeStep = 0.001;
    const maxTimeStep = 0.020;
    state.timeStep = (event.detail.value * (maxTimeStep - minTimeStep)) + minTimeStep;
    // No need to update span, basic-slider handles it internally
}

export function updateFillPercentage(event) {
    // Basic slider provides value between 0 and 1 in event.detail.value
    // Map normalized value (0-1) to the noise threshold range (1.0 down to 0.0)
    state.noiseThreshold = 1.0 - event.detail.value;
    // No need to update span, basic-slider handles it internally
}

export function updateSimplify() {
    state.isSimplified = ui.simplifyControl.checked;
}

export function updateAnimationAreaMode() {
    state.animationAreaMode = document.querySelector('input[name="animArea"]:checked').value;
}

export function updateStartAnimationEnabled() {
    state.startAnimationEnabled = ui.startAnimationControl.checked;
}

export function updateEndAnimationEnabled() {
    state.endAnimationEnabled = ui.endAnimationControl.checked;
}

export function updateStartAnimationDuration() {
    state.startAnimationDuration = parseFloat(ui.startDurationInput.value) || 0.1;
    if (state.startAnimationDuration <= 0) state.startAnimationDuration = 0.1;
    ui.startDurationInput.value = state.startAnimationDuration.toFixed(1);
}

export function updateEndAnimationDuration() {
    state.endAnimationDuration = parseFloat(ui.endDurationInput.value) || 0.1;
    if (state.endAnimationDuration <= 0) state.endAnimationDuration = 0.1;
    ui.endDurationInput.value = state.endAnimationDuration.toFixed(1);
}

export function updateOverallDuration() {
    state.overallDuration = parseFloat(ui.overallDurationInput.value) || 0.1;
    if (state.overallDuration <= 0) state.overallDuration = 0.1;
    ui.overallDurationInput.value = state.overallDuration.toFixed(1);
}

export function updateCurrentLetters() {
    state.currentLetters = ui.letterInput.value;
}

export function updateLetterColor() {
    state.letterColor = ui.letterColorInput.value;
}

export function updateLetterBgColor() {
    state.letterBgColor = ui.letterBgColorInput.value;
}

// Initialize UI event listeners
export function initializeUIListeners() {
    ui.speedControl.addEventListener('change', updateSpeed);
    ui.gridAmountControl.addEventListener('change', updateGridParamsFn);
    ui.fillControl.addEventListener('change', updateFillPercentage);
    ui.simplifyControl.addEventListener('change', updateSimplify);
    ui.bgUploadInput.addEventListener('change', handleBgUploadFn);
    ui.cellImgUploadInput.addEventListener('change', handleCellImgUploadFn);
    ui.animAreaRadios.forEach(radio => radio.addEventListener('change', updateAnimationAreaMode));
    ui.letterInput.addEventListener('input', updateCurrentLetters);
    ui.letterColorInput.addEventListener('input', updateLetterColor);
    ui.letterBgColorInput.addEventListener('input', updateLetterBgColor);

    ui.startButton.addEventListener('click', () => {
        if (state.isSequenceActive()) {
            handleRestartFn();
        } else {
            handleStartSequenceFn();
        }
    });

    ui.overallDurationInput.addEventListener('change', updateOverallDuration);
    ui.startAnimationControl.addEventListener('change', updateStartAnimationEnabled);
    ui.startDurationInput.addEventListener('change', updateStartAnimationDuration);
    ui.endAnimationControl.addEventListener('change', updateEndAnimationEnabled);
    ui.endDurationInput.addEventListener('change', updateEndAnimationDuration);
    ui.startRecordButton.addEventListener('click', () => handleStartRecordingFn(false));
    ui.stopRecordButton.addEventListener('click', () => handleStopRecordingFn(true));
}

// Apply initial UI states
export function applyInitialUIValues() {
    // Set initial normalized values directly on the component attributes
    // These were calculated from the original HTML:
    // Speed: 5 => (5-1)/(20-1) ≈ 0.2105
    // Grid: 30 => (30-10)/(200-10) ≈ 0.1053
    // Fill: 50 => (50-0)/(100-0) = 0.5
    ui.speedControl.setAttribute('value', '0.2105');
    ui.gridAmountControl.setAttribute('value', '0.1053');
    ui.fillControl.setAttribute('value', '0.5');

    // Call other update functions that don't depend on the now-removed spans
    // updateGridParamsFn needs to be called to initialize based on the new attribute
    updateGridParamsFn(); // Call it without event to read initial attribute
    updateSimplify();
    updateAnimationAreaMode();
    updateOverallDuration();
    updateStartAnimationEnabled();
    updateStartAnimationDuration();
    updateEndAnimationEnabled();
    updateEndAnimationDuration();
    updateCurrentLetters();
    updateLetterColor();
    updateLetterBgColor();

    ui.startButton.textContent = "Start Sequence & Record";
    ui.startButton.classList.remove('stop-mode');
    ui.startButton.disabled = false;
    ui.startRecordButton.disabled = false;
    ui.stopRecordButton.disabled = true;
    ui.stopRecordButton.style.display = 'none';
} 