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
const SVG_BACKGROUND_COLOR = '#000000';
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
    characterSettings: document.getElementById('characterSettings'),
    particleCharacterInput: document.getElementById('particleCharacter'),
    particleFontSelect: document.getElementById('particleFont'),
    controlsToDisable: []
};

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
    particleShape: 'circle',
    particleCharacter: '★',
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
         const driftDx = this.initialX - this.x; const driftDy = this.initialY - this.y;
         if (Math.abs(driftDx) < PARTICLE_DRIFT_THRESHOLD && Math.abs(driftDy) < PARTICLE_DRIFT_THRESHOLD) {
             this.x += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED; this.y += (Math.random() - 0.5) * PARTICLE_DRIFT_SPEED;
         }
       }
}

// --- Core Functions ---
function createImageParticleDefinitions(img) {
    const { canvas } = domElements;
    if (!canvas || canvas.width === 0 || canvas.height === 0) { console.error("Canvas not ready or has zero dimensions. Cannot create particle definitions."); return []; }
    const tempCanvas = document.createElement('canvas'); const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    const canvasAspect = canvas.width / canvas.height; const imgAspect = img.width / img.height;
    const padding = IMAGE_PADDING_FACTOR; const targetCanvasWidth = canvas.width * (1 - padding * 2);
    const targetCanvasHeight = canvas.height * (1 - padding * 2); let drawWidth, drawHeight;
    if (imgAspect > (targetCanvasWidth / targetCanvasHeight)) { drawWidth = targetCanvasWidth; drawHeight = drawWidth / imgAspect; }
    else { drawHeight = targetCanvasHeight; drawWidth = drawHeight * imgAspect; }
    const offsetX = (canvas.width - drawWidth) / 2; const offsetY = (canvas.height - drawHeight) / 2;
    tempCanvas.width = canvas.width; tempCanvas.height = canvas.height;
    try {
        tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height); const data = imageData.data;
        const particleDefinitions = [];
        for (let y = 0; y < tempCanvas.height; y += state.particleDensity) {
            for (let x = 0; x < tempCanvas.width; x += state.particleDensity) {
                const index = (y * tempCanvas.width + x) * 4; const alpha = data[index + 3];
                if (alpha > PARTICLE_ALPHA_THRESHOLD && (data[index] > PARTICLE_COLOR_THRESHOLD || data[index+1] > PARTICLE_COLOR_THRESHOLD || data[index+2] > PARTICLE_COLOR_THRESHOLD)) {
                    const r = data[index]; const g = data[index + 1]; const b = data[index + 2]; const color = { r, g, b };
                    particleDefinitions.push({ x, y, color, initialX: x, initialY: y });
                }
            }
        }
        console.log(`Created ${particleDefinitions.length} particle definitions.`); return particleDefinitions;
    } catch (error) { console.error("Error processing image data:", error); return []; }
}
function updateImageListUI() {
    const { imageListDiv } = domElements; imageListDiv.innerHTML = '';
    if (state.uploadedImages.length === 0) { imageListDiv.innerHTML = '<p class="text-gray-500 text-sm">No images uploaded yet.</p>'; return; }
    state.uploadedImages.forEach((imgData, index) => {
        const item = document.createElement('div'); item.classList.add('image-item', 'p-2', 'rounded-md', 'flex', 'items-center', 'justify-between', 'mb-1');
        if (index === state.currentImageIndex) { item.classList.add('active'); }
        const infoDiv = document.createElement('div'); infoDiv.classList.add('flex', 'items-center', 'overflow-hidden', 'mr-2');
        const thumb = document.createElement('img'); thumb.src = imgData.img.src; thumb.alt = imgData.name; thumb.classList.add('mr-2', 'flex-shrink-0');
        const nameSpan = document.createElement('span'); nameSpan.textContent = imgData.name.length > 15 ? imgData.name.substring(0, 12) + '...' : imgData.name; nameSpan.classList.add('text-sm', 'text-gray-200', 'truncate'); nameSpan.title = imgData.name;
        infoDiv.appendChild(thumb); infoDiv.appendChild(nameSpan); item.addEventListener('click', () => handleSwitchImage(index));
        const removeBtn = document.createElement('button'); removeBtn.textContent = 'X'; removeBtn.classList.add('remove-btn', 'flex-shrink-0'); removeBtn.title = `Remove ${imgData.name}`;
        removeBtn.addEventListener('click', (e) => { e.stopPropagation(); handleRemoveImage(index); });
        item.appendChild(infoDiv); item.appendChild(removeBtn); imageListDiv.appendChild(item);
    });
}
function processFiles(files) {
     if (!files || files.length === 0) return; if (state.uploadedImages.length === 0 && domElements.imageListDiv.querySelector('p')) { domElements.imageListDiv.innerHTML = ''; }
     Array.from(files).forEach((file) => {
         if (file.type.startsWith('image/')) {
             const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => {
                     const newImageId = state.imageCounter++; const newImageData = { id: newImageId, name: file.name, img: img, particleDefinitions: null };
                     state.uploadedImages.push(newImageData); updateImageListUI(); if (state.uploadedImages.length === 1) { handleSwitchImage(0); } };
                 img.onerror = () => console.error(`Error loading image: ${file.name}`); img.src = e.target.result; };
             reader.onerror = () => console.error(`Error reading file: ${file.name}`); reader.readAsDataURL(file);
         } else { console.warn(`Skipping non-image file: ${file.name}`); } });
  }
