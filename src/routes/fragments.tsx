"use client";

import { createRoute } from "@tanstack/react-router";
import FragmentsPage from "@projects/distortion/ui/FragmentsPage";
import { rootRoute } from "./root";

export const fragmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fragments",
  component: FragmentsPage,
});

export default fragmentsRoute;
