"use client";

import { createRoute } from "@tanstack/react-router";
import DisplacementPage from "@projects/distortion/ui/DisplacementPage";
import { rootRoute } from "./root";

export const displacementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/displacement",
  component: DisplacementPage,
});

export default displacementRoute;
