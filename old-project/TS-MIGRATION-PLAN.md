# TypeScript Migration Plan for `old-project`

## 1. Goals & Constraints

- **Goal 1**: Convert all JavaScript in `old-project` to TypeScript.
- **Goal 2**: Adopt the new `src` folder structure you defined, using per‑project modules under `src/projects/*` and global/shared modules under `src/types` and `src/shared`.
- **Goal 3**: Preserve current visual/behavioral output (animations, UI behavior, recording) while improving structure and type safety.
- **Constraint**: Minimize changes to core visual/algorithmic logic. Focus TS work on structure, types, module boundaries, and wiring.

Result: `old-project` becomes a legacy reference only; the active code lives under `src/` in TS.

---

## 2. Inventory of Existing Code in `old-project`

### 2.1 Top-level site shell

- **`index.html`**
  - Main Experiments landing page.
  - Uses:
    - `styles.css`
    - `canvas/canvas.css`
    - `us-tokens.css`
    - `main.js` (page transitions, link animations, canvas fade integration)
    - `canvas/canvas.js` (starfield/warp background canvas)
- **`main.js`**
  - DOMContentLoaded handler.
  - Controls:
    - Header/info section entrance/exit animations
    - Projects grid animations on click (fade/slide) with navigation
    - Integration with `window.warpSpeed` from `canvas/canvas.js` (animates speed on navigation)
- **`canvas/canvas.js`**
  - Standalone canvas starfield background.
  - Uses CSS custom properties via `getCssVariable` and a `hexToRgb` helper.
  - Exposes and uses global `window.warpSpeed`.
  - Internal star structure and animation loop on `<canvas id="warpCanvas">`.

### 2.2 `projects/grid` (Noise grid experiment)

- **`projects/grid/index.html`**
  - Entry HTML for Grid experiment.
  - Includes:
    - CDN simplex-noise ESM module
    - `style.css`
    - `uninspired/tokens.css`
    - `uninspired/components/basic-slider.js`
    - `<script type="module" src="main.js"></script>`
  - Rich control panel: background upload, cell images, letters, segmented controls, sliders, timed sequence + recording, manual recording.

- **`projects/grid/main.js`**
  - ES module entry point.
  - Imports:
    - `ui` + UI functions from `./modules/ui.js`
    - Canvas functions from `./modules/canvas.js`
    - Animation API from `./modules/animation.js`
    - Recording API from `./modules/recording.js`
    - Image handling from `./modules/imageHandling.js`
  - Sets up wiring and resolves circular dependencies via `setDependencies`, `setAnimationFunctions`, etc.

- **`projects/grid/modules/constants.js`**
  - All grid-related constants:
    - Canvas: `INITIAL_CANVAS_SIZE`, `MAX_INTERNAL_RESOLUTION`, `OVERLAP_FIX`
    - Animation: `END_THRESHOLD_PERCENT`, `ACCELERATION_FACTOR`, `START_ACCELERATION_FACTOR`
    - Recording: `RECORDING_FRAMERATE`, `RECORDING_MIME_TYPE`, `RECORDING_VIDEO_BITRATE`
    - Letters: `DEFAULT_LETTER_COLOR`, `DEFAULT_LETTER_BG_COLOR`, `IMAGE_VS_LETTER_PROBABILITY`
    - Noise: `BASE_FREQ`, `FREQ_AMPLITUDE`, `FREQ_OSC_FREQ`, `MIN_FREQ`, `SIMPLIFY_FACTOR`

- **`projects/grid/modules/state.js`**
  - Imports `createNoise3D` from CDN simplex-noise.
  - Exports:
    - `noise3D`
    - A large `state` object:
      - Time & animation settings
      - Grid sizing and cell properties
      - Noise & thresholds
      - Background image & pixel data
      - Letter settings
      - Sequence state (start/main/end flags + timing)
      - `requestAnimationFrame` IDs
      - Recording state (MediaRecorder, stream, flags)
      - Helper methods: `isSequenceActive()`, `clearAssignedData()`

- **`projects/grid/modules/ui.js`**
  - Caches all DOM references into an exported `ui` object.
  - Holds callback references injected via `setDependencies` to avoid circular imports.
  - Includes many UI update functions:
    - Slider handlers (`updateSpeed`, `updateFillPercentage`, `updateBrightnessThreshold`, etc.)
    - Radio/toggle handlers (simplify pattern, animation area, fade in/out toggles)
    - Letter input handlers
    - Randomize-sliders helper (`randomizeSliders`)

