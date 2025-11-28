// Fragments Mode – stand-alone implementation

// ---- DOM Elements ----
const startRecordingBtn = document.getElementById('startRecordingBtn');
const recordingStatus = document.getElementById('recordingStatus');
const recordingDurationInput = document.getElementById('recordingDurationInput');
const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const canvasContainer = document.querySelector('.canvas-container');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const radiusSlider = document.getElementById('radiusSlider');
const intensitySlider = document.getElementById('intensitySlider');
const blockSizeSlider = document.getElementById('blockSizeSlider');

const radiusValueSpan = document.getElementById('radiusValue');
const intensityValueSpan = document.getElementById('intensityValue');
const blockSizeValueSpan = document.getElementById('blockSizeValue');

// Animation toggle
const animationToggle = document.getElementById('animationToggle');

// Mode tabs
const togglePersistentBtn = document.getElementById('togglePersistentBtn');
const hoverModeBtn = document.getElementById('hoverModeBtn');

// Persistent controls
const pointCountSpan = document.getElementById('pointCount');
const clearPointsBtn = document.getElementById('clearPointsBtn');
const saveImageBtn = document.getElementById('saveImageBtn');


// ---- State ----
let originalImageData = null;
let img = new Image();
let tempCanvas = document.createElement('canvas');
let tempCtx = tempCanvas.getContext('2d');

let currentRadius = parseFloat(radiusSlider.value);
let currentIntensity = parseFloat(intensitySlider.value);
let currentBlockSize = parseInt(blockSizeSlider.value);

let isPersistentMode = false;
let isAnimationEnabled = true;
let persistentPoints = [];
let persistentAnimationId = null;





// ---- Event Wiring ----
startRecordingBtn.addEventListener('click', startRecording);
imageLoader.addEventListener('change', handleImage, false);

// Custom slider implementation
function setupCustomSlider(slider, valueSpan, minValue, maxValue, initialValue, valueParser) {
  // Initial setup
  let isDragging = false;
  const min = parseFloat(minValue);
  const max = parseFloat(maxValue);
  const range = max - min;
  const sliderWidth = slider.offsetWidth;
  
  // Initialize value display
  valueSpan.textContent = initialValue;
  slider.value = initialValue;
  
  // Standard input event for keyboard accessibility
  slider.addEventListener('input', function(e) {
    const value = valueParser(e.target.value);
    valueSpan.textContent = value;
    updatePersistent();
  });

  // Mouse event handlers
  slider.addEventListener('mousedown', function(e) {
    e.preventDefault(); // Prevent selection
    isDragging = true;
    this.classList.add('dragging');
    updateSliderPosition(e);
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    updateSliderPosition(e);
  });

  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      slider.classList.remove('dragging');
    }
  });

  // Touch event handlers for mobile
  slider.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent scrolling
    isDragging = true;
    this.classList.add('dragging');
    updateSliderPosition(e.touches[0]);
  }, { passive: false });

  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    updateSliderPosition(e.touches[0]);
  }, { passive: false });

  document.addEventListener('touchend', function() {
    if (isDragging) {
      isDragging = false;
      slider.classList.remove('dragging');
    }
  });

  // Function to update slider position and value
  function updateSliderPosition(e) {
    if (!isDragging) return;
    
    // Get slider dimensions
    const rect = slider.getBoundingClientRect();
    
    // Calculate percentage position (0 to 1)
    let percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    // Calculate value based on percentage
    const rawValue = min + (percentage * range);
    
    // Round value if needed (for integer sliders)
    const value = valueParser(rawValue);
    
    // Update slider position and value
    slider.value = value;
    valueSpan.textContent = value;
    
    // Update app state
    updatePersistent();
  }
}

// Setup each slider with custom handling
setupCustomSlider(radiusSlider, radiusValueSpan, radiusSlider.min, radiusSlider.max, currentRadius, value => {
  currentRadius = Math.round(parseFloat(value));
  return currentRadius;
});

setupCustomSlider(intensitySlider, intensityValueSpan, intensitySlider.min, intensitySlider.max, currentIntensity, value => {
  currentIntensity = Math.round(parseFloat(value));
  return currentIntensity;
});

