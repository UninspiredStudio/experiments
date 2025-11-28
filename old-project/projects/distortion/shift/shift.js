// Shift Mode – Stand-alone implementation
// Only the logic needed for the “shift” distortion.

// DOM Elements
const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const canvasContainer = document.querySelector('.canvas-container');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const radiusSlider = document.getElementById('radiusSlider');
const intensitySlider = document.getElementById('intensitySlider');
const fragmentationSlider = document.getElementById('fragmentationSlider');
const brightnessInfluenceSlider = document.getElementById('brightnessInfluenceSlider');

const radiusValueSpan = document.getElementById('radiusValue');
const intensityValueSpan = document.getElementById('intensityValue');
const fragmentationValueSpan = document.getElementById('fragmentationValue');
const brightnessInfluenceValueSpan = document.getElementById('brightnessInfluenceValue');

const dirHorizontalBtn = document.getElementById('dirHorizontalBtn');
const dirVerticalBtn = document.getElementById('dirVerticalBtn');
const dirRadialBtn = document.getElementById('dirRadialBtn');

const pixelDeleteEnabled = document.getElementById('pixelDeleteEnabled');
const pixelDeleteThresholdContainer = document.getElementById('pixelDeleteThresholdContainer');
const pixelDeleteThresholdSlider = document.getElementById('pixelDeleteThresholdSlider');
const pixelDeleteThresholdValueSpan = document.getElementById('pixelDeleteThresholdValue');

const brightnessInfluenceDeleteEnabled = document.getElementById('brightnessInfluenceDeleteEnabled');
const brightnessInfluenceDeleteThresholdContainer = document.getElementById('brightnessInfluenceDeleteThresholdContainer');
const brightnessInfluenceDeleteThresholdSlider = document.getElementById('brightnessInfluenceDeleteThresholdSlider');
const brightnessInfluenceDeleteThresholdValueSpan = document.getElementById('brightnessInfluenceDeleteThresholdValue');

// Persistent point controls
const pointCountSpan = document.getElementById('pointCount');
const clearPointsBtn = document.getElementById('clearPointsBtn');
const togglePersistentBtn = document.getElementById('togglePersistentBtn');

// Actions
const saveImageBtn = document.getElementById('saveImageBtn');

// Recording controls
const startRecordingBtn = document.getElementById('startRecordingBtn');
const recordingStatus = document.getElementById('recordingStatus');
const recordingDurationInput = document.getElementById('recordingDurationInput');
const recordingCountdown = document.getElementById('recordingCountdown');
const countdownText = document.getElementById('countdownText');

// State Variables
let originalImageData = null;
let img = new Image();

let currentRadius = parseFloat(radiusSlider.value);
let currentIntensity = parseFloat(intensitySlider.value);
let currentFragmentation = parseFloat(fragmentationSlider.value);
let currentBrightnessInfluence = parseFloat(brightnessInfluenceSlider.value);
let currentShiftDirection = 'horizontal';

let isPixelDeleteEnabled = false;
let currentPixelDeleteThreshold = 0.5;
let isBrightnessInfluenceDeleteEnabled = false;
let currentBrightnessInfluenceDeleteThreshold = 10;

let isPersistentMode = false;
let persistentPoints = [];
let persistentAnimationId = null;
let currentMousePosition = null;

// Recording state
let mediaRecorder;
let recordedChunks = [];
let selectedMimeType = '';

// ---- Event Wiring ----
startRecordingBtn.addEventListener('click', startRecording);
imageLoader.addEventListener('change', handleImage, false);

radiusSlider.addEventListener('input', (e) => {
  currentRadius = parseFloat(e.target.value);
  radiusValueSpan.textContent = currentRadius;
  updatePersistent();
});
intensitySlider.addEventListener('input', (e) => {
  currentIntensity = parseFloat(e.target.value);
  intensityValueSpan.textContent = currentIntensity;
  updatePersistent();
});
fragmentationSlider.addEventListener('input', (e) => {
  currentFragmentation = parseFloat(e.target.value);
  fragmentationValueSpan.textContent = currentFragmentation;
  updatePersistent();
});
brightnessInfluenceSlider.addEventListener('input', (e) => {
  currentBrightnessInfluence = parseFloat(e.target.value);
  brightnessInfluenceValueSpan.textContent = currentBrightnessInfluence.toFixed(2);
  updatePersistent();
});

