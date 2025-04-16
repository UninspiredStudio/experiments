// animation.js - Manages animation loops and sequences

import { END_THRESHOLD_PERCENT, START_ACCELERATION_FACTOR, ACCELERATION_FACTOR, BASE_FREQ, FREQ_AMPLITUDE, FREQ_OSC_FREQ, MIN_FREQ, SIMPLIFY_FACTOR, BG_BRIGHTNESS_THRESHOLD } from './constants.js';
import { state, noise3D } from './state.js';
import { ui } from './ui.js';
import { drawFrame, drawCell, getBgPixelBrightness } from './canvas.js';

// Handle import for completeSequence to avoid circular dependency
let completeSequence;

// Function to set the completeSequence function (called from main.js)
export function setCompleteSequenceFunction(completeFn) {
    completeSequence = completeFn;
}

// Stop all animation loops
export function stopAllAnimations(keepBackgroundRunning = false) {
    if (state.startAnimationFrameId) cancelAnimationFrame(state.startAnimationFrameId);
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    if (state.fadeOutFrameId) cancelAnimationFrame(state.fadeOutFrameId);
    if (state.backgroundFrameId && !keepBackgroundRunning) cancelAnimationFrame(state.backgroundFrameId);
    
    state.startAnimationFrameId = null;
    state.animationFrameId = null;
    state.fadeOutFrameId = null;
    if (!keepBackgroundRunning) state.backgroundFrameId = null;
    
    state.isStarting = false;
    state.isMainLoopActive = false;
    state.isEnding = false;
    if (!keepBackgroundRunning) state.isBackgroundLoopActive = false;
    
    console.log(`Stopped all animations. ${keepBackgroundRunning ? 'Keeping' : 'Stopping'} background loop.`);
}

// Start background animation loop
export function startBackgroundAnimation() {
    if (state.isBackgroundLoopActive || state.isSequenceActive()) return;
    
    console.log("Starting background animation loop.");
    state.isBackgroundLoopActive = true;
    
    if (state.backgroundFrameId) cancelAnimationFrame(state.backgroundFrameId);
    state.backgroundFrameId = requestAnimationFrame(backgroundAnimate);
}

// Background animation frame handler
function backgroundAnimate() {
    if (!state.isBackgroundLoopActive) {
        if (state.backgroundFrameId) cancelAnimationFrame(state.backgroundFrameId);
        state.backgroundFrameId = null;
        return;
    }
    
    state.backgroundFrameId = requestAnimationFrame(backgroundAnimate);
    drawFrame(state.noiseThreshold); // Draw with standard threshold
}

// Start the intro animation sequence
export function startIntroAnimation(timestamp) {
    if (!state.isStarting || !state.startAnimationFrameId) {
        if (state.startAnimationFrameId) cancelAnimationFrame(state.startAnimationFrameId);
        state.startAnimationFrameId = null;
        return;
    }
    
    const elapsedTime = (timestamp - state.startAnimationStartTime) / 1000;

    if (elapsedTime >= state.startAnimationDuration) {
        cancelAnimationFrame(state.startAnimationFrameId);
        state.startAnimationFrameId = null;
        state.isStarting = false;
        state.isMainLoopActive = true;
        state.mainAnimationStartTime = performance.now();
        state.mainAnimationEndTime = state.mainAnimationStartTime + (state.overallDuration * 1000);
        
        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = requestAnimationFrame(animate);
        
        console.log("Fade-in complete, starting main animation.");
        return;
    }

    state.startAnimationFrameId = requestAnimationFrame(startIntroAnimation);
    const timerProgress = Math.min(1.0, elapsedTime / state.startAnimationDuration);
    const adjustedNoiseThreshold = 1.0 - (1.0 - state.noiseThreshold) * Math.pow(timerProgress, START_ACCELERATION_FACTOR);
    drawFrame(adjustedNoiseThreshold); // Draw with adjusted threshold
}

// Main animation frame handler
export function animate(timestamp) {
    if (!state.isMainLoopActive || state.isEnding || state.isStarting || !state.animationFrameId) {
        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
        return;
    }

    if (timestamp >= state.mainAnimationEndTime) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
        state.isMainLoopActive = false;
        console.log("Main animation duration complete.");
        
        if (state.endAnimationEnabled) {
            startFadeOut();
        } else {
            ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
            if (state.bgImageForDrawing) ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height);
            state.assignedCellData.clear();
            completeSequence();
        }
        return;
    }

    state.animationFrameId = requestAnimationFrame(animate);
    drawFrame(state.noiseThreshold); // Draw with standard threshold
}