function handleRemoveImage(indexToRemove) {
    if (indexToRemove < 0 || indexToRemove >= state.uploadedImages.length) return; const wasCurrentImage = (indexToRemove === state.currentImageIndex);
    const removedImageName = state.uploadedImages[indexToRemove].name; state.uploadedImages.splice(indexToRemove, 1); console.log(`Removed image: ${removedImageName}`);
    if (wasCurrentImage) { if (state.uploadedImages.length > 0) { const newIndex = Math.min(indexToRemove, state.uploadedImages.length - 1); state.currentImageIndex = -1; handleSwitchImage(newIndex); }
        else { handleSwitchImage(-1); } }
    else { if (indexToRemove < state.currentImageIndex) { state.currentImageIndex--; } updateImageListUI(); }
     if (!state.hasRecordedPath || wasCurrentImage) { domElements.replayPathBtn.disabled = true; state.hasRecordedPath = false; }
     state.hasRecordedAnimation = false; state.recordedFrames = []; updateControlStates();
   }
function handleSwitchImage(newIndex) {
    console.log(`Attempting switch to index: ${newIndex}`); if (newIndex < -1 || newIndex >= state.uploadedImages.length || newIndex === state.currentImageIndex) {
         if (newIndex === -1 && state.currentImageIndex !== -1) { /* Allow clearing */ } else { console.log(`Switch aborted: Index ${newIndex} invalid or same as current (${state.currentImageIndex}).`); return; } }
    const oldIndex = state.currentImageIndex; state.currentImageIndex = newIndex; console.log(`Switching from ${oldIndex} to ${newIndex}`);
     state.hasRecordedAnimation = false; state.recordedFrames = []; setAnimationRecordingStatus('');
    if (state.currentImageIndex === -1) { console.log("Clearing particles."); state.particles = []; updateImageListUI(); updateControlStates(); return; }
    const imageData = state.uploadedImages[state.currentImageIndex]; if (!imageData || !imageData.img) { console.error(`Image data not found for index ${state.currentImageIndex}. Reverting.`); state.currentImageIndex = oldIndex; updateImageListUI(); updateControlStates(); return; }
    console.log(`Loading image: ${imageData.name}`); if (!imageData.particleDefinitions) { console.log(`Generating definitions for ${imageData.name}...`); imageData.particleDefinitions = createImageParticleDefinitions(imageData.img);
         if (!imageData.particleDefinitions || imageData.particleDefinitions.length === 0) { console.error(`Failed to generate definitions for ${imageData.name}. Clearing particles.`); state.currentImageIndex = -1; state.particles = []; updateImageListUI(); updateControlStates(); return; } }
    const newParticleDefs = imageData.particleDefinitions; const nextParticlesArray = []; console.log(`Creating ${newParticleDefs.length} new particles from definitions...`);
    for (const def of newParticleDefs) { const newP = new Particle(def.initialX, def.initialY, def.color, def.initialX, def.initialY); nextParticlesArray.push(newP); }
    state.particles = nextParticlesArray; console.log(`Particle array updated with ${state.particles.length} particles.`); updateImageListUI(); updateControlStates();
}

