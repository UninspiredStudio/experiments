"use client";

import React from "react";
import { ControlSection, ExperimentShell, LabeledSlider } from "@/components/shared";
import { Button, Switch } from "@/ui";
import { createFragmentsEffect, type FragmentsEffect, type FragmentsParams } from "@projects/distortion/effects/fragments";
import { coordsFromMouse, loadImageFromFile } from "@projects/distortion/core/image-loader";

const DEFAULT_IMAGE = "/img-placeholder/1.jpeg";

const DEFAULTS: FragmentsParams = {
  radius: 220,
  intensity: 30,
  blockSize: 28,
  isPersistentMode: false,
  isAnimationEnabled: true,
};

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function FragmentsControls({
  radius,
  setRadius,
  intensity,
  setIntensity,
  blockSize,
  setBlockSize,
  isAnimationEnabled,
  setAnimationEnabled,
  isPersistentMode,
  togglePersistentMode,
  pointCount,
  onUpload,
  onClear,
  onReset,
  onRandomize,
  loadingImage,
}: {
  radius: number;
  setRadius: (value: number) => void;
  intensity: number;
  setIntensity: (value: number) => void;
  blockSize: number;
  setBlockSize: (value: number) => void;
  isAnimationEnabled: boolean;
  setAnimationEnabled: (value: boolean) => void;
  isPersistentMode: boolean;
  togglePersistentMode: () => void;
  pointCount: number;
  onUpload: () => void;
  onClear: () => void;
  onReset: () => void;
  onRandomize: () => void;
  loadingImage: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="small" variant="brand-secondary" onClick={onUpload} disabled={loadingImage}>
          Upload image
        </Button>
        <Button size="small" variant="neutral-secondary" onClick={onRandomize}>
          Randomize
        </Button>
        <Button size="small" variant="neutral-tertiary" onClick={onReset}>
          Reset defaults
        </Button>
      </div>

      <LabeledSlider
        label="Radius"
        value={radius}
        min={40}
        max={1200}
        step={10}
        formatValue={(val) => `${Math.round(val)}px`}
        onChange={(val) => setRadius(val)}
      />

      <LabeledSlider
        label="Intensity"
        value={intensity}
        min={1}
        max={120}
        step={1}
        formatValue={(val) => Math.round(val).toString()}
        onChange={(val) => setIntensity(val)}
      />

      <LabeledSlider
        label="Block size"
        value={blockSize}
        min={2}
        max={120}
        step={1}
        formatValue={(val) => `${Math.round(val)}px`}
        onChange={(val) => setBlockSize(val)}
      />

      <ControlSection
        title="Behavior"
        description="Drive hover-based distortion or lock-in points for repeatable effects."
        spacing="tight"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Hover animation</span>
          <Switch checked={isAnimationEnabled} onCheckedChange={(checked) => setAnimationEnabled(Boolean(checked))} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Persistent mode</span>
          <Switch checked={isPersistentMode} onCheckedChange={togglePersistentMode} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-subtext-color">Persistent points</span>
          <span className="text-caption-bold font-caption-bold text-default-font">{pointCount}</span>
        </div>
        <div className="flex gap-2">
          <Button size="small" variant="neutral-secondary" onClick={onClear}>
            Clear points
          </Button>
        </div>
      </ControlSection>

      <ControlSection tone="card" spacing="tight">
        <p className="text-caption text-subtext-color">
          Hover to distort the image. Enable persistent mode to place points with clicks and build up a multi-point
          collage.
        </p>
      </ControlSection>
    </div>
  );
}

function FragmentsCanvas({
  canvasRef,
  onPointerMove,
  onPointerLeave,
  onCanvasClick,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerMove: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onPointerLeave: () => void;
  onCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-caption text-subtext-color">
        Move the cursor to nudge fragments. Click to drop persistent points when that mode is enabled.
      </p>
      <canvas
        ref={canvasRef}
        className="max-w-full rounded-md border border-neutral-border bg-black"
        onMouseMove={onPointerMove}
        onMouseLeave={onPointerLeave}
        onClick={onCanvasClick}
      />
    </div>
  );
}