// Start the fade-out animation
export function startFadeOut() {
    if (state.isEnding || !state.endAnimationEnabled) return;
    
    state.isEnding = true;
    state.isMainLoopActive = false;
    
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
    
    if (state.fadeOutFrameId) {
        cancelAnimationFrame(state.fadeOutFrameId);
        state.fadeOutFrameId = null;
    }
    
    console.log("Starting end fade-out animation...");
    state.initialVisibleCount = state.assignedCellData.size;
    console.log(`End fade started with ${state.initialVisibleCount} cells.`);
    
    state.fadeOutStartTime = performance.now();
    state.fadeOutFrameId = requestAnimationFrame(fadeOutAnimate);
}

// Fade-out animation frame handler
export function fadeOutAnimate(timestamp) {
    if (!state.isEnding || !state.fadeOutFrameId) {
        if (state.fadeOutFrameId) cancelAnimationFrame(state.fadeOutFrameId);
        state.fadeOutFrameId = null;
        return;
    }
    
    const elapsedTime = (timestamp - state.fadeOutStartTime) / 1000;

    if (elapsedTime >= state.endAnimationDuration) {
        cancelAnimationFrame(state.fadeOutFrameId);
        state.fadeOutFrameId = null;
        state.isEnding = false;
        
        ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
        if (state.bgImageForDrawing) ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height);
        state.assignedCellData.clear();
        
        console.log("Fade-out duration complete.");
        completeSequence();
        return;
    }

    state.fadeOutFrameId = requestAnimationFrame(fadeOutAnimate);
    const timerProgress = Math.min(1.0, elapsedTime / state.endAnimationDuration);
    const adjustedNoiseThreshold = state.noiseThreshold + (1.0 - state.noiseThreshold) * Math.pow(timerProgress, ACCELERATION_FACTOR);

    // Redraw frame with adjusted threshold (Fade-out logic)
    state.time += state.timeStep;
    let currentFreq = BASE_FREQ + FREQ_AMPLITUDE * Math.sin(FREQ_OSC_FREQ * state.time * 2 * Math.PI);
    currentFreq = Math.max(MIN_FREQ, currentFreq);
    const effectiveFreq = state.isSimplified ? BASE_FREQ * SIMPLIFY_FACTOR : currentFreq;

    ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    if (state.bgImageForDrawing) ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height);
    state.bgPixelData = null;

    let currentVisibleCount = 0;
    const cellsToRemove = [];

    state.assignedCellData.forEach((cellData, cellKey) => {
        const [cellX, cellY] = cellKey.split(',').map(Number);
        const sampleX = (cellX + 0.5) * state.calculatedCellSize;
        const sampleY = (cellY + 0.5) * state.calculatedCellSize;

        let shouldAnimate = true;
        if (state.animationAreaMode !== 'everywhere' && state.bgImage) {
            const brightness = getBgPixelBrightness(sampleX, sampleY);
            if (state.animationAreaMode === 'light' && brightness <= BG_BRIGHTNESS_THRESHOLD) shouldAnimate = false;
            if (state.animationAreaMode === 'dark' && brightness > BG_BRIGHTNESS_THRESHOLD) shouldAnimate = false;
        }
        
        if (!shouldAnimate) {
            cellsToRemove.push(cellKey);
            return;
        }

        const noiseX = sampleX * effectiveFreq;
        const noiseY = sampleY * effectiveFreq;
        const noiseZ = state.time;
        const isPotentiallyOn = ((noise3D(noiseX, noiseY, noiseZ) + 1) / 2) > adjustedNoiseThreshold;

        if (isPotentiallyOn) {
            // Cell remains on: Update colors if letter, then draw
            if (cellData.type === 'letter') {
                cellData.fg = state.letterColor;
                cellData.bg = state.letterBgColor;
            }
            drawCell(cellX, cellY, cellData); // Draw the cell based on its type
            currentVisibleCount++;
        } else {
            cellsToRemove.push(cellKey); // Mark for removal
        }
    });
    
    cellsToRemove.forEach(key => state.assignedCellData.delete(key)); // Remove

    // Optional: End fade-out early
    const thresholdCount = state.initialVisibleCount > 0 
        ? Math.floor(state.initialVisibleCount * END_THRESHOLD_PERCENT) 
        : 0;
        
    if ((currentVisibleCount > 0 && currentVisibleCount <= thresholdCount && state.initialVisibleCount > 0) 
        || currentVisibleCount === 0) {
        console.log("Fade-out ending early due to low cell count.");
        
        if (state.fadeOutFrameId) cancelAnimationFrame(state.fadeOutFrameId);
        state.fadeOutFrameId = null;
        state.isEnding = false;
        
        ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
        if (state.bgImageForDrawing) ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height);
        state.assignedCellData.clear();
        completeSequence();
    }
} 