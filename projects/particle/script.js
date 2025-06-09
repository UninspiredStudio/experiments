// --- Constants ---
const IMAGE_PADDING_FACTOR = 0.1;
const PARTICLE_ALPHA_THRESHOLD = 100;
const PARTICLE_COLOR_THRESHOLD = 5;
const PARTICLE_RETURN_THRESHOLD = 0.05;
const PARTICLE_DRIFT_THRESHOLD = 10;
const PARTICLE_DRIFT_SPEED = 0.4;
const RESIZE_DEBOUNCE_DELAY = 250;
const COUNTDOWN_START_VALUE = 3;
const REPLAY_PATH_COLOR = 'rgba(0, 150, 255, 0.8)';
const REPLAY_PATH_WIDTH = 2;
const REPLAY_TARGET_FPS = 60;
const FRAME_FILENAME_PADDING = 5;

// --- DOM Elements ---
const domElements = {
    canvas: document.getElementById('particleCanvas'),
    imageUpload: document.getElementById('imageUpload'),
    imageListDiv: document.getElementById('imageList'),
    densitySlider: document.getElementById('particleDensity'),
    densityValueSpan: document.getElementById('densityValue'),
    mouseRadiusSlider: document.getElementById('mouseRadius'),
    radiusValueSpan: document.getElementById('radiusValue'),
    transitionSpeedSlider: document.getElementById('transitionSpeed'),
    speedValueSpan: document.getElementById('speedValue'),
    body: document.body,
    recordPathBtn: document.getElementById('recordPathBtn'),
    replayPathBtn: document.getElementById('replayPathBtn'),
    trackingDurationInput: document.getElementById('trackingDurationInput'),
    showReplayPathCheckbox: document.getElementById('showReplayPathCheckbox'),
    countdownDisplay: document.getElementById('countdownDisplay'),
    downloadSvgBtn: document.getElementById('downloadSvgBtn'),
    recordAnimationDurationInput: document.getElementById('recordAnimationDurationInput'),
    recordAnimationBtn: document.getElementById('recordAnimationBtn'),
    recordWithReplayBtn: document.getElementById('recordWithReplayBtn'), // New button
    downloadRecordingBtn: document.getElementById('downloadRecordingBtn'),
    animationRecordingStatus: document.getElementById('animationRecordingStatus'),
    particleSizeSlider: document.getElementById('particleSizeSlider'),
    particleSizeValue: document.getElementById('particleSizeValue'),
    particleShapeRadios: document.querySelectorAll('input[name="particleShape"]'),
    interactionModeRadios: document.querySelectorAll('input[name="interactionMode"]'),
    videoRecordingDurationInput: document.getElementById('videoRecordingDurationInput'),
    recordVideoBtn: document.getElementById('recordVideoBtn'),
    downloadVideoBtn: document.getElementById('downloadVideoBtn'),
    videoRecordingStatus: document.getElementById('videoRecordingStatus'),
    optimizedRecordingCheckbox: document.getElementById('optimizedRecordingCheckbox'),
    characterSettings: document.getElementById('characterSettings'),
    particleCharacterInput: document.getElementById('particleCharacter'),
    particleFontSelect: document.getElementById('particleFont'),
    controlsToDisable: []
};

// Populate controlsToDisable after DOM elements are referenced
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
    domElements.particleFontSelect
];

// --- State Variables ---
const state = {
    particles: [],
    uploadedImages: [],
    currentImageIndex: -1,
    imageCounter: 0,
    mouse: { x: null, y: null, radius: parseInt(domElements.mouseRadiusSlider.value) },
    actualMouse: { x: null, y: null },
    particleDensity: parseInt(domElements.densitySlider.value),
    mouseEffectSpeedFactor: parseInt(domElements.transitionSpeedSlider.value),
    isResizing: false,
    resizeTimeout: null,
    ctx: null, // Initialized later
    isCountingDown: false,
    isRecording: false,
    isReplaying: false,
    hasRecordedPath: false,
    recordedPath: [],
    normalizedPath: [],
    originalRecordingDuration: 0,
    totalReplayPathLength: 0,
    calculatedReplaySpeed: 0,
    replayProgress: 0,
    showReplayPath: true,
    countdownValue: COUNTDOWN_START_VALUE,
    countdownIntervalId: null,
    countdownType: null, // 'path' or 'video' to track countdown type
    trackingTimeoutId: null,
    isRecordingAnimation: false,
    recordedFrames: [],
    animationRecordingDuration: 0,
    animationRecordingStartTime: 0,
    animationRecordingTimeoutId: null,
    hasRecordedAnimation: false,
    isProcessingRecording: false,
    particleSize: parseFloat(domElements.particleSizeSlider.value),
    particleShape: 'character',
    particleCharacter: '?',
    particleFont: 'Arial',
    interactionMode: 'repel',
    lastTimestamp: 0,
    // Video recording state
    isRecordingVideo: false,
    mediaRecorder: null,
    recordedVideoChunks: [],
    videoRecordingDuration: 0,
    videoRecordingStartTime: 0,
    videoRecordingTimeoutId: null,
    hasRecordedVideo: false,
    recordedVideoBlob: null,
    // Optimized recording state
    recordingSetup: null,
    recordingCanvas: null,
    isOptimizedRecording: false,
    // Custom background state
    exportBackgroundColor: '#00ff00', // Default green screen
    useTransparentBackground: false,
    // Configurable particle thresholds
    particleAlphaThreshold: PARTICLE_ALPHA_THRESHOLD,
    particleColorThreshold: PARTICLE_COLOR_THRESHOLD,
};

// --- Particle Class ---
class Particle {
    constructor(x, y, color, initialX, initialY) {
        this.x = x; this.y = y; this.initialX = initialX; this.initialY = initialY;
        this.color = { ...color }; this.density = (Math.random() * 20) + 5;
        this.currentAlpha = 1; this.isRepelled = false;
        // Assign a random character from the current character string
        this.assignedCharacter = this.getRandomCharacter();
    }
    
    getRandomCharacter() {
        if (state.particleCharacter && state.particleCharacter.length > 0) {
            const randomIndex = Math.floor(Math.random() * state.particleCharacter.length);
            return state.particleCharacter.charAt(randomIndex);
        }
        return '★'; // Fallback
    }
    
