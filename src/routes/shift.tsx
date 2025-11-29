"use client";

import { createRoute } from "@tanstack/react-router";
import ShiftPage from "@projects/distortion/ui/ShiftPage";
import { rootRoute } from "./root";

export const shiftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shift",
  component: ShiftPage,
});

export default shiftRoute;
