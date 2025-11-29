import { querySliceUiElements } from './ui/elements'
import { createSliceRecorder } from './recording'
import { createJaggedPath, drawTiledImageSection } from './utils/geometry'

// Get elements
const {
	canvas,
	canvasContainer,
	imageLoader1,
	imageLoader2,
	tornEdgeCheckbox,
	startButton,
	stopButton,
	recordingStatus,
	freezeSlicesCheckbox,
	randomizeButton,
	backgroundColorPicker,
	backgroundPresets,
	optimizedRecordingCheckbox,
	speedSlider,
	jaggedAmpSlider,
	jaggedFreqSlider,
	rotationSlider,
	hScrollSpeedSlider1,
	hScrollSpeedSlider2,
	scrollSpeedSlider1,
	scrollSpeedSlider2,
	blockProbSlider,
	maxBlockHeightSlider,
	displacementSlider,
	sliceGapSlider,
	gapVariabilitySlider,
	lineProbSlider,
	maxLineWidthSlider,
	vDisplacementSlider,
	lineGapSlider,
	lineGapVariabilitySlider,
	jaggedAmpControl,
	jaggedFreqControl,
} = querySliceUiElements()

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// --- Off-screen Canvas ---
const elementPrepCanvas = document.createElement('canvas');
const elementPrepCtx = elementPrepCanvas.getContext('2d') as CanvasRenderingContext2D;

interface FrozenHorizontalSlice {
  y: number;
  height: number;
  sourceImage: 1 | 2;
  displacementX: number;
  angle: number;
  gapSize: number;
}

interface FrozenVerticalSlice {
  x: number;
  width: number;
  sourceImage: 1 | 2;
  displacementY: number;
  angle: number;
  gapSize: number;
}

type SliderWithValue = HTMLElement & { value?: string | null };

interface SliderChangeDetail {
  displayValue: number;
}

type SliderChangeEvent = CustomEvent<SliderChangeDetail>;

// --- State Variables ---
let loadedImage1: HTMLImageElement | null = null;
let loadedImage2: HTMLImageElement | null = null;
let _imageAspectRatio1 = 1,
  _imageAspectRatio2 = 1;
let hScrollSpeed1 = 0,
  hScrollSpeed2 = 0,
  scrollXOffset1 = 0,
  scrollXOffset2 = 0;
let scrollSpeed1 = 0,
  scrollSpeed2 = 0,
  scrollYOffset1 = 0,
  scrollYOffset2 = 0;
let sliceGapBase = 0,
  gapVariability = 0;
let lineGapBase = 0,
  lineGapVariability = 0;
let maxRotation = 0,
  tornEdgeMode = false,
  jaggednessAmplitude = 4,
  jaggednessFrequency = 0.05;
let vDisplacementMax = 0;
let targetFps = 10,
  lineProbability = 0.1,
  blockProbability = 0.2;
let displacementMax = 20;
let maxBlockHeight = 10,
  maxLineWidth = 5;
const minBlockHeight = 1;

// --- Custom Background State ---
let exportBackgroundColor = '#00ff00'; // Default green screen
let useTransparentBackground = false;

// --- Freeze Slices State ---
let freezeSlicesMode = false;
let frozenHorizontalSlices: FrozenHorizontalSlice[] = [];
let frozenVerticalSlices: FrozenVerticalSlice[] = [];

// --- Initialize State from HTML ---
// Wait for basic-slider components to load, then initialize values
window.addEventListener('DOMContentLoaded', () => {
  // Give basic-sliders time to initialize
  setTimeout(() => {
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
  }, 100);
});

// --- Animation Timing Variables ---
let fpsInterval = 1000 / targetFps;
let lastTimestamp = 0;
let timeSinceLastDraw = 0;
let animationFrameId: number | null = null;

// --- Canvas Dimensions ---
let canvasWidth = 100,
  canvasHeight = 100,
  drawWidth = 100,
  drawHeight = 100,
  drawX = 0,
  drawY = 0;

// --- Recording Integration ---
const recorder = createSliceRecorder({
  canvas,
  startButton,
  stopButton,
  recordingStatus,
  optimizedRecordingCheckbox,
  getTargetFps: () => targetFps,
  getCanvasSize: () => ({ width: canvasWidth, height: canvasHeight }),
  getImageContentBounds: calculateImageContentBounds,
  getBackgroundConfig: () => ({ exportBackgroundColor, useTransparentBackground }),
});

