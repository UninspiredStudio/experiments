"use client";
/*
 * Documentation:
 * LayoutCanvas_XYZ — https://app.subframe.com/0890da2aa05a/library?component=LayoutCanvas_XYZ_d7f4f257-be35-4eb7-a560-1307b917892a
 */

import React from "react";
import * as SubframeUtils from "../utils";

interface LayoutCanvas_XyzRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const LayoutCanvas_XyzRoot = React.forwardRef<
  HTMLDivElement,
  LayoutCanvas_XyzRootProps
>(function LayoutCanvas_XyzRoot(
  { children, className, ...otherProps }: LayoutCanvas_XyzRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex h-full w-full flex-col items-start",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      {children ? (
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const LayoutCanvas_Xyz = LayoutCanvas_XyzRoot;
