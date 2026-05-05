# Visual Contrast — Before & After Slider

A production-ready before/after image comparison tool built with React, TypeScript, and Tailwind CSS. Upload two images, compare them with a smooth interactive slider, and export the reveal as a video file directly from the browser — no backend required.

---

## Features

- **Interactive slider** — drag anywhere on the image to reveal before/after. Uses `setPointerCapture` for smooth tracking on both mouse and touch.
- **Drag-and-drop upload** — drop images onto either zone or click to browse. Replace or remove images without losing the other.
- **Play animation** — one-click ping-pong preview: Before → After → Before → After with ease-in-out timing.
- **Video export** — records the canvas with `MediaRecorder` and auto-downloads:
  - **MP4** on Safari 14.5+
  - **WebM (VP9)** on Chrome, Firefox, Edge
- **BEFORE / AFTER labels baked into the video** — fade in over the first 400 ms, visible for the full 7.3-second cinematic sequence.
- **Light & dark mode** — toggle with the Sun/Moon button. Defaults to your system preference. All surfaces transition smoothly via CSS variables.
- **Framer-inspired UI** — pure dark/light surfaces, gradient border on the slider frame, ambient radial glow, tight typography, and the exact Framer button/card system.

---

## Video export timeline

| Segment | Duration | What happens |
|---|---|---|
| Hold Before | 0.5 s | Audience registers the original state |
| Sweep → After | 2.0 s | First reveal (ease-in-out) |
| Hold After | 0.5 s | Eye registers the transformation |
| Ping-pong → Before | 2.0 s | Comparison sweep back |
| Hold Before | 0.3 s | Brief breath before finale |
| Final sweep → After | 1.5 s | Closing reveal |
| Hold After | 0.5 s | Video ends on the result |
| **Total** | **~7.3 s** | |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Video | `HTMLCanvasElement.captureStream` + `MediaRecorder` API |

---

## Project structure

```
src/
├── App.tsx                   # State orchestration, layout, theme toggle
├── components/
│   ├── ComparisonSlider.tsx  # Drag slider with pointer capture
│   └── FileDropZone.tsx      # Drag-and-drop upload card
├── hooks/
│   └── useVideoExport.ts     # Canvas rendering + MediaRecorder logic
└── index.css                 # CSS variables (dark/light), Framer button system
```

---

## Getting started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Browser support

| Browser | Slider | Video export format |
|---|---|---|
| Chrome 88+ | ✅ | WebM (VP9) |
| Firefox 78+ | ✅ | WebM |
| Edge 88+ | ✅ | WebM (VP9) |
| Safari 14.5+ | ✅ | MP4 |

---

## How the video export works

1. Both images are loaded into an off-screen `<canvas>` element.
2. `canvas.captureStream(60)` feeds a 60 fps stream into `MediaRecorder`.
3. A `requestAnimationFrame` loop drives the slider position through the 7.3-second keyframe timeline, drawing each frame to the canvas with `drawImage` + `clip`.
4. BEFORE/AFTER labels are drawn directly onto every frame using the Canvas 2D API with rounded-rect backdrops.
5. When the animation ends, `MediaRecorder.stop()` fires, the recorded chunks are assembled into a `Blob`, and the browser triggers an automatic download.

The canvas rendering mirrors the DOM `clip-path: inset()` logic exactly, so the exported video looks identical to the interactive preview.

---

## License

MIT