// --- Image Loading Function ---
function setupImageLoader(loaderElement: HTMLInputElement, imageTarget: 1 | 2): void {
  loaderElement.addEventListener('change', (event) => {
    const target = event.currentTarget as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result !== 'string') {
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (imageTarget === 1) {
          loadedImage1 = img;
          _imageAspectRatio1 = img.width / img.height;
          scrollYOffset1 = 0;
          scrollXOffset1 = 0;
        } else {
          loadedImage2 = img;
          _imageAspectRatio2 = img.width / img.height;
          scrollYOffset2 = 0;
          scrollXOffset2 = 0;
        }
        resizeCanvas();
      };
      img.onerror = () => {
        console.error(`Error loading image ${imageTarget}.`);
        alert(`Failed to load image ${imageTarget}.`);
        if (imageTarget === 1) {
          loadedImage1 = null;
        } else {
          loadedImage2 = null;
        }
        resizeCanvas();
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
setupImageLoader(imageLoader1, 1);
setupImageLoader(imageLoader2, 2);

// --- Auto-load default images ---
function loadDefaultImages(): void {
  // Load image1.jpeg as Image 1
  loadImageFromPath('../../img-placeholder/1.jpeg', 1);
  // Load image4.jpeg as Image 2 (base image)
  loadImageFromPath('../../img-placeholder/4.jpeg', 2);
}

function loadImageFromPath(imagePath: string, imageTarget: 1 | 2): void {
  const img = new Image();
  img.onload = () => {
    if (imageTarget === 1) {
      loadedImage1 = img;
      _imageAspectRatio1 = img.width / img.height;
      scrollYOffset1 = 0;
      scrollXOffset1 = 0;
    } else {
      loadedImage2 = img;
      _imageAspectRatio2 = img.width / img.height;
      scrollYOffset2 = 0;
      scrollXOffset2 = 0;
    }
    resizeCanvas();
  };
  img.onerror = () => {
    console.error(`Error loading default image ${imageTarget} from ${imagePath}.`);
    if (imageTarget === 1) {
      loadedImage1 = null;
    } else {
      loadedImage2 = null;
    }
    resizeCanvas();
  };
  img.src = imagePath;
}

// Load default images when page loads
loadDefaultImages();

// --- Update Functions for Controls ---
// Helper function to get display value from basic-slider
function getSliderDisplayValue(slider: HTMLElement): number {
  const sliderWithValue = slider as SliderWithValue;
  const value = sliderWithValue.value ?? '0';
  const normalizedValue = Number.parseFloat(value);
  const minAttr = sliderWithValue.getAttribute('min');
  const maxAttr = sliderWithValue.getAttribute('max');
  const min = minAttr === null ? 0 : Number.parseFloat(minAttr);
  const max = maxAttr === null ? 1 : Number.parseFloat(maxAttr);
  return min + normalizedValue * (max - min);
}

tornEdgeCheckbox.addEventListener('change', (event) => {
  const target = event.currentTarget as HTMLInputElement | null;
  if (!target) {
    return;
  }
  tornEdgeMode = target.checked;
  if (target.checked) {
    jaggedAmpControl.style.display = 'flex';
    jaggedFreqControl.style.display = 'flex';
  } else {
    jaggedAmpControl.style.display = 'none';
    jaggedFreqControl.style.display = 'none';
  }
});

// Event listeners for basic-sliders use 'change' event
jaggedAmpSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  jaggednessAmplitude = detail.displayValue;
});
jaggedFreqSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  jaggednessFrequency = detail.displayValue;
});
hScrollSpeedSlider1.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  hScrollSpeed1 = detail.displayValue;
});
hScrollSpeedSlider2.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  hScrollSpeed2 = detail.displayValue;
});
scrollSpeedSlider1.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  scrollSpeed1 = detail.displayValue;
});
scrollSpeedSlider2.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  scrollSpeed2 = detail.displayValue;
});
sliceGapSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  sliceGapBase = Math.round(detail.displayValue);
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
gapVariabilitySlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  gapVariability = detail.displayValue;
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
rotationSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  maxRotation = Math.round(detail.displayValue);
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
vDisplacementSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  vDisplacementMax = Math.round(detail.displayValue);
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
lineGapSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  lineGapBase = Math.round(detail.displayValue);
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
lineGapVariabilitySlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  lineGapVariability = detail.displayValue;
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
speedSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  targetFps = Math.round(detail.displayValue);
  fpsInterval = targetFps > 0 ? 1000 / targetFps : Infinity;
  if (recorder.isRecordingActive()) {
    console.warn("Changing FPS during recording may affect video output speed.");
  }
});
lineProbSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  lineProbability = detail.displayValue;
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
blockProbSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  blockProbability = detail.displayValue;
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
displacementSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  displacementMax = Math.round(detail.displayValue);
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
maxBlockHeightSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  maxBlockHeight = Math.round(detail.displayValue);
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});
maxLineWidthSlider.addEventListener('change', (event) => {
  const { detail } = event as SliderChangeEvent;
  maxLineWidth = Math.round(detail.displayValue);
  // Regenerate frozen slices if freeze mode is enabled
  if (freezeSlicesMode) {
    generateFrozenSlices();
  }
});

