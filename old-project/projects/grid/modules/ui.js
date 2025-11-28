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
    brightnessThresholdControl: document.getElementById('brightnessThresholdControl'),
    
    // Segmented controls
    simplifyPatternRadios: document.querySelectorAll('input[name="simplifyPattern"]'),
    animAreaRadios: document.querySelectorAll('input[name="animArea"]'),
    overallLengthRadios: document.querySelectorAll('input[name="overallLength"]'),
    fadeInRadios: document.querySelectorAll('input[name="fadeIn"]'),
    fadeOutRadios: document.querySelectorAll('input[name="fadeOut"]'),
    
    // Toggle switches
    startAnimationToggle: document.getElementById('startAnimationToggle'),
    endAnimationToggle: document.getElementById('endAnimationToggle'),
    
    // File uploads
    bgUploadInput: document.getElementById('bgUpload'),
    cellImgUploadInput: document.getElementById('cellImgUpload'),
    
    // Action buttons
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    startRecordButton: document.getElementById('startRecordButton'),
    stopRecordButton: document.getElementById('stopRecordButton'),
    randomizeButton: document.getElementById('randomizeButton'),
    
    // Letter controls
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
    const selectedValue = document.querySelector('input[name="simplifyPattern"]:checked').value;
    state.isSimplified = selectedValue === 'simple';
}

export function updateAnimationAreaMode() {
    state.animationAreaMode = document.querySelector('input[name="animArea"]:checked').value;
    updateBrightnessThresholdVisibility();
}

function updateBrightnessThresholdVisibility() {
    const brightnessThresholdContainer = ui.brightnessThresholdControl.closest('.control-item');
    if (state.animationAreaMode === 'everywhere') {
        brightnessThresholdContainer.style.display = 'none';
    } else {
        brightnessThresholdContainer.style.display = 'flex';
    }
}

export function updateBrightnessThreshold(event) {
    // Basic slider provides value between 0 and 1 in event.detail.value
    // Map normalized value (0-1) to the brightness threshold range (0 to 255)
    state.brightnessThreshold = Math.round(event.detail.value * 255);
    // No need to update span, basic-slider handles it internally
}

export function updateOverallLength() {
    const selectedValue = document.querySelector('input[name="overallLength"]:checked').value;
    state.overallDuration = parseFloat(selectedValue);
}

export function updateFadeIn() {
    const selectedValue = document.querySelector('input[name="fadeIn"]:checked').value;
    state.startAnimationDuration = parseFloat(selectedValue);
}

export function updateFadeOut() {
    const selectedValue = document.querySelector('input[name="fadeOut"]:checked').value;
    state.endAnimationDuration = parseFloat(selectedValue);
}

export function updateStartAnimationEnabled() {
    state.startAnimationEnabled = ui.startAnimationToggle.checked;
}

export function updateEndAnimationEnabled() {
    state.endAnimationEnabled = ui.endAnimationToggle.checked;
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

// Randomize sliders function
export function randomizeSliders() {
    // Generate random values between 0 and 1 for all sliders
    const randomSpeedValue = Math.random();
    const randomGridValue = Math.random();
    const randomFillValue = Math.random();
    const randomBrightnessValue = Math.random();
    
    // Set the random values on the sliders
    ui.speedControl.setAttribute('value', randomSpeedValue.toString());
    ui.gridAmountControl.setAttribute('value', randomGridValue.toString());
    ui.fillControl.setAttribute('value', randomFillValue.toString());
    ui.brightnessThresholdControl.setAttribute('value', randomBrightnessValue.toString());
    
    // Trigger the update functions to apply the changes
    updateSpeed({ detail: { value: randomSpeedValue } });
    updateGridParamsFn();
    updateFillPercentage({ detail: { value: randomFillValue } });
    updateBrightnessThreshold({ detail: { value: randomBrightnessValue } });
}

// Initialize UI event listeners
export function initializeUIListeners() {
    ui.speedControl.addEventListener('change', updateSpeed);
    ui.gridAmountControl.addEventListener('change', updateGridParamsFn);
    ui.fillControl.addEventListener('change', updateFillPercentage);
    ui.brightnessThresholdControl.addEventListener('change', updateBrightnessThreshold);
    
    // Segmented controls
    ui.simplifyPatternRadios.forEach(radio => radio.addEventListener('change', updateSimplify));
    ui.animAreaRadios.forEach(radio => radio.addEventListener('change', updateAnimationAreaMode));
    ui.overallLengthRadios.forEach(radio => radio.addEventListener('change', updateOverallLength));
    ui.fadeInRadios.forEach(radio => radio.addEventListener('change', updateFadeIn));
    ui.fadeOutRadios.forEach(radio => radio.addEventListener('change', updateFadeOut));
    
    // Toggle switches
    ui.startAnimationToggle.addEventListener('change', updateStartAnimationEnabled);
    ui.endAnimationToggle.addEventListener('change', updateEndAnimationEnabled);
    
    // File uploads
    ui.bgUploadInput.addEventListener('change', handleBgUploadFn);
    ui.cellImgUploadInput.addEventListener('change', handleCellImgUploadFn);
    
    // Letter controls
    ui.letterInput.addEventListener('input', updateCurrentLetters);
    ui.letterColorInput.addEventListener('input', updateLetterColor);
    ui.letterBgColorInput.addEventListener('input', updateLetterBgColor);

    // Action buttons
    ui.startButton.addEventListener('click', () => {
        if (state.isSequenceActive()) {
            handleRestartFn();
        } else {
            handleStartSequenceFn();
        }
    });

    ui.restartButton.addEventListener('click', handleRestartFn);
    ui.startRecordButton.addEventListener('click', () => handleStartRecordingFn(false));
    ui.stopRecordButton.addEventListener('click', () => handleStopRecordingFn(true));
    ui.randomizeButton.addEventListener('click', randomizeSliders);
}

// Apply initial UI states
export function applyInitialUIValues() {
    // Set initial normalized values directly on the component attributes
    // These were calculated from the desired values:
    // Speed: 8 => (8-1)/(20-1) ≈ 0.3684
    // Grid: 50 => (50-10)/(200-10) ≈ 0.2105
    // Fill: 50 => (50-0)/(100-0) = 0.5
    ui.speedControl.setAttribute('value', '0.3684');
    ui.gridAmountControl.setAttribute('value', '0.2105');
    ui.fillControl.setAttribute('value', '0.5');
    ui.brightnessThresholdControl.setAttribute('value', '0.5020'); // Default 128/255 ≈ 0.5020

    // Call other update functions that don't depend on the now-removed spans
    // updateGridParamsFn needs to be called to initialize based on the new attribute
    updateGridParamsFn(); // Call it without event to read initial attribute
    updateSimplify();
    updateAnimationAreaMode(); // This will also call updateBrightnessThresholdVisibility()
    updateBrightnessThreshold({ detail: { value: 0.5020 } }); // Initialize with default value (128/255)
    updateOverallLength();
    updateFadeIn();
    updateFadeOut();
    updateStartAnimationEnabled();
    updateEndAnimationEnabled();
    updateCurrentLetters();
    updateLetterColor();
    updateLetterBgColor();

    ui.startButton.textContent = "Record";
    ui.startButton.classList.remove('stop-mode');
    ui.startButton.disabled = false;
    ui.restartButton.disabled = false;
    ui.startRecordButton.disabled = false;
    ui.stopRecordButton.disabled = true;
    ui.stopRecordButton.style.display = 'none';
} 