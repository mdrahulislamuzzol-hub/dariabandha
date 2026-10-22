# Dariabandha

The renderer-independent B1 rules core is complete. B2 Tasks 1–4 now provide a local browser build, a state-driven 4v4 grey-box court and player view, keyboard/touch controls, role cameras, a basic HUD, and deterministic reset. The seven non-human seats remain stationary placeholders; active AI belongs to B4.

## Requirements

- Node.js 20.19+ (Vite 6) and npm
- Dependencies are pinned in `package.json` and `package-lock.json`; Three.js is bundled locally at exactly `0.128.0`.

## Install and run

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. The page runs a fixed Quick Match 4v4 fixture. If WebGL initialization is unavailable, it displays a readable fallback message.

## Build and test

```sh
npm run build
npm run preview
npm test
```

The Node suite includes B1 rule regressions and B2 fixture, cadence, geometry, controls, HUD, and reset checks; it does not require a browser or WebGL.

## Current B2 checkpoint

Task 4's HUD and deterministic reset implementation is independently reviewed and pushed to `codex/dariabandha-b1` as `8000c7c`. The full suite passes 78/78 and the production build succeeds. Vite emits its default advisory because the Three.js bundle is 645.49 kB minified (168.14 kB gzip).

B2 acceptance remains incomplete. Chrome on the host device confirmed the WebGL scene, HUD, attacker keyboard movement, pointer-joystick movement, and reset to the original setup/toss. All-eight-player visibility, Sikka keyboard behavior, a controlled Guard fixture, Sprint/Tag effects, physical phone/touch input, saved court-end screenshots, and startup/performance measurements remain unverified. The seven AI seats are stationary placeholders, as required for B2. See [the approved B2 plan](docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md), the [canonical B2 progress ledger](docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md), the [detailed SDD execution ledger](.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/progress.md), and [README_FIRST.txt](README_FIRST.txt) for the current handoff.

After completing B2's outstanding manual browser checks, the next master-plan milestone is B3 Match flow. Do not begin B3 until B2 acceptance is complete.

All files in `sources/` and root `master.txt` are read-only reference material.
