"use client";

import React from "react";
import { ControlSection, ExperimentShell, LabeledSlider } from "@/components/shared";
import { Button, Switch, ToggleGroup } from "@/ui";
import { createShiftEffect, type ShiftDirection, type ShiftEffect, type ShiftParams } from "@projects/distortion/effects/shift";
import { coordsFromMouse, loadImageFromFile } from "@projects/distortion/core/image-loader";
import { INTENSITY_RANGE, RADIUS_RANGE } from "@projects/distortion/constants/common";
import { FRAGMENTATION_RANGE, BRIGHTNESS_INFLUENCE_RANGE } from "@projects/distortion/constants/shift";
import type { Point } from "@/types";
import { clamp } from "@shared/utils/math";
import { useCanvasFit } from "@/hooks/useCanvasFit";
import { fitCanvasToContainer } from "@/utils/fitCanvasToContainer";
import { DEFAULT_PLACEHOLDER_IMAGE, SECONDARY_PLACEHOLDER_IMAGE } from "@/config/assets";

const DEFAULT_IMAGE = SECONDARY_PLACEHOLDER_IMAGE ?? DEFAULT_PLACEHOLDER_IMAGE;

const DEFAULTS: ShiftParams = {
  radius: 420,
  intensity: 26,
  fragmentation: 140,
  brightnessInfluence: 0.35,
  direction: "horizontal",
  isPixelDeleteEnabled: false,
  pixelDeleteThreshold: 0.35,
  isBrightnessInfluenceDeleteEnabled: false,
  brightnessInfluenceDeleteThreshold: 0.4,
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function ShiftControls({
  params,
  setParams,
  persistentMode,
  setPersistentMode,
  pointCount,
  onUpload,
  onClear,
  onReset,
  onRandomize,
  loadingImage,
}: {
  params: ShiftParams;
  setParams: (next: Partial<ShiftParams>) => void;
  persistentMode: boolean;
  setPersistentMode: (value: boolean) => void;
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LabeledSlider
          label="Radius"
          value={params.radius}
          min={RADIUS_RANGE.min}
          max={RADIUS_RANGE.max}
          step={10}
          formatValue={(val) => `${Math.round(val)}px`}
          onChange={(val) => setParams({ radius: val })}
        />
        <LabeledSlider
          label="Intensity"
          value={params.intensity}
          min={INTENSITY_RANGE.min}
          max={INTENSITY_RANGE.max}
          step={1}
          formatValue={(val) => Math.round(val).toString()}
          onChange={(val) => setParams({ intensity: val })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LabeledSlider
          label="Fragmentation"
          value={params.fragmentation}
          min={FRAGMENTATION_RANGE.min}
          max={FRAGMENTATION_RANGE.max}
          step={5}
          formatValue={(val) => Math.round(val).toString()}
          onChange={(val) => setParams({ fragmentation: val })}
        />
        <LabeledSlider
          label="Brightness influence"
          value={params.brightnessInfluence}
          min={BRIGHTNESS_INFLUENCE_RANGE.min}
          max={BRIGHTNESS_INFLUENCE_RANGE.max}
          step={BRIGHTNESS_INFLUENCE_RANGE.step}
          formatValue={(val) => val.toFixed(2)}
          onChange={(val) => setParams({ brightnessInfluence: val })}
        />
      </div>

      <ControlSection title="Direction">
        <ToggleGroup
          type="single"
          value={params.direction}
          onValueChange={(val) => {
            if (val === "horizontal" || val === "vertical" || val === "radial") {
              setParams({ direction: val as ShiftDirection });
            }
          }}
        >
          <ToggleGroup.Item value="horizontal" icon={null}>
            Horizontal
          </ToggleGroup.Item>
          <ToggleGroup.Item value="vertical" icon={null}>
            Vertical
          </ToggleGroup.Item>
          <ToggleGroup.Item value="radial" icon={null}>
            Radial
          </ToggleGroup.Item>
        </ToggleGroup>
      </ControlSection>

      <ControlSection title="Cleanup" description="Drop pixels or shifts beyond your thresholds." spacing="tight">
        <div className="flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Delete dark pixels</span>
          <Switch
            checked={params.isPixelDeleteEnabled}
            onCheckedChange={(checked) => setParams({ isPixelDeleteEnabled: Boolean(checked) })}
          />
        </div>
        <LabeledSlider
          label="Pixel brightness threshold"
          value={params.pixelDeleteThreshold}
          min={0}
          max={1}
          step={0.01}
          formatValue={(val) => `${Math.round(val * 100)}%`}
          onChange={(val) => setParams({ pixelDeleteThreshold: val })}
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Delete strong shifts</span>
          <Switch
            checked={params.isBrightnessInfluenceDeleteEnabled}
            onCheckedChange={(checked) => setParams({ isBrightnessInfluenceDeleteEnabled: Boolean(checked) })}
          />
        </div>
        <LabeledSlider
          label="Shift delete threshold"
          value={params.brightnessInfluenceDeleteThreshold}
          min={0}
          max={1}
          step={0.01}
          formatValue={(val) => `${Math.round(val * 100)}%`}
          onChange={(val) => setParams({ brightnessInfluenceDeleteThreshold: val })}
        />
      </ControlSection>

      <ControlSection
        title="Persistent anchors"
        description="Keep distortion points alive for layered shifts."
        spacing="tight"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Persistent mode</span>
          <Switch checked={persistentMode} onCheckedChange={(checked) => setPersistentMode(Boolean(checked))} />
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
          Hover to shift pixels using brightness-driven distortion. Enable persistent mode and click to anchor multiple
          distortions.
        </p>
      </ControlSection>
    </div>
  );
}

function ShiftCanvas({
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
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden">
      <p className="text-caption text-subtext-color">
        Shift fragments along a chosen axis or radially. Click to add persistent distortion points.
      </p>
      <canvas
        ref={canvasRef}
        className="h-auto w-auto max-h-full max-w-full self-center my-auto rounded-md border border-neutral-border bg-black"
        onMouseMove={onPointerMove}
        onMouseLeave={onPointerLeave}
        onClick={onCanvasClick}
      />
    </div>
  );
}

export default function ShiftPage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const effectRef = React.useRef<ShiftEffect | null>(null);
  const originalImageDataRef = React.useRef<ImageData | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const pointsRef = React.useRef<Point[]>([]);
  const settingsRef = React.useRef<ShiftParams>({ ...DEFAULTS });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useCanvasFit(canvasRef, containerRef);

  const [params, setParamsState] = React.useState<ShiftParams>({ ...DEFAULTS });
  const [persistentMode, setPersistentMode] = React.useState(false);
  const [pointCount, setPointCount] = React.useState(0);
  const [loadingImage, setLoadingImage] = React.useState(false);

  const updateParams = React.useCallback(
    (next: Partial<ShiftParams>) => {
      settingsRef.current = { ...settingsRef.current, ...next };
      setParamsState((prev) => ({ ...prev, ...next }));
    },
    [],
  );

  const redrawCanvas = React.useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const original = originalImageDataRef.current;
    if (!ctx || !canvas || !original) { return; }
    ctx.putImageData(original, 0, 0);
    if (persistentMode && pointsRef.current.length > 0) {
      pointsRef.current.forEach((point) => {
        effectRef.current?.apply(point.x, point.y);
      });
      ctx.fillStyle = "rgba(255,0,0,0.6)";
      pointsRef.current.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [persistentMode]);

  const sizeCanvasToContainer = React.useCallback(
    (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) { return; }
      const width = container?.clientWidth ?? img.naturalWidth;
      const scale = width / img.naturalWidth;
      const height = Math.max(420, Math.round(img.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      fitCanvasToContainer(canvas, container ?? canvas.parentElement);
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
    settingsRef.current = { ...DEFAULTS };
    setParamsState({ ...DEFAULTS });
    setPersistentMode(false);
    pointsRef.current = [];
    setPointCount(0);
    redrawCanvas();
  }, [redrawCanvas]);

  const randomize = React.useCallback(() => {
    const nextRadius = clamp(Math.round(100 + Math.random() * 700), RADIUS_RANGE.min, RADIUS_RANGE.max);
    const nextIntensity = clamp(
      Math.round(8 + Math.random() * 80),
      INTENSITY_RANGE.min,
      INTENSITY_RANGE.max,
    );
    const nextFragmentation = clamp(
      Math.round(Math.random() * FRAGMENTATION_RANGE.max),
      FRAGMENTATION_RANGE.min,
      FRAGMENTATION_RANGE.max,
    );
    const nextBrightnessInfluence = parseFloat((Math.random()).toFixed(2));
    const nextDirection: ShiftDirection = ["horizontal", "vertical", "radial"][Math.floor(Math.random() * 3)] as ShiftDirection;
    updateParams({
      radius: nextRadius,
      intensity: nextIntensity,
      fragmentation: nextFragmentation,
      brightnessInfluence: nextBrightnessInfluence,
      direction: nextDirection,
    });
    redrawCanvas();
  }, [redrawCanvas, updateParams]);

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
        // ignore load failure
      } finally {
        setLoadingImage(false);
        event.target.value = "";
      }
    },
    [applyImage],
  );

  const handlePointerMove = React.useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (persistentMode) { return; }
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !originalImageDataRef.current) { return; }
    const { x, y } = coordsFromMouse(canvas, event.nativeEvent);
    effectRef.current?.apply(x, y);
  }, [persistentMode]);

  const handlePointerLeave = React.useCallback(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleCanvasClick = React.useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!persistentMode || !originalImageDataRef.current) { return; }
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const { x, y } = coordsFromMouse(canvas, event.nativeEvent);
    pointsRef.current.push({ x, y });
    setPointCount(pointsRef.current.length);
    redrawCanvas();
  }, [persistentMode, redrawCanvas]);

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

    effectRef.current = createShiftEffect({
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
    settingsRef.current = { ...params };
    if (persistentMode) {
      redrawCanvas();
    }
  }, [params, persistentMode, redrawCanvas]);

  React.useEffect(() => {
    if (!persistentMode) {
      pointsRef.current = [];
      setPointCount(0);
    }
    redrawCanvas();
  }, [persistentMode, redrawCanvas]);

  return (
    <ExperimentShell
      controls={
        <ShiftControls
          params={params}
          setParams={(next) => {
            const nextValues: Partial<ShiftParams> = { ...next };
            if (typeof nextValues.radius === "number") {
              nextValues.radius = clamp(Math.round(nextValues.radius), RADIUS_RANGE.min, RADIUS_RANGE.max);
            }
            if (typeof nextValues.intensity === "number") {
              nextValues.intensity = clamp(Math.round(nextValues.intensity), INTENSITY_RANGE.min, INTENSITY_RANGE.max);
            }
            if (typeof nextValues.fragmentation === "number") {
              nextValues.fragmentation = clamp(
                Math.round(nextValues.fragmentation),
                FRAGMENTATION_RANGE.min,
                FRAGMENTATION_RANGE.max,
              );
            }
            if (typeof nextValues.brightnessInfluence === "number") {
              nextValues.brightnessInfluence = clamp(
                nextValues.brightnessInfluence,
                BRIGHTNESS_INFLUENCE_RANGE.min,
                BRIGHTNESS_INFLUENCE_RANGE.max,
              );
            }
            if (typeof nextValues.pixelDeleteThreshold === "number") {
              nextValues.pixelDeleteThreshold = clamp(nextValues.pixelDeleteThreshold, 0, 1);
            }
            if (typeof nextValues.brightnessInfluenceDeleteThreshold === "number") {
              nextValues.brightnessInfluenceDeleteThreshold = clamp(
                nextValues.brightnessInfluenceDeleteThreshold,
                0,
                1,
              );
            }
            updateParams(nextValues);
          }}
          persistentMode={persistentMode}
          setPersistentMode={setPersistentMode}
          pointCount={pointCount}
          onUpload={handleUpload}
          onClear={clearPoints}
          onReset={resetControls}
          onRandomize={randomize}
          loadingImage={loadingImage}
        />
      }
      canvas={
        <div ref={containerRef} className="flex h-full min-h-0 w-full flex-1 flex-col">
          <ShiftCanvas
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
