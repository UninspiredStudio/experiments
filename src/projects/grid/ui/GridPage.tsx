"use client";

import React, { useEffect, useRef, useState } from "react";
import { ControlSection, ExperimentShell, LabeledSlider } from "@/components/shared";
import { Button, Switch, TextField, ToggleGroup } from "@/ui";
import { bootstrapGridApp } from "@projects/grid/main";
import { gridState, noise3D } from "@projects/grid/core/state";
import { updateGridParams } from "@projects/grid/core/canvas";
import {
  applyBrightnessFromSliderDetail,
  applyFillFromSliderDetail,
  applySpeedFromSliderDetail,
} from "@projects/grid/ui/state-adapters";
import { startBackgroundAnimation, stopAllAnimations } from "@projects/grid/animation/sequence";
import { drawBackground } from "@projects/grid/rendering/background";

type GridControlsProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

const DEFAULTS = {
  speed: 0.3684,
  gridAmount: 10,
  fill: 0.5,
  brightness: 0.5,
  animationArea: "dark" as "everywhere" | "light" | "dark",
  isSimplified: false,
  overallDuration: 5,
  fadeInDuration: 1,
  fadeOutDuration: 1,
  startEnabled: false,
  endEnabled: false,
  letterColor: "#FFFFFF",
  letterBgColor: "#000000",
  letters: "",
};

