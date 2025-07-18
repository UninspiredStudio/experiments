// Displacement Mode – stand-alone implementation

// ---- DOM Elements ----
const recordBtn = document.getElementById('recordBtn');
const durationInput = document.getElementById('durationInput');
const imageLoader = document.getElementById('imageLoader');
const displacementLoader = document.getElementById('displacementLoader');
const canvas = document.getElementById('imageCanvas');
const canvasContainer = document.querySelector('.canvas-container');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const radiusSlider = document.getElementById('radiusSlider');
const intensitySlider = document.getElementById('intensitySlider');
const displacementScaleSlider = document.getElementById('displacementScaleSlider');

const radiusValueSpan = document.getElementById('radiusValue');
const intensityValueSpan = document.getElementById('intensityValue');
const displacementScaleValueSpan = document.getElementById('displacementScaleValue');

const dispDirHorizontalBtn = document.getElementById('dispDirHorizontalBtn');
const dispDirVerticalBtn = document.getElementById('dispDirVerticalBtn');
const dispDirBothBtn = document.getElementById('dispDirBothBtn');
const dispDirRadialBtn = document.getElementById('dispDirRadialBtn');

// Persistent controls
const pointCountSpan = document.getElementById('pointCount');
const clearPointsBtn = document.getElementById('clearPointsBtn');
const togglePersistentBtn = document.getElementById('togglePersistentBtn');

// ---- State ----
let originalImageData = null;
let displacementImageData = null;
let img = new Image();
let displacementImg = new Image();

let currentRadius = parseFloat(radiusSlider.value);
let currentIntensity = parseFloat(intensitySlider.value);
let currentDisplacementScale = parseFloat(displacementScaleSlider.value);
let currentDisplacementDirection = 'horizontal';

let isPersistentMode = false;
let persistentPoints = [];
let persistentAnimationId = null;

// ---- Event Wiring ----
recordBtn.addEventListener('click', () => {
  // Prevent starting a new recording if one is already in progress
  if (recordBtn.classList.contains('recording') || recordBtn.classList.contains('processing')) {
    return;
  }
  startRecording();
});

imageLoader.addEventListener('change', handleImage, false);
displacementLoader.addEventListener('change', handleDisplacementImage, false);

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
displacementScaleSlider.addEventListener('input', (e) => {
  currentDisplacementScale = parseFloat(e.target.value);
  displacementScaleValueSpan.textContent = currentDisplacementScale.toFixed(1);
  updatePersistent();
});

function setDispDirection(dir) {
  currentDisplacementDirection = dir;
  dispDirHorizontalBtn.classList.toggle('active', dir === 'horizontal');
  dispDirVerticalBtn.classList.toggle('active', dir === 'vertical');
  dispDirBothBtn.classList.toggle('active', dir === 'both');
  dispDirRadialBtn.classList.toggle('active', dir === 'radial');
  updatePersistent();
}

dispDirHorizontalBtn.addEventListener('click', () => setDispDirection('horizontal'));
dispDirVerticalBtn.addEventListener('click', () => setDispDirection('vertical'));
dispDirBothBtn.addEventListener('click', () => setDispDirection('both'));
dispDirRadialBtn.addEventListener('click', () => setDispDirection('radial'));

canvasContainer.addEventListener('mousemove', handleMouseMove);
canvasContainer.addEventListener('mouseleave', handleMouseOut);
canvas.addEventListener('click', handleCanvasClick);

clearPointsBtn.addEventListener('click', clearAllPoints);
togglePersistentBtn.addEventListener('click', togglePersistentMode);

// Init displayed values
radiusValueSpan.textContent = currentRadius;
intensityValueSpan.textContent = currentIntensity;
displacementScaleValueSpan.textContent = currentDisplacementScale.toFixed(1);

// ---- Image Handling ----
function handleImage(e) {
  originalImageData = null;
  persistentPoints = [];
  updatePointCount();
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
    img.src = event.target.result;
  };
  if (e.target.files && e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
}

