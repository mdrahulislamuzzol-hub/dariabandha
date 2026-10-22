# B2 SDD execution ledger

Canonical status is maintained in `docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md`. Keep this detailed implementation/review log synchronized with that authoritative ledger; do not use this file as a conflicting checkpoint.

Plan: `docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md`  
Base: `codex/dariabandha-b1` at `6cc52b2`
Workflow: sequential implementer → independent reviewer → fixes → fresh re-review. Do not start a task until its predecessor is cleanly reviewed. Do not push an unreviewed task.

## Task status

- Task 1 — Browser Shell and Fixed-Tick Bridge: independently reviewed clean, committed, and pushed as `6cc52b2`; reviewer reran Node tests (63/63) and production build successfully. HTTP/browser smoke was attempted but sandbox access denied local socket access. See `task-1-report.md`.
- Task 2 — 4v4 Grey-Box Court and Player View: independently reviewed clean (68/68 tests, production build, no code/scope findings); ready to commit/push. No commit hash yet. Manual browser/WebGL validation remains outstanding. See `task-2-report.md` and `task-2-manual-checklist.md`.
- Tasks 3–4: not started.

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
