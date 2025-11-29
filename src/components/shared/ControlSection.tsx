"use client";

import React from "react";
import * as SubframeUtils from "@/ui/utils";

type ControlSectionProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "card" | "plain";
  spacing?: "tight" | "normal" | "loose";
  className?: string;
  children?: React.ReactNode;
};

const GAP_CLASSES: Record<NonNullable<ControlSectionProps["spacing"]>, string> = {
  tight: "gap-2",
  normal: "gap-3",
  loose: "gap-4",
};

export function ControlSection({
  title,
  description,
  actions,
  tone = "card",
  spacing = "normal",
  className,
  children,
}: ControlSectionProps) {
  const gapClass = GAP_CLASSES[spacing];
  const surfaceClass = tone === "card" ? "rounded-md border border-neutral-border bg-neutral-50 px-3 py-3" : "";

  return (
    <div className={SubframeUtils.twClassNames("flex flex-col", gapClass, surfaceClass, className)}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-2">
          {title ? <div className="text-caption-bold font-caption-bold text-default-font">{title}</div> : <span />}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {description ? <p className="text-caption text-subtext-color">{description}</p> : null}
      {children}
    </div>
  );
}
