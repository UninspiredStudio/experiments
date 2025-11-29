"use client";

import { createRoute } from "@tanstack/react-router";
import SlicePage from "@projects/slice/ui/SlicePage";
import { rootRoute } from "./root";

export const sliceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/slice",
  component: SlicePage,
});

export default sliceRoute;