setupCustomSlider(blockSizeSlider, blockSizeValueSpan, blockSizeSlider.min, blockSizeSlider.max, currentBlockSize, value => {
  currentBlockSize = Math.round(parseFloat(value));
  return currentBlockSize;
});

// Animation toggle functionality
animationToggle.addEventListener('change', function() {
  isAnimationEnabled = this.checked;
  if (!isPersistentMode) {
    // Redraw with/without animation effect immediately
    redrawCanvas();
  }
});

// Mode tab interactions
hoverModeBtn.addEventListener('click', enableHoverMode);
togglePersistentBtn.addEventListener('click', togglePersistentMode);

canvasContainer.addEventListener('mousemove', handleMouseMove);
canvasContainer.addEventListener('mouseleave', handleMouseOut);
canvas.addEventListener('click', handleCanvasClick);

clearPointsBtn.addEventListener('click', clearAllPoints);
saveImageBtn.addEventListener('click', saveCanvasAsImage);




// Init displayed values
radiusValueSpan.textContent = currentRadius;
intensityValueSpan.textContent = currentIntensity;
blockSizeValueSpan.textContent = currentBlockSize;

// ---- Image Handling ----

function handleImage(e) {
  originalImageData = null;
  persistentPoints = [];
  updatePointCount();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 1;
  canvas.height = 1;

  const reader = new FileReader();
  reader.onload = (event) => {
    img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      try {
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.error('Error getting image data', err);
      }
    };
    img.onerror = () => {
      console.error('Error loading the default image');
    };
    img.src = event.target.result;
  };
  if (e.target.files && e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
}

// Load default placeholder image
window.addEventListener('load', function() {
  img = new Image();
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    try {
      originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error('Error getting image data', err);
    }
  };
  img.onerror = () => {
    console.error('Error loading the default image');
  };
  img.src = '../../img-placeholder/12.jpeg';
});

// ---- Canvas Interaction ----
function handleMouseMove(e) {
  if (!originalImageData || isPersistentMode) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  applyDistortion(x, y, currentIntensity);
}

function handleMouseOut() {
  if (!originalImageData || isPersistentMode) return;
  redrawCanvas();
}

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

// ---- Persistent helpers ----
function updatePointCount() {
  pointCountSpan.textContent = persistentPoints.length;
}

function clearAllPoints() {
  persistentPoints = [];
  updatePointCount();
  stopPersistentAnimation();
  if (originalImageData) ctx.putImageData(originalImageData, 0, 0);
}

function enableHoverMode() {
  if (isPersistentMode) {
    isPersistentMode = false;
    updateModeTabs();
    canvas.classList.remove('persistent-mode');
    if (originalImageData) ctx.putImageData(originalImageData, 0, 0);
  }
}

function togglePersistentMode() {
  isPersistentMode = !isPersistentMode;
  updateModeTabs();
  canvas.classList.toggle('persistent-mode', isPersistentMode);
  
  if (!isPersistentMode) {
    // Switch to hover mode
    stopPersistentAnimation();
    if (originalImageData) ctx.putImageData(originalImageData, 0, 0);
  } else if (persistentPoints.length > 0) {
    // Activate persistent points
    startPersistentAnimation();
  }
}

function updateModeTabs() {
  // Update the active tab
  hoverModeBtn.classList.toggle('active', !isPersistentMode);
  togglePersistentBtn.classList.toggle('active', isPersistentMode);
}

function updatePersistent() {
  if (isPersistentMode && persistentPoints.length) startPersistentAnimation();
}

function startPersistentAnimation() {
  stopPersistentAnimation();
  if (!isPersistentMode || !originalImageData) return;

  redrawCanvas();
}
function stopPersistentAnimation() {
  if (persistentAnimationId) cancelAnimationFrame(persistentAnimationId);
  persistentAnimationId = null;
}
function drawPointIndicators() {
  ctx.fillStyle = 'rgba(0,0,255,0.6)';
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
    persistentPoints.forEach((p) => applyDistortion(p.x, p.y, currentIntensity));
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
    redrawCanvas();
  }
}

