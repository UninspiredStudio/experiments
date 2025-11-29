"use client";

import { rootRoute } from "./root";
import { homeRoute } from "./home";
import { gridRoute } from "./grid";
import { displacementRoute } from "./displacement";
import { fragmentsRoute } from "./fragments";
import { shiftRoute } from "./shift";
import { particleRoute } from "./particle";
import { sliceRoute } from "./slice";
import { notFoundRoute } from "./not-found";

export const routeTree = rootRoute.addChildren([
  homeRoute,
  gridRoute,
  displacementRoute,
  fragmentsRoute,
  shiftRoute,
  particleRoute,
  sliceRoute,
  notFoundRoute,
]);

export default routeTree;