    draw(ctx) {
        if (this.currentAlpha <= 0) return;
        const size = state.particleSize * this.currentAlpha; if (size <= 0) return;
        ctx.fillStyle = `rgba(${Math.round(this.color.r)}, ${Math.round(this.color.g)}, ${Math.round(this.color.b)}, ${this.currentAlpha})`;
        if (state.particleShape === 'circle') {
            ctx.beginPath(); ctx.arc(this.x, this.y, size / 2, 0, Math.PI * 2); ctx.closePath(); ctx.fill();
        } else if (state.particleShape === 'square') { 
            ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size); 
        } else if (state.particleShape === 'character') {
            ctx.save();
            ctx.font = `${size * 16}px ${state.particleFont}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.assignedCharacter, this.x, this.y);
            ctx.restore();
        }
    }
    update() { this._applyMouseInteraction(); this._applyReturnForce(); this._applyDrift(); }
    _applyMouseInteraction() {
         if (state.mouse.x === null || state.mouse.y === null) { this.isRepelled = false; return; }
         const dx = state.mouse.x - this.x; const dy = state.mouse.y - this.y; const distanceSq = dx * dx + dy * dy;
         const radiusSq = state.mouse.radius * state.mouse.radius;
         if (distanceSq < radiusSq && distanceSq > 0.1) {
             const distance = Math.sqrt(distanceSq); const forceDirectionX = dx / distance; const forceDirectionY = dy / distance;
             const maxDistance = state.mouse.radius; const force = (maxDistance - distance) / maxDistance;
             const effectFactor = 1 / (state.mouseEffectSpeedFactor / 10);
             const moveX = forceDirectionX * force * this.density * effectFactor; const moveY = forceDirectionY * force * this.density * effectFactor;
             if (state.interactionMode === 'repel') { this.x -= moveX; this.y -= moveY; }
             else { this.x += moveX; this.y += moveY; }
             this.isRepelled = true;
         } else { this.isRepelled = false; }
       }
    _applyReturnForce() {
        if (this.isRepelled) return;
        const returnDx = this.initialX - this.x; const returnDy = this.initialY - this.y; const distanceSq = returnDx * returnDx + returnDy * returnDy;
        if (distanceSq > PARTICLE_RETURN_THRESHOLD * PARTICLE_RETURN_THRESHOLD) {
            const moveX = returnDx / state.mouseEffectSpeedFactor; const moveY = returnDy / state.mouseEffectSpeedFactor;
            this.x += moveX; this.y += moveY;
        } else { this.x = this.initialX; this.y = this.initialY; }
    }
    _applyDrift() {
         if (this.isRepelled) return;
         
         // Only apply drift when particles are away from their initial position
         // This prevents jittering when there's no interaction
         const driftDx = this.initialX - this.x; 
         const driftDy = this.initialY - this.y;
         const distanceFromInitial = Math.sqrt(driftDx * driftDx + driftDy * driftDy);
         
         // Only add drift if particle is significantly away from initial position
         if (distanceFromInitial > PARTICLE_DRIFT_THRESHOLD) {
             this.x += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED; 
             this.y += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED;
         }
       }
}

// --- Core Functions ---
function createImageParticleDefinitions(img) {
    const { canvas } = domElements;
    
    // Enhanced error checking with detailed logging
    if (!canvas) {
        console.error("Canvas element not found. Cannot create particle definitions.");
        return [];
    }
    
    if (canvas.width === 0 || canvas.height === 0) {
        console.error(`Canvas has zero dimensions (${canvas.width}x${canvas.height}). Cannot create particle definitions.`);
        return [];
    }
    
    if (!img) {
        console.error("Image is null or undefined. Cannot create particle definitions.");
        return [];
    }
    
    if (img.width === 0 || img.height === 0) {
        console.error(`Image has zero dimensions (${img.width}x${img.height}). Cannot create particle definitions.`);
        return [];
    }
    
    console.log(`Creating particle definitions for image: ${img.width}x${img.height}, Canvas: ${canvas.width}x${canvas.height}`);
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!tempCtx) {
        console.error("Failed to get 2D context from temporary canvas. Cannot create particle definitions.");
        return [];
    }
    
    const canvasAspect = canvas.width / canvas.height;
    const imgAspect = img.width / img.height;
    const padding = IMAGE_PADDING_FACTOR;
    const targetCanvasWidth = canvas.width * (1 - padding * 2);
    const targetCanvasHeight = canvas.height * (1 - padding * 2);
    
    let drawWidth, drawHeight;
    if (imgAspect > (targetCanvasWidth / targetCanvasHeight)) {
        drawWidth = targetCanvasWidth;
        drawHeight = drawWidth / imgAspect;
    } else {
        drawHeight = targetCanvasHeight;
        drawWidth = drawHeight * imgAspect;
    }
    
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    console.log(`Drawing image at: offset(${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}), size(${drawWidth.toFixed(2)}x${drawHeight.toFixed(2)})`);
    
    try {
        tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        console.log("Image drawn successfully to temporary canvas");
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        const particleDefinitions = [];
        
        console.log(`Analyzing ${tempCanvas.width}x${tempCanvas.height} pixels with density ${state.particleDensity}`);
        console.log(`Thresholds - Alpha: ${state.particleAlphaThreshold}, Color: ${state.particleColorThreshold}`);
        
        let totalPixelsChecked = 0;
        let pixelsWithAlpha = 0;
        let pixelsWithColor = 0;
        let pixelsPassingBoth = 0;
        
        for (let y = 0; y < tempCanvas.height; y += state.particleDensity) {
            for (let x = 0; x < tempCanvas.width; x += state.particleDensity) {
                totalPixelsChecked++;
                const index = (y * tempCanvas.width + x) * 4;
                const alpha = data[index + 3];
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                if (alpha > state.particleAlphaThreshold) {
                    pixelsWithAlpha++;
                    
                    // Updated logic to handle black and white images properly
                    // For black and white images, black pixels (0,0,0) are valid content
                    const isBlackPixel = (r <= 10 && g <= 10 && b <= 10); // Very dark pixels
                    const isColorPixel = (r > state.particleColorThreshold || g > state.particleColorThreshold || b > state.particleColorThreshold);
                    
                    if (isColorPixel || isBlackPixel) {
                        pixelsWithColor++;
                        pixelsPassingBoth++;
                        
                        const color = { r, g, b };
                        particleDefinitions.push({ x, y, color, initialX: x, initialY: y });
                    }
                }
            }
        }
        
        console.log(`Pixel analysis results:`);
        console.log(`- Total pixels checked: ${totalPixelsChecked}`);
        console.log(`- Pixels with alpha > ${state.particleAlphaThreshold}: ${pixelsWithAlpha}`);
        console.log(`- Pixels with color > ${state.particleColorThreshold}: ${pixelsWithColor}`);
        console.log(`- Pixels passing both tests: ${pixelsPassingBoth}`);
        console.log(`- Created ${particleDefinitions.length} particle definitions`);
        
        if (particleDefinitions.length === 0) {
            console.warn("No particles created. Image might be too transparent or have low contrast.");
            console.warn("Consider adjusting particle density, alpha threshold, or color threshold.");
            
            // Sample a few pixels to show their values
            console.log("Sample pixel analysis (first 10 pixels):");
            for (let i = 0; i < Math.min(10, totalPixelsChecked); i++) {
                const x = (i % Math.ceil(tempCanvas.width / state.particleDensity)) * state.particleDensity;
                const y = Math.floor(i / Math.ceil(tempCanvas.width / state.particleDensity)) * state.particleDensity;
                const index = (y * tempCanvas.width + x) * 4;
                const alpha = data[index + 3];
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                console.log(`  Pixel (${x},${y}): rgba(${r}, ${g}, ${b}, ${alpha})`);
            }
            
            // Try with relaxed thresholds as fallback
            console.log("Attempting fallback with relaxed thresholds...");
            const relaxedAlphaThreshold = 25; // Much lower alpha threshold
            const relaxedColorThreshold = 1; // Much lower color threshold
            
            console.log(`Fallback thresholds - Alpha: ${relaxedAlphaThreshold}, Color: ${relaxedColorThreshold}`);
            
            let fallbackCount = 0;
            for (let y = 0; y < tempCanvas.height; y += state.particleDensity) {
                for (let x = 0; x < tempCanvas.width; x += state.particleDensity) {
                    const index = (y * tempCanvas.width + x) * 4;
                    const alpha = data[index + 3];
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    
                    if (alpha > relaxedAlphaThreshold) {
                        // Apply same black and white logic in fallback
                        const isBlackPixel = (r <= 10 && g <= 10 && b <= 10); // Very dark pixels
                        const isColorPixel = (r > relaxedColorThreshold || g > relaxedColorThreshold || b > relaxedColorThreshold);
                        
                        if (isColorPixel || isBlackPixel) {
                            const color = { r, g, b };
                            particleDefinitions.push({ x, y, color, initialX: x, initialY: y });
                            fallbackCount++;
                        }
                    }
                }
            }
            
            if (fallbackCount > 0) {
                console.log(`Fallback successful: Created ${fallbackCount} particles with relaxed thresholds`);
            } else {
                console.warn("Even fallback thresholds failed to generate particles. Image may be completely transparent or corrupted.");
            }
        }
        
        return particleDefinitions;
    } catch (error) {
        console.error("Error processing image data:", error);
        console.error("Error stack:", error.stack);
        return [];
    }
}

// Debug function for testing particle generation
function testParticleGeneration(imageIndex = null) {
    const targetIndex = imageIndex !== null ? imageIndex : state.currentImageIndex;
    
    if (targetIndex === -1 || targetIndex >= state.uploadedImages.length) {
        console.error("No valid image selected or invalid index provided.");
        console.log(`Current image index: ${state.currentImageIndex}, Total images: ${state.uploadedImages.length}`);
        return;
    }
    
    const imageData = state.uploadedImages[targetIndex];
    console.log(`Testing particle generation for: ${imageData.name}`);
    console.log(`Image dimensions: ${imageData.img.width}x${imageData.img.height}`);
    console.log(`Canvas dimensions: ${domElements.canvas.width}x${domElements.canvas.height}`);
    console.log(`Current particle density: ${state.particleDensity}`);
    
    const testDefinitions = createImageParticleDefinitions(imageData.img);
    console.log(`Test result: ${testDefinitions.length} particles would be created`);
    
    return testDefinitions;
}

// Function to adjust thresholds for difficult images
function adjustThresholds(alphaThreshold = null, colorThreshold = null) {
    let thresholdsChanged = false;
    
    if (alphaThreshold !== null) {
        console.log(`Changing alpha threshold from ${state.particleAlphaThreshold} to ${alphaThreshold}`);
        state.particleAlphaThreshold = alphaThreshold;
        thresholdsChanged = true;
    }
    
    if (colorThreshold !== null) {
        console.log(`Changing color threshold from ${state.particleColorThreshold} to ${colorThreshold}`);
        state.particleColorThreshold = colorThreshold;
        thresholdsChanged = true;
    }
    
    console.log("Current thresholds:");
    console.log(`- Alpha threshold: ${state.particleAlphaThreshold}`);
    console.log(`- Color threshold: ${state.particleColorThreshold}`);
    
    if (thresholdsChanged) {
        console.log("Thresholds changed. Clearing particle definitions for all images...");
        // Clear all cached particle definitions so they get regenerated with new thresholds
        state.uploadedImages.forEach(imgData => {
            imgData.particleDefinitions = null;
        });
        
        // If there's a current image, regenerate its particles
        if (state.currentImageIndex !== -1) {
            console.log("Regenerating particles for current image...");
            const currentIndex = state.currentImageIndex;
            state.currentImageIndex = -1; // Force regeneration
            handleSwitchImage(currentIndex);
        }
    }
}

// Specific function for black and white images
function testBlackAndWhite(imageIndex = null) {
    const targetIndex = imageIndex !== null ? imageIndex : state.currentImageIndex;
    
    if (targetIndex === -1 || targetIndex >= state.uploadedImages.length) {
        console.error("No valid image selected or invalid index provided.");
        return;
    }
    
    const imageData = state.uploadedImages[targetIndex];
    console.log(`Testing black and white analysis for: ${imageData.name}`);
    
    // Quick analysis of the image to see pixel distribution
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    const { canvas } = domElements;
    
    tempCanvas.width = Math.min(canvas.width, 200); // Sample size for quick analysis
    tempCanvas.height = Math.min(canvas.height, 200);
    
    tempCtx.drawImage(imageData.img, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageDataSample = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageDataSample.data;
    
    let blackPixels = 0;
    let whitePixels = 0;
    let grayPixels = 0;
    let transparentPixels = 0;
    let totalPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        totalPixels++;
        
        if (a < 100) {
            transparentPixels++;
        } else if (r <= 10 && g <= 10 && b <= 10) {
            blackPixels++;
        } else if (r >= 240 && g >= 240 && b >= 240) {
            whitePixels++;
        } else {
            grayPixels++;
        }
    }
    
    console.log("=== Black & White Image Analysis ===");
    console.log(`Total pixels sampled: ${totalPixels}`);
    console.log(`Black pixels (≤ 10,10,10): ${blackPixels} (${(blackPixels/totalPixels*100).toFixed(1)}%)`);
    console.log(`White pixels (≥ 240,240,240): ${whitePixels} (${(whitePixels/totalPixels*100).toFixed(1)}%)`);
    console.log(`Gray pixels: ${grayPixels} (${(grayPixels/totalPixels*100).toFixed(1)}%)`);
    console.log(`Transparent pixels (alpha < 100): ${transparentPixels} (${(transparentPixels/totalPixels*100).toFixed(1)}%)`);
    
    if (transparentPixels > totalPixels * 0.8) {
        console.warn("⚠️  Image appears to be mostly transparent. Try adjustThresholds(25, 1)");
    } else if (blackPixels + whitePixels > totalPixels * 0.8) {
        console.log("✅ This appears to be a black and white image. The updated logic should handle it correctly now.");
    } else {
        console.log("ℹ️  This appears to be a grayscale or color image.");
    }
    
    return { blackPixels, whitePixels, grayPixels, transparentPixels, totalPixels };
}

function updateImageListUI() {
    const { imageListDiv } = domElements;
    
    // Check if the imageList element exists (it may have been removed from the UI)
    if (!imageListDiv) {
        console.log('Image list UI element not found - skipping UI update');
        return;
    }
    
    imageListDiv.innerHTML = '';
    
    if (state.uploadedImages.length === 0) {
        imageListDiv.innerHTML = '<p class="text-gray-500 text-sm">No image loaded yet.</p>';
        return;
    }
    
    // Display the single image
    const imgData = state.uploadedImages[0];
    const item = document.createElement('div');
    item.classList.add('image-item', 'p-2', 'rounded-md', 'flex', 'items-center', 'mb-1');
    if (state.currentImageIndex === 0) {
        item.classList.add('active');
    }
    
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('flex', 'items-center', 'overflow-hidden', 'flex-grow');
    
    const thumb = document.createElement('img');
    thumb.src = imgData.img.src;
    thumb.alt = imgData.name;
    thumb.classList.add('mr-4', 'flex-shrink-0');
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = imgData.name.length > 20 ? imgData.name.substring(0, 17) + '...' : imgData.name;
    nameSpan.classList.add('text-sm', 'text-gray-200', 'truncate');
    nameSpan.title = imgData.name;
    
    infoDiv.appendChild(thumb);
    infoDiv.appendChild(nameSpan);
    item.appendChild(infoDiv);
    
    // Add replace button instead of remove button
    const replaceBtn = document.createElement('button');
    replaceBtn.textContent = 'Replace';
    replaceBtn.classList.add('replace-btn', 'flex-shrink-0', 'ml-4', 'text-xs', 'px-2', 'py-1', 'rounded');
    replaceBtn.title = 'Replace current image';
    replaceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        domElements.imageUpload.click(); // Trigger file picker
    });
    
    item.appendChild(replaceBtn);
    imageListDiv.appendChild(item);
}
function processFiles(files) {
    if (!files || files.length === 0) return;
    
    // Clear existing image if any
    if (state.uploadedImages.length > 0) {
        console.log(`Replacing existing image: ${state.uploadedImages[0].name}`);
        state.uploadedImages = [];
        state.currentImageIndex = -1;
        state.particles = [];
        // Reset recording states since image is being replaced
        state.hasRecordedPath = false;
        state.hasRecordedAnimation = false;
        state.recordedFrames = [];
        updateControlStates();
    }
    
    // Only process the first file since we only allow one image
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const newImageId = state.imageCounter++;
                const newImageData = {
                    id: newImageId,
                    name: file.name,
                    img: img,
                    particleDefinitions: null
                };
                
                // Replace the entire array with just this one image
                state.uploadedImages = [newImageData];
                updateImageListUI();
                handleSwitchImage(0);
                console.log(`Loaded new image: ${file.name}`);
            };
            img.onerror = () => console.error(`Error loading image: ${file.name}`);
            img.src = e.target.result;
        };
        reader.onerror = () => console.error(`Error reading file: ${file.name}`);
        reader.readAsDataURL(file);
    } else {
        console.warn(`Invalid file type. Please select an image file.`);
    }
}
// handleRemoveImage function removed - not needed in single image mode
function handleSwitchImage(newIndex) {
    console.log(`Attempting switch to index: ${newIndex}`);
    
    // In single image mode, we only have index 0 or -1 (no image)
    if (newIndex !== 0 && newIndex !== -1) {
        console.log(`Switch aborted: Invalid index ${newIndex} for single image mode.`);
        return;
    }
    
    if (newIndex === state.currentImageIndex) {
        console.log(`Switch aborted: Already at index ${newIndex}.`);
        return;
    }
    
    const oldIndex = state.currentImageIndex;
    state.currentImageIndex = newIndex;
    console.log(`Switching from ${oldIndex} to ${newIndex}`);
    
    // Reset animation states when switching images
    state.hasRecordedAnimation = false;
    state.recordedFrames = [];
    setAnimationRecordingStatus('');
    
    if (state.currentImageIndex === -1) {
        console.log("Clearing particles.");
        state.particles = [];
        updateImageListUI();
        updateControlStates();
        return;
    }
    
    const imageData = state.uploadedImages[0]; // Only one image in single mode
    if (!imageData || !imageData.img) {
        console.error(`Image data not found. Reverting.`);
        state.currentImageIndex = oldIndex;
        updateImageListUI();
        updateControlStates();
        return;
    }
    
    console.log(`Loading image: ${imageData.name}`);
    if (!imageData.particleDefinitions) {
        console.log(`Generating definitions for ${imageData.name}...`);
        imageData.particleDefinitions = createImageParticleDefinitions(imageData.img);
        
        if (!imageData.particleDefinitions || imageData.particleDefinitions.length === 0) {
            console.error(`Failed to generate definitions for ${imageData.name}. Clearing particles.`);
            state.currentImageIndex = -1;
            state.particles = [];
            updateImageListUI();
            updateControlStates();
            return;
        }
    }
    
    const newParticleDefs = imageData.particleDefinitions;
    const nextParticlesArray = [];
    console.log(`Creating ${newParticleDefs.length} new particles from definitions...`);
    
    for (const def of newParticleDefs) {
        const newP = new Particle(def.initialX, def.initialY, def.color, def.initialX, def.initialY);
        nextParticlesArray.push(newP);
    }
    
    state.particles = nextParticlesArray;
    console.log(`Particle array updated with ${state.particles.length} particles.`);
    updateImageListUI();
    updateControlStates();
}

// --- Path Recording and Replay Functions ---
function updateControlStates() {
    const disableAll = state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || state.isRecordingVideo;
    const noImageLoaded = state.currentImageIndex === -1;
    domElements.controlsToDisable.forEach(control => {
        if (!control) return; // Skip null/undefined controls
        
        if (control instanceof NodeList) {
            control.forEach(radio => {
                if (radio) radio.disabled = disableAll;
            });
        }
        else if (control === domElements.replayPathBtn) {
            control.disabled = disableAll || noImageLoaded || !state.hasRecordedPath;
        } else if (control === domElements.downloadSvgBtn) {
            control.disabled = disableAll || noImageLoaded;
        } else if (control === domElements.recordAnimationBtn) {
            control.disabled = disableAll || noImageLoaded;
        } else if (control === domElements.recordWithReplayBtn) { // Disable new button
            control.disabled = disableAll || noImageLoaded || !state.hasRecordedPath;
        } else if (control === domElements.downloadRecordingBtn) {
            control.disabled = disableAll || noImageLoaded || !state.hasRecordedAnimation;
        } else if (control === domElements.recordPathBtn) {
            control.disabled = disableAll || noImageLoaded;
        } else if (control === domElements.recordVideoBtn) {
            control.disabled = disableAll || noImageLoaded;
        } else if (control === domElements.downloadVideoBtn) {
            control.disabled = disableAll || noImageLoaded || !state.hasRecordedVideo;
        }
         else {
            control.disabled = disableAll;
        }
    });
     // Path Button Text
     if (state.isCountingDown && state.countdownType === 'path') { 
         if (domElements.recordPathBtn) domElements.recordPathBtn.textContent = 'Starting...'; 
     } // Path countdown
     else if (state.isRecording) { 
         if (domElements.recordPathBtn) domElements.recordPathBtn.textContent = `Recording Path...`; 
     }
     else if (state.isReplaying && !state.isRecordingAnimation) { 
         if (domElements.replayPathBtn) domElements.replayPathBtn.textContent = 'Replaying...'; 
     } // Only show Replaying if NOT also recording animation
     else { 
         if (domElements.recordPathBtn) domElements.recordPathBtn.textContent = 'Record Path'; 
         if (domElements.replayPathBtn) domElements.replayPathBtn.textContent = 'Replay Path'; 
     }
    // Animation Button Text
    if (state.isRecordingAnimation && state.isReplaying) { 
        if (domElements.recordWithReplayBtn) domElements.recordWithReplayBtn.textContent = 'Rec & Replay...'; 
        if (domElements.recordAnimationBtn) domElements.recordAnimationBtn.textContent = 'Record Animation'; 
    } // Specific state
    else if (state.isRecordingAnimation) { 
        if (domElements.recordAnimationBtn) domElements.recordAnimationBtn.textContent = 'Recording...'; 
        if (domElements.recordWithReplayBtn) domElements.recordWithReplayBtn.textContent = 'Record with Path Replay'; 
    }
    else { 
        if (domElements.recordAnimationBtn) domElements.recordAnimationBtn.textContent = 'Record Animation'; 
        if (domElements.recordWithReplayBtn) domElements.recordWithReplayBtn.textContent = 'Record with Path Replay'; 
    }
    // Download Button Text
    if (state.isProcessingRecording) { 
        if (domElements.downloadRecordingBtn) domElements.downloadRecordingBtn.textContent = 'Zipping...'; 
    }
    else { 
        if (domElements.downloadRecordingBtn) domElements.downloadRecordingBtn.textContent = 'Download ZIP'; 
    }
    // Video Recording Button Text
    if (state.isRecordingVideo) { 
        if (domElements.recordVideoBtn) domElements.recordVideoBtn.textContent = 'Recording Video...'; 
    }
    else if (state.isCountingDown && state.countdownType === 'video') { 
        if (domElements.recordVideoBtn) domElements.recordVideoBtn.textContent = 'Starting Video...'; 
    } // Video countdown state
    else { 
        if (domElements.recordVideoBtn) domElements.recordVideoBtn.textContent = 'Record Canvas Video'; 
    }
    // Video Download Button Text
    if (state.hasRecordedVideo) { 
        if (domElements.downloadVideoBtn) domElements.downloadVideoBtn.textContent = 'Download Video'; 
    }
    else { 
        if (domElements.downloadVideoBtn) domElements.downloadVideoBtn.textContent = 'Download Video'; 
    }
}
function setAnimationRecordingStatus(message, type = '') {
    const statusEl = domElements.animationRecordingStatus; statusEl.textContent = message; statusEl.className = ''; if (type) { statusEl.classList.add(type); }
}
function startCountdown() {
    if (state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || state.currentImageIndex === -1) return;
    state.isCountingDown = true; state.hasRecordedPath = false; state.originalRecordingDuration = 0; state.countdownValue = COUNTDOWN_START_VALUE;
    state.countdownType = 'path'; // Set countdown type for path recording
    domElements.countdownDisplay.textContent = state.countdownValue; domElements.countdownDisplay.style.display = 'block'; updateControlStates();
    state.countdownIntervalId = setInterval(() => { state.countdownValue--; domElements.countdownDisplay.textContent = state.countdownValue;
        if (state.countdownValue <= 0) { clearInterval(state.countdownIntervalId); state.countdownIntervalId = null; domElements.countdownDisplay.style.display = 'none'; state.isCountingDown = false; state.countdownType = null; startTracking(); } }, 1000);
}
function startTracking() {
    state.isRecording = true; state.recordedPath = []; const trackingDurationMs = parseInt(domElements.trackingDurationInput.value) * 1000; updateControlStates(); console.log(`Starting mouse tracking for ${trackingDurationMs}ms...`);
    if (state.actualMouse.x !== null && state.actualMouse.y !== null) { state.recordedPath.push({ x: state.actualMouse.x, y: state.actualMouse.y, timestamp: performance.now() }); }
    else { state.recordedPath.push({ x: -1, y: -1, timestamp: performance.now() }); }
    state.trackingTimeoutId = setTimeout(() => { stopTracking(); }, trackingDurationMs);
}
function stopTracking() {
    if (!state.isRecording) return; clearTimeout(state.trackingTimeoutId); state.trackingTimeoutId = null; state.isRecording = false;
     if (state.actualMouse.x !== null && state.actualMouse.y !== null) { let lastTimestamp = state.recordedPath.length > 0 ? state.recordedPath[state.recordedPath.length - 1].timestamp : performance.now() - 1; let finalTimestamp = performance.now();
         if (finalTimestamp <= lastTimestamp) finalTimestamp = lastTimestamp + 0.1; state.recordedPath.push({ x: state.actualMouse.x, y: state.actualMouse.y, timestamp: finalTimestamp }); }
     if (state.recordedPath.length > 1 && state.recordedPath[0].x === -1) { state.recordedPath.shift(); }
    console.log(`Stopped path tracking. Recorded ${state.recordedPath.length} points.`); if (state.recordedPath.length > 1) { state.hasRecordedPath = true; state.originalRecordingDuration = state.recordedPath[state.recordedPath.length - 1].timestamp - state.recordedPath[0].timestamp; console.log(`Path recorded successfully (${(state.originalRecordingDuration / 1000).toFixed(2)}s).`); }
    else { state.hasRecordedPath = false; state.originalRecordingDuration = 0; console.log("Not enough points recorded for a valid path."); } updateControlStates();
}
function normalizePathForDuration() {
    console.log("Normalizing path..."); state.normalizedPath = []; state.totalReplayPathLength = 0; let originalPathLength = 0;
    if (!state.hasRecordedPath || state.recordedPath.length < 2) { console.warn("No valid path to normalize."); return false; }
    for (let i = 1; i < state.recordedPath.length; i++) { const p1 = state.recordedPath[i - 1]; const p2 = state.recordedPath[i]; const dx = p2.x - p1.x; const dy = p2.y - p1.y; originalPathLength += Math.sqrt(dx * dx + dy * dy); }
    state.totalReplayPathLength = originalPathLength; if (state.totalReplayPathLength <= 0) { console.warn("Total path length is zero or negative. Cannot normalize."); return false; }
    if (state.originalRecordingDuration <= 0) { console.warn("Original recording duration is zero or negative. Cannot normalize."); return false; }
    state.calculatedReplaySpeed = state.totalReplayPathLength / (state.originalRecordingDuration / 1000.0); console.log(`Calculated path replay speed: ${state.calculatedReplaySpeed.toFixed(2)} px/sec`);
    const numSteps = Math.max(Math.ceil((state.originalRecordingDuration / 1000.0) * REPLAY_TARGET_FPS), 2); const stepLength = state.totalReplayPathLength / (numSteps - 1);
    state.normalizedPath.push({ ...state.recordedPath[0] }); let currentLength = 0; let currentPathIndex = 0;
    for (let step = 1; step < numSteps; step++) { const targetDistance = step * stepLength;
        while (currentPathIndex < state.recordedPath.length - 1) { const p1 = state.recordedPath[currentPathIndex]; const p2 = state.recordedPath[currentPathIndex + 1]; const dx = p2.x - p1.x; const dy = p2.y - p1.y; const segmentLength = Math.sqrt(dx * dx + dy * dy);
            if (segmentLength > 0 && currentLength + segmentLength >= targetDistance - 0.001) { const remainingDistance = targetDistance - currentLength; const fraction = remainingDistance / segmentLength; const interpX = p1.x + dx * fraction; const interpY = p1.y + dy * fraction; state.normalizedPath.push({ x: interpX, y: interpY }); break; }
            else { currentLength += segmentLength; currentPathIndex++; if (currentPathIndex >= state.recordedPath.length - 1) { break; } } }
         if (currentPathIndex >= state.recordedPath.length - 1 && state.normalizedPath.length <= step) { console.warn(`Ran out of path segments during normalization at step ${step}.`); break; } }
     const lastOriginalPoint = state.recordedPath[state.recordedPath.length - 1]; const lastNormalizedPoint = state.normalizedPath[state.normalizedPath.length - 1];
     if (lastNormalizedPoint.x !== lastOriginalPoint.x || lastNormalizedPoint.y !== lastOriginalPoint.y) { state.normalizedPath.push({...lastOriginalPoint}); }
    console.log(`Normalized path created with ${state.normalizedPath.length} points.`); return true;
}
function triggerReplay() {
    if (state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || !state.hasRecordedPath || state.currentImageIndex === -1) return;
    if (normalizePathForDuration()) { startReplay(); } else { console.error("Failed to normalize path, cannot start replay."); updateControlStates(); }
}
function startReplay() {
    if (state.normalizedPath.length < 2) { console.error("Cannot start path replay: normalized path is too short."); return; }
    state.isReplaying = true; state.replayProgress = 0; domElements.canvas.classList.add('replaying');
    state.mouse.x = state.normalizedPath[0].x; state.mouse.y = state.normalizedPath[0].y;
    updateControlStates(); console.log(`Starting path replay...`);
}
function stopReplay() {
    if (!state.isReplaying) return; // Check if actually replaying before stopping
    state.isReplaying = false; state.replayProgress = 0; domElements.canvas.classList.remove('replaying');
    state.mouse.x = state.actualMouse.x; state.mouse.y = state.actualMouse.y;
    updateControlStates(); console.log("Path replay finished.");
}
function drawReplayPath(ctx, deltaTime) {
    if (!state.isReplaying || state.normalizedPath.length < 2 || state.calculatedReplaySpeed <= 0) return;
    state.replayProgress += state.calculatedReplaySpeed * deltaTime; let virtualX = state.normalizedPath[0].x; let virtualY = state.normalizedPath[0].y;
    let targetIndex = 0; let currentLength = 0;
    for (let i = 1; i < state.normalizedPath.length; i++) { const p1 = state.normalizedPath[i - 1]; const p2 = state.normalizedPath[i]; const dx = p2.x - p1.x; const dy = p2.y - p1.y; const segmentLength = Math.sqrt(dx * dx + dy * dy);
        if (currentLength + segmentLength >= state.replayProgress) { targetIndex = i; break; } currentLength += segmentLength; if (i === state.normalizedPath.length - 1) { targetIndex = i; } }
     if (targetIndex > 0) { const p1 = state.normalizedPath[targetIndex - 1]; const p2 = state.normalizedPath[targetIndex]; const dx = p2.x - p1.x; const dy = p2.y - p1.y; const segmentLength = Math.sqrt(dx * dx + dy * dy); const lengthIntoSegment = state.replayProgress - currentLength; let fraction = 0;
         if (segmentLength > 0) { fraction = Math.max(0, Math.min(1, lengthIntoSegment / segmentLength)); } else if (state.replayProgress >= currentLength) { fraction = 1; } virtualX = p1.x + dx * fraction; virtualY = p1.y + dy * fraction; }
     else { virtualX = state.normalizedPath[0].x; virtualY = state.normalizedPath[0].y; }
    if (state.showReplayPath) { ctx.strokeStyle = REPLAY_PATH_COLOR; ctx.lineWidth = REPLAY_PATH_WIDTH; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(state.normalizedPath[0].x, state.normalizedPath[0].y);
        for (let i = 1; i < targetIndex; i++) { ctx.lineTo(state.normalizedPath[i].x, state.normalizedPath[i].y); } ctx.lineTo(virtualX, virtualY); ctx.stroke(); }
    state.mouse.x = virtualX; state.mouse.y = virtualY;
    if (state.replayProgress >= state.totalReplayPathLength) { const lastPoint = state.normalizedPath[state.normalizedPath.length - 1]; state.mouse.x = lastPoint.x; state.mouse.y = lastPoint.y; stopReplay(); } // Stop replay when path ends
}

// --- Animation Recording Functions ---
function startAnimationRecording() {
    if (state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || state.currentImageIndex === -1) return;
    if (typeof JSZip === 'undefined') { console.error("JSZip library is not loaded. Cannot record animation."); setAnimationRecordingStatus("Error: JSZip not loaded"); return; }
    state.isRecordingAnimation = true; state.hasRecordedAnimation = false; state.recordedFrames = [];
    state.animationRecordingDuration = parseInt(domElements.recordAnimationDurationInput.value) * 1000; state.animationRecordingStartTime = performance.now();
    updateControlStates(); setAnimationRecordingStatus(`Recording... (0/${domElements.recordAnimationDurationInput.value}s)`, 'recording'); console.log(`Starting animation recording for ${state.animationRecordingDuration}ms...`);
    state.animationRecordingTimeoutId = setTimeout(() => { stopAnimationRecording(); }, state.animationRecordingDuration);
}
function stopAnimationRecording() {
    if (!state.isRecordingAnimation) return; clearTimeout(state.animationRecordingTimeoutId); state.animationRecordingTimeoutId = null; state.isRecordingAnimation = false;
    if (state.recordedFrames.length > 0) { state.hasRecordedAnimation = true; setAnimationRecordingStatus(`Recorded ${state.recordedFrames.length} frames. Ready to download.`, 'ready'); console.log(`Stopped animation recording. Recorded ${state.recordedFrames.length} frames.`); }
    else { state.hasRecordedAnimation = false; setAnimationRecordingStatus('Recording finished. No frames captured.'); console.log("Stopped animation recording. No frames captured."); }
    updateControlStates();
}
async function downloadRecordedAnimation() {
    if (state.isProcessingRecording || !state.hasRecordedAnimation || state.recordedFrames.length === 0 || state.isRecordingAnimation) return;
    if (typeof JSZip === 'undefined') { console.error("JSZip library is not loaded. Cannot download recording."); setAnimationRecordingStatus("Error: JSZip not loaded"); return; }
    state.isProcessingRecording = true; updateControlStates(); setAnimationRecordingStatus(`Processing ${state.recordedFrames.length} frames...`, 'processing'); console.log("Starting to zip recorded frames...");
    try { const zip = new JSZip(); state.recordedFrames.forEach((svgString, index) => { const frameNumber = String(index + 1).padStart(FRAME_FILENAME_PADDING, '0'); zip.file(`frame_${frameNumber}.svg`, svgString); });
        setAnimationRecordingStatus(`Zipping ${state.recordedFrames.length} frames...`, 'processing'); const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; const currentImageName = state.currentImageIndex !== -1 ? state.uploadedImages[state.currentImageIndex].name.split('.').slice(0, -1).join('.') : 'animation';
        a.download = `${currentImageName}_recording_${Date.now()}.zip`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        console.log("ZIP file download triggered."); setAnimationRecordingStatus(`Downloaded ${state.recordedFrames.length} frames.`, 'ready');
    } catch (error) { console.error("Error creating ZIP file:", error); setAnimationRecordingStatus("Error creating ZIP file."); }
    finally { state.isProcessingRecording = false; updateControlStates(); }
}

// --- Video Recording Functions ---
function setVideoRecordingStatus(message, type = '') {
    const statusEl = domElements.videoRecordingStatus;
    statusEl.textContent = message;
    statusEl.className = '';
    if (type) {
        statusEl.classList.add(type);
    }
}

// New function to calculate the bounds of the current image content
function calculateImageContentBounds() {
    const { canvas } = domElements;
    
    if (state.currentImageIndex === -1 || state.currentImageIndex >= state.uploadedImages.length) {
        console.warn("No active image to calculate bounds for");
        return null;
    }
    
    const img = state.uploadedImages[state.currentImageIndex].img;
    const padding = IMAGE_PADDING_FACTOR;
    const targetCanvasWidth = canvas.width * (1 - padding * 2);
    const targetCanvasHeight = canvas.height * (1 - padding * 2);
    const imgAspect = img.width / img.height;
    
    let drawWidth, drawHeight;
    if (imgAspect > (targetCanvasWidth / targetCanvasHeight)) {
        drawWidth = targetCanvasWidth;
        drawHeight = drawWidth / imgAspect;
    } else {
        drawHeight = targetCanvasHeight;
        drawWidth = drawHeight * imgAspect;
    }
    
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;
    
    return {
        x: Math.floor(offsetX),
        y: Math.floor(offsetY),
        width: Math.ceil(drawWidth),
        height: Math.ceil(drawHeight)
    };
}

// New function to create optimized recording canvas
function createOptimizedRecordingCanvas() {
    // Check if optimized recording is enabled
    if (!domElements.optimizedRecordingCheckbox.checked) {
        console.log("Optimized recording is disabled, using full canvas");
        return null;
    }

    const bounds = calculateImageContentBounds();
    if (!bounds) {
        console.warn("Could not calculate image bounds for optimized recording");
        return null;
    }
    
    // Add some minimal padding to ensure we don't crop particles at edges
    const extraPadding = 20;
    const recordingWidth = bounds.width + (extraPadding * 2);
    const recordingHeight = bounds.height + (extraPadding * 2);
    
    // Create recording canvas
    const recordingCanvas = document.createElement('canvas');
    recordingCanvas.width = recordingWidth;
    recordingCanvas.height = recordingHeight;
    const recordingCtx = recordingCanvas.getContext('2d');
    
    console.log(`Created optimized recording canvas: ${recordingWidth}x${recordingHeight} (vs main canvas ${domElements.canvas.width}x${domElements.canvas.height})`);
    
    return {
        canvas: recordingCanvas,
        ctx: recordingCtx,
        bounds: bounds,
        padding: extraPadding
    };
}

// New function to copy current frame to recording canvas with transparent background
function copyFrameToRecordingCanvas(recordingSetup) {
    const { canvas: recordingCanvas, ctx: recordingCtx, bounds, padding } = recordingSetup;
    const { canvas: mainCanvas } = domElements;
    
    // Clear the recording canvas
    recordingCtx.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
    
    // Fill with custom background color if not transparent
    if (!state.useTransparentBackground && state.exportBackgroundColor !== 'transparent') {
        recordingCtx.fillStyle = state.exportBackgroundColor;
        recordingCtx.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);
    }
    
    // Set compositing mode for proper alpha blending
    recordingCtx.globalCompositeOperation = 'source-over';
    
    // Copy the image content area from main canvas to recording canvas
    recordingCtx.drawImage(
        mainCanvas,
        bounds.x - padding, bounds.y - padding, bounds.width + (padding * 2), bounds.height + (padding * 2), // Source area (with padding)
        0, 0, recordingCanvas.width, recordingCanvas.height // Destination area
    );
}

// Modified startActualVideoRecording function to use optimized canvas
function startActualVideoRecording() {
    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
        console.error("MediaRecorder API is not supported in this browser.");
        setVideoRecordingStatus("Error: MediaRecorder not supported in this browser");
        return;
    }

    try {
        // Define video quality constants
        const MAX_VIDEO_BITRATE = 150000000; // 150 Mbps
        
        // Create optimized recording setup
        const recordingSetup = createOptimizedRecordingCanvas();
        if (!recordingSetup) {
            // Fallback to main canvas if optimization fails
            console.warn("Falling back to main canvas recording");
            const stream = domElements.canvas.captureStream(60);
            if (!stream) {
                console.error("Failed to capture canvas stream");
                setVideoRecordingStatus("Error: Failed to capture canvas stream");
                return;
            }
            state.recordingSetup = null;
            state.recordingCanvas = domElements.canvas;
        } else {
            // Use optimized recording canvas
            state.recordingSetup = recordingSetup;
            state.recordingCanvas = recordingSetup.canvas;
            
            // Start copying frames to recording canvas
            state.isOptimizedRecording = true;
        }
        
        // Get the stream from the appropriate canvas
        const stream = state.recordingCanvas.captureStream(60); // 60 FPS
        if (!stream) {
            console.error("Failed to capture canvas stream");
            setVideoRecordingStatus("Error: Failed to capture canvas stream");
            return;
        }

        // Check if the stream has video tracks
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
            console.error("No video tracks found in canvas stream");
            setVideoRecordingStatus("Error: No video tracks available");
            return;
        }

        // Try H.265 with alpha support first, then fallback to other codecs
        const codecOptions = [
            { 
                mimeType: 'video/mp4; codecs="hev1.1.6.L93.B0"', // H.265 Main Profile
                videoBitsPerSecond: MAX_VIDEO_BITRATE,
                description: 'H.265 MP4'
            },
            { 
                mimeType: 'video/mp4; codecs="hvc1.1.6.L93.B0"', // H.265 alternative
                videoBitsPerSecond: MAX_VIDEO_BITRATE,
                description: 'H.265 MP4 (alt)'
            },
            { 
                mimeType: 'video/webm; codecs="vp9"', // VP9 with alpha support
                videoBitsPerSecond: MAX_VIDEO_BITRATE,
                description: 'WebM VP9 (with alpha)'
            },
            { 
                mimeType: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"', // H.264 fallback
                videoBitsPerSecond: MAX_VIDEO_BITRATE,
                description: 'H.264 MP4 (no alpha)'
            },
            { 
                mimeType: 'video/mp4', 
                videoBitsPerSecond: MAX_VIDEO_BITRATE,
                description: 'MP4 (default)'
            },
            { 
                mimeType: 'video/webm', 
                videoBitsPerSecond: MAX_VIDEO_BITRATE,
                description: 'WebM (default)'
            }
        ];
        
        let selectedCodec = null;
        for (const option of codecOptions) {
            if (MediaRecorder.isTypeSupported(option.mimeType)) {
                selectedCodec = option;
                break;
            }
        }
        
        if (!selectedCodec) {
            selectedCodec = { mimeType: '', videoBitsPerSecond: MAX_VIDEO_BITRATE, description: 'Browser default' };
        }
        
        console.log(`Using codec: ${selectedCodec.description} (${selectedCodec.mimeType || 'default'})`);
        console.log("Target Bitrate:", selectedCodec.videoBitsPerSecond);

        // Create MediaRecorder with selected codec
        const options = { 
            mimeType: selectedCodec.mimeType || undefined,
            videoBitsPerSecond: selectedCodec.videoBitsPerSecond
        };
        
        // Remove mimeType if empty to let browser choose
        if (!selectedCodec.mimeType) {
            delete options.mimeType;
        }

        state.mediaRecorder = new MediaRecorder(stream, options);
        state.recordedVideoChunks = [];
        
        // Store the selected codec info for later use
        state.mediaRecorder.selectedCodec = selectedCodec;

        // Set up event handlers
        state.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                state.recordedVideoChunks.push(event.data);
                console.log(`Video chunk recorded: ${event.data.size} bytes`);
            }
        };

        state.mediaRecorder.onstop = () => {
            console.log("MediaRecorder stopped");
            if (state.recordedVideoChunks.length > 0) {
                const mimeType = state.mediaRecorder.mimeType || 'video/webm';
                state.recordedVideoBlob = new Blob(state.recordedVideoChunks, { type: mimeType });
                state.hasRecordedVideo = true;
                
                const dimensions = state.recordingSetup ? 
                    `${state.recordingSetup.canvas.width}x${state.recordingSetup.canvas.height}` : 
                    `${domElements.canvas.width}x${domElements.canvas.height}`;
                    
                setVideoRecordingStatus(`Video recorded successfully (${(state.recordedVideoBlob.size / (1024 * 1024)).toFixed(2)} MB, ${dimensions}). Ready to download.`, 'ready');
                console.log(`Video recording completed. Blob size: ${state.recordedVideoBlob.size} bytes, Dimensions: ${dimensions}`);
            } else {
                state.hasRecordedVideo = false;
                state.recordedVideoBlob = null;
                setVideoRecordingStatus('Recording finished. No video data captured.');
                console.log("Video recording completed, but no data was captured.");
            }
            
            // Clean up recording setup
            state.recordingSetup = null;
            state.recordingCanvas = null;
            state.isOptimizedRecording = false;
            state.mediaRecorder = null;
            updateControlStates();
        };

        state.mediaRecorder.onerror = (event) => {
            console.error("MediaRecorder error:", event.error);
            setVideoRecordingStatus(`Recording error: ${event.error.message}`);
            stopVideoRecording();
        };

        // Start recording
        state.isRecordingVideo = true;
        state.hasRecordedVideo = false;
        state.recordedVideoBlob = null;
        state.videoRecordingDuration = parseInt(domElements.videoRecordingDurationInput.value) * 1000;
        state.videoRecordingStartTime = performance.now();

        updateControlStates();
        
        const recordingType = state.recordingSetup ? "optimized" : "full canvas";
        const dimensions = state.recordingSetup ? 
            `${state.recordingSetup.canvas.width}x${state.recordingSetup.canvas.height}` : 
            `${domElements.canvas.width}x${domElements.canvas.height}`;
            
        setVideoRecordingStatus(`Recording ${recordingType} video (${dimensions})... (0/${domElements.videoRecordingDurationInput.value}s)`, 'recording');
        console.log(`Starting ${recordingType} video recording for ${state.videoRecordingDuration}ms at ${dimensions}`);

        state.mediaRecorder.start(100); // Record in 100ms chunks

        // Set timeout to stop recording
        state.videoRecordingTimeoutId = setTimeout(() => {
            stopVideoRecording();
        }, state.videoRecordingDuration);

    } catch (error) {
        console.error("Error starting video recording:", error);
        setVideoRecordingStatus(`Error starting recording: ${error.message}`);
        state.isRecordingVideo = false;
        state.recordingSetup = null;
        state.recordingCanvas = null;
        state.isOptimizedRecording = false;
        updateControlStates();
    }
}

function stopVideoRecording() {
    if (!state.isRecordingVideo || !state.mediaRecorder) {
        return;
    }

    console.log("Stopping video recording...");
    clearTimeout(state.videoRecordingTimeoutId);
    state.videoRecordingTimeoutId = null;
    state.isRecordingVideo = false;

    if (state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
    }

    // Stop all tracks in the stream to free up resources
    if (state.mediaRecorder.stream) {
        state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    // Clean up recording setup
    state.recordingSetup = null;
    state.recordingCanvas = null;
    state.isOptimizedRecording = false;

    updateControlStates();
}

function downloadRecordedVideo() {
    if (!state.hasRecordedVideo || !state.recordedVideoBlob || state.isRecordingVideo) {
        console.warn("No video available for download or recording in progress");
        return;
    }

    try {
        const url = URL.createObjectURL(state.recordedVideoBlob);
        const a = document.createElement('a');
        a.href = url;
        
        // Determine file extension and add codec info to filename
        let extension = 'webm';
        if (state.recordedVideoBlob.type.includes('mp4')) {
            extension = 'mp4';
        }
        
        let codecInfo = '';
        let backgroundInfo = '';
        
        if (state.mediaRecorder && state.mediaRecorder.selectedCodec) {
            const codec = state.mediaRecorder.selectedCodec;
            if (codec.description.includes('H.265')) {
                codecInfo = '_h265';
            } else if (codec.description.includes('VP9')) {
                codecInfo = '_vp9_alpha';
            } else if (codec.description.includes('H.264')) {
                codecInfo = '_h264';
            }
        }
        
        // Add background type to filename
        if (state.useTransparentBackground || state.exportBackgroundColor === 'transparent') {
            backgroundInfo = '_transparent';
        } else if (state.exportBackgroundColor === '#00ff00') {
            backgroundInfo = '_greenscreen';
        } else if (state.exportBackgroundColor === '#0000ff') {
            backgroundInfo = '_bluescreen';
        } else if (state.exportBackgroundColor === '#ff00ff') {
            backgroundInfo = '_magentascreen';
        } else if (state.exportBackgroundColor !== '#000000' && state.exportBackgroundColor !== '#ffffff') {
            backgroundInfo = '_customscreen';
        }
        
        const currentImageName = state.currentImageIndex !== -1 
            ? state.uploadedImages[state.currentImageIndex].name.split('.').slice(0, -1).join('.')
            : 'canvas';
        
        a.download = `${currentImageName}_video${codecInfo}${backgroundInfo}_${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log("Video download triggered.");
        setVideoRecordingStatus("Video downloaded successfully.", 'ready');
    } catch (error) {
        console.error("Error downloading video:", error);
        setVideoRecordingStatus(`Download error: ${error.message}`);
    }
}

// --- SVG Generation ---
function generateSVGString() {
    const { canvas } = domElements; 
    const { particles } = state; 
    const width = canvas.width; 
    const height = canvas.height;
    
    if(width === 0 || height === 0) {
        console.warn("Attempted to generate SVG with zero width/height canvas.")
        return '<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg"></svg>'; // Return empty SVG
    }
    
    // Create SVG with transparent background (no background rect)
    let svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    particles.forEach(p => { 
        if (p.currentAlpha > 0) { 
            const size = state.particleSize * p.currentAlpha; 
            if (size <= 0) return;
            
            const color = `rgb(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)})`; 
            const opacity = p.currentAlpha.toFixed(2);
            const cx = p.x.toFixed(2); 
            const cy = p.y.toFixed(2);
            
            if (state.particleShape === 'circle') { 
                const radius = (size / 2).toFixed(2); 
                svgString += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" fill-opacity="${opacity}" />`; 
            }
            else if (state.particleShape === 'square') { 
                const halfSize = (size / 2); 
                const xPos = (p.x - halfSize).toFixed(2); 
                const yPos = (p.y - halfSize).toFixed(2); 
                const side = size.toFixed(2); 
                svgString += `<rect x="${xPos}" y="${yPos}" width="${side}" height="${side}" fill="${color}" fill-opacity="${opacity}" />`; 
            }
            else if (state.particleShape === 'character') { 
                const fontSize = (size * 16); 
                const charToRender = p.assignedCharacter || '★';
                
                // Convert character to path instead of using text element
                const pathElement = getCharacterPath(charToRender, p.x, p.y, fontSize, state.particleFont);
                // Add fill and opacity to the path
                if (pathElement.includes('<path')) {
                    svgString += pathElement.replace('<path d=', `<path fill="${color}" fill-opacity="${opacity}" d=`);
                } else if (pathElement.includes('<circle')) {
                    svgString += pathElement.replace('<circle', `<circle fill="${color}" fill-opacity="${opacity}"`);
                } else if (pathElement.includes('<rect')) {
                    svgString += pathElement.replace('<rect', `<rect fill="${color}" fill-opacity="${opacity}"`);
                }
            } 
        } 
    });
    
    svgString += `</svg>`; 
    return svgString;
}

// --- Helper function to convert character to SVG path ---
function getCharacterPath(character, x, y, fontSize, fontFamily) {
    // Create a temporary canvas to measure the character and convert it to path data
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Use a larger canvas for better precision, but base it on actual font size
    const canvasSize = Math.max(200, fontSize * 3);
    tempCanvas.width = canvasSize;
    tempCanvas.height = canvasSize;
    
    // Set font exactly as it appears in the browser
    tempCtx.font = `${fontSize}px ${fontFamily}`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillStyle = 'black';
    
    // Measure the text to get accurate dimensions
    const metrics = tempCtx.measureText(character);
    const textWidth = metrics.width;
    const textHeight = fontSize; // Approximate text height based on font size
    
    // Draw the character in the center of the canvas
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    tempCtx.fillText(character, centerX, centerY);
    
    // Get image data and convert to path
    const imageData = tempCtx.getImageData(0, 0, canvasSize, canvasSize);
    const data = imageData.data;
    
    // Find the actual bounding box of the rendered character
    let minX = canvasSize, maxX = 0, minY = canvasSize, maxY = 0;
    let hasPixels = false;
    const threshold = 100;
    
    for (let py = 0; py < canvasSize; py++) {
        for (let px = 0; px < canvasSize; px++) {
            const alpha = data[(py * canvasSize + px) * 4 + 3];
            if (alpha > threshold) {
                hasPixels = true;
                minX = Math.min(minX, px);
                maxX = Math.max(maxX, px);
                minY = Math.min(minY, py);
                maxY = Math.max(maxY, py);
            }
        }
    }
    
    if (!hasPixels) {
        // Fallback to a simple shape if character couldn't be processed
        const size = fontSize * 0.4;
        return `<rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}" />`;
    }
    
    // Calculate actual rendered dimensions
    const renderedWidth = maxX - minX + 1;
    const renderedHeight = maxY - minY + 1;
    
    // Calculate scaling to match the target font size
    // Use the larger dimension to ensure the character fits properly
    const targetSize = Math.max(textWidth, textHeight);
    const actualSize = Math.max(renderedWidth, renderedHeight);
    const scale = targetSize / actualSize;
    
    // Calculate the offset to center the character at the target position
    const renderedCenterX = (minX + maxX) / 2;
    const renderedCenterY = (minY + maxY) / 2;
    const offsetX = x - (renderedCenterX - centerX) * scale;
    const offsetY = y - (renderedCenterY - centerY) * scale;
    
    // Create optimized paths with better resolution
    const paths = [];
    const visited = new Set();
    // Use smaller step size for better quality, but limit it for performance
    const step = Math.max(1, Math.min(3, Math.floor(fontSize / 15)));
    
    for (let py = minY; py <= maxY; py += step) {
        for (let px = minX; px <= maxX; px += step) {
            const key = `${px},${py}`;
            if (visited.has(key)) continue;
            
            const alpha = data[(py * canvasSize + px) * 4 + 3];
            if (alpha > threshold) {
                visited.add(key);
                
                // Try to create larger rectangles by extending horizontally
                let width = step;
                let extendX = px + step;
                
                // Extend horizontally while pixels are available
                while (extendX <= maxX && !visited.has(`${extendX},${py}`)) {
                    const extendAlpha = data[(py * canvasSize + extendX) * 4 + 3];
                    if (extendAlpha > threshold) {
                        visited.add(`${extendX},${py}`);
                        width += step;
                        extendX += step;
                    } else {
                        break;
                    }
                }
                
                // Transform coordinates to target position with proper scaling
                const rectX = offsetX + (px - centerX) * scale;
                const rectY = offsetY + (py - centerY) * scale;
                const rectWidth = width * scale;
                const rectHeight = step * scale;
                
                // Create path segment
                paths.push(`M ${rectX.toFixed(2)} ${rectY.toFixed(2)} L ${(rectX + rectWidth).toFixed(2)} ${rectY.toFixed(2)} L ${(rectX + rectWidth).toFixed(2)} ${(rectY + rectHeight).toFixed(2)} L ${rectX.toFixed(2)} ${(rectY + rectHeight).toFixed(2)} Z`);
            }
        }
    }
    
    if (paths.length === 0) {
        // Fallback to a simple circle if path creation failed
        const radius = fontSize * 0.3;
        return `<circle cx="${x}" cy="${y}" r="${radius}" />`;
    }
    
    return `<path d="${paths.join(' ')}" />`;
}

function downloadSVG() {
     if (state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || state.currentImageIndex === -1) return;
    console.log("Generating single SVG frame for download..."); const { particles } = state; if (particles.length === 0) { console.warn("No particles to generate SVG from."); return; }
    const svgString = generateSVGString(); const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    const currentImageName = state.currentImageIndex !== -1 ? state.uploadedImages[state.currentImageIndex].name.split('.').slice(0, -1).join('.') : 'particles';
    a.download = `${currentImageName}_frame_${Date.now()}.svg`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    console.log("Single SVG frame download triggered.");
}

// --- Main Animation Loop ---
function animate(timestamp) {
    if (!state.ctx) return; // Don't run if context isn't ready
    const { ctx } = state; const { canvas } = domElements; if (!state.lastTimestamp) state.lastTimestamp = timestamp;
    const deltaTime = (timestamp - state.lastTimestamp) / 1000.0; state.lastTimestamp = timestamp; 
    
    // Clear canvas and apply custom background when recording (for both optimized and full canvas recording)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.isRecordingVideo && !state.useTransparentBackground && state.exportBackgroundColor !== 'transparent') {
        ctx.fillStyle = state.exportBackgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (state.isReplaying) { drawReplayPath(ctx, deltaTime); } // Updates state.mouse if replaying
    for (let i = 0; i < state.particles.length; i++) { const p = state.particles[i]; p.update(); p.draw(ctx); } // Particles react to state.mouse
    if (state.isRecordingAnimation) { const svgFrame = generateSVGString(); state.recordedFrames.push(svgFrame); // Capture frame if recording
        if(state.recordedFrames.length % 10 === 0 || state.recordedFrames.length === 1) { // Update status more frequently
             const elapsedSeconds = ((performance.now() - state.animationRecordingStartTime) / 1000).toFixed(1);
             const statusMsg = state.isReplaying ? `Recording & Replaying Path...` : `Recording...`; // Adjust status message
             setAnimationRecordingStatus(`${statusMsg} (${elapsedSeconds}/${domElements.recordAnimationDurationInput.value}s) Frames: ${state.recordedFrames.length}`, 'recording'); } }
    // Update video recording status and copy frame if optimized recording
    if (state.isRecordingVideo) {
        const elapsedSeconds = ((performance.now() - state.videoRecordingStartTime) / 1000).toFixed(1);
        const maxDuration = domElements.videoRecordingDurationInput.value;
        
        const recordingType = state.recordingSetup ? "optimized" : "full canvas";
        const dimensions = state.recordingSetup ? 
            `${state.recordingSetup.canvas.width}x${state.recordingSetup.canvas.height}` : 
            `${domElements.canvas.width}x${domElements.canvas.height}`;
        
        let codecInfo = '';
        if (state.mediaRecorder && state.mediaRecorder.selectedCodec) {
            codecInfo = ` - ${state.mediaRecorder.selectedCodec.description}`;
        }
        
        let backgroundInfo = '';
        if (state.useTransparentBackground || state.exportBackgroundColor === 'transparent') {
            backgroundInfo = ' - Transparent bg';
        } else if (state.exportBackgroundColor === '#00ff00') {
            backgroundInfo = ' - Green screen';
        } else if (state.exportBackgroundColor === '#0000ff') {
            backgroundInfo = ' - Blue screen';
        } else if (state.exportBackgroundColor === '#ff00ff') {
            backgroundInfo = ' - Magenta screen';
        } else {
            backgroundInfo = ` - Custom bg (${state.exportBackgroundColor})`;
        }
            
        setVideoRecordingStatus(`Recording ${recordingType} video (${dimensions})${codecInfo}${backgroundInfo}... (${elapsedSeconds}/${maxDuration}s)`, 'recording');
        
        // Copy current frame to recording canvas if using optimized recording
        if (state.isOptimizedRecording && state.recordingSetup) {
            copyFrameToRecordingCanvas(state.recordingSetup);
        }
    }
    requestAnimationFrame(animate);
}

// --- Event Handlers ---
function handleFileChange(event) { processFiles(event.target.files); event.target.value = null; }
function handleDensityChange(event) { 
    let newDensity = parseInt(event.target.value); 
    // Ensure density cannot go below 2
    if (newDensity < 2) {
        newDensity = 2;
        event.target.value = 2;
    }
    state.particleDensity = newDensity; 
    domElements.densityValueSpan.textContent = state.particleDensity; 
    console.log(`Particle density changed to ${state.particleDensity}. Clearing definitions.`); 
    state.uploadedImages.forEach(imgData => imgData.particleDefinitions = null); 
    if (state.currentImageIndex !== -1) { 
        const currentIndex = state.currentImageIndex; 
        state.currentImageIndex = -1; 
        handleSwitchImage(currentIndex); 
    } 
}
function handleRadiusChange(event) { state.mouse.radius = parseInt(event.target.value); domElements.radiusValueSpan.textContent = state.mouse.radius; }
function handleSpeedChange(event) { state.mouseEffectSpeedFactor = parseInt(event.target.value); domElements.speedValueSpan.textContent = state.mouseEffectSpeedFactor; console.log(`Mouse effect speed factor changed to ${state.mouseEffectSpeedFactor}.`); }
function handleParticleSizeChange(event) { state.particleSize = parseFloat(event.target.value); domElements.particleSizeValue.textContent = state.particleSize.toFixed(1); }
function handleParticleShapeChange(event) { 
    if (event.target.checked) { 
        state.particleShape = event.target.value; 
        toggleCharacterSettings(); 
        console.log(`Particle shape changed to ${state.particleShape}.`); 
    } 
}
function toggleCharacterSettings() {
    const isCharacterShape = state.particleShape === 'character';
    if (isCharacterShape) {
        domElements.characterSettings.style.display = 'block';
        domElements.characterSettings.className = 'character-settings-expanded';
    } else {
        domElements.characterSettings.style.display = 'none';
        domElements.characterSettings.className = 'mb-3';
    }
}
function handleParticleCharacterChange(event) { 
    const newChar = event.target.value.trim() || '★'; 
    state.particleCharacter = newChar; 
    // Update all existing particles with new random characters
    updateParticleCharacters();
    console.log(`Particle character(s) changed to '${state.particleCharacter}'.`); 
}
function updateParticleCharacters() {
    // Reassign random characters to all existing particles
    state.particles.forEach(particle => {
        particle.assignedCharacter = particle.getRandomCharacter();
    });
}
function handleParticleFontChange(event) { 
    state.particleFont = event.target.value; 
    console.log(`Particle font changed to ${state.particleFont}.`); 
}
function handleInteractionModeChange(event) { if (event.target.checked) { state.interactionMode = event.target.value; console.log(`Interaction mode changed to ${state.interactionMode}.`); } }
function handleMouseMove(event) { const rect = domElements.canvas.getBoundingClientRect(); state.actualMouse.x = event.clientX - rect.left; state.actualMouse.y = event.clientY - rect.top; if (!state.isReplaying) { state.mouse.x = state.actualMouse.x; state.mouse.y = state.actualMouse.y; } if (state.isRecording) { state.recordedPath.push({ x: state.actualMouse.x, y: state.actualMouse.y, timestamp: performance.now() }); } }
function handleMouseLeave() { state.actualMouse.x = null; state.actualMouse.y = null; if (!state.isReplaying) { state.mouse.x = null; state.mouse.y = null; } }
function handleDragEnter(e) { e.preventDefault(); e.stopPropagation(); domElements.body.classList.add('dragging-over'); }
function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); domElements.body.classList.add('dragging-over'); }
function handleDragLeave(e) { e.preventDefault(); e.stopPropagation(); if (e.relatedTarget === null || !domElements.body.contains(e.relatedTarget)) { domElements.body.classList.remove('dragging-over'); } }
function handleDrop(e) { e.preventDefault(); e.stopPropagation(); domElements.body.classList.remove('dragging-over'); const files = e.dataTransfer.files; if (files.length > 0) { processFiles(files); } }
function handleResize() { clearTimeout(state.resizeTimeout); state.isResizing = true; state.resizeTimeout = setTimeout(() => { const { canvas } = domElements; const canvasContainer = canvas.parentElement; if (!canvasContainer) { console.error("Canvas container not found during resize."); state.isResizing = false; return; } const containerWidth = canvasContainer.offsetWidth; const containerHeight = canvasContainer.offsetHeight; if (canvas.width !== containerWidth || canvas.height !== containerHeight) { console.log(`Resizing canvas from ${canvas.width}x${canvas.height} to ${containerWidth}x${containerHeight}`); canvas.width = containerWidth; canvas.height = containerHeight; state.uploadedImages.forEach(imgData => imgData.particleDefinitions = null); if (state.currentImageIndex !== -1 && canvas.width > 0 && canvas.height > 0) { console.log(`Triggering image redraw after resize...`); const currentIndex = state.currentImageIndex; state.currentImageIndex = -1; handleSwitchImage(currentIndex); } else { console.log("Resize occurred, but no active image or canvas has zero dimensions.");} } else { console.log("Resize event detected, but dimensions haven't changed."); } state.isResizing = false; }, RESIZE_DEBOUNCE_DELAY); }
function handleShowPathChange(event) { state.showReplayPath = event.target.checked; console.log(`Show replay path set to: ${state.showReplayPath}`); }