// Direction buttons
function setShiftDirection(dir) {
  currentShiftDirection = dir;
  dirHorizontalBtn.classList.toggle('active', dir === 'horizontal');
  dirVerticalBtn.classList.toggle('active', dir === 'vertical');
  dirRadialBtn.classList.toggle('active', dir === 'radial');
  updatePersistent();
}

dirHorizontalBtn.addEventListener('click', () => setShiftDirection('horizontal'));
dirVerticalBtn.addEventListener('click', () => setShiftDirection('vertical'));
dirRadialBtn.addEventListener('click', () => setShiftDirection('radial'));

// Pixel deletion controls
pixelDeleteEnabled.addEventListener('change', (e) => {
  isPixelDeleteEnabled = e.target.checked;
  pixelDeleteThresholdContainer.classList.toggle('hidden', !isPixelDeleteEnabled);
  updatePersistent();
});
pixelDeleteThresholdSlider.addEventListener('input', (e) => {
  currentPixelDeleteThreshold = parseFloat(e.target.value);
  pixelDeleteThresholdValueSpan.textContent = currentPixelDeleteThreshold.toFixed(2);
  updatePersistent();
});

// Brightness influence deletion controls
brightnessInfluenceDeleteEnabled.addEventListener('change', (e) => {
  isBrightnessInfluenceDeleteEnabled = e.target.checked;
  brightnessInfluenceDeleteThresholdContainer.classList.toggle('hidden', !isBrightnessInfluenceDeleteEnabled);
  updatePersistent();
});
brightnessInfluenceDeleteThresholdSlider.addEventListener('input', (e) => {
  currentBrightnessInfluenceDeleteThreshold = parseFloat(e.target.value);
  brightnessInfluenceDeleteThresholdValueSpan.textContent = currentBrightnessInfluenceDeleteThreshold.toFixed(0);
  updatePersistent();
});

// Canvas interactions
canvasContainer.addEventListener('mousemove', handleMouseMove);
canvasContainer.addEventListener('mouseleave', handleMouseOut);
canvas.addEventListener('click', handleCanvasClick);

clearPointsBtn.addEventListener('click', clearAllPoints);
togglePersistentBtn.addEventListener('click', togglePersistentMode);
saveImageBtn.addEventListener('click', saveCanvasAsImage);

// Init displayed slider values
radiusValueSpan.textContent = currentRadius;
intensityValueSpan.textContent = currentIntensity;
fragmentationValueSpan.textContent = currentFragmentation;
brightnessInfluenceValueSpan.textContent = currentBrightnessInfluence.toFixed(2);

// ---- Image Handling ----
function handleImage(e) {
  stopPersistentAnimation();
  originalImageData = null;
  persistentPoints = [];
  updatePointCount();
  currentMousePosition = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 1;
  canvas.height = 1;

  const reader = new FileReader();
  reader.onload = function (event) {
    img = new Image();
    img.onload = function () {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error('Error getting image data:', error);
        originalImageData = null;
      }
    };
    img.src = event.target.result;
  };
  if (e.target.files && e.target.files[0]) {
    reader.readAsDataURL(e.target.files[0]);
  }
}

// ---- Canvas Interaction Helpers ----
function handleMouseMove(e) {
  if (!originalImageData || isPersistentMode) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  applyDistortion(x, y);
}

function handleMouseOut() {
  if (!originalImageData || isPersistentMode) return;
  ctx.putImageData(originalImageData, 0, 0);
}

// ---- Persistent Points ----
function handleCanvasClick(e) {
  if (!originalImageData || !isPersistentMode) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  persistentPoints.push({ x, y });
  updatePointCount();
  startPersistentAnimation();
}

