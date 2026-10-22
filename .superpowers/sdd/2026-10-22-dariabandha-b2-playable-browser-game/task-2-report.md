# B2 Task 2 — 4v4 Grey-Box Court and Player View

Status: implementation independently reviewed clean and committed/pushed at checkpoint `c562467` (implementation commit `cd6acd1`). Manual browser/WebGL validation remains outstanding.

## Implementation

- `src/browser/greybox-view.js` converts B1 `createCourt('4v4')` into a plain geometry manifest, then uses Three.js to draw the ground, all B1 row/end/side lines, guard lane strips, and spine region.
- World coordinates are documented in the module: one Three.js world unit equals one B1 metre; x is unchanged, y is up, and world z is B1 z minus half the court length. This centres the view on the court without changing rule coordinates.
- Eight capsule-like primitive player groups are created from each B1 seat. Position, facing, role, controller, state, and stamina are read from B1 state. Team emblems, controller markers, and role markers use distinct shapes in addition to team colors. Attacker stamina is shown as a state-driven bar and player state as an active/non-active ring.
- `src/browser/main.js` now renders the grey-box scene and updates actor transforms with presentation interpolation. No device controls, role camera, HUD, reset, action animation, or AI logic was added; those remain later tasks/in-scope boundaries.
- The coordinator slices admitted time at B1 tick boundaries and calls the unchanged `advanceFrame` interface for each slice, retaining the immediate previous authoritative state. This keeps interpolation in the browser layer and leaves every file under `src/rules/` unchanged.

## Verification

- Focused Task 2 tests: 5 passed. They compare all 4v4 line endpoints and widths, lane/spine/ground geometry, all eight seat/team/controller/role/position mappings, interpolation math, immediate-previous-state capture across multi-tick frames, and Three.js actor markers/transforms.
- Full Node suite: 68 passed, 0 failed.
- Vite production build: passed with 17 modules. The minified JS chunk is 638.07 kB (165.57 kB gzip), so Vite emits its default >500 kB chunk advisory.
- `git diff --check`: passes; Git prints only its LF-to-CRLF working-copy advisories. The bundled Node runtime was invoked directly because npm was not available on PATH in this environment.
- No `sources/` files are changed. No browser/WebGL screenshot or manual scene review is claimed here.

## Review and next steps

- Independent review: clean; reviewer confirmed 68/68 tests and production build, with no code/scope findings. The task was subsequently committed/pushed through checkpoint `c562467`.
- Manual screenshot checklist: `task-2-manual-checklist.md`.
- Browser/WebGL screenshots remain outstanding; the checklist is prepared but not completed.
- Task 3 began after the Task 2 commit/push checkpoint.