// --- NEW: Combined Recording + Replay ---
/** Handles the click for the "Record with Path Replay" button */
function handleRecordWithReplay() {
    // Prevent starting if busy, no image, or no path
    if (state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || state.currentImageIndex === -1 || !state.hasRecordedPath) {
        console.warn("Cannot start Record with Replay due to current state or missing path/image.");
        return;
    }
     // Check if JSZip is loaded (still needed for download)
     if (typeof JSZip === 'undefined') {
        console.error("JSZip library is not loaded. Cannot record animation.");
        setAnimationRecordingStatus("Error: JSZip not loaded");
        return;
    }

    // Normalize the path first
    if (!normalizePathForDuration()) {
        console.error("Failed to normalize path. Cannot start Record with Replay.");
        setAnimationRecordingStatus("Error: Failed to prepare path.");
        return;
    }

    // Start both processes
    state.isRecordingAnimation = true;
    state.hasRecordedAnimation = false;
    state.recordedFrames = [];
    state.animationRecordingDuration = parseInt(domElements.recordAnimationDurationInput.value) * 1000;
    state.animationRecordingStartTime = performance.now();

    state.isReplaying = true;
    state.replayProgress = 0;
    domElements.canvas.classList.add('replaying');
    state.mouse.x = state.normalizedPath[0].x;
    state.mouse.y = state.normalizedPath[0].y;

    updateControlStates(); // Update UI for combined state
    setAnimationRecordingStatus(`Recording & Replaying Path... (0/${domElements.recordAnimationDurationInput.value}s)`, 'recording');
    console.log(`Starting combined Record with Replay for ${state.animationRecordingDuration}ms`);

    // Set a single timeout to stop both
    // Clear any existing timeout just in case
    clearTimeout(state.animationRecordingTimeoutId);
    state.animationRecordingTimeoutId = setTimeout(() => {
        stopRecordingAndReplay();
    }, state.animationRecordingDuration);
}

