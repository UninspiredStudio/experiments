"use client";

import React from "react";
import { ControlSection, ExperimentShell, LabeledSlider } from "@/components/shared";
import { Button, TextField } from "@/ui";
import { drawTiledImageSection } from "@projects/slice/utils/geometry";
import { loadImageFromFile } from "@projects/distortion/core/image-loader";

const PLACEHOLDER_A = "/img-placeholder/1.jpeg";
const PLACEHOLDER_B = "/img-placeholder/2.jpeg";

const DEFAULTS = {
  sliceCount: 26,
  gap: 6,
  speedA: 0.35,
  speedB: -0.22,
  displacement: 18,
  mix: 0.5,
  background: "#050505",
};

type SliceInfo = {
  seed: number;
  useA: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

function SliceControls({
  sliceCount,
  setSliceCount,
  gap,
  setGap,
  displacement,
  setDisplacement,
  speedA,
  setSpeedA,
  speedB,
  setSpeedB,
  mix,
  setMix,
  background,
  setBackground,
  onUploadA,
  onUploadB,
  onReset,
  onRandomize,
  imageALabel,
  imageBLabel,
}: {
  sliceCount: number;
  setSliceCount: (value: number) => void;
  gap: number;
  setGap: (value: number) => void;
  displacement: number;
  setDisplacement: (value: number) => void;
  speedA: number;
  setSpeedA: (value: number) => void;
  speedB: number;
  setSpeedB: (value: number) => void;
  mix: number;
  setMix: (value: number) => void;
  background: string;
  setBackground: (value: string) => void;
  onUploadA: () => void;
  onUploadB: () => void;
  onReset: () => void;
  onRandomize: () => void;
  imageALabel: string;
  imageBLabel: string;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="small" variant="brand-secondary" onClick={onUploadA}>
          Upload image A
        </Button>
        <Button size="small" variant="brand-secondary" onClick={onUploadB}>
          Upload image B
        </Button>
        <Button size="small" variant="neutral-secondary" onClick={onRandomize}>
          Randomize
        </Button>
        <Button size="small" variant="neutral-tertiary" onClick={onReset}>
          Reset defaults
        </Button>
      </div>

      <ControlSection tone="card" spacing="tight">
        <p className="text-caption text-subtext-color">
          A: <span className="font-caption-bold text-default-font">{imageALabel}</span>
        </p>
        <p className="text-caption text-subtext-color">
          B: <span className="font-caption-bold text-default-font">{imageBLabel}</span>
        </p>
      </ControlSection>

      <LabeledSlider
        label="Slice count"
        value={sliceCount}
        min={6}
        max={80}
        step={1}
        formatValue={(val) => Math.round(val).toString()}
        helperText="More slices means thinner strips across the canvas."
        onChange={(val) => setSliceCount(val)}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LabeledSlider
          label="Speed A"
          value={speedA}
          min={-1}
          max={1}
          step={0.01}
          formatValue={(val) => val.toFixed(2)}
          onChange={(val) => setSpeedA(val)}
        />
        <LabeledSlider
          label="Speed B"
          value={speedB}
          min={-1}
          max={1}
          step={0.01}
          formatValue={(val) => val.toFixed(2)}
          onChange={(val) => setSpeedB(val)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LabeledSlider
          label="Displacement"
          value={displacement}
          min={0}
          max={40}
          step={1}
          formatValue={(val) => `${Math.round(val)}px`}
          onChange={(val) => setDisplacement(val)}
        />
        <LabeledSlider
          label="Gap"
          value={gap}
          min={0}
          max={24}
          step={1}
          formatValue={(val) => `${Math.round(val)}px`}
          onChange={(val) => setGap(val)}
        />
      </div>

      <LabeledSlider
        label="Image mix"
        value={mix}
        min={0}
        max={1}
        step={0.01}
        formatValue={(val) => `${Math.round(val * 100)}% A`}
        helperText="Controls the probability of a slice using image A versus image B."
        onChange={(val) => setMix(val)}
      />

      <ControlSection title="Canvas styling" spacing="normal">
        <TextField label="Background color">
          <TextField.Input
            type="color"
            value={background}
            onChange={(event) => setBackground(event.target.value)}
          />
        </TextField>
      </ControlSection>
    </div>
  );
}

function SliceCanvas({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-caption text-subtext-color">
        Alternating slices from two images scroll across the canvas. Tweak speeds, gaps, and displacement to sculpt
        the collage.
      </p>
      <canvas
        ref={canvasRef}
        className="max-w-full rounded-md border border-neutral-border bg-black"
      />
    </div>
  );
}

export default function SlicePage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const imageARef = React.useRef<HTMLImageElement | null>(null);
  const imageBRef = React.useRef<HTMLImageElement | null>(null);
  const fileARef = React.useRef<HTMLInputElement | null>(null);
  const fileBRef = React.useRef<HTMLInputElement | null>(null);

  const slicesRef = React.useRef<SliceInfo[]>([]);
  const settingsRef = React.useRef({
    sliceCount: DEFAULTS.sliceCount,
    gap: DEFAULTS.gap,
    speedA: DEFAULTS.speedA,
    speedB: DEFAULTS.speedB,
    displacement: DEFAULTS.displacement,
    mix: DEFAULTS.mix,
    background: DEFAULTS.background,
  });

  const [sliceCount, setSliceCountState] = React.useState(DEFAULTS.sliceCount);
  const [gap, setGapState] = React.useState(DEFAULTS.gap);
  const [displacement, setDisplacementState] = React.useState(DEFAULTS.displacement);
  const [speedA, setSpeedAState] = React.useState(DEFAULTS.speedA);
  const [speedB, setSpeedBState] = React.useState(DEFAULTS.speedB);
  const [mix, setMixState] = React.useState(DEFAULTS.mix);
  const [background, setBackgroundState] = React.useState(DEFAULTS.background);
  const [imageALabel, setImageALabel] = React.useState("Placeholder A");
  const [imageBLabel, setImageBLabel] = React.useState("Placeholder B");

  const rebuildSlices = React.useCallback((count?: number, mixValue?: number) => {
    const sliceTotal = count ?? settingsRef.current.sliceCount;
    const mixSetting = mixValue ?? settingsRef.current.mix;
    const slices: SliceInfo[] = Array.from({ length: sliceTotal }, () => ({
      seed: Math.random(),
      useA: Math.random() < mixSetting,
    }));
    slicesRef.current = slices;
  }, []);

  const syncCanvasSize = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) { return; }
    const width = container?.clientWidth ?? 960;
    const height = Math.max(500, Math.round(width * 0.65));
    canvas.width = width;
    canvas.height = height;
  }, []);

  const renderFrame = React.useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) { return; }

    const { gap: gapSetting, displacement: disp, speedA: aSpeed, speedB: bSpeed, background: bg } =
      settingsRef.current;
    const slices = slicesRef.current;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (slices.length === 0) {
      return;
    }

    const sliceHeight = canvas.height / slices.length;
    const gapPx = Math.min(gapSetting, sliceHeight * 0.8);
    const drawHeight = Math.max(2, sliceHeight - gapPx);

    slices.forEach((slice, index) => {
      const img = slice.useA ? imageARef.current ?? imageBRef.current : imageBRef.current ?? imageARef.current;
      if (!img) { return; }

      const speed = slice.useA ? aSpeed : bSpeed;
      const baseX = (timestamp * 0.05 * speed) + slice.seed * img.width;
      const wave = Math.sin(timestamp / 900 + slice.seed * 14) * disp;
      const y = index * sliceHeight + wave * 0.25;

      drawTiledImageSection(
        ctx,
        img,
        baseX,
        slice.seed * img.height,
        canvas.width,
        drawHeight + Math.abs(disp * 0.4),
        wave,
        y,
        canvas.width,
        drawHeight,
      );
    });
  }, []);

  const startLoop = React.useCallback(() => {
    const tick = (ts: number) => {
      renderFrame(ts);
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
  }, [renderFrame]);

  const stopLoop = React.useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const applyImage = React.useCallback(
    async (file: File | null, assign: "a" | "b") => {
      if (!file) { return; }
      const img = await loadImageFromFile(file);
      if (assign === "a") {
        imageARef.current = img;
        setImageALabel(file.name);
      } else {
        imageBRef.current = img;
        setImageBLabel(file.name);
      }
    },
    [],
  );

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>, assign: "a" | "b") => {
      const file = event.target.files?.[0] ?? null;
      try {
        await applyImage(file, assign);
      } catch {
        // ignore load failures
      } finally {
        event.target.value = "";
      }
    },
    [applyImage],
  );

  const loadDefaults = React.useCallback(async () => {
    try {
      const [imgA, imgB] = await Promise.all([loadImage(PLACEHOLDER_A), loadImage(PLACEHOLDER_B)]);
      imageARef.current = imgA;
      imageBRef.current = imgB;
      setImageALabel("Placeholder A");
      setImageBLabel("Placeholder B");
    } catch {
      // If placeholders fail, keep whatever is already loaded.
    }
  }, []);

  const resetControls = React.useCallback(() => {
    settingsRef.current.sliceCount = DEFAULTS.sliceCount;
    settingsRef.current.gap = DEFAULTS.gap;
    settingsRef.current.speedA = DEFAULTS.speedA;
    settingsRef.current.speedB = DEFAULTS.speedB;
    settingsRef.current.displacement = DEFAULTS.displacement;
    settingsRef.current.mix = DEFAULTS.mix;
    settingsRef.current.background = DEFAULTS.background;

    setSliceCountState(DEFAULTS.sliceCount);
    setGapState(DEFAULTS.gap);
    setDisplacementState(DEFAULTS.displacement);
    setSpeedAState(DEFAULTS.speedA);
    setSpeedBState(DEFAULTS.speedB);
    setMixState(DEFAULTS.mix);
    setBackgroundState(DEFAULTS.background);

    rebuildSlices(DEFAULTS.sliceCount, DEFAULTS.mix);
  }, [rebuildSlices]);

  const randomizeControls = React.useCallback(() => {
    const nextSliceCount = Math.round(8 + Math.random() * 48);
    const nextGap = Math.round(Math.random() * 16);
    const nextDisplacement = Math.round(Math.random() * 28);
    const nextSpeedA = parseFloat((Math.random() * 1.2 - 0.6).toFixed(2));
    const nextSpeedB = parseFloat((Math.random() * 1.2 - 0.6).toFixed(2));
    const nextMix = Math.random();

    settingsRef.current.sliceCount = nextSliceCount;
    settingsRef.current.gap = nextGap;
    settingsRef.current.displacement = nextDisplacement;
    settingsRef.current.speedA = nextSpeedA;
    settingsRef.current.speedB = nextSpeedB;
    settingsRef.current.mix = nextMix;

    setSliceCountState(nextSliceCount);
    setGapState(nextGap);
    setDisplacementState(nextDisplacement);
    setSpeedAState(nextSpeedA);
    setSpeedBState(nextSpeedB);
    setMixState(nextMix);
    rebuildSlices(nextSliceCount, nextMix);
  }, [rebuildSlices]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) { return; }
    ctxRef.current = ctx;

    syncCanvasSize();
    rebuildSlices();
    void loadDefaults();
    startLoop();

    window.addEventListener("resize", syncCanvasSize);
    return () => {
      stopLoop();
      window.removeEventListener("resize", syncCanvasSize);
    };
  }, [loadDefaults, rebuildSlices, startLoop, stopLoop, syncCanvasSize]);

  return (
    <ExperimentShell
      controls={
        <SliceControls
          sliceCount={sliceCount}
          setSliceCount={(value) => {
            const next = clamp(Math.round(value), 6, 80);
            settingsRef.current.sliceCount = next;
            setSliceCountState(next);
            rebuildSlices(next);
          }}
          gap={gap}
          setGap={(value) => {
            const next = clamp(Math.round(value), 0, 24);
            settingsRef.current.gap = next;
            setGapState(next);
          }}
          displacement={displacement}
          setDisplacement={(value) => {
            const next = clamp(Math.round(value), 0, 40);
            settingsRef.current.displacement = next;
            setDisplacementState(next);
          }}
          speedA={speedA}
          setSpeedA={(value) => {
            const next = clamp(Number(value), -1, 1);
            settingsRef.current.speedA = next;
            setSpeedAState(next);
          }}
          speedB={speedB}
          setSpeedB={(value) => {
            const next = clamp(Number(value), -1, 1);
            settingsRef.current.speedB = next;
            setSpeedBState(next);
          }}
          mix={mix}
          setMix={(value) => {
            const next = clamp(Number(value), 0, 1);
            settingsRef.current.mix = next;
            setMixState(next);
            rebuildSlices(undefined, next);
          }}
          background={background}
          setBackground={(value) => {
            settingsRef.current.background = value;
            setBackgroundState(value);
          }}
          onUploadA={() => fileARef.current?.click()}
          onUploadB={() => fileBRef.current?.click()}
          onReset={resetControls}
          onRandomize={randomizeControls}
          imageALabel={imageALabel}
          imageBLabel={imageBLabel}
        />
      }
      canvas={
        <div ref={containerRef} className="w-full">
          <SliceCanvas canvasRef={canvasRef} />
          <input
            ref={fileARef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFileChange(event, "a")}
          />
          <input
            ref={fileBRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFileChange(event, "b")}
          />
        </div>
      }
    />
  );
}
