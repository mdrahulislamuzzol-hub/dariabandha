# B2 SDD execution ledger

Canonical status is maintained in `docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md`. Keep this detailed implementation/review log synchronized with that authoritative ledger; do not use this file as a conflicting checkpoint.

Plan: `docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md`  
Task 4 base: `codex/dariabandha-b1` at `e6f02a7` plus documentation checkpoint `d26065b`; implementation commit `8000c7c` is pushed.
Workflow: sequential implementer → independent reviewer → fixes → fresh re-review. Do not start a task until its predecessor is cleanly reviewed. Do not push an unreviewed task.

## Task status

- Task 1 — Browser Shell and Fixed-Tick Bridge: independently reviewed clean, committed, and pushed as `6cc52b2`; reviewer reran Node tests (63/63) and production build successfully. HTTP/browser smoke was attempted but sandbox access denied local socket access. See `task-1-report.md`.
- Task 2 — 4v4 Grey-Box Court and Player View: independently reviewed clean and committed/pushed through checkpoint `c562467` (implementation commit `cd6acd1`); 68/68 tests and production build passed. Manual browser/WebGL validation remains outstanding. See `task-2-report.md` and `task-2-manual-checklist.md`.
- Task 3 — Keyboard/Touch Control, Camera, and B1 Simulation: independently reviewed clean and committed/pushed through `e6f02a7` (implementation commit `082b3c6`); focused tests 7/7, full suite 75/75, production build passes. Includes owner-approved §25 stop-time correction. See `task-3-report.md`.
- Task 4 — Basic HUD, Reset, and B2 Acceptance/Handoff: implementation committed and pushed as `8000c7c`, independently reviewed clean. Focused tests 3/3; full suite 78/78; Vite build passes. B2 acceptance remains incomplete because browser/WebGL and keyboard/touch manual checks could not connect to the local server; see `task-4-report.md` and `task-4-manual-checklist.md`.

## Task 1 implementation notes

- Added a Vite static browser entry and pinned `three@0.128.0` dependency. The selected Vite pin is `6.4.5`.
- Created a blank Three.js scene with an explicit visible message if WebGL initialization fails.
- Added deterministic Quick Match 4v4 fixtures for a single human attacker, guard, or Sikka; the remaining seven seats are AI placeholders with neutral input. Seed 0 yields the team-0 opening toss using the existing B1 seeded toss. Fixture setup does not alter B1 or consume an additional draw.
- Added a DOM-free coordinator calling B1 `advanceFrame` with its fixed 60 Hz tick and five-step catch-up cap. The coordinator publishes authoritative B1 state/events plus interpolation alpha; it contains no movement/rule logic.
- Focused tests cover fixture reproducibility/seat counts/role mapping, 30/60/120 Hz state equality, the catch-up cap, and deterministic reset. Full Node suite: 63 passed, 0 failed.
- Dependency bootstrap completed after the initial npm install command exceeded its first command window: `three@0.128.0` and `vite@6.4.5` are installed, and `package-lock.json` was generated with npm's offline lockfile-only operation. `npm ls --depth=0` confirms those exact top-level versions.
- Production build: `npm run build` succeeds (Vite 6.4.5, 16 modules, bundled JS 533.58 kB / 134.94 kB gzip). Vite emits its default advisory that the minified main chunk exceeds 500 kB; no code splitting is added in this blank Task 1 shell.
- Browser smoke limitation: `vite preview` started at `http://127.0.0.1:4173/`, but an HTTP request from the sandbox failed with `An attempt was made to access a socket in a way forbidden by its access permissions.` An escalated local-preview attempt could not be completed during this task. No WebGL/manual browser behavior is claimed as verified.
- No `src/rules/` files or `sources/` files were changed. No plan scope deviation; the local browser smoke limitation is an environment constraint, not a design change.

## Task 2 implementation notes

- Rendered the B1 `createCourt('4v4')` ground, all row/end/side line geometry, guard lane strips, and spine region. Added eight primitive capsule-like players with B1 state-driven positions/facing/role/controller/state/stamina, shape-coded team/controller/role indicators, state rings, and attacker stamina bars.
- Coordinate contract: 1 world unit = 1 metre; x unchanged; y up; world z = B1 z − court length / 2. Thus B1 end z=0 maps to world z=−length/2 and the far end maps to +length/2.
- Transform interpolation is presentation-only. The browser coordinator divides admitted frame time at tick boundaries and calls the existing B1 `advanceFrame` API, retaining the prior authoritative tick for accurate interpolation. `src/rules/` stays unchanged; no rules or simulation policy changes.
- Focused Task 2 tests: 5/5. Full suite: 68/68. Production build succeeds; Vite notes the minified main chunk (638.07 kB, 165.57 kB gzip) exceeds its default 500 kB advisory threshold. Direct bundled Node invocation was used because npm was not on PATH.
- Manual browser/WebGL validation remains unperformed. The initial-spawn and both-court-ends screenshot checklist is `task-2-manual-checklist.md`.
- Independent review is clean: 68/68 tests and the production build pass; no code or scope findings. Task 2 is ready to commit/push, with commit hash pending. Manual browser/WebGL validation remains outstanding. No files under `sources/` changed.