/** Stops both animation recording and path replay */
function stopRecordingAndReplay() {
    console.log("Stopping combined Record with Replay...");
    clearTimeout(state.animationRecordingTimeoutId);
    state.animationRecordingTimeoutId = null;

    const wasRecording = state.isRecordingAnimation;
    const wasReplaying = state.isReplaying;

    state.isRecordingAnimation = false;
    state.isReplaying = false; // Ensure replay stops

    if (wasReplaying) {
        domElements.canvas.classList.remove('replaying');
        state.mouse.x = state.actualMouse.x; // Restore virtual mouse
        state.mouse.y = state.actualMouse.y;
        state.replayProgress = 0; // Reset progress
    }

    if (wasRecording && state.recordedFrames.length > 0) {
        state.hasRecordedAnimation = true;
        setAnimationRecordingStatus(`Recorded ${state.recordedFrames.length} frames during replay. Ready to download.`, 'ready');
        console.log(`Stopped combined recording. Recorded ${state.recordedFrames.length} frames.`);
    } else if (wasRecording) {
        state.hasRecordedAnimation = false;
        setAnimationRecordingStatus('Recording finished. No frames captured.');
        console.log("Stopped combined recording. No frames captured.");
    } else {
         setAnimationRecordingStatus(''); // Clear status if only replay was somehow stopped here
    }

    updateControlStates(); // Re-enable relevant controls
}

