"use client";

import React from "react";
import { Link, createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";

const NotFound = () => (
  <div className="flex h-screen items-center justify-center bg-default-background text-default-font">
    <div className="flex flex-col items-center gap-3">
      <p className="text-heading-3 font-heading-3">Page not found</p>
      <Link to="/" className="text-body-bold font-body-bold text-brand-primary underline">
        Go home
      </Link>
    </div>
  </div>
);

export const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: NotFound,
});

export default notFoundRoute;