export default function FragmentsPage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const effectRef = React.useRef<FragmentsEffect | null>(null);
  const originalImageDataRef = React.useRef<ImageData | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const pointsRef = React.useRef<Point[]>([]);
  const settingsRef = React.useRef<FragmentsParams>({ ...DEFAULTS });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [radius, setRadius] = React.useState(DEFAULTS.radius);
  const [intensity, setIntensity] = React.useState(DEFAULTS.intensity);
  const [blockSize, setBlockSize] = React.useState(DEFAULTS.blockSize);
  const [isAnimationEnabled, setAnimationEnabled] = React.useState(DEFAULTS.isAnimationEnabled);
  const [isPersistentMode, setPersistentMode] = React.useState(DEFAULTS.isPersistentMode);
  const [pointCount, setPointCount] = React.useState(0);
  const [loadingImage, setLoadingImage] = React.useState(false);

  const updateSettings = React.useCallback(
    (next: Partial<FragmentsParams>) => {
      settingsRef.current = { ...settingsRef.current, ...next };
    },
    [],
  );

  const redrawCanvas = React.useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const original = originalImageDataRef.current;
    if (!ctx || !canvas || !original) { return; }

    ctx.putImageData(original, 0, 0);
    if (isPersistentMode && pointsRef.current.length > 0) {
      pointsRef.current.forEach((point) => {
        effectRef.current?.apply(point.x, point.y);
      });
      // Draw point indicators for clarity.
      ctx.fillStyle = "rgba(0,0,255,0.6)";
      pointsRef.current.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [isPersistentMode]);

  const sizeCanvasToContainer = React.useCallback(
    (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) { return; }
      const width = container?.clientWidth ?? img.naturalWidth;
      const scale = width / img.naturalWidth;
      const height = Math.max(400, Math.round(img.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      try {
        originalImageDataRef.current = ctx.getImageData(0, 0, width, height);
      } catch {
        originalImageDataRef.current = null;
      }
      redrawCanvas();
    },
    [redrawCanvas],
  );

  const applyImage = React.useCallback((img: HTMLImageElement, _name?: string) => {
    imageRef.current = img;
    sizeCanvasToContainer(img);
  }, [sizeCanvasToContainer]);

  const resetControls = React.useCallback(() => {
    setRadius(DEFAULTS.radius);
    setIntensity(DEFAULTS.intensity);
    setBlockSize(DEFAULTS.blockSize);
    setAnimationEnabled(DEFAULTS.isAnimationEnabled);
    setPersistentMode(DEFAULTS.isPersistentMode);
    pointsRef.current = [];
    setPointCount(0);
    updateSettings({ ...DEFAULTS });
    redrawCanvas();
  }, [redrawCanvas, updateSettings]);

  const randomize = React.useCallback(() => {
    const nextRadius = clamp(Math.round(120 + Math.random() * 600), 80, 900);
    const nextIntensity = clamp(Math.round(10 + Math.random() * 80), 5, 120);
    const nextBlockSize = clamp(Math.round(4 + Math.random() * 80), 2, 120);
    const nextAnimation = Math.random() > 0.4;

    setRadius(nextRadius);
    setIntensity(nextIntensity);
    setBlockSize(nextBlockSize);
    setAnimationEnabled(nextAnimation);
    updateSettings({
      radius: nextRadius,
      intensity: nextIntensity,
      blockSize: nextBlockSize,
      isAnimationEnabled: nextAnimation,
    });
    if (isPersistentMode) {
      redrawCanvas();
    }
  }, [isPersistentMode, redrawCanvas, updateSettings]);

  const handleUpload = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) { return; }
      setLoadingImage(true);
      try {
        const img = await loadImageFromFile(file);
        applyImage(img, file.name);
        pointsRef.current = [];
        setPointCount(0);
      } catch {
        // ignore failed load
      } finally {
        setLoadingImage(false);
        event.target.value = "";
      }
    },
    [applyImage],
  );

  const handlePointerMove = React.useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPersistentMode) { return; }
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !originalImageDataRef.current) { return; }
    const { x, y } = coordsFromMouse(canvas, event.nativeEvent);
    effectRef.current?.apply(x, y);
  }, [isPersistentMode]);

  const handlePointerLeave = React.useCallback(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleCanvasClick = React.useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPersistentMode || !originalImageDataRef.current) { return; }
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const { x, y } = coordsFromMouse(canvas, event.nativeEvent);
    pointsRef.current.push({ x, y });
    setPointCount(pointsRef.current.length);
    redrawCanvas();
  }, [isPersistentMode, redrawCanvas]);

  const clearPoints = React.useCallback(() => {
    pointsRef.current = [];
    setPointCount(0);
    redrawCanvas();
  }, [redrawCanvas]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) { return; }
    ctxRef.current = ctx;

    effectRef.current = createFragmentsEffect({
      canvas,
      ctx,
      getOriginalImageData: () => originalImageDataRef.current,
      getParams: () => settingsRef.current,
    });

    void loadImage(DEFAULT_IMAGE)
      .then((img) => applyImage(img, "Placeholder"))
      .catch(() => {});

    const handleResize = () => {
      if (imageRef.current) {
        sizeCanvasToContainer(imageRef.current);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [applyImage, sizeCanvasToContainer]);

  React.useEffect(() => {
    updateSettings({ radius });
    if (isPersistentMode) {
      redrawCanvas();
    }
  }, [radius, isPersistentMode, redrawCanvas, updateSettings]);

  React.useEffect(() => {
    updateSettings({ intensity });
    if (isPersistentMode) {
      redrawCanvas();
    }
  }, [intensity, isPersistentMode, redrawCanvas, updateSettings]);

  React.useEffect(() => {
    updateSettings({ blockSize });
    if (isPersistentMode) {
      redrawCanvas();
    }
  }, [blockSize, isPersistentMode, redrawCanvas, updateSettings]);

  React.useEffect(() => {
    updateSettings({ isAnimationEnabled });
  }, [isAnimationEnabled, updateSettings]);

  React.useEffect(() => {
    updateSettings({ isPersistentMode });
    if (!isPersistentMode) {
      pointsRef.current = [];
      setPointCount(0);
    }
    redrawCanvas();
  }, [isPersistentMode, redrawCanvas, updateSettings]);

  return (
    <ExperimentShell
      controls={
        <FragmentsControls
          radius={radius}
          setRadius={(value) => setRadius(clamp(Math.round(value), 40, 1200))}
          intensity={intensity}
          setIntensity={(value) => setIntensity(clamp(Math.round(value), 1, 120))}
          blockSize={blockSize}
          setBlockSize={(value) => setBlockSize(clamp(Math.round(value), 2, 120))}
          isAnimationEnabled={isAnimationEnabled}
          setAnimationEnabled={setAnimationEnabled}
          isPersistentMode={isPersistentMode}
          togglePersistentMode={() => setPersistentMode((prev) => !prev)}
          pointCount={pointCount}
          onUpload={handleUpload}
          onClear={clearPoints}
          onReset={resetControls}
          onRandomize={randomize}
          loadingImage={loadingImage}
        />
      }
      canvas={
        <div ref={containerRef} className="w-full">
          <FragmentsCanvas
            canvasRef={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onCanvasClick={handleCanvasClick}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => { void handleFileChange(event); }}
          />
        </div>
      }
    />
  );
}