// Event listener for freeze slices toggle
freezeSlicesCheckbox.addEventListener('change', (event) => {
  const target = event.currentTarget as HTMLInputElement | null;
  if (!target) {
    return;
  }
  freezeSlicesMode = target.checked;
  if (freezeSlicesMode) {
    // Capture current slice configuration
    generateFrozenSlices();
    console.log('Slices frozen with', frozenHorizontalSlices.length, 'horizontal slices and', frozenVerticalSlices.length, 'vertical slices');
  } else {
    // Clear frozen slices to return to random generation
    frozenHorizontalSlices = [];
    frozenVerticalSlices = [];
    console.log('Slices unfrozen - returning to random generation');
  }
});

// Event listeners for background color controls
backgroundColorPicker.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }
  exportBackgroundColor = target.value;
  backgroundPresets.value = 'custom'; // Add custom option if not exists
  console.log('Export background color changed to:', exportBackgroundColor);
});

backgroundPresets.addEventListener('change', (event) => {
  const target = event.target as HTMLSelectElement | null;
  if (!target) {
    return;
  }
  const value = target.value;
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

// (geometry helpers moved to src/projects/slice/utils/geometry.ts)

// --- Generate Frozen Slices Function ---
function generateFrozenSlices() {
  frozenHorizontalSlices = [];
  frozenVerticalSlices = [];

  // Generate frozen horizontal slices with current settings
  let currentY = 0;
  while (currentY < drawHeight) {
    const currentMaxSliceHeight = Math.max(minBlockHeight, maxBlockHeight);
    const sliceHeight = Math.random() * (currentMaxSliceHeight - minBlockHeight) + minBlockHeight;
    const effectiveSliceHeight = Math.min(sliceHeight, drawHeight - currentY);

    let gapSize = sliceGapBase;
    if (gapVariability > 0 && Math.abs(sliceGapBase) > 0) {
      gapSize += (Math.random() - 0.5) * 2 * Math.abs(sliceGapBase) * gapVariability;
    }

    if (Math.random() < blockProbability && effectiveSliceHeight >= 1) {
      const sourceImageChoice = loadedImage1 && loadedImage2 ? (Math.random() < 0.5 ? 1 : 2) : (loadedImage1 ? 1 : 2);
      const displacementX = Math.floor((Math.random() - 0.5) * 2 * displacementMax);
      const angle = (Math.random() - 0.5) * 2 * maxRotation;

      frozenHorizontalSlices.push({
        y: currentY,
        height: effectiveSliceHeight,
        sourceImage: sourceImageChoice,
        displacementX: displacementX,
        angle: angle,
        gapSize: gapSize
      });
    }

    currentY += Math.max(1, effectiveSliceHeight + gapSize);
  }

  // Generate frozen vertical slices with current settings
  let currentX = 0;
  while (currentX < drawWidth) {
    const lineWidth = Math.random() * maxLineWidth + 1;
    const effectiveLineWidth = Math.min(lineWidth, drawWidth - currentX);

    let gapSize = lineGapBase;
    if (lineGapVariability > 0 && Math.abs(lineGapBase) > 0) {
      gapSize += (Math.random() - 0.5) * 2 * Math.abs(lineGapBase) * lineGapVariability;
    }

    if (Math.random() < lineProbability && effectiveLineWidth >= 1) {
      const sourceImageChoice = loadedImage1 && loadedImage2 ? (Math.random() < 0.5 ? 1 : 2) : (loadedImage1 ? 1 : 2);
      const displacementY = Math.floor((Math.random() - 0.5) * 2 * vDisplacementMax);
      const angle = (Math.random() - 0.5) * 2 * maxRotation;

      frozenVerticalSlices.push({
        x: currentX,
        width: effectiveLineWidth,
        sourceImage: sourceImageChoice,
        displacementY: displacementY,
        angle: angle,
        gapSize: gapSize
      });
    }

    currentX += Math.max(1, effectiveLineWidth + gapSize);
  }
}

// --- Glitch Drawing Function ---
function drawGlitchFrame() {
  // Clear canvas and apply background
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Apply custom background when recording (for both optimized and full canvas recording)
  if (recorder.isRecordingActive() && !useTransparentBackground && exportBackgroundColor !== 'transparent') {
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
  // Draw horizontal slices - use frozen slices if freeze mode is enabled
  if (freezeSlicesMode && frozenHorizontalSlices.length > 0) {
    // Use frozen slices with their stored settings
    for (const slice of frozenHorizontalSlices) {
      const sourceImage = slice.sourceImage === 1 ? loadedImage1 : loadedImage2;
      if (!sourceImage || sourceImage.height <= 0 || sourceImage.width <= 0) { continue; }

      const destX_final = drawX + slice.displacementX;
      const destY_final = drawY + slice.y;
      const destX_center = destX_final + drawWidth / 2;
      const destY_center = destY_final + slice.height / 2;
      const vScrollOffset = (sourceImage === loadedImage1) ? scrollYOffset1 : scrollYOffset2;
      const hScrollOffset = (sourceImage === loadedImage1) ? scrollXOffset1 : scrollXOffset2;
      const baseSourceY = (slice.y / drawHeight) * sourceImage.height;
      const scrolledSourceY = baseSourceY + vScrollOffset;
      const finalSourceX = hScrollOffset;
      const finalSourceY = scrolledSourceY;
      const sourceImageSliceHeight = (slice.height / drawHeight) * sourceImage.height;
      const sourceImageSliceWidth = sourceImage.width;

      if (sourceImageSliceHeight > 0 && isFinite(finalSourceY) && isFinite(finalSourceX) && isFinite(sourceImageSliceWidth)) {
        elementPrepCanvas.width = drawWidth;
        elementPrepCanvas.height = slice.height;
        drawTiledImageSection(elementPrepCtx, sourceImage, finalSourceX, finalSourceY, sourceImageSliceWidth, sourceImageSliceHeight, 0, 0, drawWidth, slice.height);
      } else {
        continue;
      }

      ctx.save();
      const applyRotation = Math.abs(slice.angle) > 0.1 && maxRotation > 0;
      if (applyRotation) {
        const radAngle = slice.angle * (Math.PI / 180);
        ctx.translate(destX_center, destY_center);
        ctx.rotate(radAngle);
        ctx.translate(-destX_center, -destY_center);
      }
      if (tornEdgeMode) {
        createJaggedPath(ctx, destX_final, destY_final, drawWidth, slice.height, jaggednessAmplitude, jaggednessFrequency);
        ctx.clip();
      }
      ctx.drawImage(elementPrepCanvas, destX_final, destY_final);
      ctx.restore();
    }
  } else {
    // Use original random generation
    let currentY = 0;
    while (currentY < drawHeight) {
      const currentMaxSliceHeight = Math.max(minBlockHeight, maxBlockHeight);
      const sliceHeight = Math.random() * (currentMaxSliceHeight - minBlockHeight) + minBlockHeight;
      const effectiveSliceHeight = Math.min(sliceHeight, drawHeight - currentY);
      let gapSize = sliceGapBase;
      if (gapVariability > 0 && Math.abs(sliceGapBase) > 0) {
        gapSize += (Math.random() - 0.5) * 2 * Math.abs(sliceGapBase) * gapVariability;
      }
      if (Math.random() < blockProbability && effectiveSliceHeight >= 1) {
        const sourceImage = loadedImage1 && loadedImage2 ? (Math.random() < 0.5 ? loadedImage1 : loadedImage2) : (loadedImage1 || loadedImage2);
        if (!sourceImage || sourceImage.height <= 0 || sourceImage.width <= 0) { continue; }
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
  }
  // Draw vertical slices - use frozen slices if freeze mode is enabled
  if (freezeSlicesMode && frozenVerticalSlices.length > 0) {
    // Use frozen slices with their stored settings
    for (const slice of frozenVerticalSlices) {
      const sourceImage = slice.sourceImage === 1 ? loadedImage1 : loadedImage2;
      if (!sourceImage || sourceImage.height <= 0 || sourceImage.width <= 0) { continue; }

      const destX_final = drawX + slice.x;
      const destY_final = drawY + slice.displacementY;
      const destX_center = destX_final + slice.width / 2;
      const destY_center = destY_final + drawHeight / 2;
      const vScrollOffset = (sourceImage === loadedImage1) ? scrollYOffset1 : scrollYOffset2;
      const hScrollOffset = (sourceImage === loadedImage1) ? scrollXOffset1 : scrollXOffset2;
      const baseSourceX = (slice.x / drawWidth) * sourceImage.width;
      const scrolledSourceX = baseSourceX + hScrollOffset;
      const finalSourceX = scrolledSourceX;
      const finalSourceY = vScrollOffset;
      const sourceImageLineWidth = (slice.width / drawWidth) * sourceImage.width;
      const sourceImageLineHeight = sourceImage.height;

      if (sourceImageLineWidth > 0 && isFinite(finalSourceY) && isFinite(finalSourceX) && isFinite(sourceImageLineHeight)) {
        elementPrepCanvas.width = slice.width;
        elementPrepCanvas.height = drawHeight;
        drawTiledImageSection(elementPrepCtx, sourceImage, finalSourceX, finalSourceY, sourceImageLineWidth, sourceImageLineHeight, 0, 0, slice.width, drawHeight);
      } else {
        continue;
      }

      ctx.save();
      const applyRotation = Math.abs(slice.angle) > 0.1 && maxRotation > 0;
      if (applyRotation) {
        const radAngle = slice.angle * (Math.PI / 180);
        ctx.translate(destX_center, destY_center);
        ctx.rotate(radAngle);
        ctx.translate(-destX_center, -destY_center);
      }
      if (tornEdgeMode) {
        createJaggedPath(ctx, destX_final, destY_final, slice.width, drawHeight, jaggednessAmplitude, jaggednessFrequency);
        ctx.clip();
      }
      ctx.drawImage(elementPrepCanvas, destX_final, destY_final);
      ctx.restore();
    }
  } else {
    // Use original random generation
    let currentX = 0;
    while (currentX < drawWidth) {
      const lineWidth = Math.random() * maxLineWidth + 1;
      const effectiveLineWidth = Math.min(lineWidth, drawWidth - currentX);
      let gapSize = lineGapBase;
      if (lineGapVariability > 0 && Math.abs(lineGapBase) > 0) {
        gapSize += (Math.random() - 0.5) * 2 * Math.abs(lineGapBase) * lineGapVariability;
      }
      if (Math.random() < lineProbability && effectiveLineWidth >= 1) {
        const sourceImage = loadedImage1 && loadedImage2 ? (Math.random() < 0.5 ? loadedImage1 : loadedImage2) : (loadedImage1 || loadedImage2);
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
  }

  // Copy frame to recording canvas if optimized recording is active
  recorder.handleFrame();
}

// --- Animation Loop ---
function animationLoop(timestamp: number): void {
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
function resizeCanvas(): void {
  const containerWidth = canvasContainer.clientWidth;
  const containerHeight = canvasContainer.clientHeight;
  const padding = 40;
  const maxWidth = containerWidth - padding;
  const maxHeight = containerHeight - padding;
  if (maxWidth <= 0 || maxHeight <= 0) {
    return;
  }
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
    // If freeze mode is enabled, regenerate frozen slices with new dimensions
    if (freezeSlicesMode) {
      generateFrozenSlices();
    }
    drawGlitchFrame();
  }
}
window.addEventListener('resize', resizeCanvas);

// --- Optimized Recording Functions ---
// Calculate the bounds of the current image content
function calculateImageContentBounds(): { x: number; y: number; width: number; height: number } | null {
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
    height: Math.ceil(drawHeight),
  };
}

// Randomize sliders function
function randomizeSliders() {
    // Array of all sliders that should be randomized
    const sliders = [
        speedSlider, jaggedAmpSlider, jaggedFreqSlider, rotationSlider,
        hScrollSpeedSlider1, hScrollSpeedSlider2, scrollSpeedSlider1, scrollSpeedSlider2,
        blockProbSlider, maxBlockHeightSlider, displacementSlider,
        sliceGapSlider, gapVariabilitySlider, lineProbSlider, maxLineWidthSlider,
        vDisplacementSlider, lineGapSlider, lineGapVariabilitySlider
    ] as HTMLElement[];

    // Randomize each slider
    sliders.forEach((slider: HTMLElement) => {
        const randomValue = Math.random();
        slider.setAttribute('value', randomValue.toString());

        // Trigger the change event to update the internal state
        const changeEvent = new CustomEvent<SliderChangeDetail>('change', {
            detail: { displayValue: getSliderDisplayValue(slider) }
        });
        slider.dispatchEvent(changeEvent);
    });

    // Regenerate frozen slices if freeze mode is enabled
    if (freezeSlicesMode) {
        generateFrozenSlices();
    }
}

// Add event listener for randomize button
randomizeButton.addEventListener('click', randomizeSliders);

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