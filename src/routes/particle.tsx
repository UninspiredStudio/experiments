"use client";

import { createRoute } from "@tanstack/react-router";
import ParticlePage from "@projects/particle/ui/ParticlePage";
import { rootRoute } from "./root";

export const particleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/particle",
  component: ParticlePage,
});

export default particleRoute;