function updatePointCount() {
  pointCountSpan.textContent = persistentPoints.length;
}

function clearAllPoints() {
  persistentPoints = [];
  updatePointCount();
  stopPersistentAnimation();
  if (originalImageData) ctx.putImageData(originalImageData, 0, 0);
}

function togglePersistentMode() {
  isPersistentMode = !isPersistentMode;
  togglePersistentBtn.textContent = isPersistentMode ? 'Disable Persistent Mode' : 'Enable Persistent Mode';
  canvas.classList.toggle('persistent-mode', isPersistentMode);
  if (!isPersistentMode) {
    stopPersistentAnimation();
    if (originalImageData) ctx.putImageData(originalImageData, 0, 0);
  } else if (persistentPoints.length > 0) {
    startPersistentAnimation();
  }
}

function updatePersistent() {
  if (isPersistentMode && persistentPoints.length > 0) {
    startPersistentAnimation();
  }
}

// ---- Distortion Logic ----
function applyDistortion(effectX, effectY) {
  if (!originalImageData) return;

  const width = canvas.width;
  const height = canvas.height;
  const distortedImageData = ctx.createImageData(width, height);
  const data = distortedImageData.data;
  const originalData = originalImageData.data;

  const radius = currentRadius;
  const radiusSq = radius * radius;
  data.set(originalData);

  const startX = Math.max(0, Math.floor(effectX - radius));
  const endX = Math.min(width, Math.ceil(effectX + radius));
  const startY = Math.max(0, Math.floor(effectY - radius));
  const endY = Math.min(height, Math.ceil(effectY + radius));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const index = (y * width + x) * 4;
      const dx = x - effectX;
      const dy = y - effectY;
      const distSq = dx * dx + dy * dy;
      if (distSq < radiusSq && distSq > 0) {
        const distance = Math.sqrt(distSq);
        const strength = 1 - distance / radius;

        const rOrig = originalData[index];
        const gOrig = originalData[index + 1];
        const bOrig = originalData[index + 2];
        const brightness = (rOrig + gOrig + bOrig) / (3 * 255);

        // Brightness influence component
        const brightnessComp = strength * (brightness - 0.5) * currentIntensity * 2;
        const brightnessInfluenceOffset = Math.abs(brightnessComp * currentBrightnessInfluence);

        // Pixel deletion checks
        if (isPixelDeleteEnabled && brightness < currentPixelDeleteThreshold) {
          data[index + 3] = 0; // make transparent
          continue;
        }
        if (isBrightnessInfluenceDeleteEnabled && brightnessInfluenceOffset > currentBrightnessInfluenceDeleteThreshold) {
          data[index + 3] = 0;
          continue;
        }

        // Random component for fragmentation style
        const randomComp = strength * (Math.random() - 0.5) * currentFragmentation * 2;
        const totalOffset = brightnessComp * currentBrightnessInfluence + randomComp;
        let srcX = x;
        let srcY = y;
        if (currentShiftDirection === 'horizontal') srcX = x + totalOffset;
        else if (currentShiftDirection === 'vertical') srcY = y + totalOffset;
        else if (currentShiftDirection === 'radial') {
          const norm = distance === 0 ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance };
          srcX = x + norm.x * totalOffset;
          srcY = y + norm.y * totalOffset;
        }
        srcX = Math.max(0, Math.min(width - 1, Math.floor(srcX)));
        srcY = Math.max(0, Math.min(height - 1, Math.floor(srcY)));
        const srcIdx = (srcY * width + srcX) * 4;
        data[index] = originalData[srcIdx];
        data[index + 1] = originalData[srcIdx + 1];
        data[index + 2] = originalData[srcIdx + 2];
        data[index + 3] = originalData[srcIdx + 3];
      }
    }
  }
  ctx.putImageData(distortedImageData, 0, 0);
}