// --- Initialization ---
function initialize() {
    console.log("Initializing Image Particle Animator...");

    // Get Canvas Context - moved here
    state.ctx = domElements.canvas.getContext('2d');
    if (!state.ctx) {
        console.error("Failed to get 2D context from canvas. Particle animation cannot start.");
        alert("Could not initialize the canvas. Please try refreshing or using a different browser.");
        return; // Stop initialization if context fails
    }
    console.log("Canvas 2D context acquired.");

    domElements.controlsToDisable = [
        domElements.imageUpload, domElements.densitySlider, domElements.mouseRadiusSlider,
        domElements.transitionSpeedSlider, domElements.recordPathBtn, domElements.replayPathBtn,
        domElements.trackingDurationInput, domElements.showReplayPathCheckbox, domElements.downloadSvgBtn,
        domElements.recordAnimationDurationInput, domElements.recordAnimationBtn, domElements.downloadRecordingBtn,
        domElements.particleSizeSlider, domElements.particleShapeRadios, domElements.interactionModeRadios,
        domElements.recordWithReplayBtn, // Add new button to disable list
        domElements.videoRecordingDurationInput, domElements.recordVideoBtn, domElements.downloadVideoBtn,
        domElements.optimizedRecordingCheckbox,
        domElements.particleCharacterInput, domElements.particleFontSelect
    ];

    // Attach Event Listeners
    domElements.imageUpload.addEventListener('change', handleFileChange);
    domElements.densitySlider.addEventListener('input', handleDensityChange);
    domElements.mouseRadiusSlider.addEventListener('input', handleRadiusChange);
    domElements.transitionSpeedSlider.addEventListener('input', handleSpeedChange);
    domElements.particleSizeSlider.addEventListener('input', handleParticleSizeChange);
    domElements.particleShapeRadios.forEach(radio => radio.addEventListener('change', handleParticleShapeChange));
    domElements.particleCharacterInput.addEventListener('input', handleParticleCharacterChange);
    domElements.particleFontSelect.addEventListener('change', handleParticleFontChange);
    domElements.interactionModeRadios.forEach(radio => radio.addEventListener('change', handleInteractionModeChange));
    domElements.recordPathBtn.addEventListener('click', startCountdown);
    domElements.replayPathBtn.addEventListener('click', triggerReplay);
    domElements.showReplayPathCheckbox.addEventListener('change', handleShowPathChange);
    if (domElements.recordAnimationBtn) domElements.recordAnimationBtn.addEventListener('click', startAnimationRecording);
    if (domElements.recordWithReplayBtn) domElements.recordWithReplayBtn.addEventListener('click', handleRecordWithReplay); // Attach listener for new button
    if (domElements.downloadRecordingBtn) domElements.downloadRecordingBtn.addEventListener('click', downloadRecordedAnimation);
    if (domElements.downloadSvgBtn) domElements.downloadSvgBtn.addEventListener('click', downloadSVG);
    if (domElements.recordVideoBtn) domElements.recordVideoBtn.addEventListener('click', startVideoRecording);
    if (domElements.downloadVideoBtn) domElements.downloadVideoBtn.addEventListener('click', downloadRecordedVideo);
    
    // Background color control event listeners
    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    const backgroundPresets = document.getElementById('backgroundPresets');
    
    if (backgroundColorPicker) {
        backgroundColorPicker.addEventListener('change', function(e) {
            state.exportBackgroundColor = e.target.value;
            if (backgroundPresets) backgroundPresets.value = 'custom'; // Add custom option if not exists
            console.log('Export background color changed to:', state.exportBackgroundColor);
        });
    }
    
    if (backgroundPresets) {
        backgroundPresets.addEventListener('change', function(e) {
            const value = e.target.value;
            if (value === 'transparent') {
                state.useTransparentBackground = true;
                state.exportBackgroundColor = 'transparent';
            } else {
                state.useTransparentBackground = false;
                state.exportBackgroundColor = value;
                if (backgroundColorPicker) backgroundColorPicker.value = value;
            }
            console.log('Background preset changed to:', value);
        });
    }
    
    domElements.canvas.addEventListener('mousemove', handleMouseMove);
    domElements.canvas.addEventListener('mouseleave', handleMouseLeave);
    domElements.body.addEventListener('dragenter', handleDragEnter);
    domElements.body.addEventListener('dragover', handleDragOver);
    domElements.body.addEventListener('dragleave', handleDragLeave);
    domElements.body.addEventListener('drop', handleDrop);
    window.addEventListener('resize', handleResize);
    console.log("Event listeners attached.");

    // Initial UI Setup
    updateImageListUI();
    if (domElements.densityValueSpan) domElements.densityValueSpan.textContent = state.particleDensity;
    if (domElements.radiusValueSpan) domElements.radiusValueSpan.textContent = state.mouse.radius;
    if (domElements.speedValueSpan) domElements.speedValueSpan.textContent = state.mouseEffectSpeedFactor;
    if (domElements.particleSizeValue) domElements.particleSizeValue.textContent = state.particleSize.toFixed(1);
    if (domElements.particleCharacterInput) domElements.particleCharacterInput.value = state.particleCharacter;
    if (domElements.particleFontSelect) domElements.particleFontSelect.value = state.particleFont;
    toggleCharacterSettings(); // Set initial visibility of character settings
    try {
        // Check if elements exist before trying to access properties
        const shapeCircleRadio = document.getElementById(`particleShape${state.particleShape.charAt(0).toUpperCase() + state.particleShape.slice(1)}`);
        if (shapeCircleRadio) shapeCircleRadio.checked = true;
        const modeRepelRadio = document.getElementById(`interactionMode${state.interactionMode.charAt(0).toUpperCase() + state.interactionMode.slice(1)}`);
        if (modeRepelRadio) modeRepelRadio.checked = true;
    } catch (e) {
        console.warn("Error setting initial radio button states:", e);
    }
    if (domElements.showReplayPathCheckbox) domElements.showReplayPathCheckbox.checked = state.showReplayPath;
    updateControlStates();
    setAnimationRecordingStatus('');
    setVideoRecordingStatus('');
    console.log("Initial UI setup complete.");
    
    // Load default image (image3 from img placeholder folder)
    loadDefaultImage();
    
    // Inform user about debug capabilities
    console.log("");
    console.log("🛠️  DEBUG HELP AVAILABLE");
    console.log("If you experience 'Failed to generate definitions' errors with images,");
    console.log("type 'particleDebugHelp()' in this console for assistance.");
    console.log("");

    // Initial Resize and Animation Start
    // Wrap in a short timeout to ensure layout is stable
    setTimeout(() => {
        console.log("Performing initial resize calculation.");
        handleResize(); // Calculate initial canvas size
        console.log("Starting animation loop.");
        requestAnimationFrame(animate); // Start animation
    }, 50); // Slightly shorter delay

    console.log("Initialization setup complete.");
}

