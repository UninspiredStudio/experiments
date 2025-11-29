"use client";

import React from "react";
import { Link } from "@tanstack/react-router";
import { LayoutCanvas_Xyz, LayoutContainer_Xyz } from "@/ui";

const links = [
  { to: "/grid", label: "Grid" },
  { to: "/displacement", label: "Displacement" },
  { to: "/fragments", label: "Fragments" },
  { to: "/shift", label: "Shift" },
  { to: "/particle", label: "Particle" },
  { to: "/slice", label: "Slice" },
];

export function HomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col gap-6 bg-default-background px-12 py-12 text-default-font">
      <div className="flex flex-col gap-2">
        <h1 className="text-heading-1 font-heading-1">Experiments</h1>
        <p className="text-body text-subtext-color">
          Pick an experiment to open the React port with the shared shell.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link key={item.to} to={item.to} className="group">
            <div className="flex h-28 flex-col justify-between rounded-md border border-neutral-border bg-neutral-50 px-4 py-3 transition hover:border-brand-600 hover:bg-brand-50">
              <span className="text-heading-3 font-heading-3">{item.label}</span>
              <span className="text-caption-bold font-caption-bold text-brand-primary">
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex items-start gap-4 rounded-md border border-neutral-border bg-neutral-50 px-4 py-4">
        <LayoutContainer_Xyz className="w-80 flex-none">
          <span className="text-caption text-subtext-color">
            UI components provided by Subframe.
          </span>
        </LayoutContainer_Xyz>
        <LayoutCanvas_Xyz className="flex-1">
          <div className="flex w-full flex-col items-start gap-2">
            <p className="text-caption text-subtext-color">
              Grid, Displacement, Particle, and Slice canvases live here when selected.
            </p>
          </div>
        </LayoutCanvas_Xyz>
      </div>
    </div>
  );
}

export default HomePage;