// Persistent animation loop
function startPersistentAnimation() {
  stopPersistentAnimation();
  function loop() {
    if (!isPersistentMode) return;
    ctx.putImageData(originalImageData, 0, 0);
    persistentPoints.forEach((p) => applyDistortion(p.x, p.y));
    drawPointIndicators();
    persistentAnimationId = requestAnimationFrame(loop);
  }
  loop();
}
function stopPersistentAnimation() {
  if (persistentAnimationId) cancelAnimationFrame(persistentAnimationId);
  persistentAnimationId = null;
}

function drawPointIndicators() {
  ctx.fillStyle = 'rgba(255,0,0,0.6)';
  persistentPoints.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function saveCanvasAsImage() {
  if (!originalImageData) {
    alert('Please upload an image first.');
    return;
  }

  // If in persistent mode, redraw without the indicators for a clean export
  if (isPersistentMode && persistentPoints.length > 0) {
    ctx.putImageData(originalImageData, 0, 0);
    persistentPoints.forEach((p) => applyDistortion(p.x, p.y));
  }

  const link = document.createElement('a');
  link.download = 'distorted-image.png';
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // If we removed the indicators, draw them back on the canvas for the user
  if (isPersistentMode && persistentPoints.length > 0) {
    drawPointIndicators();
  } else {
    // Redraw the canvas to its current state
    if (currentMousePosition && !isPersistentMode) {
      applyDistortion(currentMousePosition.x, currentMousePosition.y);
    } else {
      ctx.putImageData(originalImageData, 0, 0);
    }
  }
}

// ---- Recording Logic ----
function getSupportedMimeType() {
    const codecs = [
        'video/mp4; codecs="avc1.42E01E"', // H.264 Baseline Profile
        'video/mp4; codecs="hvc1.1.6.L93.B0"', // HEVC/H.265 Main Profile
        'video/mp4; codecs="hev1.1.6.L93.B0"', // HEVC/H.265 Main Profile (alternative)
        'video/webm; codecs="vp9, opus"',
        'video/webm; codecs="vp8, opus"',
        'video/mp4' // Generic fallback
    ];

    for (const codec of codecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
            return codec;
        }
    }
    return null; // No supported codec found
}

function startRecording() {
    if (!('MediaRecorder' in window)) {
        alert('MediaRecorder not supported in this browser.');
        return;
    }

    selectedMimeType = getSupportedMimeType();
    if (!selectedMimeType) {
        alert('No supported video format found for recording.');
        return;
    }

    startRecordingBtn.disabled = true;

    // Show countdown display
    recordingCountdown.classList.remove('hidden');
    
    let countdown = 3;
    recordingStatus.textContent = `Recording starts in ${countdown}...`;
    countdownText.textContent = `Recording starts in ${countdown}...`;
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            recordingStatus.textContent = `Recording starts in ${countdown}...`;
            countdownText.textContent = `Recording starts in ${countdown}...`;
        } else {
            clearInterval(countdownInterval);
            recordingStatus.textContent = 'Status: Recording...';
            countdownText.textContent = 'Recording in progress...';
            
            // Hide countdown after a brief moment
            setTimeout(() => {
                recordingCountdown.classList.add('hidden');
            }, 1000);
            
            const stream = canvas.captureStream(60); // 60 FPS
            recordedChunks = [];

            try {
                mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
            } catch (e) {
                console.error('Exception while creating MediaRecorder:', e);
                alert(`Error creating MediaRecorder: ${e.message}`);
                startRecordingBtn.disabled = false;
                return;
            }

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, {
                    type: selectedMimeType
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.style = 'display: none';
                a.href = url;
                a.download = 'shift-recording.mp4';
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                recordedChunks = [];
                recordingStatus.textContent = 'Status: Idle';
                startRecordingBtn.disabled = false;
            };

            mediaRecorder.start();

            const duration = parseInt(recordingDurationInput.value, 10) * 1000;
            setTimeout(() => {
                stopRecording();
            }, duration);
        }
    }, 1000);
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        recordingStatus.textContent = 'Status: Processing...';
    }
}
