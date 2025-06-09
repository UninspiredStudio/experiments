// canvas.js - Manages canvas operations and drawing functions

import { OVERLAP_FIX, DEFAULT_LETTER_COLOR, DEFAULT_LETTER_BG_COLOR, BASE_FREQ, FREQ_AMPLITUDE, FREQ_OSC_FREQ, MIN_FREQ, SIMPLIFY_FACTOR, IMAGE_VS_LETTER_PROBABILITY } from './constants.js';
import { state, noise3D } from './state.js';
import { ui } from './ui.js';

// Initialize canvas dimensions
export function initializeCanvas() {
    ui.canvas.width = state.gridAmount;
    ui.canvas.height = state.gridAmount;
    ui.hiddenBgCanvas.width = ui.canvas.width;
    ui.hiddenBgCanvas.height = ui.canvas.height;
}

// Updates grid parameters based on control values
export function updateGridParams(event) {
    let gridValue;
    if (event && event.detail) {
        // Called from event listener, use the display value from the event detail
        gridValue = Math.round(event.detail.displayValue); // Ensure it's an integer
    } else {
        // Called initially or without event, read current display value from component
        // Ensure the component and its methods are available
        if (ui.gridAmountControl && typeof ui.gridAmountControl._getDisplayValue === 'function') {
            const normalizedValue = ui.gridAmountControl.value; // Get the normalized value (0-1)
            gridValue = Math.round(ui.gridAmountControl._getDisplayValue(normalizedValue)); // Calculate display value
        } else {
            // Fallback or initial state before component fully ready?
            console.warn('Grid amount control or its methods not yet available.');
            // Attempt to read min attribute as a default starting point?
            gridValue = parseInt(ui.gridAmountControl.getAttribute('min') || '10'); 
        }
    }

    state.gridAmount = gridValue;
    if (state.gridAmount <= 0) state.gridAmount = 1;
    state.calculatedCellSize = ui.canvas.width / state.gridAmount;
    state.numCellsX = state.gridAmount;
    state.numCellsY = Math.ceil(ui.canvas.height / state.calculatedCellSize);
    state.bgPixelData = null;
    state.assignedCellData.clear(); // Clear assigned data as grid changed
    console.log(`Grid updated: ${state.numCellsX}x${state.numCellsY}, Cell size: ${state.calculatedCellSize.toFixed(2)}`);
}

// Get pixel brightness at given coordinates
export function getBgPixelBrightness(canvasX, canvasY) {
    if (!state.bgImage || !ui.hiddenCtx) return 128;
    
    if (!state.bgPixelData || state.bgPixelDataWidth !== ui.hiddenBgCanvas.width) {
        try {
            if (ui.hiddenBgCanvas.width > 0 && ui.hiddenBgCanvas.height > 0) {
                state.bgPixelData = ui.hiddenCtx.getImageData(0, 0, ui.hiddenBgCanvas.width, ui.hiddenBgCanvas.height).data;
                state.bgPixelDataWidth = ui.hiddenBgCanvas.width;
            } else {
                state.bgPixelData = null;
                return 128;
            }
        } catch (e) {
            console.error("Error getting image data from hidden canvas:", e);
            state.bgPixelData = null;
            return 128;
        }
    }
    
    if (!state.bgPixelData) return 128;
    
    const x = Math.max(0, Math.min(Math.floor(canvasX), ui.hiddenBgCanvas.width - 1));
    const y = Math.max(0, Math.min(Math.floor(canvasY), ui.hiddenBgCanvas.height - 1));
    const index = (y * state.bgPixelDataWidth + x) * 4;
    const r = state.bgPixelData[index];
    const g = state.bgPixelData[index + 1];
    const b = state.bgPixelData[index + 2];
    
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Draws a single cell based on its assigned type (image or letter).
 * @param {number} cellX - The column index of the cell.
 * @param {number} cellY - The row index of the cell.
 * @param {object | null} data - The data object for the cell from assignedCellData.
 * Expected structure: { type: 'image' | 'letter', content: Image | string, fg?: string, bg?: string }
 */
export function drawCell(cellX, cellY, data) {
    if (!data) return; // Should not happen if called correctly, but safety first

    const drawX = cellX * state.calculatedCellSize;
    const drawY = cellY * state.calculatedCellSize;
    const size = state.calculatedCellSize;

    // --- Draw based on cell type ---
    if (data.type === 'image') {
        const img = data.content; // Content is the Image object
        if (img && img.complete && img.naturalWidth > 0) {
            try {
                // Draw image slightly larger to prevent gaps
                ui.ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                    drawX, drawY, size + OVERLAP_FIX, size + OVERLAP_FIX);
            } catch (e) {
                console.warn(`Error drawing image cell ${cellX},${cellY}:`, e);
                // Optionally draw placeholder on error
            }
        }
    } else if (data.type === 'letter') {
        const letter = data.content; // Content is the letter string
        const fg = data.fg || DEFAULT_LETTER_COLOR;
        const bg = data.bg || DEFAULT_LETTER_BG_COLOR;

        // 1. Draw Letter Background Color
        ui.ctx.fillStyle = bg;
        // Draw slightly larger to prevent gaps
        ui.ctx.fillRect(drawX, drawY, size + OVERLAP_FIX, size + OVERLAP_FIX);

        // 2. Draw Letter Text
        ui.ctx.fillStyle = fg;
        const fontSize = Math.max(8, size * 0.75);
        ui.ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ui.ctx.textAlign = 'center';
        ui.ctx.textBaseline = 'middle';
        ui.ctx.fillText(letter, drawX + size / 2, drawY + size / 2 + fontSize * 0.05);
    }
}

