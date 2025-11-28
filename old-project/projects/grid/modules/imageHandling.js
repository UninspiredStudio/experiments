// imageHandling.js - Handles image loading and processing

import { MAX_INTERNAL_RESOLUTION } from './constants.js';
import { state } from './state.js';
import { ui } from './ui.js';

// State for managing uploaded images and previews
let uploadedCellImages = [];
let uploadedBackgroundImage = null;

// Default placeholder images - referenced from img-placeholder directory
const DEFAULT_IMAGES = {
    background: '../../img-placeholder/1.jpeg',
    cells: [
        '../../img-placeholder/2.jpeg',
        '../../img-placeholder/3.jpeg', 
        '../../img-placeholder/4.jpeg',
        '../../img-placeholder/5.jpeg'
    ]
};

// Function to update grid parameters
let updateGridParamsFn;

// Set the updateGridParams function from external module
export function setUpdateGridParamsFunction(fn) {
    updateGridParamsFn = fn;
}

// Show background image preview
function showBackgroundPreview(imageSrc) {
    console.log('showBackgroundPreview called with:', imageSrc);
    const previewContainer = document.getElementById('bgPreviewContainer');
    const previewImage = document.getElementById('bgPreviewImage');
    
    console.log('previewContainer found:', !!previewContainer);
    console.log('previewImage found:', !!previewImage);
    
    if (previewContainer && previewImage) {
        previewImage.onload = () => {
            console.log('Preview image loaded successfully');
            previewContainer.style.display = 'block';
            console.log('Preview container is now visible');
        };
        previewImage.onerror = () => {
            console.error('Failed to load preview image');
        };
        previewImage.src = imageSrc;
    } else {
        console.error('Preview elements not found!');
    }
}

// Hide background image preview
function hideBackgroundPreview() {
    const previewContainer = document.getElementById('bgPreviewContainer');
    previewContainer.style.display = 'none';
}

// Delete background image
function deleteBackgroundImage() {
    uploadedBackgroundImage = null;
    
    // Hide preview
    hideBackgroundPreview();
    
    // Load default background
    const bgImg = new Image();
    bgImg.onload = () => {
        state.bgImage = bgImg;
        state.bgImageForDrawing = new Image();
        state.bgImageForDrawing.src = bgImg.src;
        
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
            ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height);
            
            console.log("Background image deleted, reverted to default.");
        };
    };
    
    bgImg.src = DEFAULT_IMAGES.background;
}

// Show cell images preview
function showCellImagesPreview(images) {
    console.log('showCellImagesPreview called with', images.length, 'images');
    const previewContainer = document.getElementById('cellPreviewContainer');
    console.log('cellPreviewContainer found:', !!previewContainer);
    
    if (!previewContainer) {
        console.error('Cell preview container not found!');
        return;
    }
    
    previewContainer.innerHTML = '';
    
    images.forEach((img, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const previewImage = document.createElement('img');
        previewImage.className = 'preview-image';
        previewImage.src = img.src;
        previewImage.alt = `Cell image ${index + 1}`;
        
        // Always show delete button for all preview images
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = '×';
        deleteButton.title = `Delete cell image ${index + 1}`;
        deleteButton.onclick = () => deleteCellImage(index);
        previewItem.appendChild(deleteButton);
        
        previewItem.appendChild(previewImage);
        previewContainer.appendChild(previewItem);
    });
    
    previewContainer.style.display = 'block';
}

// Hide cell images preview
function hideCellImagesPreview() {
    const previewContainer = document.getElementById('cellPreviewContainer');
    previewContainer.style.display = 'none';
}

// Delete a specific cell image
function deleteCellImage(index) {
    state.assignedCellData.clear();
    
    // Get the image to delete before removing it
    const imageToDelete = state.cellImages[index];
    
    // Remove from the currently displayed images
    state.cellImages.splice(index, 1);
    
    // If we're displaying uploaded images, also remove from uploadedCellImages
    if (uploadedCellImages.length > 0 && imageToDelete) {
        // Find the corresponding image in uploadedCellImages and remove it
        const uploadedIndex = uploadedCellImages.findIndex(img => img.src === imageToDelete.src);
        if (uploadedIndex !== -1) {
            uploadedCellImages.splice(uploadedIndex, 1);
            // Update state.cellImages to match uploadedCellImages
            state.cellImages = [...uploadedCellImages];
        }
    }
    
    // Update the preview with remaining images
    if (state.cellImages.length > 0) {
        showCellImagesPreview(state.cellImages);
    } else {
        // No images left, hide preview
        hideCellImagesPreview();
    }
    
    console.log(`Cell image ${index + 1} deleted. Remaining images: ${state.cellImages.length}, Uploaded: ${uploadedCellImages.length}`);
}

