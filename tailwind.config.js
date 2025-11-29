/* eslint-env node */
import subframeConfig from "@subframe/core/tailwind.config";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [subframeConfig],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/subframe/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
