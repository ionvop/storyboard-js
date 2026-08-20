# sbJS

A browser-based tool for creating sprite-based animations synchronized to music, using JavaScript code.

Everything runs entirely client-side — no server, no accounts, no uploads. You write a small JavaScript script that animates uploaded sprite images over time, preview it in real time against a music track, and export the result as a video file.

## Features

- **Script-driven animation** — Animate sprites with a small JavaScript API (`moveX`, `moveY`, `scale`, `rotate`, `fade`, `additive`, …).
- **Music sync** — Upload a music track; animation timings are in seconds, synced to playback.
- **Live preview** — See the scene render in real time as the track plays.
- **Sprite assets** — Upload one or more images and reference them by name in your script.
- **Project files** — Save and reopen projects as `.dat` files.
- **Video export** — Render the animation (with audio) to `.mp4` or `.webm` at your chosen framerate and resolution.
- **Sandboxed execution** — User scripts run in an isolated Web Worker.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (with npm)
- A modern browser. For the fastest MP4 export, use **Chrome or Edge** (WebCodecs API). Other browsers fall back to WebM via MediaRecorder.

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev
```

Then open the URL printed by Vite (typically `http://localhost:5173`).

### Build

```bash
npm run build
```

This runs `tsc` (type-check) followed by `vite build`, producing a static site in `dist/` that can be hosted anywhere.

## Usage

1. **Upload a music track** (via the sprite panel).
2. **Upload one or more sprite images**.
3. **Write a script** that animates those sprites over time.
4. **Preview** the animation in real time.
5. **Save** your project (`.dat`) and/or **Render** it to a video file.

### Scripting API

Scripts are evaluated in a sandboxed worker and receive two globals:

| Global | Description |
| --- | --- |
| `Sprite(name)` | Creates an animated sprite. `name` must match an uploaded sprite (case-sensitive). |
| `print(text)` | Logs text to the status panel. |

Animation methods (all take `startTime` in seconds, synced to the music):

| Method | Property | Notes |
| --- | --- | --- |
| `moveX(start, target, duration?, easing?)` | x position | `0` = left edge, `1` = right edge |
| `moveY(start, target, duration?, easing?)` | y position | `0` = top edge, `1` = bottom edge |
| `scale(start, target, duration?, easing?)` | size multiplier | |
| `scaleX(start, target, duration?, easing?)` | horizontal scale | |
| `scaleY(start, target, duration?, easing?)` | vertical scale | |
| `rotate(start, target, duration?, easing?)` | angle | in radians |
| `fade(start, target, duration?, easing?)` | alpha | `0`–`1` |
| `additive(start, target)` | additive blending | `0` or `1` |

Each method takes `(startTime, targetValue, duration = 0, easing = "linear")`.

**Easings:** `linear`, `easeIn`, `easeOut`, `easeInOut`. A `duration` of `0` snaps instantly.

**Reading values back:** `sprite.sample(time)` returns the sprite's resolved properties at a given time (in seconds), exactly matching what is rendered on the canvas.

### Example

```js
const logo = new Sprite("logo");

logo.moveX(0, 0.0);                   // left edge at t=0
logo.moveX(0, 1.0, 5, "easeInOut");   // slide to right over 5s
logo.fade(0, 0.0);
logo.fade(0, 1.0, 2, "easeOut");      // fade in
logo.rotate(4, 0);
logo.rotate(4, Math.PI * 2, 4);       // spin 360°

print(logo.sample(2.5).x);            // read back x at t=2.5
```

## Project Structure

```
├── index.html              # Entry HTML page
├── vite.config.ts           # Vite + React + Tailwind config
├── tsconfig.json            # TypeScript config
├── package.json             # Project metadata & dependencies
├── old/                     # Original (pre-refactor) implementation
└── src/
    ├── App.tsx              # Main application layout & state
    ├── main.tsx             # React entry point
    ├── index.css            # Global styles
    ├── components/          # UI components
    │   ├── AudioPlayer.tsx
    │   ├── CodeEditor.tsx
    │   ├── ExportModal.tsx
    │   ├── HelpModal.tsx
    │   ├── PreviewCanvas.tsx
    │   ├── SpritesPanel.tsx
    │   ├── StatusPanel.tsx
    │   └── layout/          # Split panes & top bar
    ├── hooks/
    │   └── useSandbox.ts    # Sandbox worker lifecycle
    ├── lib/
    │   ├── export.ts        # Video export (WebCodecs / MediaRecorder)
    │   ├── file.ts          # Project save/load & uploads
    │   ├── render.ts        # Canvas sprite rendering
    │   ├── scene.ts         # Property sampling & easing
    │   ├── types.ts         # Shared type definitions
    │   └── video.ts         # Frame rendering for preview & export
    └── worker/
        └── sandbox.ts       # Sandboxed script evaluator (Web Worker)
```

## Tech Stack

- **React 19** — UI
- **Vite 6** — build tooling & dev server
- **TypeScript** — type-safe source
- **Tailwind CSS 4 + DaisyUI 5** — styling & UI components
- **CodeMirror** (`@uiw/react-codemirror`) — code editor
- **mp4-muxer** — MP4 container muxing for WebCodecs export
- **WebCodecs / MediaRecorder** — in-browser video encoding

## Tips & Limitations

- Keep `Sprite("name")` strings matching the sprite panel names exactly.
- Later events override earlier ones for the same property.
- `sample(time)` returns the same values the renderer uses.
- Rendering long tracks can produce very large files.
- Everything runs client-side; there is **no undo** — use Save often.

## License

© 2026 ionvop