// Initialize delete button event listeners
export function initializeDeleteListeners() {
    const bgDeleteButton = document.getElementById('bgDeleteButton');
    if (bgDeleteButton) {
        bgDeleteButton.addEventListener('click', deleteBackgroundImage);
    }
    
    // Test: Show the preview containers to verify they exist and work
    console.log('Testing preview containers...');
    const bgPreviewContainer = document.getElementById('bgPreviewContainer');
    const cellPreviewContainer = document.getElementById('cellPreviewContainer');
    
    if (bgPreviewContainer) {
        console.log('Background preview container found');
    } else {
        console.error('Background preview container NOT found');
    }
    
    if (cellPreviewContainer) {
        console.log('Cell preview container found');
    } else {
        console.error('Cell preview container NOT found');
    }
}

// Export delete functions for external access
export { deleteBackgroundImage, deleteCellImage };

// Load default images on initialization
export function loadDefaultImages() {
    // Load background image
    const bgImg = new Image();
    bgImg.onload = () => {
        state.bgImage = bgImg;
        state.bgImageForDrawing = new Image();
        state.bgImageForDrawing.src = bgImg.src;
        
        // Show background preview for default image
        showBackgroundPreview(bgImg.src);
        
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
            ui.ctx.drawImage(state.bgImageForDrawing, 0, 0, ui.canvas.width, ui.canvas.height);
            
            console.log("Default background image loaded and set.");
        };
        
        bgImg.onerror = () => {
            console.error("Failed to load default background image:", DEFAULT_IMAGES.background);
        };
    };
    
    bgImg.onerror = () => {
        console.error("Failed to load default background image:", DEFAULT_IMAGES.background);
    };
    
    bgImg.src = DEFAULT_IMAGES.background;
    
    // Load cell images
    const cellLoadPromises = DEFAULT_IMAGES.cells.map(imagePath => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.error("Failed to load cell image:", imagePath);
                reject(new Error(`Failed to load ${imagePath}`));
            };
            img.src = imagePath;
        });
    });
    
    Promise.allSettled(cellLoadPromises).then(results => {
        state.cellImages = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
            
        // Show cell images preview for default images
        if (state.cellImages.length > 0) {
            showCellImagesPreview(state.cellImages);
        }
            
        console.log(`${state.cellImages.length} default cell images loaded successfully.`);
        
        if (results.length > state.cellImages.length) {
            console.warn(`${results.length - state.cellImages.length} default cell image(s) failed to load.`);
        }
    });
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
            uploadedBackgroundImage = img;
            
            // Show preview
            showBackgroundPreview(img.src);
            
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
            uploadedBackgroundImage = null;
            hideBackgroundPreview();
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
    state.assignedCellData.clear();
    
    ui.loadingMessage.textContent = `Loading ${files.length} Cell Image(s)...`;
    ui.loadingMessage.style.display = 'block';
    ui.startButton.disabled = true;
    ui.startRecordButton.disabled = true;
    
    const loadPromises = Array.from(files).map(file => loadImageFromFile(file));
    
    Promise.allSettled(loadPromises)
        .then(results => {
            const newImages = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value);
            
            // Add new images to existing uploaded images (additive)
            uploadedCellImages.push(...newImages);
            
            // Replace default images with uploaded ones, or add to existing uploaded images
            if (uploadedCellImages.length > 0) {
                state.cellImages = [...uploadedCellImages];
                showCellImagesPreview(uploadedCellImages);
            }
                
            console.log(`${newImages.length} new cell image(s) loaded successfully. Total: ${uploadedCellImages.length}`);
            
            if (results.length > newImages.length) {
                console.warn(`${results.length - newImages.length} cell image(s) failed to load.`);
                results
                    .filter(r => r.status === 'rejected')
                    .forEach(r => console.error("Cell load error:", r.reason));
            }
        })
        .catch(error => {
            console.error("Unexpected error during cell image loading:", error);
            // Don't clear existing images on error
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