function handleDisplacementImage(e) {
  displacementImageData = null;
  const reader = new FileReader();
  reader.onload = (event) => {
    displacementImg = new Image();
    displacementImg.onload = () => {
      const tmp = document.createElement('canvas');
      const tctx = tmp.getContext('2d');
      tmp.width = displacementImg.naturalWidth;
      tmp.height = displacementImg.naturalHeight;
      tctx.drawImage(displacementImg, 0, 0);
      try {
        displacementImageData = tctx.getImageData(0, 0, tmp.width, tmp.height);
      } catch (err) {
        console.error('Error getting displacement map', err);
      }
    };
    displacementImg.src = event.target.result;
  };
  if (e.target.files && e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
}

// ---- Canvas Interaction ----
function handleMouseMove(e) {
  if (!originalImageData || !displacementImageData || isPersistentMode) return;
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

function handleCanvasClick(e) {
  if (!originalImageData || !displacementImageData || !isPersistentMode) return;
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
function togglePersistentMode() {
  isPersistentMode = !isPersistentMode;
  togglePersistentBtn.textContent = isPersistentMode ? 'Disable Persistent Mode' : 'Enable Persistent Mode';
  canvas.classList.toggle('persistent-mode', isPersistentMode);
  if (!isPersistentMode) {
    stopPersistentAnimation();
    if (originalImageData) ctx.putImageData(originalImageData, 0, 0);
  } else if (persistentPoints.length) {
    startPersistentAnimation();
  }
}
function updatePersistent() {
  if (isPersistentMode && persistentPoints.length) startPersistentAnimation();
}
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
  ctx.fillStyle = 'rgba(0,255,0,0.6)';
  persistentPoints.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---- Displacement Distortion Logic ----
// ---- Recording Logic ----
let mediaRecorder;
let recordedChunks = [];
let ffmpeg;

// Initialize FFmpeg
async function initFFmpeg() {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = createFFmpeg({
    log: false,
    corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
  });
  
  await ffmpeg.load();
  return ffmpeg;
}

// Create a processing indicator element
function createProcessingIndicator(message) {
  const indicator = document.createElement('div');
  indicator.className = 'processing-indicator';
  indicator.innerHTML = `
    <div class="message">${message}</div>
    <div class="progress">
      <div class="progress-bar"></div>
    </div>
  `;
  document.body.appendChild(indicator);
  return indicator;
}

// Update the progress bar
function updateProgress(indicator, progress) {
  if (!indicator) return;
  const progressBar = indicator.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.style.width = `${Math.round(progress * 100)}%`;
  }
}

function startRecording() {
  const duration = parseInt(durationInput.value, 10) * 1000; // in ms
  if (isNaN(duration) || duration <= 0) {
    alert('Please enter a valid duration.');
    return;
  }

  // Visual feedback
  recordBtn.textContent = 'Countdown...';
  recordBtn.classList.add('recording');
  recordBtn.disabled = true;
  canvas.classList.add('recording-active');

  // Save the current canvas state before showing countdown
  const savedCanvasState = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Start countdown
  startCountdown(3, () => {
    // Restore the canvas state after countdown
    ctx.putImageData(savedCanvasState, 0, 0);

    // Update button text
    recordBtn.textContent = 'Recording in Progress...';

    // Now start actual recording - add recording-started class to hide cursor
    canvas.classList.add('recording-started');
    
    const stream = canvas.captureStream(60); // 60 FPS
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm; codecs=vp9', // Use webm with vp9 for quality
    });

    recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordBtn.textContent = 'Processing...';
      recordBtn.classList.remove('recording');
      recordBtn.classList.add('processing');

      // Use a short timeout to allow the UI to update before processing
      setTimeout(async () => {
        const webmBlob = new Blob(recordedChunks, {
          type: 'video/webm',
        });
        
        // Convert WebM to MP4 using FFmpeg.js
        try {
          await convertToMp4(webmBlob);
        } catch (error) {
          console.error('Conversion failed:', error);
          alert('Failed to convert video. Downloading WebM instead.');
          downloadVideo(webmBlob, 'canvas-recording.webm');
        }

        // Reset button state
        recordBtn.textContent = 'Record Canvas';
        recordBtn.classList.remove('processing');
        recordBtn.disabled = false;
        canvas.classList.remove('recording-active');
        canvas.classList.remove('recording-started');
      }, 50);
    };

    mediaRecorder.start();

    // Stop recording after the specified duration
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, duration);
  });
}

// Function to display countdown on canvas
function startCountdown(count, callback) {
  // Save original canvas content
  const originalContent = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  function showNumber(num) {
    // Restore original canvas content underneath
    ctx.putImageData(originalContent, 0, 0);
    
    // Set style for countdown text
    ctx.fillStyle = 'rgba(255,255,255,0.8)';  // Semi-transparent white
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';      // Semi-transparent black outline
    ctx.lineWidth = 8;                        // Thick outline
    
    // Calculate font size based on canvas dimensions - make it prominent
    const fontSize = Math.min(canvas.width, canvas.height) / 4;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Position text in the center of the canvas
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    // Draw text with outline for better visibility on any background
    ctx.strokeText(num, x, y);
    ctx.fillText(num, x, y);
  }
  
  // Show initial number
  showNumber(count);
  
  // Loop through countdown
  const interval = setInterval(() => {
    count--;
    
    if (count >= 0) {
      showNumber(count);
    } else {
      clearInterval(interval);
      callback(); // Countdown complete
    }
  }, 1000); // Update every second
}