- **`projects/grid/modules/canvas.js`**
  - Canvas initialization and core drawing:
    - `initializeCanvas`
    - `updateGridParams`
    - `getBgPixelBrightness`
    - `drawCell`
    - `drawFrame` (main per-frame grid drawing + noise sampling)

- **`projects/grid/modules/animation.js`**
  - Animation orchestration:
    - `setCompleteSequenceFunction`
    - `stopAllAnimations`
    - `startBackgroundAnimation` / `backgroundAnimate`
    - `startIntroAnimation` (fade-in based on duration)
    - `animate` (main loop with duration + threshold control)
    - `startFadeOut` / `fadeOutAnimate` (end fadeout and call `completeSequence`)

- **`projects/grid/modules/recording.js`**
  - Uses constants, `state`, `ui`, and animation modules.
  - Handles:
    - `setAnimationFunctions` (inject intro + main animation fns)
    - `completeSequence` behavior
    - `handleStartSequence` (timed recording/animation)
    - `handleRestart`
    - `handleStartRecording` / `handleStopRecording`
  - Uses `MediaRecorder` and `canvas.captureStream`.

- **`projects/grid/modules/imageHandling.js`**
  - Default image paths (`img-placeholder` directory).
  - Manages upload state and preview UI.
  - Resizes background into canvas and hidden canvas.
  - Holds `setUpdateGridParamsFunction` and uses `updateGridParamsFn`. 

- **`projects/grid/uninspired/components/basic-slider.js`**
  - Custom web component used as slider control.
  - Shared conceptually with `projects/slice`.

### 2.3 `projects/particle` (Image particle animation)

- **`projects/particle/index.html`**
  - Sidebar + main canvas layout.
  - Includes:
    - `js/jszip.min.js` (3rd-party library)
    - `base/tokens.css`, `styles.css`
    - `<script src="script.js" defer></script>`
  - Controls:
    - Particle density, size, shape, interaction modes
    - Mouse radius, transition speed
    - Path recording & replay
    - Animation recording duration, countdown UI
    - Canvas recording to video via `MediaRecorder`
    - SVG export
    - Randomize sliders

- **`projects/particle/script.js`**
  - Large monolithic script.
  - Key parts:
    - `domElements` object containing many DOM references (canvas, sliders, buttons, etc.).
    - Central `state` object with particle arrays, animation flags, countdown state, recording state, replay data, etc.
    - Image loading and particle initialization logic.
    - Main animation loop and particle physics/updating.
    - Path recording & replay system.
    - Frame-by-frame recording to zipped PNG or similar (via JSZip).
    - Video recording via `canvas.captureStream` + `MediaRecorder`.
    - Randomization helpers for sliders.

### 2.4 `projects/slice` (Glitch/slice animator)

- **`projects/slice/index.html`**
  - Uses `tokens.css`, `style.css`, `basic-slider.js`.
  - Controls:
    - Two image uploads
    - Basic sliders for speed, jaggedness, displacement, gaps, lines, etc.
    - Toggles for torn edge, freeze slices, optimized recording, etc.
    - Background color presets for recording
    - Recording and randomize button
  - Includes `<script src="script.js"></script>`.

- **`projects/slice/script.js`**
  - Monolithic script.
  - Key responsibilities:
    - DOM lookup for many controls and `<canvas id="glitchCanvas">`.
    - Off-screen canvas for image prep.
    - Complex glitch/slice drawing logic, including torn edges & line artifacts.
    - Animation loop with frame timing control.
    - Resize logic keeping aspect ratio within canvas container.
    - Canvas recording logic (MediaRecorder) and randomization of controls.

### 2.5 `projects/distortion` (Displacement/Fragments/Shift)

Three stand-alone experiments, each as one HTML + one JS:

- **Displacement Mode**
  - `projects/distortion/displacement/displacement.html`
  - `projects/distortion/displacement/displacement.js`
  - Features:
    - Image upload + displacement map upload.
    - Segmented controls for displacement direction.
    - Sliders for radius, intensity, displacement scale.
    - Persistent points mode (multiple distortion centers).
    - Canvas recording with duration input and `MediaRecorder`.

- **Fragments Mode**
  - `projects/distortion/fragments/fragments.html`
  - `projects/distortion/fragments/fragments.js`
  - Features:
    - Image upload.
    - Sliders for intensity, radius, block size.
    - Toggle for animation vs static.
    - Persistent mode vs hover mode, with point count and clear.
    - Save image.
    - Recording of animation via `MediaRecorder` with duration control.

