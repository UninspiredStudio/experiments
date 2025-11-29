"use client";

import React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";

const RootLayout = () => (
  <div className="min-h-screen bg-default-background text-default-font">
    <Outlet />
  </div>
);

export const rootRoute = createRootRoute({
  component: RootLayout,
});

export default rootRoute;
