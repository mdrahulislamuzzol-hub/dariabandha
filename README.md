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

For local manual checks, deterministic role fixtures are available without adding a player-facing menu: append `?humanRole=guard` or `?humanRole=sikka` to the local URL. Use `?humanRole=guard&tagTest=1` to place one stationary opponent in a legal tag window and verify the B1 tag result.

## Build and test

```sh
npm run build
npm run preview
npm test
```

The Node suite includes B1 rule regressions and B2 fixture, cadence, geometry, controls, HUD, and reset checks; it does not require a browser or WebGL.

## Current B2 checkpoint

Task 4's HUD and deterministic reset implementation is independently reviewed and pushed to `codex/dariabandha-b1` as `8000c7c`. A browser-check follow-up spaces attackers across their entry box and exposes local-only Guard/Sikka fixtures plus a tag test setup. The full suite and production build results for the follow-up are recorded in the B2 ledger.

B2 acceptance remains incomplete. Host Chrome and the Codex in-app browser have confirmed the WebGL scene, HUD, attacker/Sikka/Guard keyboard behavior, pointer joystick movement, sprint stamina drain, valid Tag result in the local tag fixture, and reset. The initial attacker overlap was fixed. The current camera view still does not show all eight players without occlusion; physical phone/touch input and saved screenshots of both court ends remain unverified. Startup/performance instrumentation is not part of this grey-box page. The seven AI seats remain stationary placeholders, as required for B2. See [the approved B2 plan](docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md), the [canonical B2 progress ledger](docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md), the [detailed SDD execution ledger](.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/progress.md), and [README_FIRST.txt](README_FIRST.txt) for the current handoff.

After completing B2's outstanding manual browser checks, the next master-plan milestone is B3 Match flow. Do not begin B3 until B2 acceptance is complete.

All files in `sources/` and root `master.txt` are read-only reference material.
