# Contributing to palette-pick

Thanks for looking. palette-pick is a small browser app: an image goes in, a palette comes out, and the image never leaves the page.

## Setup

```bash
git clone https://github.com/frozenmango8/palette-pick.git
cd palette-pick
npm install
npm test
npm run dev
```

The dev server runs at `http://localhost:5173/`. Production builds use the `/palette-pick/` base path so they match GitHub Pages.

## What to change

- Color math, quantization, sampling, and export live in `src/lib`. Those modules are pure and covered by `tests/`.
- The Web Worker in `src/workers/quantize.worker.ts` should stay a thin wrapper around `quantizeBytes`.
- UI is React in `src/components` and `src/App.tsx`, styled by `src/index.css`.

If you change the quantizer, add or update a unit test that locks the behavior. In particular, a dominant neutral plus small accents should still produce those accents, and the same pixels should always return the same palette.

## Checks

```bash
npm test
npm run build
```

`npm run build` typechecks and produces `dist/`. CI runs both on every pull request.

## UI expectations

- Keyboard users can browse for a file, change palette size, sort, switch export formats, and copy values without a mouse.
- Text meets WCAG AA against its background. Swatch contrast grades are data about the extracted color, not a substitute for the app chrome being readable.
- Don't add a server, analytics, or an upload step. Decoding and quantization stay in the browser.

## Pull requests

Open a PR against `main` with a short description of the behavior change and how you tested it. Bug fixes should include a failing test when the bug is in `src/lib`.
