"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { ControlSection, ExperimentShell, LabeledSlider } from "@/components/shared";
import { Button, Switch, TextField, ToggleGroup } from "@/ui";
import { bootstrapGridApp } from "@projects/grid/main";
import { gridState, noise3D } from "@projects/grid/core/state";
import { startBackgroundAnimation, stopAllAnimations } from "@projects/grid/animation/sequence";
import { startManualRecording, stopRecording } from "@projects/grid/features/recording";
import { drawBackground } from "@projects/grid/rendering/background";
import { useGridControlsStore } from "@projects/grid/store/useGridControlsStore";
import { useCanvasFit } from "@/hooks/useCanvasFit";

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = (reader.result as string) ?? "";
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type GridControlsProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

function GridControls({ canvasRef }: GridControlsProps) {
  const {
    speed,
    gridAmount,
    fill,
    brightness,
    letters,
    letterColor,
    letterBgColor,
    startEnabled,
    endEnabled,
    animationArea,
    isSimplified,
    overallDuration,
    fadeInDuration,
    fadeOutDuration,
    setSpeed,
    setGridAmount,
    setFill,
    setBrightness,
    setAnimationArea,
    setSimplified,
    setDurations,
    setLetters,
    setLetterColor,
    setLetterBgColor,
    setStartEnabled,
    setEndEnabled,
    reset,
    randomize,
  } = useGridControlsStore();

  const [isRecording, setIsRecording] = React.useState(false);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const cellInputRef = useRef<HTMLInputElement | null>(null);

  const handleStartRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const started = startManualRecording(gridState, canvas);
    if (started) {
      setIsRecording(true);
    }
  }, [canvasRef]);

  const handleStopRecording = useCallback(() => {
    stopRecording(gridState);
    setIsRecording(false);
  }, []);

  const handleBgFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) { return; }

      try {
        const img = await loadImageFromFile(file);
        const canvas = canvasRef.current;
        const hidden = document.getElementById("gridHiddenCanvas") as HTMLCanvasElement | null;
        if (!canvas || !hidden) { return; }

        const ctx = canvas.getContext("2d");
        const hiddenCtx = hidden.getContext("2d", { willReadFrequently: true });
        if (!ctx || !hiddenCtx) { return; }

        gridState.bgImage = img;
        gridState.bgImageForDrawing = img;
        hidden.width = canvas.width;
        hidden.height = canvas.height;
        hiddenCtx.clearRect(0, 0, hidden.width, hidden.height);
        hiddenCtx.drawImage(img, 0, 0, hidden.width, hidden.height);
        gridState.bgPixelData = null;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } finally {
        event.target.value = "";
      }
    },
    [canvasRef],
  );

  const handleCellFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) { return; }

    gridState.isCellImageLoading = true;
    try {
      const images = await Promise.all(files.map((file) => loadImageFromFile(file)));
      gridState.cellImages = images;
      gridState.assignedCellData.clear();
    } finally {
      gridState.isCellImageLoading = false;
      event.target.value = "";
    }
  }, []);

  const restart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) { return; }
    const context = { ctx, canvas };
    stopAllAnimations(gridState, false);
    drawBackground(gridState, context);
    gridState.assignedCellData.clear();
    gridState.time = 0;
    startBackgroundAnimation(gridState, context, noise3D);
  }, [canvasRef]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="small" variant="brand-secondary" onClick={restart}>
          Restart
        </Button>
        <Button size="small" variant="neutral-secondary" onClick={() => randomize(canvasRef.current)}>
          Randomize
        </Button>
        <Button size="small" variant="neutral-tertiary" onClick={() => reset(canvasRef.current)}>
          Reset defaults
        </Button>
      </div>

      <ControlSection title="Images" spacing="normal">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="small"
            variant="brand-secondary"
            onClick={() => bgInputRef.current?.click()}
          >
            Upload background
          </Button>
          <Button
            size="small"
            variant="neutral-secondary"
            onClick={() => cellInputRef.current?.click()}
          >
            Upload cell images
          </Button>
        </div>
        <p className="text-caption text-subtext-color">
          Custom images override the default placeholders for the grid background and cells.
        </p>
        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => { void handleBgFileChange(event); }}
        />
        <input
          ref={cellInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => { void handleCellFileChange(event); }}
        />
      </ControlSection>

      <LabeledSlider
        label="Speed"
        value={speed}
        min={0}
        max={1}
        step={0.01}
        formatValue={(val) => val.toFixed(2)}
        onChange={(val) => setSpeed(val)}
      />

      <LabeledSlider
        label="Grid Amount"
        value={gridAmount}
        min={4}
        max={80}
        step={1}
        formatValue={(val) => Math.round(val).toString()}
        onChange={(val) => setGridAmount(val, canvasRef.current)}
      />

      <LabeledSlider
        label="Fill"
        value={fill}
        min={0}
        max={1}
        step={0.01}
        formatValue={(val) => val.toFixed(2)}
        onChange={(val) => setFill(val)}
      />

      <LabeledSlider
        label="Brightness"
        value={brightness}
        min={0}
        max={1}
        step={0.01}
        formatValue={(val) => val.toFixed(2)}
        onChange={(val) => setBrightness(val)}
      />

      <ControlSection title="Pattern">
        <ToggleGroup
          type="single"
          value={isSimplified ? "simple" : "complex"}
          onValueChange={(val) => setSimplified(val === "simple")}
          className="w-full"
        >
          <ToggleGroup.Item value="complex" icon={null}>
            Complex
          </ToggleGroup.Item>
          <ToggleGroup.Item value="simple" icon={null}>
            Simplify
          </ToggleGroup.Item>
        </ToggleGroup>
      </ControlSection>

      <ControlSection title="Animate on">
        <ToggleGroup
          type="single"
          value={animationArea}
          onValueChange={(val) => {
            if (val === "everywhere" || val === "light" || val === "dark") {
              setAnimationArea(val);
            }
          }}
          className="w-full"
        >
          <ToggleGroup.Item value="everywhere" icon={null}>
            Everywhere
          </ToggleGroup.Item>
          <ToggleGroup.Item value="light" icon={null}>
            Light areas
          </ToggleGroup.Item>
          <ToggleGroup.Item value="dark" icon={null}>
            Dark areas
          </ToggleGroup.Item>
        </ToggleGroup>
      </ControlSection>

      <ControlSection title="Durations (s)">
        <div className="grid grid-cols-1 gap-3">
          <TextField label="Overall duration">
            <TextField.Input
              type="number"
              min={0.1}
              step={0.1}
              value={String(overallDuration)}
              onChange={(event) => {
                const next = parseFloat(event.target.value);
                setDurations(next, fadeInDuration, fadeOutDuration);
              }}
              placeholder="Overall animation length"
            />
          </TextField>
          <TextField label="Fade in">
            <TextField.Input
              type="number"
              min={0}
              step={0.1}
              value={String(fadeInDuration)}
              onChange={(event) => {
                const next = parseFloat(event.target.value);
                setDurations(overallDuration, next, fadeOutDuration);
              }}
              placeholder="Fade in seconds"
            />
          </TextField>
          <TextField label="Fade out">
            <TextField.Input
              type="number"
              min={0}
              step={0.1}
              value={String(fadeOutDuration)}
              onChange={(event) => {
                const next = parseFloat(event.target.value);
                setDurations(overallDuration, fadeInDuration, next);
              }}
              placeholder="Fade out seconds"
            />
          </TextField>
        </div>
      </ControlSection>

      <ControlSection title="Letter cells" description="Optional text overlay per grid cell.">
        <TextField label="Letters for cells">
          <TextField.Input
            value={letters}
            onChange={(event) => {
              const next = event.target.value;
              setLetters(next);
            }}
            placeholder="Type letters here"
          />
        </TextField>
        <div className="flex items-center gap-3">
          <label className="text-caption text-subtext-color">Letter color</label>
          <input
            type="color"
            value={letterColor}
            onChange={(event) => {
              const next = event.target.value;
              setLetterColor(next);
            }}
            className="h-9 w-12 cursor-pointer rounded border border-neutral-border bg-default-background"
          />
          <label className="text-caption text-subtext-color">Cell background</label>
          <input
            type="color"
            value={letterBgColor}
            onChange={(event) => {
              const next = event.target.value;
              setLetterBgColor(next);
            }}
            className="h-9 w-12 cursor-pointer rounded border border-neutral-border bg-default-background"
          />
        </div>
      </ControlSection>

      <ControlSection title="Entry/exit animations" spacing="tight">
        <div className="flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Enable start animation</span>
          <Switch
            checked={startEnabled}
            onCheckedChange={(checked) => {
              setStartEnabled(Boolean(checked));
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Enable end animation</span>
          <Switch
            checked={endEnabled}
            onCheckedChange={(checked) => {
              setEndEnabled(Boolean(checked));
            }}
          />
        </div>
      </ControlSection>

      <ControlSection title="Recording" spacing="tight">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="small"
            variant="brand-secondary"
            onClick={handleStartRecording}
            disabled={isRecording}
          >
            Start recording
          </Button>
          <Button
            size="small"
            variant="neutral-secondary"
            onClick={handleStopRecording}
            disabled={!isRecording}
          >
            Stop recording
          </Button>
        </div>
      </ControlSection>
    </div>
  );
}

function GridPage() {
  const applyToGridState = useGridControlsStore((state) => state.applyToGridState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenBgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  useCanvasFit(canvasRef, canvasContainerRef);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hidden = hiddenBgCanvasRef.current;
    if (!canvas || !hidden) { return; }
    const cleanup = bootstrapGridApp({
      canvas,
      hiddenBgCanvas: hidden,
    });
    applyToGridState(canvas);
    return () => {
      cleanup();
    };
  }, [applyToGridState]);

  return (
    <ExperimentShell
      controls={<GridControls canvasRef={canvasRef} />}
      canvas={
        <div
          ref={canvasContainerRef}
          className="flex h-full min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            id="gridCanvas"
            className="h-auto w-auto max-h-full max-w-full self-center my-auto rounded-md border border-neutral-border bg-black"
          />
          <canvas ref={hiddenBgCanvasRef} id="gridHiddenCanvas" className="hidden" />
        </div>
      }
    />
  );
}

export default GridPage;
