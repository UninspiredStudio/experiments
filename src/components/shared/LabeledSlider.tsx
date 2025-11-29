"use client";

import React from "react";
import * as SubframeUtils from "@/ui/utils";
import { Slider } from "@/ui";

type LabeledSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  helperText?: React.ReactNode;
  className?: string;
  onChange: (value: number) => void;
};

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  helperText,
  className,
  onChange,
}: LabeledSliderProps) {
  const formatted = formatValue ? formatValue(value) : String(value);

  return (
    <div className={SubframeUtils.twClassNames("flex flex-col gap-3", className)}>
      <label className="text-caption-bold font-caption-bold text-default-font">
        {formatted ? `${label} (${formatted})` : label}
      </label>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onValueChange={(vals) => onChange(vals?.[0] ?? value)}
      />
      {helperText ? <p className="text-caption text-subtext-color">{helperText}</p> : null}
    </div>
  );
}