// ---- Fragment Distortion Logic ----
function redrawCanvas() {
  if (!originalImageData) return;

  if (isPersistentMode && persistentPoints.length > 0) {
    ctx.putImageData(originalImageData, 0, 0);
    persistentPoints.forEach((p) => applyDistortion(p.x, p.y, currentIntensity));
  } else {
    ctx.putImageData(originalImageData, 0, 0);
  }

  if (isPersistentMode && persistentPoints.length > 0) {
    drawPointIndicators();
  }
}

function applyDistortion(effectX, effectY, intensity) {
  if (!originalImageData) return;
  const width = canvas.width;
  const height = canvas.height;
  
  const sourceImageData = isPersistentMode 
    ? ctx.getImageData(0, 0, width, height)
    : originalImageData;

  const output = ctx.createImageData(width, height);
  const outData = output.data;
  const srcData = sourceImageData.data;
  outData.set(srcData);

  const radius = currentRadius;
  const radiusSq = radius * radius;
  const blockSize = currentBlockSize;
  if (blockSize < 1) return;

  const startX = Math.max(0, Math.floor(effectX - radius));
  const endX = Math.min(width, Math.ceil(effectX + radius));
  const startY = Math.max(0, Math.floor(effectY - radius));
  const endY = Math.min(height, Math.ceil(effectY + radius));

  for (let y = startY; y < endY; y += blockSize) {
    for (let x = startX; x < endX; x += blockSize) {
      const centerX = x + blockSize / 2;
      const centerY = y + blockSize / 2;
      const dx = centerX - effectX;
      const dy = centerY - effectY;
      const distSq = dx * dx + dy * dy;
      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        const strength = 1 - dist / radius;

        let offsetX, offsetY;
        if (isPersistentMode) {
          // Static distortion for persistent points
          offsetX = Math.floor(strength * (Math.sin(x * 0.1) * intensity * 2));
          offsetY = Math.floor(strength * (Math.cos(y * 0.1) * intensity * 2));
        } else {
          // Wobble effect for mouse hover - only animate if enabled
          if (isAnimationEnabled) {
            offsetX = Math.floor(strength * (Math.sin(Date.now() * 0.002 + x * 0.1) * intensity * 2));
            offsetY = Math.floor(strength * (Math.cos(Date.now() * 0.002 + y * 0.1) * intensity * 2));
          } else {
            offsetX = Math.floor(strength * (Math.sin(x * 0.1) * intensity * 2));
            offsetY = Math.floor(strength * (Math.cos(y * 0.1) * intensity * 2));
          }
        }

        const srcX = Math.max(0, Math.min(width - blockSize, x + offsetX));
        const srcY = Math.max(0, Math.min(height - blockSize, y + offsetY));
        copyBlock(srcData, outData, width, height, srcX, srcY, x, y, blockSize);
      }
    }
  }
  ctx.putImageData(output, 0, 0);
}

// ---- Recording Logic ----
let mediaRecorder;
let recordedChunks = [];
let selectedMimeType = '';

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

    let countdown = 3;
    recordingStatus.textContent = `Recording starts in ${countdown}...`;
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            recordingStatus.textContent = `Recording starts in ${countdown}...`;
        } else {
            clearInterval(countdownInterval);
            recordingStatus.textContent = 'Status: Recording...';
            
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
                a.download = 'canvas-recording.mp4';
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

function copyBlock(src, dest, width, height, sx, sy, dx, dy, block) {
  // First copy the original pixels
  for (let y = 0; y < block; y++) {
    for (let x = 0; x < block; x++) {
      const srcIndex = ((sy + y) * width + (sx + x)) * 4;
      const destIndex = ((dy + y) * width + (dx + x)) * 4;
      dest[destIndex] = src[srcIndex];
      dest[destIndex + 1] = src[srcIndex + 1];
      dest[destIndex + 2] = src[srcIndex + 2];
      dest[destIndex + 3] = src[srcIndex + 3];
      

    }
  }
}