function GridControls({ canvasRef }: GridControlsProps) {
  const [speed, setSpeed] = useState(DEFAULTS.speed);
  const [gridAmount, setGridAmount] = useState(DEFAULTS.gridAmount);
  const [fill, setFill] = useState(DEFAULTS.fill);
  const [brightness, setBrightness] = useState(DEFAULTS.brightness);
  const [letters, setLetters] = useState(DEFAULTS.letters);
  const [letterColor, setLetterColor] = useState(DEFAULTS.letterColor);
  const [letterBgColor, setLetterBgColor] = useState(DEFAULTS.letterBgColor);
  const [startEnabled, setStartEnabled] = useState(DEFAULTS.startEnabled);
  const [endEnabled, setEndEnabled] = useState(DEFAULTS.endEnabled);
  const [animationArea, setAnimationArea] = useState<"everywhere" | "light" | "dark">(DEFAULTS.animationArea);
  const [isSimplified, setIsSimplified] = useState(DEFAULTS.isSimplified);
  const [overallDuration, setOverallDuration] = useState(DEFAULTS.overallDuration);
  const [fadeInDuration, setFadeInDuration] = useState(DEFAULTS.fadeInDuration);
  const [fadeOutDuration, setFadeOutDuration] = useState(DEFAULTS.fadeOutDuration);

  const applyGridAmount = (value: number) => {
    const amount = Math.max(2, Math.round(value));
    setGridAmount(amount);
    const canvas = canvasRef.current;
    if (canvas) {
      updateGridParams(gridState, canvas, amount);
    }
  };

  const applySpeed = (value: number) => {
    const normalized = Math.max(0, Math.min(1, value));
    setSpeed(normalized);
    applySpeedFromSliderDetail(gridState, { value: normalized, displayValue: normalized });
  };

  const applyFill = (value: number) => {
    const normalized = Math.max(0, Math.min(1, value));
    setFill(normalized);
    applyFillFromSliderDetail(gridState, { value: normalized, displayValue: normalized });
  };

  const applyBrightness = (value: number) => {
    const normalized = Math.max(0, Math.min(1, value));
    setBrightness(normalized);
    applyBrightnessFromSliderDetail(gridState, { value: normalized, displayValue: normalized });
  };

  const applyAnimationArea = (value: "everywhere" | "light" | "dark") => {
    setAnimationArea(value);
    gridState.animationAreaMode = value;
  };

  const applySimplified = (value: boolean) => {
    setIsSimplified(value);
    gridState.isSimplified = value;
  };

  const applyDurations = (overall: number, fadeIn: number, fadeOut: number) => {
    const safeOverall = Number.isFinite(overall) && overall > 0 ? overall : gridState.overallDuration;
    const safeFadeIn = Number.isFinite(fadeIn) && fadeIn > 0 ? fadeIn : gridState.startAnimationDuration;
    const safeFadeOut = Number.isFinite(fadeOut) && fadeOut > 0 ? fadeOut : gridState.endAnimationDuration;
    setOverallDuration(safeOverall);
    setFadeInDuration(safeFadeIn);
    setFadeOutDuration(safeFadeOut);
    gridState.overallDuration = safeOverall;
    gridState.startAnimationDuration = safeFadeIn;
    gridState.endAnimationDuration = safeFadeOut;
  };

  const randomize = () => {
    applySpeed(Math.random());
    applyGridAmount(5 + Math.random() * 50);
    applyFill(Math.random());
    applyBrightness(Math.random());
    applyAnimationArea(["everywhere", "light", "dark"][Math.floor(Math.random() * 3)] as "everywhere" | "light" | "dark");
    applySimplified(Math.random() > 0.5);
  };

  const resetDefaults = () => {
    applySpeed(DEFAULTS.speed);
    applyGridAmount(DEFAULTS.gridAmount);
    applyFill(DEFAULTS.fill);
    applyBrightness(DEFAULTS.brightness);
    applyAnimationArea(DEFAULTS.animationArea);
    applySimplified(DEFAULTS.isSimplified);
    applyDurations(DEFAULTS.overallDuration, DEFAULTS.fadeInDuration, DEFAULTS.fadeOutDuration);
    setLetters(DEFAULTS.letters);
    setLetterColor(DEFAULTS.letterColor);
    setLetterBgColor(DEFAULTS.letterBgColor);
    gridState.currentLetters = DEFAULTS.letters;
    gridState.letterColor = DEFAULTS.letterColor;
    gridState.letterBgColor = DEFAULTS.letterBgColor;
    setStartEnabled(DEFAULTS.startEnabled);
    setEndEnabled(DEFAULTS.endEnabled);
    gridState.startAnimationEnabled = DEFAULTS.startEnabled;
    gridState.endAnimationEnabled = DEFAULTS.endEnabled;
  };

  const restart = () => {
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
  };

  useEffect(() => {
    applySpeed(speed);
    applyGridAmount(gridAmount);
    applyFill(fill);
    applyBrightness(brightness);
    applyAnimationArea(animationArea);
    applySimplified(isSimplified);
    applyDurations(overallDuration, fadeInDuration, fadeOutDuration);
    gridState.currentLetters = letters;
    gridState.letterColor = letterColor;
    gridState.letterBgColor = letterBgColor;
    gridState.startAnimationEnabled = startEnabled;
    gridState.endAnimationEnabled = endEnabled;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="small" variant="brand-secondary" onClick={restart}>
          Restart
        </Button>
        <Button size="small" variant="neutral-secondary" onClick={randomize}>
          Randomize
        </Button>
        <Button size="small" variant="neutral-tertiary" onClick={resetDefaults}>
          Reset defaults
        </Button>
      </div>

      <LabeledSlider
        label="Speed"
        value={speed}
        min={0}
        max={1}
        step={0.01}
        formatValue={(val) => val.toFixed(2)}
        onChange={(val) => applySpeed(val)}
      />

      <LabeledSlider
        label="Grid Amount"
        value={gridAmount}
        min={4}
        max={80}
        step={1}
        formatValue={(val) => Math.round(val).toString()}
        onChange={(val) => applyGridAmount(val)}
      />

      <LabeledSlider
        label="Fill"
        value={fill}
        min={0}
        max={1}
        step={0.01}
        formatValue={(val) => val.toFixed(2)}
        onChange={(val) => applyFill(val)}
      />

      <LabeledSlider
        label="Brightness"
        value={brightness}
        min={0}
        max={1}
        step={0.01}
        formatValue={(val) => val.toFixed(2)}
        onChange={(val) => applyBrightness(val)}
      />

      <ControlSection title="Pattern">
        <ToggleGroup
          type="single"
          value={isSimplified ? "simple" : "complex"}
          onValueChange={(val) => applySimplified(val === "simple")}
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
              applyAnimationArea(val);
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
                applyDurations(next, fadeInDuration, fadeOutDuration);
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
                applyDurations(overallDuration, next, fadeOutDuration);
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
                applyDurations(overallDuration, fadeInDuration, next);
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
              gridState.currentLetters = next;
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
              gridState.letterColor = next;
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
              gridState.letterBgColor = next;
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
              gridState.startAnimationEnabled = Boolean(checked);
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Enable end animation</span>
          <Switch
            checked={endEnabled}
            onCheckedChange={(checked) => {
              setEndEnabled(Boolean(checked));
              gridState.endAnimationEnabled = Boolean(checked);
            }}
          />
        </div>
      </ControlSection>
    </div>
  );
}

function GridPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenBgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hidden = hiddenBgCanvasRef.current;
    if (!canvas || !hidden) { return; }
    const cleanup = bootstrapGridApp({
      canvas,
      hiddenBgCanvas: hidden,
    });
    return () => {
      cleanup();
    };
  }, []);

  return (
    <ExperimentShell
      controls={<GridControls canvasRef={canvasRef} />}
      canvas={
        <div className="flex w-full flex-col gap-4">
          <canvas
            ref={canvasRef}
            id="gridCanvas"
            className="max-w-full rounded-md border border-neutral-border bg-black"
          />
          <canvas ref={hiddenBgCanvasRef} id="gridHiddenCanvas" className="hidden" />
        </div>
      }
    />
  );
}

export default GridPage;