// Function to load the default image
function loadDefaultImage() {
    const defaultImagePath = '../../img-placeholder/3.jpeg';
    
    const img = new Image();
    img.onload = function() {
        console.log('Default image loaded successfully:', defaultImagePath);
        
        // Clear any existing images first (single image mode)
        state.uploadedImages = [];
        state.currentImageIndex = -1;
        state.particles = [];
        
        // Create image data object similar to how files are processed
        const imageData = {
            img: img,
            name: 'Default Image 3',
            particleDefinitions: null
        };
        
        // Set as the single image
        state.uploadedImages = [imageData];
        state.imageCounter++;
        
        // Update UI and switch to this image
        updateImageListUI();
        handleSwitchImage(0);
    };
    
    img.onerror = function() {
        console.warn('Could not load default image from:', defaultImagePath);
        console.log('You can upload an image manually using the upload button.');
    };
    
    img.src = defaultImagePath;
}

// --- Start ---
// Use DOMContentLoaded to ensure the DOM is fully parsed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // DOM is already loaded, call initialize directly
    initialize();
}

// Help function for console debugging
function particleDebugHelp() {
    console.log("=== Particle System Debug Help ===");
    console.log("");
    console.log("If you're getting 'Failed to generate definitions' errors, try these commands:");
    console.log("");
    console.log("1. Test particle generation:");
    console.log("   testParticleGeneration()              - Test current image");
    console.log("   testParticleGeneration(0)             - Test specific image by index");
    console.log("   testBlackAndWhite()                   - Analyze black & white image");
    console.log("");
    console.log("2. Adjust thresholds for difficult images:");
    console.log("   adjustThresholds(50, 2)               - Lower alpha to 50, color to 2");
    console.log("   adjustThresholds(25, 1)               - Very permissive thresholds");
    console.log("   adjustThresholds(null, 1)             - Only change color threshold");
    console.log("");
    console.log("3. Test character-to-path conversion:");
    console.log("   testCharacterPath('★', 48, 'Arial')   - Test character conversion");
    console.log("   testCharacterPath('A', 24)            - Test with different character");
    console.log("");
    console.log("4. Check current state:");
    console.log("   console.log(state.uploadedImages)     - See all uploaded images");
    console.log("   console.log(state.currentImageIndex)  - See current image index");
    console.log("   console.log(state.particleDensity)    - See particle density setting");
    console.log("");
    console.log("Common issues and solutions:");
    console.log("- Black & white images: Updated logic now handles black pixels correctly");
    console.log("- Transparent images: Try adjustThresholds(25, 1)");
    console.log("- Low contrast images: Try adjustThresholds(50, 1)");
    console.log("- Too many particles: Increase density slider or call state.particleDensity = 10");
    console.log("- Too few particles: Decrease density slider or call state.particleDensity = 3");
    console.log("- Character size issues: Use testCharacterPath() to debug conversion");
    console.log("");
    console.log("Current settings:");
    console.log(`- Alpha threshold: ${state.particleAlphaThreshold}`);
    console.log(`- Color threshold: ${state.particleColorThreshold}`);
    console.log(`- Particle density: ${state.particleDensity}`);
    console.log(`- Particle size: ${state.particleSize}`);
    console.log(`- Current image: ${state.currentImageIndex === -1 ? 'None' : state.uploadedImages[state.currentImageIndex]?.name}`);
}