- **Shift Mode**
  - `projects/distortion/shift/shift.html`
  - `projects/distortion/shift/shift.js`
  - Features:
    - Image upload.
    - Segmented controls for shift direction.
    - Sliders for intensity, radius, fragmentation, brightness influence.
    - Pixel delete options and brightness-based deletion.
    - Persistent points mode.
    - Save image.
    - Recording of animation via `MediaRecorder` with countdown.

All three:
- Use similar structural patterns: DOM references, a central state area, bespoke drawing per frame.
- Contain **duplicated or near-duplicated recording logic**.

### 2.6 `projects/xyz-member` (Member-only tools)

- **`projects/xyz-member/index.html`**
  - Password gate page with inline `<script>`.
  - On correct password, reveals links to:
    - `reveal.html`
    - `griddy.html`
    - `target.html`
    - `stagger.html`

Each of those HTML files is a mostly self-contained experiment:

- **`griddy.html`**
  - Tailwind + Paper.js + Sortable + `us-tokens.css`.
  - Inline `<script>` for complex image grid manipulations, drag-and-drop, Paper.js canvas drawing and animations.

- **`reveal.html`**
  - Tailwind + Paper.js + `us-tokens.css`.
  - Inline `<script>` controlling image reveal interactions on `#imageCanvas`, with recording/replay‑like behavior.

- **`stagger.html`**
  - Tailwind + `us-tokens.css`.
  - Inline `<script>` implementing elliptical image collage animation on `<canvas>`, with many controls and drag‑and‑drop upload.

- **`target.html`**
  - Tailwind + `us-tokens.css`.
  - Inline `<script>` implementing a “set animation targets and then animate” canvas UI: target placement, drag, randomization, etc.

All member-only experiments currently use **inline JavaScript** inside HTML, not external modules.

---

## 3. Target Folder Structure Under `src/`

### 3.1 Global (shared) structure

Target (as per your spec, slightly specialized for these projects):

- `src/types/`
  - `canvas.ts` – shared canvas & rendering types (e.g. `CanvasRef`, `CanvasSize`, `CanvasContextBundle`).
  - `animation.ts` – types for animation loops, sequence configs, recording states.
  - `common.ts` – `Point`, `Rect`, `RGBA`, `Dimension`, generic slider config types.
  - `index.ts` – re-exports.

- `src/shared/utils/`
  - `noise.ts` – wrapper around simplex-noise (`createNoise3D`, `Noise3DFn` type).
  - `color.ts` – `hexToRgb`, CSS variable helpers (`getCssVariable`), brightness calculation.
  - `math.ts` – `clamp`, `lerp`, range-mapping helpers, random helpers.
  - (Optional later) `recording.ts` – generic `startCanvasRecorder`, `stopCanvasRecorder` helpers.

- `src/shared/constants/`
  - `canvas.ts` – default canvas sizes, max resolutions, fps defaults.

These shared modules consolidate logic currently duplicated across `canvas/canvas.js`, grid, distortion, particle, and slice.

### 3.2 Project-level structure

For each canvas project, target structure (example for `grid`, but applied to others):

- `src/projects/grid/`
  - `types/`
    - `state.ts`
    - `cell.ts`
    - `index.ts`
  - `constants/`
    - `canvas.ts`
    - `animation.ts`
    - `recording.ts`
    - `index.ts`
  - `core/`
    - `state.ts` – initializes and mutates `GridState`.
    - `canvas.ts` – canvas setup, grid sizing, pixel data access.
    - `grid.ts` – grid logic not tied to DOM (e.g. noise sampling decisions).
  - `rendering/`
    - `drawer.ts` – `drawFrame` orchestration.
    - `cell-renderer.ts` – `drawCell`.
    - `background.ts` – background draw from image.
  - `animation/`
    - `controller.ts` – RAF loops, `startBackgroundAnimation`, `stopAllAnimations`.
    - `sequences.ts` – intro/outro sequence management.
    - `timeline.ts` – start/end timestamps.
    - `effects.ts` – fade curves based on `START_ACCELERATION_FACTOR`, `ACCELERATION_FACTOR`.
  - `features/`
    - `recording/`
      - `recorder.ts`
      - `types.ts`
      - `utils.ts`
    - `image-handling/`
      - `uploader.ts`
      - `loader.ts`
      - `processor.ts`
      - `types.ts`
    - `letter-system/`
      - `manager.ts`
      - `renderer.ts`
      - `types.ts`
  - `ui/`
    - `elements.ts` – DOM lookup; caches.
    - `controls.ts` – slider/radio/toggle handlers.
    - `events.ts` – attaching listeners.
    - `updaters.ts` – derived UI state updates.
  - `utils/`
    - `cell-helpers.ts`
    - `noise-helpers.ts`
  - `main.ts` – entry point that wires everything together.
  - `index.html` – either moved into app public assets or mirrored under a build system.

