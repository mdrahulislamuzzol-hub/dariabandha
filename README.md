# Dariabandha

The renderer-independent B1 rules core is complete. B2 Task 1 adds the browser shell and fixed-tick bridge; the B2 court/player view, controls, and HUD tasks are still pending.

## Requirements

- Node.js 20.19+ (Vite 6) and npm
- Dependencies are pinned in `package.json` and `package-lock.json`; Three.js is bundled locally at exactly `0.128.0`.

## Install and run

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. The current Task 1 page is intentionally a blank scene shell. If WebGL initialization is unavailable, the page displays a readable fallback message.

## Build and test

```sh
npm run build
npm run preview
npm test
```

The Node suite includes the B1 rule regressions and Task 1 fixture/fixed-tick cadence checks; it does not require a browser or WebGL.

## Current B2 checkpoint

Task 1 code is implemented and its Node tests and Vite production build pass. Independent review and browser/manual smoke checks are pending. Do not start Task 2 until the Task 1 review is clean. See [the approved B2 plan](docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md), the [canonical B2 progress ledger](docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md), the [detailed SDD execution ledger](.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/progress.md), and [README_FIRST.txt](README_FIRST.txt) for the resume checkpoint.

All files in `sources/` are read-only reference material.
