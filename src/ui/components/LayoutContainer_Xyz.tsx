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
        "flex w-112 flex-col items-start gap-2",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      {children ? (
        <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const LayoutContainer_Xyz = LayoutContainer_XyzRoot;