Other projects follow the **same high-level shape**, with some folders thin or empty initially.

---

## 4. Global TS & Build Setup

> Assumes `src/` already exists for the new app. These are adjustments for integrating the migrated experiments.

1. **`tsconfig.json` alignment**
   - Ensure `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
   - Include DOM libs: `"lib": ["ES2020", "DOM", "DOM.Iterable"]`.
   - Ensure `"include"` covers `src/**/*` (including new `src/projects/**`).

2. **Third-party dependencies (npm)**
   - Replace CDN/local JS where reasonable:
     - `simplex-noise` (currently via CDN in grid):
       - `npm install simplex-noise`
       - Import in TS: `import { createNoise3D } from 'simplex-noise';`
     - `jszip` for particle:
       - `npm install jszip @types/jszip`
     - `paper` for xyz-member experiments using Paper.js (optional but recommended):
       - `npm install paper`
   - For `FFmpeg` in displacement, leave CDN imports as-is; TS types can be `any` or shaped minimally.

3. **Entry integration / bundler wiring**
   - For each project, expose a TS entry (`main.ts`) that:
     - Attaches event listeners on `DOMContentLoaded`.
     - Or exports an `init(container: HTMLElement)` function that the app shell can call.
   - Update the router or static routes to load these entry bundles instead of the old `projects/...` HTML files.

---

## 5. Project-by-Project Migration Plan

### 5.1 Grid project (`projects/grid` → `src/projects/grid`)

**Phase 1 – Scaffolding & mechanical TS port**

1. **Create directory structure** under `src/projects/grid` as in §3.2.
2. **Copy HTML**:
   - Move `projects/grid/index.html` into the app’s public or templating system.
   - Update script tag to point to compiled bundle for `src/projects/grid/main.ts`.
   - Keep CSS & tokens references identical for now.
3. **Convert modules to TS with minimal typing**:
   - `modules/constants.js` → `constants/canvas.ts`, `constants/animation.ts`, `constants/recording.ts`.
   - `modules/state.js` →
     - `types/state.ts`: define `GridState` from existing `state` shape.
     - `core/state.ts`: export `createInitialState(): GridState` and maybe `gridState` singleton (for now).
   - `modules/canvas.js` →
     - `core/canvas.ts`: `initializeCanvas`, pixel data handling.
     - `rendering/cell-renderer.ts`: `drawCell`.
     - `rendering/drawer.ts`: `drawFrame` (using `noise3D`).
   - `modules/animation.js` → `animation/controller.ts`, `animation/sequences.ts`, `animation/timeline.ts`.
   - `modules/recording.js` → `features/recording/recorder.ts` + `features/recording/types.ts`.
   - `modules/imageHandling.js` → `features/image-handling/*`.
   - `modules/ui.js` → `ui/elements.ts`, `ui/controls.ts`, `ui/events.ts`, `ui/updaters.ts`.
   - `uninspired/components/basic-slider.js` → place under a shared UI area (or keep as-is, but written in TS if reused elsewhere).
4. **Add lightweight types**:
   - Type `ui` elements as `HTMLCanvasElement`, `HTMLInputElement`, etc.
   - Type animation frame IDs as `number | null`.
   - For complex maps: define `CellData` in `types/cell.ts` and type `assignedCellData` as `Map<string, CellData>`.

**Phase 2 – Refine types & boundaries**

5. **Replace implicit globals**:
   - Ensure no reliance on `window` except where necessary.
   - Import `noise3D` from `src/shared/utils/noise.ts` instead of CDN.
6. **Tighten typing**:
   - Make `state` immutable in definition (interface) but mutated by specific functions.
   - Type all callbacks passed into `setDependencies` and `setAnimationFunctions`.
7. **Optional refactors (later)**:
   - Replace function injection with explicit dependency modules or a simple `GridContext` object.

Migration order **within grid** (mirrors your suggested order):

1. `constants/`
2. `types/`
3. `core/`
4. `rendering/`
5. `animation/`
6. `features/`
7. `ui/`
8. `main.ts` wiring.

### 5.2 Particle project (`projects/particle` → `src/projects/particle`)

**Phase 1 – Module split & TS shell**

1. **Structure**:
   - `src/projects/particle/types/` – `particle.ts`, `state.ts`, `recording.ts`.
   - `constants/` – slider ranges, thresholds, timings.
   - `core/` – particle system (initialization, update), state.
   - `rendering/` – drawing particles + replay path.
   - `animation/` – main RAF loop, countdown timers.
   - `features/recording/` – path recording, animation recording, video recording, SVG export.
   - `ui/` – `elements.ts`, `events.ts`, `controls.ts` for all DOM interactions.
   - `utils/` – randomization helpers, mapping slider values, frame naming.
   - `main.ts` – entry.
2. **Wrap existing `script.js` logic into modules**:
   - First pass: copy as-is into `main.ts`, convert to TS with `any` where needed and no structural change.
   - Second pass: extract `domElements` into `ui/elements.ts` and `state` into `core/state.ts` + `types`.
3. **Recording refactor (optional but recommended)**:
   - Move canvas-to-frames and JSZip logic into `features/recording/`.
   - Treat video recording (`recordVideoBtn`) as a sub-feature.

**Phase 2 – Typing and shared utils**

4. Replace ad-hoc color/brightness logic with `src/shared/utils/color.ts` where duplicated.
5. Type particle structures (`Particle`, `ReplayFrame`, `RecordingStatus`).
6. Introduce enums/unions for mode-like fields (e.g. interaction mode, shape).

### 5.3 Slice project (`projects/slice` → `src/projects/slice`)

**Phase 1 – Structure & TS conversion**

1. **Structure**:
   - `types/` – `SliceConfig`, `SliceState`, `FrozenSlice`, etc.
   - `constants/` – slider ranges and recording defaults.
   - `core/` – image loading, slice generation, glitch logic.
   - `rendering/` – `drawGlitchFrame`, torn-edge rendering.
   - `animation/` – glitch loop, FPS limiting.
   - `features/recording/` – MediaRecorder wiring + countdown.
   - `ui/` – DOM elements, slider handlers, randomize logic.
   - `utils/` – geometry helpers, time-based throttling.
   - `main.ts` – entry.
2. **Extract `basic-slider.js` logic**:
   - Either reuse shared slider web component from grid (if identical) or centralize as a shared component (TS) under `src/shared`.
3. **TS pass**:
   - Convert `script.js` into TS modules while keeping algorithm intact.
   - Use `CanvasRenderingContext2D`, `HTMLCanvasElement` types.

**Phase 2 – Refinement**

4. Factor recording code into `features/recording/`.
5. Tighten types around freeze vs live modes, displacement controls, and presets.

### 5.4 Distortion project (`projects/distortion/*` → `src/projects/distortion`)

Target high-level structure:

- `src/projects/distortion/types/` – shared types (`DistortionMode`, `PersistentPoint`, `DistortionStateBase`).
- `constants/` – generic + per-mode constants.
- `core/` – common image loading, base state.
- `rendering/` –
  - `displacement.ts`
  - `fragments.ts`
  - `shift.ts`
- `effects/` – per-mode helpers:
  - `displacement/`, `fragments/`, `shift/` (optional granularity).
- `features/recording/` – shared canvas recording module.
- `ui/` – mode selection (if unified), or per-mode UI modules.
- `main.ts` – orchestrates current mode and wiring.

**Incremental migration options**:

1. **Stage 1 – One mode at a time, keep separate HTMLs**
   - Create TS modules for each of the three modes individually, preserving their current HTML:
     - `displacement/main.ts` tied to `displacement.html`.
     - `fragments/main.ts` tied to `fragments.html`.
     - `shift/main.ts` tied to `shift.html`.
   - Extract common recording logic for each into `features/recording/` within the distortion project.

2. **Stage 2 – Consolidate under single `distortion` project (optional)**
   - Introduce a top-level `index.html` and UI to choose between modes.
   - Use `DistortionMode` enum and dynamically initialize the correct renderer.

**TS work**:

- For each mode:
  - Define `ModeState` interface from the existing implicit state in JS.
  - Type canvas context, slider elements, buttons.
  - Move pixel-processing loops into `rendering/*.ts` files.
  - Move recording wiring (MediaRecorder) into a shared feature module.

### 5.5 xyz-member project (`projects/xyz-member` → `src/projects/xyz-member`)

Treat `xyz-member` as a single project with **multiple feature modules**:

- `src/projects/xyz-member/types/` – shared types across tools (image descriptors, layout configs).
- `features/`
  - `password-gate/` (currently `index.html` inline logic).
  - `griddy/`
  - `reveal/`
  - `stagger/`
  - `target/`
- Each feature gets its own `main.ts` (or a shared `main.ts` that routes based on path).

**Steps**:

1. **Extract inline scripts** from each HTML into TS modules:
   - For each page, create `features/<name>/main.ts` and move DOM + logic there.
   - Keep HTML mostly unchanged; point to compiled bundles instead of inline `<script>`.
2. **Add typing**:
   - For Paper.js-based tools (`griddy`, `reveal`):
     - Use `paper` types or local `any` wrappers initially.
   - For canvas-heavy tools (`stagger`, `target`):
     - Type all drawing helpers and state structures.
3. **Password gate**:
   - Move password logic from `index.html` into `features/password-gate/main.ts`.
   - HTML becomes a thin template referencing the bundle.

### 5.6 Landing & starfield (`index.html`, `main.js`, `canvas/canvas.js`)

You can treat the landing experience as its own project, e.g. `src/projects/home`:

- `src/projects/home/core/` – layout + page state.
- `rendering/starfield.ts` – port of `canvas/canvas.js` using shared color helpers.
- `ui/transitions.ts` – interactions from `main.js` (fade/slide animations, warp speed ramping).
- `main.ts` – sets up DOMContentLoaded handler and glues transitions + starfield.

Migration steps:

1. Convert `canvas/canvas.js` to TS using `src/shared/utils/color.ts` for `getCssVariable` + `hexToRgb`.
2. Move `main.js` logic into `ui/transitions.ts` + `main.ts`, typing the animation helper functions and `animateWarpSpeed`.
3. Wire `index.html` to the compiled `home/main.ts` bundle.

---

## 6. Phased Migration Strategy (Cross-project)

Suggested high-level order:

1. **Global groundwork**
   - Ensure TS config supports DOM + strict types.
   - Create `src/types`, `src/shared/utils`, and `src/shared/constants` with stubs.
   - Add minimal shared helpers (`color.ts`, `math.ts`, optional `noise.ts`).

2. **Migrate `grid` as the proof-of-concept**
   - It already uses ES modules and has a relatively clean separation of concerns.
   - Follow the grid-specific steps in §5.1.
   - Once grid runs under TS, you have a strong pattern for other projects.

3. **Migrate distortion (Fragments → Shift → Displacement)**
   - Start with one mode (e.g. Fragments) and port as-is into `src/projects/distortion`.
   - Extract shared recording code.

4. **Migrate `slice`**
   - Port monolithic script into TS + project structure.
   - Reuse recording and slider helpers from grid/slice shared components where possible.

5. **Migrate `particle`**
   - Port script into TS, set up JSZip typings.
   - Factor out recording & replay features into `features/recording/`.

6. **Migrate `xyz-member` tools**
   - One feature at a time; start with the simplest (likely `target` or `stagger`).
   - Extract inline scripts to TS modules.

7. **Migrate landing & starfield**
   - Port `canvas/canvas.js` and `main.js` last, once the app shell is stable.

At each stage:

- Keep the original `old-project` version runnable as a reference until the TS version is visually and behaviorally matched.
- Add incremental typing instead of trying to fully type everything at once.
- Prefer small, mechanical moves:
  - Move file → rename to `.ts` → fix imports → add basic types → then refine.

---

## 7. Notes & Recommendations

- **Don’t over-share too early**: start with project-local `features/recording` etc. You can later promote truly generic helpers into `src/shared` once patterns stabilize.
- **Preserve behavior first, refactor second**: the first pass should aim for TS parity with minimal logic changes.
- **Align with future React/SPA plans**: keeping each project’s `main.ts` as an entry API (e.g. `init(canvasContainer)`) will make it easier to mount them inside a React/SPA shell later.
- **Inline JS elimination**: xyz-member is the only area with large inline scripts; extracting them into TS modules will immediately improve maintainability.

This plan gives you a clear path from the current flat JS experiments in `old-project` to a structured, TypeScript-based `src` layout that follows your global/project/feature hierarchy.
