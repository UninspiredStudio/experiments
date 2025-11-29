"use client";

import React from "react";
import { LayoutCanvas_Xyz, LayoutContainer_Xyz } from "@/ui";
import * as SubframeUtils from "@/ui/utils";

interface ExperimentShellProps {
  controls?: React.ReactNode;
  canvas?: React.ReactNode;
  className?: string;
}

/**
 * Shared layout for experiments: left controls column, right canvas/content area.
 */
export function ExperimentShell({
  controls,
  canvas,
  className,
}: ExperimentShellProps) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex min-h-screen w-full flex-col gap-8 overflow-y-auto bg-default-background px-6 py-8 lg:h-screen lg:flex-row lg:items-start lg:gap-12 lg:overflow-hidden lg:px-12",
        className,
      )}
    >
      <LayoutContainer_Xyz className="h-auto w-full flex-none self-stretch overflow-y-auto lg:h-full lg:w-112 lg:pr-2">
        {controls}
      </LayoutContainer_Xyz>
      <LayoutCanvas_Xyz className="lg:h-full lg:flex-1 lg:overflow-hidden">
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2 lg:h-full lg:overflow-auto">
          {canvas}
        </div>
      </LayoutCanvas_Xyz>
    </div>
  );
}
