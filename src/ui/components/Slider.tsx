"use client";
/*
 * Documentation:
 * Slider — https://app.subframe.com/0890da2aa05a/library?component=Slider_1601945f-3f70-45f0-b34f-b3adae4a148c
 */

import React from "react";
import * as SubframeCore from "@subframe/core";
import * as SubframeUtils from "../utils";

interface RangeProps
  extends React.ComponentProps<typeof SubframeCore.Slider.Range> {
  className?: string;
}

const Range = React.forwardRef<HTMLDivElement, RangeProps>(function Range(
  { className, ...otherProps }: RangeProps,
  ref
) {
  return (
    <SubframeCore.Slider.Range asChild={true} {...otherProps}>
      <div
        className={SubframeUtils.twClassNames(
          "flex h-full flex-col items-start bg-brand-400",
          className
        )}
        ref={ref}
      />
    </SubframeCore.Slider.Range>
  );
});

interface ThumbProps
  extends React.ComponentProps<typeof SubframeCore.Slider.Thumb> {
  className?: string;
}

const Thumb = React.forwardRef<HTMLDivElement, ThumbProps>(function Thumb(
  { className, ...otherProps }: ThumbProps,
  ref
) {
  return (
    <SubframeCore.Slider.Thumb asChild={true} {...otherProps}>
      <div
        className={SubframeUtils.twClassNames(
          "flex h-6 w-6 items-center gap-2 bg-brand-400",
          className
        )}
        ref={ref}
      />
    </SubframeCore.Slider.Thumb>
  );
});

interface TrackProps
  extends React.ComponentProps<typeof SubframeCore.Slider.Track> {
  className?: string;
}

const Track = React.forwardRef<HTMLDivElement, TrackProps>(function Track(
  { className, ...otherProps }: TrackProps,
  ref
) {
  return (
    <SubframeCore.Slider.Track asChild={true} {...otherProps}>
      <div
        className={SubframeUtils.twClassNames(
          "flex h-12 w-full flex-col items-start gap-2 bg-neutral-100",
          className
        )}
        ref={ref}
      >
        <Slider.Range />
      </div>
    </SubframeCore.Slider.Track>
  );
});

interface SliderRootProps
  extends React.ComponentProps<typeof SubframeCore.Slider.Root> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  className?: string;
}

const SliderRoot = React.forwardRef<HTMLDivElement, SliderRootProps>(
  function SliderRoot({ className, ...otherProps }: SliderRootProps, ref) {
    return (
      <SubframeCore.Slider.Root asChild={true} {...otherProps}>
        <div
          className={SubframeUtils.twClassNames(
            "flex h-12 w-full cursor-pointer flex-col items-start justify-center gap-2 overflow-hidden relative",
            className
          )}
          ref={ref}
        >
          <span className="text-us-body-singleline font-us-body-singleline text-default-font text-center absolute z-[2] left-0 right-0 pointer-events-none">
            Label
          </span>
          <Track />
          <Thumb className="h-12 w-6 flex-none" />
        </div>
      </SubframeCore.Slider.Root>
    );
  }
);

export const Slider = Object.assign(SliderRoot, {
  Range,
  Thumb,
  Track,
});
