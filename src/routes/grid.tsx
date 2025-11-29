"use client";

import { createRoute } from "@tanstack/react-router";
import GridPage from "@projects/grid/ui/GridPage";
import { rootRoute } from "./root";

export const gridRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/grid",
  component: GridPage,
});

export default gridRoute;
