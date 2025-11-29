"use client";

import React from "react";
import { ControlSection, ExperimentShell, LabeledSlider } from "@/components/shared";
import { Button, Select, TextField, ToggleGroup } from "@/ui";
import { startAnimationLoop, stopAnimationLoop } from "@projects/particle/animation/loop";
import { particleState, resetParticleState } from "@projects/particle/core/state";
import { createParticleFromDefinition, updateParticleCharacters } from "@projects/particle/core/particles";
import { drawFrame } from "@projects/particle/rendering/renderer";
import type { InteractionMode, ParticleShape } from "@projects/particle/types/state";
import type { ParticleDefinition } from "@projects/particle/types/particle";

const DEFAULT_IMAGE = "/img-placeholder/1.jpeg";

const DEFAULTS = {
  density: 12,
  radius: 300,
  speed: 10,
  size: 6.4,
  shape: "character" as ParticleShape,
  interaction: "repel" as InteractionMode,
  characters: "?",
  font: "Arial",
};

const FONT_OPTIONS = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Helvetica",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Comic Sans MS",
  "Impact",
  "Lucida Console",
  "Tahoma",
  "Palatino",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

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

function createDefinitionsFromImage(img: HTMLImageElement, canvas: HTMLCanvasElement): ParticleDefinition[] {
  if (!img || img.width === 0 || img.height === 0 || canvas.width === 0 || canvas.height === 0) {
    return [];
  }

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
  if (!tempCtx) {
    return [];
  }

  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  const imgAspect = img.width / img.height;
  const padding = 0.1;
  const targetCanvasWidth = canvas.width * (1 - padding * 2);
  const targetCanvasHeight = canvas.height * (1 - padding * 2);

  let drawWidth: number;
  let drawHeight: number;
  if (imgAspect > targetCanvasWidth / targetCanvasHeight) {
    drawWidth = targetCanvasWidth;
    drawHeight = drawWidth / imgAspect;
  } else {
    drawHeight = targetCanvasHeight;
    drawWidth = drawHeight * imgAspect;
  }

  const offsetX = (canvas.width - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;

  try {
    tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  } catch {
    return [];
  }

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;
  const density = Math.max(2, Math.round(particleState.particleDensity));
  const alphaThreshold = particleState.particleAlphaThreshold;
  const colorThreshold = particleState.particleColorThreshold;

  const definitions: ParticleDefinition[] = [];

  const pushFromThresholds = (alphaLimit: number, colorLimit: number) => {
    for (let y = 0; y < tempCanvas.height; y += density) {
      for (let x = 0; x < tempCanvas.width; x += density) {
        const index = (y * tempCanvas.width + x) * 4;
        const alpha = data[index + 3];
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        if (alpha > alphaLimit) {
          const isBlackPixel = r <= 10 && g <= 10 && b <= 10;
          const isColorPixel = r > colorLimit || g > colorLimit || b > colorLimit;

          if (isColorPixel || isBlackPixel) {
            const color = { r, g, b };
            definitions.push({ x, y, color, initialX: x, initialY: y });
          }
        }
      }
    }
  };

  pushFromThresholds(alphaThreshold, colorThreshold);

  if (definitions.length === 0) {
    pushFromThresholds(25, 1);
  }

  return definitions;
}

function ParticleControls({
  onUpload,
  onRandomize,
  onReset,
  density,
  setDensity,
  radius,
  setRadius,
  speed,
  setSpeed,
  particleSize,
  setParticleSize,
  shape,
  setShape,
  interaction,
  setInteraction,
  characters,
  setCharacters,
  font,
  setFont,
  currentImageName,
  loadingImage,
}: {
  onUpload: () => void;
  onRandomize: () => void;
  onReset: () => void;
  density: number;
  setDensity: (value: number) => void;
  radius: number;
  setRadius: (value: number) => void;
  speed: number;
  setSpeed: (value: number) => void;
  particleSize: number;
  setParticleSize: (value: number) => void;
  shape: ParticleShape;
  setShape: (value: ParticleShape) => void;
  interaction: InteractionMode;
  setInteraction: (value: InteractionMode) => void;
  characters: string;
  setCharacters: (value: string) => void;
  font: string;
  setFont: (value: string) => void;
  currentImageName: string;
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

      <ControlSection tone="card" spacing="tight">
        <p className="text-caption text-subtext-color">
          Current image: <span className="font-caption-bold text-default-font">{currentImageName}</span>
        </p>
      </ControlSection>

      <LabeledSlider
        label="Density"
        value={density}
        min={2}
        max={32}
        step={1}
        formatValue={(val) => Math.round(val).toString()}
        helperText="Lower values pack particles closer together."
        onChange={(val) => setDensity(val)}
      />

      <LabeledSlider
        label="Particle size"
        value={particleSize}
        min={0.5}
        max={15}
        step={0.1}
        formatValue={(val) => `${val.toFixed(1)}px`}
        onChange={(val) => setParticleSize(val)}
      />

      <LabeledSlider
        label="Interaction radius"
        value={radius}
        min={40}
        max={900}
        step={5}
        formatValue={(val) => `${Math.round(val)}px`}
        onChange={(val) => setRadius(val)}
      />

      <LabeledSlider
        label="Effect speed"
        value={speed}
        min={1}
        max={120}
        step={1}
        formatValue={(val) => Math.round(val).toString()}
        helperText="Higher values slow down the return animation."
        onChange={(val) => setSpeed(val)}
      />

      <ControlSection title="Shape">
        <ToggleGroup
          type="single"
          value={shape}
          onValueChange={(val) => {
            if (val === "circle" || val === "square" || val === "character") {
              setShape(val);
            }
          }}
        >
          <ToggleGroup.Item value="circle" icon={null}>
            Circle
          </ToggleGroup.Item>
          <ToggleGroup.Item value="square" icon={null}>
            Square
          </ToggleGroup.Item>
          <ToggleGroup.Item value="character" icon={null}>
            Character
          </ToggleGroup.Item>
        </ToggleGroup>
      </ControlSection>

      <ControlSection title="Interaction">
        <ToggleGroup
          type="single"
          value={interaction}
          onValueChange={(val) => {
            if (val === "repel" || val === "attract") {
              setInteraction(val);
            }
          }}
        >
          <ToggleGroup.Item value="repel" icon={null}>
            Repel
          </ToggleGroup.Item>
          <ToggleGroup.Item value="attract" icon={null}>
            Attract
          </ToggleGroup.Item>
        </ToggleGroup>
      </ControlSection>

      <ControlSection title="Typography" spacing="normal">
        <TextField label="Characters">
          <TextField.Input
            value={characters}
            onChange={(event) => setCharacters(event.target.value)}
            placeholder="Type characters to sprinkle across the particles"
          />
        </TextField>

        <Select
          label="Font"
          value={font}
          onValueChange={(val) => setFont(String(val))}
          placeholder="Pick a font"
        >
          {FONT_OPTIONS.map((option) => (
            <Select.Item key={option} value={option}>
              {option}
            </Select.Item>
          ))}
        </Select>
      </ControlSection>
    </div>
  );
}

function ParticleCanvas({
  canvasRef,
  onPointerMove,
  onPointerLeave,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerMove: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onPointerLeave: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-caption text-subtext-color">
          Move your cursor over the canvas to interact with the particles.
        </p>
      </div>
      <canvas
        ref={canvasRef}
        className="max-w-full rounded-md border border-neutral-border bg-black"
        onMouseMove={onPointerMove}
        onMouseLeave={onPointerLeave}
      />
    </div>
  );
}

export default function ParticlePage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const currentImageRef = React.useRef<HTMLImageElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [density, setDensityState] = React.useState(DEFAULTS.density);
  const [radius, setRadiusState] = React.useState(DEFAULTS.radius);
  const [speed, setSpeedState] = React.useState(DEFAULTS.speed);
  const [particleSize, setParticleSizeState] = React.useState(DEFAULTS.size);
  const [shape, setShapeState] = React.useState<ParticleShape>(DEFAULTS.shape);
  const [interaction, setInteractionState] = React.useState<InteractionMode>(DEFAULTS.interaction);
  const [characters, setCharactersState] = React.useState(DEFAULTS.characters);
  const [font, setFontState] = React.useState(DEFAULTS.font);
  const [currentImageName, setCurrentImageName] = React.useState("Placeholder");
  const [loadingImage, setLoadingImage] = React.useState(false);

  const rebuildParticles = React.useCallback((img?: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const source = img ?? currentImageRef.current;
    if (!canvas || !ctx || !source) {
      return;
    }

    const definitions = createDefinitionsFromImage(source, canvas);
    particleState.particles = definitions.map((def) => createParticleFromDefinition(def));
    drawFrame({ ctx, canvas });
  }, []);

  const syncCanvasSize = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) { return; }

    const width = container?.clientWidth ?? 960;
    const height = Math.max(500, Math.round(width * 0.65));
    canvas.width = width;
    canvas.height = height;
    rebuildParticles();
  }, [rebuildParticles]);

  const applyImage = React.useCallback((img: HTMLImageElement, name: string) => {
    currentImageRef.current = img;
    setCurrentImageName(name);
    rebuildParticles(img);
  }, [rebuildParticles]);

  const resetControls = React.useCallback(() => {
    setDensityState(DEFAULTS.density);
    setRadiusState(DEFAULTS.radius);
    setSpeedState(DEFAULTS.speed);
    setParticleSizeState(DEFAULTS.size);
    setShapeState(DEFAULTS.shape);
    setInteractionState(DEFAULTS.interaction);
    setCharactersState(DEFAULTS.characters);
    setFontState(DEFAULTS.font);

    particleState.particleDensity = DEFAULTS.density;
    particleState.mouse.radius = DEFAULTS.radius;
    particleState.mouseEffectSpeedFactor = DEFAULTS.speed;
    particleState.particleSize = DEFAULTS.size;
    particleState.particleShape = DEFAULTS.shape;
    particleState.interactionMode = DEFAULTS.interaction;
    particleState.particleCharacter = DEFAULTS.characters;
    particleState.particleFont = DEFAULTS.font;
    updateParticleCharacters();
    rebuildParticles();
  }, [rebuildParticles]);

  const randomizeControls = React.useCallback(() => {
    const nextDensity = clamp(Math.round(4 + Math.random() * 20), 2, 32);
    const nextSize = parseFloat((0.8 + Math.random() * 9).toFixed(1));
    const nextRadius = Math.round(80 + Math.random() * 520);
    const nextSpeed = clamp(Math.round(4 + Math.random() * 80), 1, 120);
    const nextShape: ParticleShape = ["circle", "square", "character"][Math.floor(Math.random() * 3)] as ParticleShape;
    const nextInteraction: InteractionMode = Math.random() > 0.5 ? "repel" : "attract";
    const nextFont = FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)];
    const charSets = ["0123456789", "abcdef", "∆≈≠", "?", "★☆✦", "code"];
    const nextChars = charSets[Math.floor(Math.random() * charSets.length)];

    setDensityState(nextDensity);
    setRadiusState(nextRadius);
    setSpeedState(nextSpeed);
    setParticleSizeState(nextSize);
    setShapeState(nextShape);
    setInteractionState(nextInteraction);
    setCharactersState(nextChars);
    setFontState(nextFont);

    particleState.particleDensity = nextDensity;
    particleState.mouse.radius = nextRadius;
    particleState.mouseEffectSpeedFactor = nextSpeed;
    particleState.particleSize = nextSize;
    particleState.particleShape = nextShape;
    particleState.interactionMode = nextInteraction;
    particleState.particleCharacter = nextChars;
    particleState.particleFont = nextFont;
    updateParticleCharacters();
    rebuildParticles();
  }, [rebuildParticles]);

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
      } catch {
        // Ignore load errors; keep previous image.
      } finally {
        setLoadingImage(false);
        event.target.value = "";
      }
    },
    [applyImage],
  );

  const handlePointerMove = React.useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    particleState.actualMouse.x = x;
    particleState.actualMouse.y = y;
    particleState.mouse.x = x;
    particleState.mouse.y = y;
  }, []);

  const handlePointerLeave = React.useCallback(() => {
    particleState.actualMouse.x = null;
    particleState.actualMouse.y = null;
    particleState.mouse.x = null;
    particleState.mouse.y = null;
  }, []);

  React.useEffect(() => {
    resetParticleState();
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) { return; }
    ctxRef.current = ctx;

    syncCanvasSize();
    particleState.particleDensity = density;
    particleState.mouse.radius = radius;
    particleState.mouseEffectSpeedFactor = speed;
    particleState.particleSize = particleSize;
    particleState.particleShape = shape;
    particleState.interactionMode = interaction;
    particleState.particleCharacter = characters;
    particleState.particleFont = font;

    startAnimationLoop(canvas, ctx);

    void loadImage(DEFAULT_IMAGE)
      .then((img) => applyImage(img, "Placeholder"))
      .catch(() => {});

    window.addEventListener("resize", syncCanvasSize);
    return () => {
      stopAnimationLoop();
      window.removeEventListener("resize", syncCanvasSize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    particleState.particleSize = particleSize;
  }, [particleSize]);

  return (
    <ExperimentShell
      className="items-start"
      controls={
        <ParticleControls
          onUpload={handleUpload}
          onRandomize={randomizeControls}
          onReset={resetControls}
          density={density}
          setDensity={(value) => {
            const next = clamp(Math.round(value), 2, 32);
            setDensityState(next);
            particleState.particleDensity = next;
            rebuildParticles();
          }}
          radius={radius}
          setRadius={(value) => {
            const next = clamp(Math.round(value), 40, 900);
            setRadiusState(next);
            particleState.mouse.radius = next;
          }}
          speed={speed}
          setSpeed={(value) => {
            const next = clamp(Math.round(value), 1, 120);
            setSpeedState(next);
            particleState.mouseEffectSpeedFactor = next;
          }}
          particleSize={particleSize}
          setParticleSize={(value) => {
            const next = clamp(Number(value), 0.5, 15);
            setParticleSizeState(next);
            particleState.particleSize = next;
          }}
          shape={shape}
          setShape={(value) => {
            setShapeState(value);
            particleState.particleShape = value;
          }}
          interaction={interaction}
          setInteraction={(value) => {
            setInteractionState(value);
            particleState.interactionMode = value;
          }}
          characters={characters}
          setCharacters={(value) => {
            const next = value || "?";
            setCharactersState(next);
            particleState.particleCharacter = next;
            updateParticleCharacters();
          }}
          font={font}
          setFont={(value) => {
            setFontState(value);
            particleState.particleFont = value;
            updateParticleCharacters();
          }}
          currentImageName={currentImageName}
          loadingImage={loadingImage}
        />
      }
      canvas={
        <div ref={containerRef} className="w-full">
          <ParticleCanvas
            canvasRef={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
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
