"use client";

import { createRoute } from "@tanstack/react-router";
import HomePage from "@projects/home/ui/HomePage";
import { rootRoute } from "./root";

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

export default homeRoute;
