// Get elements
const canvas = document.getElementById('glitchCanvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.querySelector('.canvas-container');
const imageLoader1 = document.getElementById('imageLoader1');
const imageLoader2 = document.getElementById('imageLoader2');
const tornEdgeCheckbox = document.getElementById('tornEdgeCheckbox');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const recordingStatus = document.getElementById('recordingStatus');

// --- Off-screen Canvas ---
const elementPrepCanvas = document.createElement('canvas');
const elementPrepCtx = elementPrepCanvas.getContext('2d');

// Control elements references...
const speedSlider = document.getElementById('speedSlider');
const jaggedAmpSlider = document.getElementById('jaggedAmpSlider');
const jaggedFreqSlider = document.getElementById('jaggedFreqSlider');
const rotationSlider = document.getElementById('rotationSlider');
const hScrollSpeedSlider1 = document.getElementById('hScrollSpeedSlider1');
const hScrollSpeedSlider2 = document.getElementById('hScrollSpeedSlider2');
const scrollSpeedSlider1 = document.getElementById('scrollSpeedSlider1');
const scrollSpeedSlider2 = document.getElementById('scrollSpeedSlider2');
const blockProbSlider = document.getElementById('blockProbSlider');
const maxBlockHeightSlider = document.getElementById('maxBlockHeightSlider');
const displacementSlider = document.getElementById('displacementSlider');
const sliceGapSlider = document.getElementById('sliceGapSlider');
const gapVariabilitySlider = document.getElementById('gapVariabilitySlider');
const lineProbSlider = document.getElementById('lineProbSlider');
const maxLineWidthSlider = document.getElementById('maxLineWidthSlider');
const vDisplacementSlider = document.getElementById('vDisplacementSlider');
const lineGapSlider = document.getElementById('lineGapSlider');
const lineGapVariabilitySlider = document.getElementById('lineGapVariabilitySlider');

// Background color controls
const backgroundColorPicker = document.getElementById('backgroundColorPicker');
const backgroundPresets = document.getElementById('backgroundPresets');

// --- State Variables ---
let loadedImage1 = null, loadedImage2 = null;
let imageAspectRatio1 = 1, imageAspectRatio2 = 1;
let hScrollSpeed1 = 0, hScrollSpeed2 = 0, scrollXOffset1 = 0, scrollXOffset2 = 0;
let scrollSpeed1 = 0, scrollSpeed2 = 0, scrollYOffset1 = 0, scrollYOffset2 = 0;
let sliceGapBase = 0, gapVariability = 0;
let lineGapBase = 0, lineGapVariability = 0;
let maxRotation = 0, tornEdgeMode = false, jaggednessAmplitude = 4, jaggednessFrequency = 0.05;
let vDisplacementMax = 0;
let targetFps = 10, lineProbability = 0.1, blockProbability = 0.2;
let displacementMax = 20;
let maxBlockHeight = 10, maxLineWidth = 5;
const minBlockHeight = 1;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let canvasStream = null;

// --- Optimized Recording State ---
let recordingSetup = null;
let recordingCanvas = null;
let isOptimizedRecording = false;

// --- Custom Background State ---
let exportBackgroundColor = '#00ff00'; // Default green screen
let useTransparentBackground = false;

// --- Initialize State from HTML ---
// Wait for basic-slider components to load, then initialize values
window.addEventListener('DOMContentLoaded', () => {
    // Give basic-sliders time to initialize
    setTimeout(() => {
        // Helper function to get display value from basic-slider
        function getSliderDisplayValue(slider) {
            const normalizedValue = parseFloat(slider.value);
            const min = parseFloat(slider.getAttribute('min'));
            const max = parseFloat(slider.getAttribute('max'));
            return min + (normalizedValue * (max - min));
        }
        
        hScrollSpeed1 = getSliderDisplayValue(hScrollSpeedSlider1); 
        hScrollSpeed2 = getSliderDisplayValue(hScrollSpeedSlider2);
        scrollSpeed1 = getSliderDisplayValue(scrollSpeedSlider1); 
        scrollSpeed2 = getSliderDisplayValue(scrollSpeedSlider2);
        sliceGapBase = Math.round(getSliderDisplayValue(sliceGapSlider)); 
        gapVariability = getSliderDisplayValue(gapVariabilitySlider);
        lineGapBase = Math.round(getSliderDisplayValue(lineGapSlider)); 
        lineGapVariability = getSliderDisplayValue(lineGapVariabilitySlider);
        maxRotation = Math.round(getSliderDisplayValue(rotationSlider)); 
        tornEdgeMode = tornEdgeCheckbox.checked;
        jaggednessAmplitude = getSliderDisplayValue(jaggedAmpSlider); 
        jaggednessFrequency = getSliderDisplayValue(jaggedFreqSlider);
        vDisplacementMax = Math.round(getSliderDisplayValue(vDisplacementSlider)); 
        targetFps = Math.round(getSliderDisplayValue(speedSlider));
        lineProbability = getSliderDisplayValue(lineProbSlider); 
        blockProbability = getSliderDisplayValue(blockProbSlider);
        displacementMax = Math.round(getSliderDisplayValue(displacementSlider)); 
        maxBlockHeight = Math.round(getSliderDisplayValue(maxBlockHeightSlider));
        maxLineWidth = Math.round(getSliderDisplayValue(maxLineWidthSlider));
        
        fpsInterval = targetFps > 0 ? 1000 / targetFps : Infinity;
    }, 100);
});

// --- Animation Timing Variables ---
let fpsInterval = 1000 / targetFps;
let lastTimestamp = 0;
let timeSinceLastDraw = 0;
let animationFrameId;

// --- Canvas Dimensions ---
let canvasWidth = 100, canvasHeight = 100, drawWidth = 100, drawHeight = 100, drawX = 0, drawY = 0;

// --- Image Loading Function ---
function setupImageLoader(loaderElement, imageTarget) {
  loaderElement.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          if (imageTarget === 1) {
            loadedImage1 = img;
            imageAspectRatio1 = img.width / img.height;
            scrollYOffset1 = 0;
            scrollXOffset1 = 0;
          } else {
            loadedImage2 = img;
            imageAspectRatio2 = img.width / img.height;
            scrollYOffset2 = 0;
            scrollXOffset2 = 0;
          }
          resizeCanvas();
        };
        img.onerror = () => {
          console.error(`Error loading image ${imageTarget}.`);
          alert(`Failed to load image ${imageTarget}.`);
          if (imageTarget === 1) loadedImage1 = null;
          else loadedImage2 = null;
          resizeCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}
setupImageLoader(imageLoader1, 1);
setupImageLoader(imageLoader2, 2);

// --- Auto-load default images ---
function loadDefaultImages() {
  // Load image1.jpeg as Image 1
  loadImageFromPath('../../img-placeholder/1.jpeg', 1);
  // Load image4.jpeg as Image 2 (base image)
  loadImageFromPath('../../img-placeholder/4.jpeg', 2);
}

function loadImageFromPath(imagePath, imageTarget) {
  const img = new Image();
  img.onload = () => {
    if (imageTarget === 1) {
      loadedImage1 = img;
      imageAspectRatio1 = img.width / img.height;
      scrollYOffset1 = 0;
      scrollXOffset1 = 0;
    } else {
      loadedImage2 = img;
      imageAspectRatio2 = img.width / img.height;
      scrollYOffset2 = 0;
      scrollXOffset2 = 0;
    }
    resizeCanvas();
  };
  img.onerror = () => {
    console.error(`Error loading default image ${imageTarget} from ${imagePath}.`);
    if (imageTarget === 1) loadedImage1 = null;
    else loadedImage2 = null;
    resizeCanvas();
  };
  img.src = imagePath;
}

// Load default images when page loads
loadDefaultImages();

// --- Update Functions for Controls ---
// Helper function to get display value from basic-slider
function getSliderDisplayValue(slider) {
    const normalizedValue = parseFloat(slider.value);
    const min = parseFloat(slider.getAttribute('min'));
    const max = parseFloat(slider.getAttribute('max'));
    return min + (normalizedValue * (max - min));
}

tornEdgeCheckbox.onchange = function() { 
  tornEdgeMode = this.checked; 
  const jaggedAmpControl = document.getElementById('jaggedAmpControl');
  const jaggedFreqControl = document.getElementById('jaggedFreqControl');
  if (this.checked) {
    jaggedAmpControl.style.display = 'flex';
    jaggedFreqControl.style.display = 'flex';
  } else {
    jaggedAmpControl.style.display = 'none';
    jaggedFreqControl.style.display = 'none';
  }
}

// Event listeners for basic-sliders use 'change' event
jaggedAmpSlider.addEventListener('change', function(e) { 
    jaggednessAmplitude = e.detail.displayValue; 
});
jaggedFreqSlider.addEventListener('change', function(e) { 
    jaggednessFrequency = e.detail.displayValue; 
});
hScrollSpeedSlider1.addEventListener('change', function(e) { 
    hScrollSpeed1 = e.detail.displayValue; 
});
hScrollSpeedSlider2.addEventListener('change', function(e) { 
    hScrollSpeed2 = e.detail.displayValue; 
});
scrollSpeedSlider1.addEventListener('change', function(e) { 
    scrollSpeed1 = e.detail.displayValue; 
});
scrollSpeedSlider2.addEventListener('change', function(e) { 
    scrollSpeed2 = e.detail.displayValue; 
});
sliceGapSlider.addEventListener('change', function(e) { 
    sliceGapBase = Math.round(e.detail.displayValue); 
});
gapVariabilitySlider.addEventListener('change', function(e) { 
    gapVariability = e.detail.displayValue; 
});
rotationSlider.addEventListener('change', function(e) { 
    maxRotation = Math.round(e.detail.displayValue); 
});
vDisplacementSlider.addEventListener('change', function(e) { 
    vDisplacementMax = Math.round(e.detail.displayValue); 
});
lineGapSlider.addEventListener('change', function(e) { 
    lineGapBase = Math.round(e.detail.displayValue); 
});
lineGapVariabilitySlider.addEventListener('change', function(e) { 
    lineGapVariability = e.detail.displayValue; 
});
speedSlider.addEventListener('change', function(e) { 
    targetFps = Math.round(e.detail.displayValue); 
    fpsInterval = targetFps > 0 ? 1000 / targetFps : Infinity; 
    if (isRecording) { 
        console.warn("Changing FPS during recording may affect video output speed."); 
    } 
});
lineProbSlider.addEventListener('change', function(e) { 
    lineProbability = e.detail.displayValue; 
});
blockProbSlider.addEventListener('change', function(e) { 
    blockProbability = e.detail.displayValue; 
});
displacementSlider.addEventListener('change', function(e) { 
    displacementMax = Math.round(e.detail.displayValue); 
});
maxBlockHeightSlider.addEventListener('change', function(e) { 
    maxBlockHeight = Math.round(e.detail.displayValue); 
});
maxLineWidthSlider.addEventListener('change', function(e) { 
    maxLineWidth = Math.round(e.detail.displayValue); 
});

// Event listeners for background color controls
backgroundColorPicker.addEventListener('change', function(e) {
    exportBackgroundColor = e.target.value;
    backgroundPresets.value = 'custom'; // Add custom option if not exists
    console.log('Export background color changed to:', exportBackgroundColor);
});

backgroundPresets.addEventListener('change', function(e) {
    const value = e.target.value;
    if (value === 'transparent') {
        useTransparentBackground = true;
        exportBackgroundColor = 'transparent';
    } else {
        useTransparentBackground = false;
        exportBackgroundColor = value;
        backgroundColorPicker.value = value;
    }
    console.log('Background preset changed to:', value);
});

// --- Robust Modulo Function ---
function robustModulo(value, modulus) {
  if (modulus === 0 || !isFinite(modulus)) return 0;
  modulus = Math.abs(modulus);
  return ((value % modulus) + modulus) % modulus;
}

// --- Helper Function to Create Jagged Path ---
function createJaggedPath(ctx, x, y, w, h, amplitude, freq) {
  if (freq <= 0) freq = 0.001;
  ctx.beginPath();
  ctx.moveTo(x, y);
  let cX = x, cY = y, s;
  while (cX < x + w) {
    s = Math.min(1 / freq, x + w - cX);
    cX += s;
    ctx.lineTo(cX, y + (Math.random() - 0.5) * 2 * amplitude);
  }
  ctx.lineTo(x + w, y);
  while (cY < y + h) {
    s = Math.min(1 / freq, y + h - cY);
    cY += s;
    ctx.lineTo(x + w + (Math.random() - 0.5) * 2 * amplitude, cY);
  }
  ctx.lineTo(x + w, y + h);
  while (cX > x) {
    s = Math.min(1 / freq, cX - x);
    cX -= s;
    ctx.lineTo(cX, y + h + (Math.random() - 0.5) * 2 * amplitude);
  }
  ctx.lineTo(x, y + h);
  while (cY > y) {
    s = Math.min(1 / freq, cY - y);
    cY -= s;
    ctx.lineTo(x + (Math.random() - 0.5) * 2 * amplitude, cY);
  }
  ctx.lineTo(x, y);
  ctx.closePath();
}

// --- Helper: Draw Tiled Image Section with Manual Wrapping ---
function drawTiledImageSection(targetCtx, sourceImg, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (!sourceImg || sourceImg.width <= 0 || sourceImg.height <= 0 || sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) {
    return;
  }
  const imgW = sourceImg.width;
  const imgH = sourceImg.height;
  sx = robustModulo(sx, imgW);
  sy = robustModulo(sy, imgH);
  targetCtx.save();
  targetCtx.clearRect(dx, dy, dw, dh);
  const scaleX = dw / sw;
  const scaleY = dh / sh;
  let currentSX = sx, currentSY = sy, remainingSW = sw, currentDX = dx;
  while (remainingSW > 0) {
    let segmentW = Math.min(remainingSW, imgW - currentSX);
    let segmentDW = segmentW * scaleX;
    let remainingSH = sh, currentSY_segment = currentSY, currentDY = dy;
    while (remainingSH > 0) {
      let segmentH = Math.min(remainingSH, imgH - currentSY_segment);
      let segmentDH = segmentH * scaleY;
      try {
        targetCtx.drawImage(sourceImg, currentSX, currentSY_segment, segmentW, segmentH, currentDX, currentDY, segmentDW, segmentDH);
      } catch(e) {
        console.warn("Error in drawTiledImageSection drawImage:", e);
      }
      remainingSH -= segmentH;
      currentSY_segment = (currentSY_segment + segmentH) % imgH;
      currentDY += segmentDH;
    }
    remainingSW -= segmentW;
    currentSX = (currentSX + segmentW) % imgW;
    currentDX += segmentDW;
  }
  targetCtx.restore();
}

// --- Glitch Drawing Function ---
function drawGlitchFrame() {
  // Clear canvas and apply background
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Apply custom background when recording (for both optimized and full canvas recording)
  if (isRecording && !useTransparentBackground && exportBackgroundColor !== 'transparent') {
    ctx.fillStyle = exportBackgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  if (!loadedImage1 && !loadedImage2) {
    ctx.fillStyle = "#555";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "16px sans-serif";
    ctx.fillText("Load an image (or two) to begin", canvasWidth / 2, canvasHeight / 2);
    return;
  }
  let currentY = 0;
  while (currentY < drawHeight) {
    const currentMaxSliceHeight = Math.max(minBlockHeight, maxBlockHeight);
    let sliceHeight = Math.random() * (currentMaxSliceHeight - minBlockHeight) + minBlockHeight;
    let effectiveSliceHeight = Math.min(sliceHeight, drawHeight - currentY);
    let gapSize = sliceGapBase;
    if (gapVariability > 0 && Math.abs(sliceGapBase) > 0) {
      gapSize += (Math.random() - 0.5) * 2 * Math.abs(sliceGapBase) * gapVariability;
    }
    if (Math.random() < blockProbability && effectiveSliceHeight >= 1) {
      let sourceImage = loadedImage1 && loadedImage2 ? (Math.random() < 0.5 ? loadedImage1 : loadedImage2) : (loadedImage1 || loadedImage2);
      if (!sourceImage || sourceImage.height <= 0 || sourceImage.width <= 0) continue;
      const displacementX = Math.floor((Math.random() - 0.5) * 2 * displacementMax);
      const destX_final = drawX + displacementX;
      const destY_final = drawY + currentY;
      const destX_center = destX_final + drawWidth / 2;
      const destY_center = destY_final + effectiveSliceHeight / 2;
      const vScrollOffset = (sourceImage === loadedImage1) ? scrollYOffset1 : scrollYOffset2;
      const hScrollOffset = (sourceImage === loadedImage1) ? scrollXOffset1 : scrollXOffset2;
      const baseSourceY = (currentY / drawHeight) * sourceImage.height;
      const scrolledSourceY = baseSourceY + vScrollOffset;
      const finalSourceX = hScrollOffset;
      const finalSourceY = scrolledSourceY;
      const sourceImageSliceHeight = (effectiveSliceHeight / drawHeight) * sourceImage.height;
      const sourceImageSliceWidth = sourceImage.width;
      if (sourceImageSliceHeight > 0 && isFinite(finalSourceY) && isFinite(finalSourceX) && isFinite(sourceImageSliceWidth)) {
        elementPrepCanvas.width = drawWidth;
        elementPrepCanvas.height = effectiveSliceHeight;
        drawTiledImageSection(elementPrepCtx, sourceImage, finalSourceX, finalSourceY, sourceImageSliceWidth, sourceImageSliceHeight, 0, 0, drawWidth, effectiveSliceHeight);
      } else {
        continue;
      }
      ctx.save();
      const angle = (Math.random() - 0.5) * 2 * maxRotation;
      const applyRotation = Math.abs(angle) > 0.1 && maxRotation > 0;
      if (applyRotation) {
        const radAngle = angle * (Math.PI / 180);
        ctx.translate(destX_center, destY_center);
        ctx.rotate(radAngle);
        ctx.translate(-destX_center, -destY_center);
      }
      if (tornEdgeMode) {
        createJaggedPath(ctx, destX_final, destY_final, drawWidth, effectiveSliceHeight, jaggednessAmplitude, jaggednessFrequency);
        ctx.clip();
      }
      ctx.drawImage(elementPrepCanvas, destX_final, destY_final);
      ctx.restore();
    }
    currentY += Math.max(1, effectiveSliceHeight + gapSize);
  }
  let currentX = 0;
  while (currentX < drawWidth) {
    const lineWidth = Math.random() * maxLineWidth + 1;
    const effectiveLineWidth = Math.min(lineWidth, drawWidth - currentX);
    let gapSize = lineGapBase;
    if (lineGapVariability > 0 && Math.abs(lineGapBase) > 0) {
      gapSize += (Math.random() - 0.5) * 2 * Math.abs(lineGapBase) * lineGapVariability;
    }
    if (Math.random() < lineProbability && effectiveLineWidth >= 1) {
      let sourceImage = loadedImage1 && loadedImage2 ? (Math.random() < 0.5 ? loadedImage1 : loadedImage2) : (loadedImage1 || loadedImage2);
      if (!sourceImage || sourceImage.height <= 0 || sourceImage.width <= 0) {
        currentX += Math.max(1, effectiveLineWidth + gapSize);
        continue;
      }
      const displacementY = Math.floor((Math.random() - 0.5) * 2 * vDisplacementMax);
      const destX_final = drawX + currentX;
      const destY_final = drawY + displacementY;
      const destX_center = destX_final + effectiveLineWidth / 2;
      const destY_center = destY_final + drawHeight / 2;
      const vScrollOffset = (sourceImage === loadedImage1) ? scrollYOffset1 : scrollYOffset2;
      const hScrollOffset = (sourceImage === loadedImage1) ? scrollXOffset1 : scrollXOffset2;
      const baseSourceX = (currentX / drawWidth) * sourceImage.width;
      const scrolledSourceX = baseSourceX + hScrollOffset;
      const finalSourceX = scrolledSourceX;
      const finalSourceY = vScrollOffset;
      const sourceImageLineWidth = (effectiveLineWidth / drawWidth) * sourceImage.width;
      const sourceImageLineHeight = sourceImage.height;
      if (sourceImageLineWidth > 0 && isFinite(finalSourceY) && isFinite(finalSourceX) && isFinite(sourceImageLineHeight)) {
        elementPrepCanvas.width = effectiveLineWidth;
        elementPrepCanvas.height = drawHeight;
        drawTiledImageSection(elementPrepCtx, sourceImage, finalSourceX, finalSourceY, sourceImageLineWidth, sourceImageLineHeight, 0, 0, effectiveLineWidth, drawHeight);
      } else {
        currentX += Math.max(1, effectiveLineWidth + gapSize);
        continue;
      }
      ctx.save();
      const angle = (Math.random() - 0.5) * 2 * maxRotation;
      const applyRotation = Math.abs(angle) > 0.1 && maxRotation > 0;
      if (applyRotation) {
        const radAngle = angle * (Math.PI / 180);
        ctx.translate(destX_center, destY_center);
        ctx.rotate(radAngle);
        ctx.translate(-destX_center, -destY_center);
      }
      if (tornEdgeMode) {
        createJaggedPath(ctx, destX_final, destY_final, effectiveLineWidth, drawHeight, jaggednessAmplitude, jaggednessFrequency);
        ctx.clip();
      }
      ctx.drawImage(elementPrepCanvas, destX_final, destY_final);
      ctx.restore();
    }
    currentX += Math.max(1, effectiveLineWidth + gapSize);
  }
  
  // Copy frame to recording canvas if optimized recording is active
  if (isOptimizedRecording && recordingSetup && isRecording) {
    copyFrameToRecordingCanvas(recordingSetup);
  }
}

// --- Animation Loop ---
function animationLoop(timestamp) {
  animationFrameId = requestAnimationFrame(animationLoop);
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  const clampedDeltaTime = Math.min(deltaTime, 0.1);
  if (clampedDeltaTime > 0) {
    if (hScrollSpeed1 !== 0 && loadedImage1) {
      scrollXOffset1 += hScrollSpeed1 * clampedDeltaTime;
    }
    if (hScrollSpeed2 !== 0 && loadedImage2) {
      scrollXOffset2 += hScrollSpeed2 * clampedDeltaTime;
    }
    if (scrollSpeed1 !== 0 && loadedImage1) {
      scrollYOffset1 += scrollSpeed1 * clampedDeltaTime;
    }
    if (scrollSpeed2 !== 0 && loadedImage2) {
      scrollYOffset2 += scrollSpeed2 * clampedDeltaTime;
    }
  }
  timeSinceLastDraw += deltaTime * 1000;
  if (timeSinceLastDraw >= fpsInterval) {
    timeSinceLastDraw = timeSinceLastDraw % fpsInterval;
    drawGlitchFrame();
  }
}

// --- Resize Handler ---
function resizeCanvas() {
  const containerWidth = canvasContainer.clientWidth;
  const containerHeight = canvasContainer.clientHeight;
  const padding = 40;
  const maxWidth = containerWidth - padding;
  const maxHeight = containerHeight - padding;
  if (maxWidth <= 0 || maxHeight <= 0) return;
  canvasWidth = maxWidth;
  canvasHeight = maxHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const primaryImage = loadedImage1 || loadedImage2;
  const primaryAspectRatio = (primaryImage && primaryImage.width > 0 && primaryImage.height > 0) ? primaryImage.width / primaryImage.height : 1;
  if (primaryImage) {
    const canvasAspectRatio = canvasWidth / canvasHeight;
    if (primaryAspectRatio > canvasAspectRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / primaryAspectRatio;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * primaryAspectRatio;
    }
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasWidth;
    drawHeight = canvasHeight;
    drawX = 0;
    drawY = 0;
  }
  if (ctx) {
    drawGlitchFrame();
  }
}
window.addEventListener('resize', resizeCanvas);

// --- Optimized Recording Functions ---
// Calculate the bounds of the current image content
function calculateImageContentBounds() {
    const primaryImage = loadedImage1 || loadedImage2;
    if (!primaryImage) {
        console.warn("No image loaded to calculate bounds for");
        return null;
    }
    
    // Use the global draw variables that are already calculated in resizeCanvas()
    return {
        x: Math.floor(drawX),
        y: Math.floor(drawY),
        width: Math.ceil(drawWidth),
        height: Math.ceil(drawHeight)
    };
}

// Create optimized recording canvas
function createOptimizedRecordingCanvas() {
    // Check if optimized recording checkbox is checked
    const optimizedRecordingCheckbox = document.getElementById('optimizedRecordingCheckbox');
    if (!optimizedRecordingCheckbox || !optimizedRecordingCheckbox.checked) {
        console.log("Optimized recording is disabled, using full canvas");
        return null;
    }

    const bounds = calculateImageContentBounds();
    if (!bounds) {
        console.warn("Could not calculate image bounds for optimized recording");
        return null;
    }
    
    // Add some minimal padding to ensure we don't crop glitch effects at edges
    const extraPadding = 20;
    const recordingWidth = bounds.width + (extraPadding * 2);
    const recordingHeight = bounds.height + (extraPadding * 2);
    
    // Create recording canvas
    const recCanvas = document.createElement('canvas');
    recCanvas.width = recordingWidth;
    recCanvas.height = recordingHeight;
    const recCtx = recCanvas.getContext('2d');
    
    console.log(`Created optimized recording canvas: ${recordingWidth}x${recordingHeight} (vs main canvas ${canvasWidth}x${canvasHeight})`);
    
    return {
        canvas: recCanvas,
        ctx: recCtx,
        bounds: bounds,
        padding: extraPadding
    };
}

// Copy current frame to recording canvas with custom background
function copyFrameToRecordingCanvas(setup) {
    const { canvas: recCanvas, ctx: recCtx, bounds, padding } = setup;
    
    // Clear the recording canvas
    recCtx.clearRect(0, 0, recCanvas.width, recCanvas.height);
    
    // Fill with custom background color if not transparent
    if (!useTransparentBackground && exportBackgroundColor !== 'transparent') {
        recCtx.fillStyle = exportBackgroundColor;
        recCtx.fillRect(0, 0, recCanvas.width, recCanvas.height);
    }
    
    // Set compositing mode for proper alpha blending
    recCtx.globalCompositeOperation = 'source-over';
    
    // Copy the image content area from main canvas to recording canvas
    recCtx.drawImage(
        canvas,
        bounds.x - padding, bounds.y - padding, bounds.width + (padding * 2), bounds.height + (padding * 2), // Source area (with padding)
        0, 0, recCanvas.width, recCanvas.height // Destination area
    );
}

// --- Recording Functions ---
function startRecording() {
  if (isRecording) return;
  if (!window.MediaRecorder) {
    alert('MediaRecorder API not supported in this browser.');
    return;
  }
  const frameRate = targetFps > 0 ? Math.min(targetFps, 60) : 60;
  
  // Create optimized recording setup
  recordingSetup = createOptimizedRecordingCanvas();
  if (!recordingSetup) {
    // Fallback to main canvas if optimization fails
    console.warn("Falling back to main canvas recording");
    recordingCanvas = canvas;
  } else {
    // Use optimized recording canvas
    recordingCanvas = recordingSetup.canvas;
    isOptimizedRecording = true;
  }
  
  // Set transparent background for recording canvas
  if (recordingSetup) {
    // Store original canvas style
    recordingSetup.originalCanvasBackground = canvas.style.backgroundColor;
    recordingSetup.originalCanvasOpacity = canvas.style.backgroundColor;
  }
  
  canvasStream = recordingCanvas.captureStream(frameRate);
  if (!canvasStream) {
    alert('Could not capture canvas stream.');
    return;
  }
  
  // Try H.265 with alpha support first, then fallback to other codecs
  const codecOptions = [
    { 
      mimeType: 'video/mp4; codecs="hev1.1.6.L93.B0"', // H.265 Main Profile
      videoBitsPerSecond: 150000000,
      description: 'H.265 MP4'
    },
    { 
      mimeType: 'video/mp4; codecs="hvc1.1.6.L93.B0"', // H.265 alternative
      videoBitsPerSecond: 150000000,
      description: 'H.265 MP4 (alt)'
    },
    { 
      mimeType: 'video/webm; codecs="vp9"', // VP9 with alpha support
      videoBitsPerSecond: 150000000,
      description: 'WebM VP9 (with alpha)'
    },
    { 
      mimeType: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"', // H.264 fallback
      videoBitsPerSecond: 150000000,
      description: 'H.264 MP4 (no alpha)'
    },
    { 
      mimeType: 'video/mp4', 
      videoBitsPerSecond: 150000000,
      description: 'MP4 (default)'
    },
    { 
      mimeType: 'video/webm', 
      videoBitsPerSecond: 150000000,
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
    selectedCodec = { mimeType: '', videoBitsPerSecond: 150000000, description: 'Browser default' };
  }
  
  console.log(`Using codec: ${selectedCodec.description} (${selectedCodec.mimeType || 'default'})`);
  console.log("Target Bitrate:", selectedCodec.videoBitsPerSecond);
  
  try {
    const options = { 
      mimeType: selectedCodec.mimeType || undefined,
      videoBitsPerSecond: selectedCodec.videoBitsPerSecond
    };
    
    // Remove mimeType if empty to let browser choose
    if (!selectedCodec.mimeType) {
      delete options.mimeType;
    }
    
    mediaRecorder = new MediaRecorder(canvasStream, options);
    recordedChunks = [];
    
    // Store the selected codec info for later use
    mediaRecorder.selectedCodec = selectedCodec;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = downloadVideo;
    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      alert('Error during recording: ' + event.error.name);
      stopRecordingCleanup();
    };
    mediaRecorder.start();
    isRecording = true;
    updateRecordingUI();
  } catch (e) {
    console.error('Error creating MediaRecorder:', e);
    alert('Could not start recording. Check console for details.');
    if (canvasStream) {
      canvasStream.getTracks().forEach(track => track.stop());
      canvasStream = null;
    }
  }
}
function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  mediaRecorder.stop();
}
function stopRecordingCleanup() {
  if (canvasStream) {
    canvasStream.getTracks().forEach(track => track.stop());
    canvasStream = null;
  }
  
  // Clean up recording setup
  recordingSetup = null;
  recordingCanvas = null;
  isOptimizedRecording = false;
  
  mediaRecorder = null;
  isRecording = false;
  updateRecordingUI();
}
function downloadVideo() {
  if (recordedChunks.length === 0) {
    console.warn("No video data recorded.");
    stopRecordingCleanup();
    return;
  }
  const mimeType = recordedChunks[0].type || 'video/mp4';
  const blob = new Blob(recordedChunks, { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  a.href = url;
  
  // Determine file extension and add codec info to filename
  let fileExtension = mimeType.split('/')[1].split(';')[0];
  let codecInfo = '';
  let backgroundInfo = '';
  
  if (mediaRecorder && mediaRecorder.selectedCodec) {
    const codec = mediaRecorder.selectedCodec;
    if (codec.description.includes('H.265')) {
      codecInfo = '_h265';
    } else if (codec.description.includes('VP9')) {
      codecInfo = '_vp9_alpha';
    } else if (codec.description.includes('H.264')) {
      codecInfo = '_h264';
    }
  }
  
  // Add background type to filename
  if (useTransparentBackground || exportBackgroundColor === 'transparent') {
    backgroundInfo = '_transparent';
  } else if (exportBackgroundColor === '#00ff00') {
    backgroundInfo = '_greenscreen';
  } else if (exportBackgroundColor === '#0000ff') {
    backgroundInfo = '_bluescreen';
  } else if (exportBackgroundColor === '#ff00ff') {
    backgroundInfo = '_magentascreen';
  } else if (exportBackgroundColor !== '#000000' && exportBackgroundColor !== '#ffffff') {
    backgroundInfo = '_customscreen';
  }
  
  a.download = `glitch-recording${codecInfo}${backgroundInfo}.${fileExtension}`;
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  recordedChunks = [];
  stopRecordingCleanup();
}
function updateRecordingUI() {
  if (isRecording) {
    startButton.disabled = true;
    stopButton.disabled = false;
    
    const recordingType = recordingSetup ? "optimized" : "full canvas";
    const dimensions = recordingSetup ? 
      `${recordingSetup.canvas.width}x${recordingSetup.canvas.height}` : 
      `${canvasWidth}x${canvasHeight}`;
    
    let codecInfo = '';
    if (mediaRecorder && mediaRecorder.selectedCodec) {
      codecInfo = ` - ${mediaRecorder.selectedCodec.description}`;
    }
    
    let backgroundInfo = '';
    if (useTransparentBackground || exportBackgroundColor === 'transparent') {
      backgroundInfo = ' - Transparent bg';
    } else if (exportBackgroundColor === '#00ff00') {
      backgroundInfo = ' - Green screen';
    } else if (exportBackgroundColor === '#0000ff') {
      backgroundInfo = ' - Blue screen';
    } else if (exportBackgroundColor === '#ff00ff') {
      backgroundInfo = ' - Magenta screen';
    } else {
      backgroundInfo = ` - Custom bg (${exportBackgroundColor})`;
    }
      
    recordingStatus.textContent = `🔴 Recording ${recordingType} (${dimensions})${codecInfo}${backgroundInfo}...`;
  } else {
    startButton.disabled = false;
    stopButton.disabled = true;
    recordingStatus.textContent = '';
  }
}
startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);

// --- Start ---
function startAnimation() {
  lastTimestamp = performance.now();
  timeSinceLastDraw = 0;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationLoop(lastTimestamp);
}
resizeCanvas();
startAnimation(); 