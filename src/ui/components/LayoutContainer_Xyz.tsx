"use client";
/*
 * Documentation:
 * LayoutContainer_XYZ — https://app.subframe.com/0890da2aa05a/library?component=LayoutContainer_XYZ_f4af3038-2c62-4c05-9272-aa7c982a6668
 */

import React from "react";
import * as SubframeUtils from "../utils";

interface LayoutContainer_XyzRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const LayoutContainer_XyzRoot = React.forwardRef<
  HTMLDivElement,
  LayoutContainer_XyzRootProps
>(function LayoutContainer_XyzRoot(
  { children, className, ...otherProps }: LayoutContainer_XyzRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex h-full w-112 flex-col items-start border border-solid border-neutral-border px-6 py-6",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      {children ? (
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-6 scrollbar-hidden overflow-y-auto">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const LayoutContainer_Xyz = LayoutContainer_XyzRoot;