function downloadVideo(blob, filename = 'canvas-recording.mp4') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// WebM to MP4 conversion using FFmpeg.js
async function convertToMp4(webmBlob) {
  // Create and show processing indicator
  const indicator = createProcessingIndicator('Converting WebM to MP4...');
  
  try {
    // Initialize FFmpeg
    const ffmpeg = await initFFmpeg();
    
    // Update progress to 10%
    updateProgress(indicator, 0.1);
    
    // Read the WebM blob into an ArrayBuffer
    const arrayBuffer = await webmBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Update progress to 30%
    updateProgress(indicator, 0.3);
    
    // Write the buffer to FFmpeg's file system
    ffmpeg.FS('writeFile', 'input.webm', uint8Array);
    
    // Update progress to 50%
    updateProgress(indicator, 0.5);
    
    // Run FFmpeg command to convert WebM to MP4
    // Using high quality settings for the conversion
    await ffmpeg.run(
      '-i', 'input.webm',
      '-c:v', 'libx264',    // H.264 codec for video
      '-preset', 'medium',  // Balance between encoding speed and compression
      '-crf', '23',         // Constant Rate Factor - lower is higher quality (18-28 is good range)
      '-pix_fmt', 'yuv420p', // Pixel format for better compatibility
      'output.mp4'
    );
    
    // Update progress to 80%
    updateProgress(indicator, 0.8);
    
    // Read the output file from FFmpeg's file system
    const outputData = ffmpeg.FS('readFile', 'output.mp4');
    
    // Update progress to 100%
    updateProgress(indicator, 1.0);
    
    // Create a blob from the output data
    const mp4Blob = new Blob([outputData.buffer], { type: 'video/mp4' });
    
    // Download the MP4 file
    downloadVideo(mp4Blob);
    
    // Clean up FFmpeg file system
    ffmpeg.FS('unlink', 'input.webm');
    ffmpeg.FS('unlink', 'output.mp4');
    
    // Remove the processing indicator
    document.body.removeChild(indicator);
    
    return true;
  } catch (error) {
    // Remove the processing indicator in case of error
    if (indicator && indicator.parentNode) {
      document.body.removeChild(indicator);
    }
    throw error;
  }
}

// ---- Displacement Distortion Logic ----
function applyDistortion(effectX, effectY) {
  if (!originalImageData || !displacementImageData) return;
  const width = canvas.width;
  const height = canvas.height;
  const output = ctx.createImageData(width, height);
  const outData = output.data;
  const srcData = originalImageData.data;
  outData.set(srcData);

  const radius = currentRadius;
  const radiusSq = radius * radius;

  const dispWidth = displacementImageData.width;
  const dispHeight = displacementImageData.height;
  const dispData = displacementImageData.data;

  const startX = Math.max(0, Math.floor(effectX - radius));
  const endX = Math.min(width, Math.ceil(effectX + radius));
  const startY = Math.max(0, Math.floor(effectY - radius));
  const endY = Math.min(height, Math.ceil(effectY + radius));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - effectX;
      const dy = y - effectY;
      const distSq = dx * dx + dy * dy;
      if (distSq < radiusSq && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const strength = 1 - dist / radius;

        // Sample displacement map in UV space
        const u = Math.floor((x / width) * dispWidth);
        const v = Math.floor((y / height) * dispHeight);
        const dispIdx = (v * dispWidth + u) * 4;
        const displacement = dispData[dispIdx] / 255;
        const dispAmt = (displacement - 0.5) * currentIntensity * currentDisplacementScale * strength;

        let offX = 0;
        let offY = 0;
        if (currentDisplacementDirection === 'horizontal') {
          offX = dispAmt;
        } else if (currentDisplacementDirection === 'vertical') {
          offY = dispAmt;
        } else if (currentDisplacementDirection === 'both') {
          offX = dispAmt;
          offY = dispAmt;
        } else if (currentDisplacementDirection === 'radial') {
          const normX = dx / dist;
          const normY = dy / dist;
          offX = normX * dispAmt;
          offY = normY * dispAmt;
        }

        const srcX = Math.max(0, Math.min(width - 1, Math.floor(x + offX)));
        const srcY = Math.max(0, Math.min(height - 1, Math.floor(y + offY)));
        const srcIndex = (srcY * width + srcX) * 4;
        outData[idx] = srcData[srcIndex];
        outData[idx + 1] = srcData[srcIndex + 1];
        outData[idx + 2] = srcData[srcIndex + 2];
        outData[idx + 3] = srcData[srcIndex + 3];
      }
    }
  }
  ctx.putImageData(output, 0, 0);
}
