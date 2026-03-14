# storyboardJS

A small browser-based visual music storyboard/animation editor inspired by how osu!storyboards work, powered by JavaScript.

sbJS lets you:

- Upload a music track
- Upload and manage sprites (images)
- Script their animation with JavaScript in a live editor
- Preview the result on a canvas synced to the music
- Export:
  - Project files (`.dat`) that include code, sprites and audio
  - Frame-by-frame “video” data (`.dat`) for offline encoding by a separate tool

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [UI Overview](#ui-overview)
- [Saving & Loading Projects](#saving--loading-projects)
- [Rendering](#rendering)
- [Scripting Reference](#scripting-reference)
- [Implementation Notes](#implementation-notes)
- [License](#license)

---

## Features

- **In-browser code editor**
  - Syntax highlighting (Prism)
  - Lightweight editor (CodeJar)
  - Live re-evaluation of your script in a Web Worker sandbox
- **Music & sprite management**
  - Upload an audio file for playback
  - Upload multiple sprites (images), rename or delete them
  - Sidebar listing all sprites with thumbnails
- **Canvas preview**
  - 16:9 preview canvas, auto-resized with drag handles
  - Playback tied to audio time
  - Real-time rendering of your scripted scene
- **Export options**
  - **Project export** to `.dat` (base64-encoded JSON)
  - **Render export** to `.dat` with all frames + audio (for a separate encoder)

---

## Project Structure

- `index.html`  
  Main UI layout and script/style imports.

- `style.css`  
  Minimal styling for the app.

- `script.js`  
  Main frontend logic:
  - UI wiring (buttons, split panes)
  - Audio + sprite management
  - Canvas rendering
  - Project save/load
  - Offline render loop

- `sandbox.js`  
  Web Worker sandbox that:
  - Receives user code
  - Exposes a small API (`Sprite`, `print`)
  - Returns sprite definitions + console-like output

- `classes.js`  
  `Scene` class:
  - Holds sprites and their events
  - Interpolates properties over time with optional easing
  - Produces a list of drawable sprites for a specific time

- `prism.css`, `prism.js`  
  Syntax highlighting for the editor (JavaScript).

- External via CDN:
  - `split-grid` (resizable panes)
  - `codejar-compat` (code editor)

---

## Getting Started

### Prerequisites

- A modern browser (Chrome, Firefox, Edge, etc.)
- Optional but recommended: serve via a local web server instead of `file://`
  to avoid any browser restrictions on Workers.

### Running Locally

1. Clone or download the project files.
2. Run a simple HTTP server in the project directory, for example:

   ```bash
   # Python 3
   python -m http.server 8000
   ```

3. Open in your browser:

   ```
   http://localhost:8000/index.html
   ```

4. You should see the sbJS interface with the default script:

   ```js
   print("Hello, world!");
   ```

---

## UI Overview

The layout is split into three main areas:

### Top Bar

- **sbJS** – App title.
- **New** – Start a blank project (clears code, audio, sprites).
- **Open** – Load a `.dat` project file.
- **Save** – Save the current project to a `.dat` file.
- **Render** – Export all frames + audio to a `.dat` video bundle.

### Left Column

- **Top: Code editor**
  - JavaScript editing with syntax highlighting.
  - Code is executed in a sandbox worker whenever you change it.

- **Bottom: Status panel**
  - Shows:
    - Output from your `print(...)` calls
    - Error messages if your script throws

You can resize the code/status split using the horizontal drag bar.

### Right Column

Split into two vertical areas:

#### Top: Preview + Audio

- **Canvas preview**
  - Shows your current scene at the current audio time.
  - Automatically resized to stay 16:9.
- **Audio player**
  - Standard HTML `<audio>` control.
  - When playing:
    - The scene is rendered frame-by-frame in sync with `currentTime`.
  - When seeking:
    - The current frame is updated to the seeked time.

#### Bottom: Sprite Management

Left side (toolbar):

- **Upload music** (button with a music icon)
  - Opens a file picker.
  - Accepts `audio/*`.
- **Upload new sprite** (button with image icon)
  - Opens a file picker.
  - Accepts `image/*`.

Right side (sprite list):

- Shows each sprite as:
  - Thumbnail
  - Editable name field
  - Delete button (trash icon)

---

## Saving & Loading Projects

### Save

- Click **Save**.
- The app generates a `.dat` file named like:

  ```
  sbJS_Project_2024-01-01T12:34:56.789Z.dat
  ```

- The `.dat` file is a **base64-encoded JSON** containing:

  ```jsonc
  {
    "music": "data:audio/...",
    "sprites": [
      {
        "name": "Sprite name",
        "data": "data:image/..."
      }
    ],
    "code": "// your JS code as a string"
  }
  ```

### Open

- Click **Open**.
- Select a previously saved `.dat` project file.
- The app will:
  - Replace current music, sprites, and code with the loaded project.
  - Re-run the loaded code.

> Opening and creating a new project will discard **unsaved** changes after confirmation.

---

## Rendering

Click **Render** to export a frame-by-frame “video” bundle.

What it does:

1. Disables the button and shows progress:  
   `Rendering... i/N`
2. Computes the number of frames:

   ```js
   const frameCount = Math.floor(audMusic.duration * 60); // 60 FPS
   ```

3. For each frame `i`:
   - Sets the audio time:

     ```js
     audMusic.currentTime = i / 60;
     ```

   - Renders the scene to an offscreen canvas (`buffer`).
   - Captures it as a PNG data URL:

     ```js
     buffer.toDataURL("image/png");
     ```

   - Appends it to `video.frames`.

4. Creates a `.dat` file containing (base64-encoded JSON):

   ```jsonc
   {
     "frames": ["data:image/png;base64,...", "..."],
     "audio": "data:audio/..."
   }
   ```

5. Prompts you to save a file named like:

   ```
   sbJS_Video_2024-01-01T12:34:56.789Z.dat
   ```

> This `.dat` is intended to be processed by a **separate encoder program**
> to combine frames and audio into a proper video file (e.g. MP4).

---

## Scripting Reference

Your script runs inside `sandbox.js` in a Web Worker.  
The worker exposes:

- `Sprite` – constructor for animated sprites
- `print` – for status/log output

The main thread uses the result to render via the `Scene` class.

### Basic Example

```js
// Log to the status panel
print("Starting storyboard...");

// Create a new sprite, referencing the image name
// (must match a sprite name in the UI)
const s = new Sprite("New sprite");

// Move sprite horizontally from x=0.1 to x=0.9 over 5 seconds
s.moveX(0, 0.9, 5, "easeInOut");

// Fade in over the first second
s.alpha(0, 1, 1, "easeOut");

// Scale up from tiny to normal over 3 seconds
s.scale(0, 1, 3, "easeIn");

// Rotate 360 degrees over 10 seconds (radians)
s.rotate(0, Math.PI * 2, 10, "linear");

// Make the sprite additive
s.additive(0, 1);
```

### `Sprite` API

#### Constructor

```js
const sprite = new Sprite(imageName);
```

- `imageName` – must match the **name** of a sprite in the UI’s sprite list.
- Internally: each `Sprite` is collected into an array and then sent back to the main thread.

#### Motion & Property Methods

Each of these methods schedules an **event** for a property:

```js
sprite.moveX(startTime, targetValue, duration = 0, easing = "linear");
sprite.moveY(startTime, targetValue, duration = 0, easing = "linear");
sprite.scale(startTime, targetValue, duration = 0, easing = "linear");
sprite.rotate(startTime, targetValue, duration = 0, easing = "linear");
sprite.alpha(startTime, targetValue, duration = 0, easing = "linear");
sprite.additive(startTime, targetValue);
```

##### Parameters

- `startTime` – when the event starts (in **seconds**, same as `audio.currentTime`).
- `targetValue`:
  - `x`, `y` – normalized position (`0.0`–`1.0`) across canvas width/height.
  - `size` – scale factor (1 = original image size).
  - `angle` – rotation in **radians**.
  - `alpha` – opacity (`0.0`–`1.0`).
- `duration` – how long the transition takes (in seconds).
  - `0` means an instantaneous jump at `startTime`.
- `easing` – one of:
  - `"linear"` (default; handled by the Scene class as the identity easing)
  - `"easeIn"`
  - `"easeOut"`
  - `"easeInOut"`

### `print` Function

```js
print("Hello from sandbox!");
```

- Appends the string followed by a newline to the status panel at the bottom-left.
- Useful as a console/logging replacement inside the worker.

---

## Implementation Notes

- **Scene & Events**
  - `Scene.draw(time)`:
    - Iterates all sprites and their events.
    - For each property (`x`, `y`, `size`, `angle`, `alpha`), finds relevant events.
    - Interpolates between property values over time using `_lerp` and `_ease`.
  - Default property values:
    - `x = 0.5`, `y = 0.5` (center)
    - `size = 1`
    - `angle = 0`
    - `alpha = 0`
    - `additive = 0`

- **Canvas & Rendering**
  - Uses an offscreen `buffer` canvas sized at `1280x720`.
  - Renders all sprites there, then scales to the visible `canvasRender`.
  - Coordinates are normalized: positions are fractions of canvas width/height.

- **Web Worker Sandbox**
  - User code is wrapped in `new Function("Sprite", "print", code)` and executed.
  - Any thrown error is caught and sent back as `{ type: "error", message }`.
  - On success, it posts back `{ type: "success", sprites, printedText }`.

- **Sprite/Image Caching**
  - Data URLs for sprites are converted to `Image` objects and cached in `imageCache`
    to avoid reloading them every frame.

---

### Disclaimer

This documentation was generated by ChatGPT but the entire codebase was written by hand.