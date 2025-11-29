"use client";

import React, { useEffect, useRef, useState } from "react";
import { ControlSection, ExperimentShell, LabeledSlider } from "@/components/shared";
import { Button, Switch, TextField, ToggleGroup } from "@/ui";
import { createDisplacementController, type DisplacementController } from "@projects/distortion/displacement/controller";
import type { DisplacementDirection } from "@projects/distortion/effects/displacement";

function DisplacementControls({
  controllerRef,
  persistent,
  pointCount,
}: {
  controllerRef: React.MutableRefObject<DisplacementController | null>;
  persistent: boolean;
  pointCount: number;
}) {
  const [radius, setRadius] = useState(800);
  const [intensity, setIntensity] = useState(30);
  const [scale, setScale] = useState(1);
  const [direction, setDirection] = useState<DisplacementDirection>("horizontal");
  const [duration, setDuration] = useState(3);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const displacementInputRef = useRef<HTMLInputElement | null>(null);

  const applyRadius = (val: number) => {
    setRadius(val);
    controllerRef.current?.setRadius(val);
  };

  const applyIntensity = (val: number) => {
    setIntensity(val);
    controllerRef.current?.setIntensity(val);
  };

  const applyScale = (val: number) => {
    setScale(val);
    controllerRef.current?.setDisplacementScale(val);
  };

  const applyDirection = (dir: DisplacementDirection) => {
    setDirection(dir);
    controllerRef.current?.setDirection(dir);
  };

  const togglePersistent = (enabled: boolean) => {
    controllerRef.current?.setPersistentMode(enabled);
  };

  const clearPoints = () => {
    controllerRef.current?.clearPoints();
  };

  const record = () => {
    controllerRef.current?.startRecording(duration);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="small" variant="brand-secondary" onClick={() => imageInputRef.current?.click()}>
          Upload Image
        </Button>
        <Button size="small" variant="neutral-secondary" onClick={() => displacementInputRef.current?.click()}>
          Upload Displacement Map
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void controllerRef.current?.loadImageFile(file);
            }
          }}
        />
        <input
          ref={displacementInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void controllerRef.current?.loadDisplacementMapFile(file);
            }
          }}
        />
      </div>

      <ControlSection title="Displacement direction">
        <ToggleGroup
          type="single"
          value={direction}
          onValueChange={(val) => {
            if (val === "horizontal" || val === "vertical" || val === "both" || val === "radial") {
              applyDirection(val);
            }
          }}
          className="w-full"
        >
          <ToggleGroup.Item value="horizontal" icon={null}>
            Horizontal
          </ToggleGroup.Item>
          <ToggleGroup.Item value="vertical" icon={null}>
            Vertical
          </ToggleGroup.Item>
          <ToggleGroup.Item value="both" icon={null}>
            Both
          </ToggleGroup.Item>
          <ToggleGroup.Item value="radial" icon={null}>
            Radial
          </ToggleGroup.Item>
        </ToggleGroup>
      </ControlSection>

      <LabeledSlider
        label="Intensity"
        value={intensity}
        min={0}
        max={600}
        step={1}
        formatValue={(val) => Math.round(val).toString()}
        onChange={(val) => applyIntensity(val)}
      />

      <LabeledSlider
        label="Radius"
        value={radius}
        min={10}
        max={1500}
        step={10}
        formatValue={(val) => `${Math.round(val)}px`}
        onChange={(val) => applyRadius(val)}
      />

      <LabeledSlider
        label="Displacement Scale"
        value={scale}
        min={0.1}
        max={3}
        step={0.1}
        formatValue={(val) => val.toFixed(1)}
        onChange={(val) => applyScale(val)}
      />

      <ControlSection
        title="Mode"
        description="Toggle persistent mode to keep multiple distortion points alive."
        spacing="tight"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-body font-body text-subtext-color">Persistent mode</span>
          <Switch
            checked={persistent}
            onCheckedChange={(checked) => togglePersistent(Boolean(checked))}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-subtext-color">Points active</span>
          <span className="text-caption-bold font-caption-bold text-default-font">{pointCount}</span>
        </div>
        <div className="flex gap-2">
          <Button size="small" variant="neutral-secondary" onClick={clearPoints}>
            Clear points
          </Button>
        </div>
      </ControlSection>

      <ControlSection title="Recording" spacing="normal">
        <TextField label="Duration (seconds)">
          <TextField.Input
            type="number"
            min={1}
            max={30}
            step={1}
            value={String(duration)}
            onChange={(event) => setDuration(Number.parseInt(event.target.value, 10) || 1)}
          />
        </TextField>
        <Button size="small" variant="brand-secondary" onClick={record}>
          Record canvas
        </Button>
      </ControlSection>

      <ControlSection tone="card" spacing="tight">
        <p className="text-caption text-subtext-color">
          Upload a base image and a displacement map. Hover to distort, or enable persistent mode and click to place
          distortion points.
        </p>
      </ControlSection>
    </div>
  );
}

function DisplacementPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<DisplacementController | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [persistent, setPersistent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const controller = createDisplacementController({
      canvas,
      onStateChange: (state) => {
        setPointCount(state.pointCount);
        setPersistent(state.persistentEnabled);
      },
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
    };
  }, []);

  return (
    <ExperimentShell
      controls={<DisplacementControls controllerRef={controllerRef} persistent={persistent} pointCount={pointCount} />}
      canvas={
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption text-subtext-color">
              Points: {pointCount} · Persistent mode: {persistent ? "On" : "Off"}
            </span>
          </div>
          <div className="relative w-full overflow-hidden rounded-md border border-neutral-border bg-black">
            <canvas
              ref={canvasRef}
              className="h-[520px] w-full"
              onMouseMove={(event) => controllerRef.current?.handlePointerMove(event.nativeEvent)}
              onMouseLeave={() => controllerRef.current?.handlePointerLeave()}
              onClick={(event) => controllerRef.current?.handleCanvasClick(event.nativeEvent)}
            />
          </div>
        </div>
      }
    />
  );
}

export default DisplacementPage;
