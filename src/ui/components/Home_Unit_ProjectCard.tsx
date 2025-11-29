"use client";
/*
 * Documentation:
 * Home_Unit_ProjectCard — https://app.subframe.com/0890da2aa05a/library?component=Home_Unit_ProjectCard_977ba55f-4085-4a03-8e3b-9c68eacb3018
 */

import React from "react";
import * as SubframeUtils from "../utils";

interface Home_Unit_ProjectCardRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const Home_Unit_ProjectCardRoot = React.forwardRef<
  HTMLDivElement,
  Home_Unit_ProjectCardRootProps
>(function Home_Unit_ProjectCardRoot(
  { label, children, className, ...otherProps }: Home_Unit_ProjectCardRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "group/977ba55f flex cursor-pointer flex-col items-start gap-4",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      <div className="flex w-full items-start gap-12">
        {label ? (
          <span className="grow shrink-0 basis-0 text-us-body-singleline font-us-body-singleline text-default-font group-hover/977ba55f:underline">
            {label}
          </span>
        ) : null}
        <span className="text-us-body-singleline font-us-body-singleline text-default-font group-hover/977ba55f:underline">
          +
        </span>
      </div>
      {children ? (
        <div className="flex flex-col items-start gap-4">{children}</div>
      ) : null}
    </div>
  );
});

export const Home_Unit_ProjectCard = Home_Unit_ProjectCardRoot;