// Main function to draw a frame
export function drawFrame(currentNoiseThreshold) {
    state.time += state.timeStep;
    
    let currentFreq = BASE_FREQ + FREQ_AMPLITUDE * Math.sin(FREQ_OSC_FREQ * state.time * 2 * Math.PI);
    currentFreq = Math.max(MIN_FREQ, currentFreq);
    const effectiveFreq = state.isSimplified ? BASE_FREQ * SIMPLIFY_FACTOR : currentFreq;

    // Clear and Draw Main Background
    ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    if (state.bgImageForDrawing && state.bgImageForDrawing.complete && state.bgImageForDrawing.naturalWidth > 0) {
        ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height);
    }
    state.bgPixelData = null;

    // Iterate and Draw Active Cells
    for (let cellY = 0; cellY < state.numCellsY; cellY++) {
        for (let cellX = 0; cellX < state.numCellsX; cellX++) {
            const sampleX = (cellX + 0.5) * state.calculatedCellSize;
            const sampleY = (cellY + 0.5) * state.calculatedCellSize;

            let shouldAnimate = true;
            if (state.animationAreaMode !== 'everywhere' && state.bgImage) {
                const brightness = getBgPixelBrightness(sampleX, sampleY);
                if (state.animationAreaMode === 'light' && brightness <= state.brightnessThreshold) shouldAnimate = false;
                if (state.animationAreaMode === 'dark' && brightness > state.brightnessThreshold) shouldAnimate = false;
            }
            if (!shouldAnimate) continue;

            const noiseX = sampleX * effectiveFreq;
            const noiseY = sampleY * effectiveFreq;
            const noiseZ = state.time;
            const noiseVal = noise3D(noiseX, noiseY, noiseZ);
            const normalizedNoise = (noiseVal + 1) / 2;

            const isOn = normalizedNoise > currentNoiseThreshold;
            const cellKey = `${cellX},${cellY}`;
            let cellDataToDraw = null; // Store the data for the cell we decide to draw

            if (isOn) {
                if (!state.assignedCellData.has(cellKey)) {
                    // Cell just turned on, decide what type to assign
                    assignCellData(cellX, cellY, cellKey);
                    if (state.assignedCellData.has(cellKey)) {
                        cellDataToDraw = state.assignedCellData.get(cellKey);
                    }
                } else {
                    // Cell was already on, retrieve existing data
                    cellDataToDraw = state.assignedCellData.get(cellKey);
                    // Update colors if it's a letter cell
                    if (cellDataToDraw.type === 'letter') {
                        cellDataToDraw.fg = state.letterColor;
                        cellDataToDraw.bg = state.letterBgColor;
                    }
                }

                // Draw the cell using its assigned data (if any)
                if (cellDataToDraw) {
                    drawCell(cellX, cellY, cellDataToDraw);
                }
            } else {
                // Cell turned off, remove assignment
                if (state.assignedCellData.has(cellKey)) {
                    state.assignedCellData.delete(cellKey);
                }
            }
        }
    }
}

// Helper function to assign data to a new cell
function assignCellData(cellX, cellY, cellKey) {
    const imagesAvailable = state.cellImages.length > 0 && !state.isCellImageLoading;
    const lettersAvailable = state.currentLetters.length > 0;
    let assignedType = null;
    let assignedContent = null;
    let assignedFg = null;
    let assignedBg = null;

    if (imagesAvailable && lettersAvailable) {
        // Both available: Randomly choose
        if (Math.random() < IMAGE_VS_LETTER_PROBABILITY) {
            assignedType = 'image';
        } else {
            assignedType = 'letter';
        }
    } else if (imagesAvailable) {
        assignedType = 'image';
    } else if (lettersAvailable) {
        assignedType = 'letter';
    }

    // Assign content based on chosen type
    if (assignedType === 'image') {
        const imgIndex = Math.floor(Math.random() * state.cellImages.length);
        assignedContent = state.cellImages[imgIndex];
    } else if (assignedType === 'letter') {
        const letterIndex = Math.floor(Math.random() * state.currentLetters.length);
        assignedContent = state.currentLetters[letterIndex];
        assignedFg = state.letterColor; // Store colors only for letters
        assignedBg = state.letterBgColor;
    }

    // Store the assignment if a type was chosen
    if (assignedType) {
        const newCellData = {
            type: assignedType,
            content: assignedContent,
            fg: assignedFg,
            bg: assignedBg
        };
        state.assignedCellData.set(cellKey, newCellData);
    }
} 