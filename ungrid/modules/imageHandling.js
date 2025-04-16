// imageHandling.js - Handles image loading and processing

import { MAX_INTERNAL_RESOLUTION } from './constants.js';
import { state } from './state.js';
import { ui } from './ui.js';

// Function to update grid parameters
let updateGridParamsFn;

// Set the updateGridParams function from external module
export function setUpdateGridParamsFunction(fn) {
    updateGridParamsFn = fn;
}

// Load an image from a file
export function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(new Error(`Failed to load image data: ${file.name}. Error: ${err}`));
                img.src = e.target.result;
            };
            reader.onerror = (err) => reject(new Error(`Failed to read file: ${file.name}. Error: ${err}`));
            reader.readAsDataURL(file);
        } else {
            reject(new Error(`File is not an image: ${file ? file.name : 'undefined'}`));
        }
    });
}

// Handle background image upload
export function handleBgUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    ui.loadingMessage.textContent = 'Loading Background...';
    ui.loadingMessage.style.display = 'block';
    ui.startButton.disabled = true;
    ui.startRecordButton.disabled = true;

    loadImageFromFile(file)
        .then(img => {
            state.bgImage = img;
            state.bgImageForDrawing = new Image();
            state.bgImageForDrawing.src = img.src;
            
            state.bgImageForDrawing.onload = () => {
                const imgWidth = state.bgImage.naturalWidth;
                const imgHeight = state.bgImage.naturalHeight;
                const aspectRatio = imgWidth / imgHeight;
                
                let targetWidth = imgWidth;
                let targetHeight = imgHeight;
                
                if (targetWidth > MAX_INTERNAL_RESOLUTION) {
                    targetWidth = MAX_INTERNAL_RESOLUTION;
                    targetHeight = targetWidth / aspectRatio;
                }
                
                if (targetHeight > MAX_INTERNAL_RESOLUTION) {
                    targetHeight = MAX_INTERNAL_RESOLUTION;
                    targetWidth = targetHeight * aspectRatio;
                }
                
                ui.canvas.width = Math.round(targetWidth);
                ui.canvas.height = Math.round(targetHeight);
                ui.hiddenBgCanvas.width = ui.canvas.width;
                ui.hiddenBgCanvas.height = ui.canvas.height;
                
                ui.hiddenCtx.drawImage(state.bgImage, 0, 0, ui.hiddenBgCanvas.width, ui.hiddenBgCanvas.height);
                state.bgPixelData = null;
                ui.canvas.style.backgroundImage = 'none';
                
                updateGridParamsFn();
                ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
                ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height); // Draw initial background
                
                console.log("Background image loaded and set.");
            };
            
            state.bgImageForDrawing.onerror = () => {
                console.error("Failed to load background image for drawing.");
                state.bgImage = null;
                state.bgImageForDrawing = null;
                ui.canvas.style.backgroundImage = 'none';
                ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
            };
        })
        .catch(error => {
            console.error("Background image load failed:", error);
            state.bgImage = null;
            state.bgImageForDrawing = null;
            ui.canvas.style.backgroundImage = 'none';
            ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
        })
        .finally(() => {
            ui.loadingMessage.style.display = 'none';
            if (!state.isSequenceActive()) {
                ui.startButton.disabled = false;
            }
            if (!state.isRecording) {
                ui.startRecordButton.disabled = false;
            }
            event.target.value = null;
        });
}

// Handle cell image upload
export function handleCellImgUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    state.isCellImageLoading = true;
    state.cellImages = [];
    state.assignedCellData.clear();
    
    ui.loadingMessage.textContent = `Loading ${files.length} Cell Image(s)...`;
    ui.loadingMessage.style.display = 'block';
    ui.startButton.disabled = true;
    ui.startRecordButton.disabled = true;
    
    const loadPromises = Array.from(files).map(file => loadImageFromFile(file));
    
    Promise.allSettled(loadPromises)
        .then(results => {
            state.cellImages = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value);
                
            console.log(`${state.cellImages.length} cell image(s) loaded successfully.`);
            
            if (results.length > state.cellImages.length) {
                console.warn(`${results.length - state.cellImages.length} cell image(s) failed to load.`);
                results
                    .filter(r => r.status === 'rejected')
                    .forEach(r => console.error("Cell load error:", r.reason));
            }
        })
        .catch(error => {
            console.error("Unexpected error during cell image loading:", error);
            state.cellImages = [];
        })
        .finally(() => {
            state.isCellImageLoading = false;
            ui.loadingMessage.style.display = 'none';
            
            if (!state.isSequenceActive()) {
                ui.startButton.disabled = false;
            }
            
            if (!state.isRecording) {
                ui.startRecordButton.disabled = false;
            }
            
            event.target.value = null;
        });
} 