// --- Path Recording and Replay Functions ---
function updateControlStates() {
    const disableAll = state.isCountingDown || state.isRecording || state.isReplaying || state.isRecordingAnimation || state.isProcessingRecording || state.isRecordingVideo;
    const noImageLoaded = state.currentImageIndex === -1;
    domElements.controlsToDisable.forEach(control => {
        if (control instanceof NodeList) {
            control.forEach(radio => radio.disabled = disableAll);
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
     if (state.isCountingDown && state.countdownType === 'path') { domElements.recordPathBtn.textContent = 'Starting...'; } // Path countdown
     else if (state.isRecording) { domElements.recordPathBtn.textContent = `Recording Path...`; }
     else if (state.isReplaying && !state.isRecordingAnimation) { domElements.replayPathBtn.textContent = 'Replaying...'; } // Only show Replaying if NOT also recording animation
     else { domElements.recordPathBtn.textContent = 'Record Path'; domElements.replayPathBtn.textContent = 'Replay Path'; }
    // Animation Button Text
    if (state.isRecordingAnimation && state.isReplaying) { domElements.recordWithReplayBtn.textContent = 'Rec & Replay...'; domElements.recordAnimationBtn.textContent = 'Record Animation'; } // Specific state
    else if (state.isRecordingAnimation) { domElements.recordAnimationBtn.textContent = 'Recording...'; domElements.recordWithReplayBtn.textContent = 'Record with Path Replay'; }
    else { domElements.recordAnimationBtn.textContent = 'Record Animation'; domElements.recordWithReplayBtn.textContent = 'Record with Path Replay'; }
    // Download Button Text
    if (state.isProcessingRecording) { domElements.downloadRecordingBtn.textContent = 'Zipping...'; }
    else { domElements.downloadRecordingBtn.textContent = 'Download ZIP'; }
    // Video Recording Button Text
    if (state.isRecordingVideo) { domElements.recordVideoBtn.textContent = 'Recording Video...'; }
    else if (state.isCountingDown && state.countdownType === 'video') { domElements.recordVideoBtn.textContent = 'Starting Video...'; } // Video countdown state
    else { domElements.recordVideoBtn.textContent = 'Record Canvas Video'; }
    // Video Download Button Text
    if (state.hasRecordedVideo) { domElements.downloadVideoBtn.textContent = 'Download Video'; }
    else { domElements.downloadVideoBtn.textContent = 'Download Video'; }
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

function startActualVideoRecording() {
    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
        console.error("MediaRecorder API is not supported in this browser.");
        setVideoRecordingStatus("Error: MediaRecorder not supported in this browser");
        return;
    }

    try {
        // Get the canvas stream
        const stream = domElements.canvas.captureStream(30); // 30 FPS
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

        // Create MediaRecorder
        let options = {};
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            options.mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
            options.mimeType = 'video/webm; codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
            options.mimeType = 'video/webm';
        }

        state.mediaRecorder = new MediaRecorder(stream, options);
        state.recordedVideoChunks = [];

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
                setVideoRecordingStatus(`Video recorded successfully (${(state.recordedVideoBlob.size / (1024 * 1024)).toFixed(2)} MB). Ready to download.`, 'ready');
                console.log(`Video recording completed. Blob size: ${state.recordedVideoBlob.size} bytes`);
            } else {
                state.hasRecordedVideo = false;
                state.recordedVideoBlob = null;
                setVideoRecordingStatus('Recording finished. No video data captured.');
                console.log("Video recording completed, but no data was captured.");
            }
            
            // Clean up
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
        setVideoRecordingStatus(`Recording video... (0/${domElements.videoRecordingDurationInput.value}s)`, 'recording');
        console.log(`Starting video recording for ${state.videoRecordingDuration}ms...`);

        state.mediaRecorder.start(100); // Record in 100ms chunks

        // Set timeout to stop recording
        state.videoRecordingTimeoutId = setTimeout(() => {
            stopVideoRecording();
        }, state.videoRecordingDuration);

    } catch (error) {
        console.error("Error starting video recording:", error);
        setVideoRecordingStatus(`Error starting recording: ${error.message}`);
        state.isRecordingVideo = false;
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
        
        // Determine file extension based on mime type
        let extension = 'webm';
        if (state.recordedVideoBlob.type.includes('mp4')) {
            extension = 'mp4';
        }
        
        const currentImageName = state.currentImageIndex !== -1 
            ? state.uploadedImages[state.currentImageIndex].name.split('.').slice(0, -1).join('.')
            : 'canvas';
        
        a.download = `${currentImageName}_video_${Date.now()}.${extension}`;
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
    const { canvas } = domElements; const { particles } = state; const width = canvas.width; const height = canvas.height;
    if(width === 0 || height === 0) {
        console.warn("Attempted to generate SVG with zero width/height canvas.")
        return '<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg"></svg>'; // Return empty SVG
    }
    let svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svgString += `<rect width="100%" height="100%" fill="${SVG_BACKGROUND_COLOR}"/>`;
    particles.forEach(p => { if (p.currentAlpha > 0) { const size = state.particleSize * p.currentAlpha; if (size <= 0) return;
            const color = `rgb(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)})`; const opacity = p.currentAlpha.toFixed(2);
            const cx = p.x.toFixed(2); const cy = p.y.toFixed(2);
            if (state.particleShape === 'circle') { const radius = (size / 2).toFixed(2); svgString += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" fill-opacity="${opacity}" />`; }
            else if (state.particleShape === 'square') { const halfSize = (size / 2); const xPos = (p.x - halfSize).toFixed(2); const yPos = (p.y - halfSize).toFixed(2); const side = size.toFixed(2); svgString += `<rect x="${xPos}" y="${yPos}" width="${side}" height="${side}" fill="${color}" fill-opacity="${opacity}" />`; }
            else if (state.particleShape === 'character') { 
                const fontSize = (size * 16).toFixed(2); 
                const charToRender = p.assignedCharacter || '★';
                svgString += `<text x="${cx}" y="${cy}" font-family="${state.particleFont}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" fill="${color}" fill-opacity="${opacity}">${charToRender}</text>`; 
            } } });
    svgString += `</svg>`; return svgString;
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
    const deltaTime = (timestamp - state.lastTimestamp) / 1000.0; state.lastTimestamp = timestamp; ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.isReplaying) { drawReplayPath(ctx, deltaTime); } // Updates state.mouse if replaying
    for (let i = 0; i < state.particles.length; i++) { const p = state.particles[i]; p.update(); p.draw(ctx); } // Particles react to state.mouse
    if (state.isRecordingAnimation) { const svgFrame = generateSVGString(); state.recordedFrames.push(svgFrame); // Capture frame if recording
        if(state.recordedFrames.length % 10 === 0 || state.recordedFrames.length === 1) { // Update status more frequently
             const elapsedSeconds = ((performance.now() - state.animationRecordingStartTime) / 1000).toFixed(1);
             const statusMsg = state.isReplaying ? `Recording & Replaying Path...` : `Recording...`; // Adjust status message
             setAnimationRecordingStatus(`${statusMsg} (${elapsedSeconds}/${domElements.recordAnimationDurationInput.value}s) Frames: ${state.recordedFrames.length}`, 'recording'); } }
    // Update video recording status
    if (state.isRecordingVideo) {
        const elapsedSeconds = ((performance.now() - state.videoRecordingStartTime) / 1000).toFixed(1);
        const maxDuration = domElements.videoRecordingDurationInput.value;
        setVideoRecordingStatus(`Recording video... (${elapsedSeconds}/${maxDuration}s)`, 'recording');
    }
    requestAnimationFrame(animate);
}

// --- Event Handlers ---
function handleFileChange(event) { processFiles(event.target.files); event.target.value = null; }
function handleDensityChange(event) { state.particleDensity = parseInt(event.target.value); domElements.densityValueSpan.textContent = state.particleDensity; console.log(`Particle density changed to ${state.particleDensity}. Clearing definitions.`); state.uploadedImages.forEach(imgData => imgData.particleDefinitions = null); if (state.currentImageIndex !== -1) { const currentIndex = state.currentImageIndex; state.currentImageIndex = -1; handleSwitchImage(currentIndex); } }
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
    domElements.characterSettings.style.display = isCharacterShape ? 'block' : 'none';
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
    domElements.recordAnimationBtn.addEventListener('click', startAnimationRecording);
    domElements.recordWithReplayBtn.addEventListener('click', handleRecordWithReplay); // Attach listener for new button
    domElements.downloadRecordingBtn.addEventListener('click', downloadRecordedAnimation);
    domElements.downloadSvgBtn.addEventListener('click', downloadSVG);
    domElements.recordVideoBtn.addEventListener('click', startVideoRecording);
    domElements.downloadVideoBtn.addEventListener('click', downloadRecordedVideo);
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
    domElements.densityValueSpan.textContent = state.particleDensity;
    domElements.radiusValueSpan.textContent = state.mouse.radius;
    domElements.speedValueSpan.textContent = state.mouseEffectSpeedFactor;
    domElements.particleSizeValue.textContent = state.particleSize.toFixed(1);
    domElements.particleCharacterInput.value = state.particleCharacter;
    domElements.particleFontSelect.value = state.particleFont;
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
    domElements.showReplayPathCheckbox.checked = state.showReplayPath;
    updateControlStates();
    setAnimationRecordingStatus('');
    setVideoRecordingStatus('');
    console.log("Initial UI setup complete.");

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

// --- Start ---
// Use DOMContentLoaded to ensure the DOM is fully parsed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // DOM is already loaded, call initialize directly
    initialize();
} 