// Debug function for testing character path conversion
function testCharacterPath(character = '★', fontSize = 48, fontFamily = 'Arial') {
    console.log(`\n=== Testing Character Path Conversion ===`);
    console.log(`Character: "${character}"`);
    console.log(`Font: ${fontSize}px ${fontFamily}`);
    
    // Test the conversion
    const testX = 100;
    const testY = 100;
    const pathResult = getCharacterPath(character, testX, testY, fontSize, fontFamily);
    
    // Create a temporary canvas to measure the original character
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    
    tempCtx.font = `${fontSize}px ${fontFamily}`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    
    const metrics = tempCtx.measureText(character);
    
    console.log(`\nOriginal text metrics:`);
    console.log(`- Text width: ${metrics.width.toFixed(2)}px`);
    console.log(`- Font size: ${fontSize}px`);
    console.log(`- Font family: ${fontFamily}`);
    
    // Draw the character and find bounds
    tempCtx.fillStyle = 'black';
    tempCtx.fillText(character, 100, 100);
    
    const imageData = tempCtx.getImageData(0, 0, 200, 200);
    const data = imageData.data;
    
    let minX = 200, maxX = 0, minY = 200, maxY = 0;
    let pixelCount = 0;
    
    for (let py = 0; py < 200; py++) {
        for (let px = 0; px < 200; px++) {
            const alpha = data[(py * 200 + px) * 4 + 3];
            if (alpha > 100) {
                pixelCount++;
                minX = Math.min(minX, px);
                maxX = Math.max(maxX, px);
                minY = Math.min(minY, py);
                maxY = Math.max(maxY, py);
            }
        }
    }
    
    const renderedWidth = maxX - minX + 1;
    const renderedHeight = maxY - minY + 1;
    
    console.log(`\nActual rendered bounds:`);
    console.log(`- Rendered size: ${renderedWidth}x${renderedHeight}px`);
    console.log(`- Bounding box: (${minX}, ${minY}) to (${maxX}, ${maxY})`);
    console.log(`- Total pixels: ${pixelCount}`);
    
    console.log(`\nGenerated SVG path:`);
    console.log(pathResult);
    
    console.log(`\nTo test this visually:`);
    console.log(`1. Open test-svg.html`);
    console.log(`2. Use the character size comparison tool`);
    console.log(`3. Set character to "${character}", size to ${fontSize}, font to ${fontFamily}`);
    
    return {
        originalMetrics: { width: metrics.width, height: fontSize },
        renderedBounds: { width: renderedWidth, height: renderedHeight },
        svgPath: pathResult,
        pixelCount: pixelCount
    };
}