## Task 3 implementation notes

- Added `src/browser/input.js`: keyboard movement (WASD/arrows), sprint and tag; pointer joystick and large sprint/tag buttons; normalized diagonal movement; deterministic nearest active opposing attacker selection inside the camera's horizontal view cone with distance then seat tie-break. Occlusion is not modeled. Because B1 does not define guard FOV, target visibility uses the attacker's 70° FOV as a documented B2 horizontal-cone inference. The same normalized input record reaches the B1 coordinator and simulation.
- Joystick pointer capture is released on pointerup, pointercancel, lost capture, and window blur. `touch-action: none` applies to the game surface and controls. A queued tag survives render frames until the next authoritative tick; coordinator consumes a tag at most once even when catch-up advances multiple ticks.
- Added `src/browser/role-camera.js` and browser-loop integration. Attacker camera uses B1 distance/height/pitch/FOV. Guard camera uses B1 distance/height and clamps its down-spine view to B1's ±25° yaw limit. Sikka inherits guard distance/height/yaw as a clearly labeled B2 presentation inference because B1 has no Sikka camera constants.
- Coordinator stores the human seat once, so role transitions never change the controlled identity. The test applies a B1 tag/daan transition that makes attacker seat 0 Sikka and confirms the same seat remains human. Only the human seat is supplied to B1; all seven AI seats receive no input.
- Focused Task 3 suite: 7/7. Full Node suite: 75/75. Vite production build passes (19 modules, 643.60 kB minified / 167.50 kB gzip) with default >500 kB advisory. Manual WebGL/browser/touch-device checks were not possible in this execution; no live behavior claim is made.
- §25 source wording: “Attacker — Time to run speed / stop time — 18 ticks / 12 ticks” and “Guard — Time to speed / stop time — 6 ticks / 5 ticks.” Initial measurement showed B1's proportional decrement left 2.252772 m/s from a 6.4 m/s attacker after 12 neutral ticks. The owner approved a scoped deviation in `src/rules/simulation.js`: neutral braking now subtracts `roleTopSpeed / stopTimeTicks` each tick. Tests verify a top-speed attacker reaches zero on tick 12 and a top-speed guard reaches zero on tick 5. Acceleration, movement caps, stamina and other rules are unchanged.
- Independent Task 3 review is clean; reviewer reran 75/75 tests and production build. The review's plan-status and window-blur coverage suggestions were addressed. No `sources/` files changed. Task 3 was committed and pushed through `e6f02a7`. Next: start Task 4 from the approved plan.

## Task 4 implementation notes

- Added `src/browser/hud.js` to format the controlled player's role/team, B1 phase, score, clock/half, stamina, and latest call/event from public state. `index.html` provides the DOM fields; `main.js` updates them at initialization and after each authoritative frame. Only the latest-call field is a live announcement region.
- The reset button reconstructs the exact fixed-seed Quick Match fixture, clears pending input/accumulator state, and retains the same human seat. Tests verify the reset state equals the original, seed/RNG state is unchanged beyond the single opening toss, and only one toss event exists.
- Focused Task 4 tests: 3/3. Full bundled-Node suite: 78/78. Vite 6.4.5 production build: 20 modules, 645.49 kB minified JS / 168.14 kB gzip; default >500 kB advisory remains. `git diff --check` passes. Independent review is clean and independently verified tests/build.
- Browser QA attempt: Vite started at `http://127.0.0.1:4173/`; the Codex in-app browser timed out (`ERR_CONNECTION_TIMED_OUT`) even when the server was run outside the sandbox. WebGL, scene screenshots, keyboard play, and phone/touch play were not verified. No device, frame-time, or memory measurements were available. See `task-4-manual-checklist.md`.
- Task 4 implementation commit `8000c7c` is pushed. The code review passed; the browser acceptance gate did not. The seven inactive AI seats remain stationary. Do not begin B3 until outstanding B2 manual checks pass.