// Expose debug functions globally for console access
window.particleDebugHelp = particleDebugHelp;
window.testParticleGeneration = testParticleGeneration;
window.adjustThresholds = adjustThresholds;
window.testBlackAndWhite = testBlackAndWhite;
window.testCharacterPath = testCharacterPath;

function startVideoRecording() {
    if (state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || state.isRecordingVideo || state.currentImageIndex === -1) {
        console.warn("Cannot start video recording due to current state or missing image.");
        return;
    }

    // Start countdown first
    startVideoCountdown();
}

function startVideoCountdown() {
    if (state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || state.isRecordingVideo || state.currentImageIndex === -1) return;
    
    state.isCountingDown = true;
    state.countdownType = 'video'; // Set countdown type for video recording
    state.countdownValue = COUNTDOWN_START_VALUE;
    domElements.countdownDisplay.textContent = state.countdownValue;
    domElements.countdownDisplay.style.display = 'block';
    updateControlStates();
    
    console.log("Starting video recording countdown...");
    
    state.countdownIntervalId = setInterval(() => {
        state.countdownValue--;
        domElements.countdownDisplay.textContent = state.countdownValue;
        
        if (state.countdownValue <= 0) {
            clearInterval(state.countdownIntervalId);
            state.countdownIntervalId = null;
            domElements.countdownDisplay.style.display = 'none';
            state.isCountingDown = false;
            state.countdownType = null; // Clear countdown type
            startActualVideoRecording(); // Start the actual recording after countdown
        }
    }, 1000);
}