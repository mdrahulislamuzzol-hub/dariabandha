# Dariabandha B2 Progress Ledger

**Status:** Tasks 1–4 are implemented and independently reviewed. Task 4 implementation commit `8000c7c` is pushed; browser-check fixes have been implemented and verified with 81/81 tests and a passing production build. B2 acceptance is **incomplete** pending all-eight visibility in a single view, physical touch, and saved court-end screenshots.
**Plan:** `docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md`  
**Task 4 base:** branch `codex/dariabandha-b1`, reviewed Task 3 checkpoint `e6f02a7`, plus the documentation-only resume checkpoint `d26065b`. Task 4 implementation commit: `8000c7c`. B1 is complete; the current cumulative suite has 81 passing tests.
**B2 workflow:** sequential fresh implementer → independent reviewer → fixes → fresh re-review, then commit/push before beginning the next task.

This file is the **canonical B2 progress/status ledger**. `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/progress.md` and the task reports/checklists are detailed execution records and must stay consistent with this checkpoint.

## Source and Scope Checkpoint

- Read-only source review completed: v2.0 DOCX §23 defines B1–B9; B2 is specifically Grey-box game and calls for capsule players, court lines, movement, stamina, camera, keyboard/touch, basic HUD, and playable 4v4 vs inactive AI. The v2.1 addendum says its work lands in existing B6/B7 steps and adds no build steps.
- Root `master.txt` omits the B1–B9 build-order table in v2.0 §23. The owner-supplied v2.0 and v2.1 DOCX files were compared with the repository copies under `sources/`; SHA-256 matches exactly for each file (`3418c28742d9d66b17419a900f9fb7934af3dc3df6efe44ac6d0fadfabea6fcd` and `70dbda9696b9da44c2ad1797e7c96af9d6a584852e663beeaaed8fc55312ef5c`). The supplied §23 defines B2 as Grey-box game and B3 as Match flow. `sources/` and `master.txt` are read-only.
- B1 already implemented deterministic rules, tag/hold/vacancy, scoring, match flow, clocks, transitions, toss, and replay. B2 consumes these interfaces; it does not reimplement them.
- B2 explicitly uses seven neutral/inactive AI seats. Active AI is master-plan B4, not B2. Online networking is B9/v1.1. Public hosting, accounts, paid services, publishing, and external integrations are not part of B2.
- B2 preserves the B1 rules core as renderer-free. Current B1 boundaries include `createMatch`, `stepMatch`, `advanceFrame`, `createCourt`, `recordReplayHeader`, `createReplay`, `recordTickInputs`, and `replayMatch`.

## B2 Task Status

| Task | Scope | Status | Implementation commit | Independent review |
|---|---|---|---|---|
| 1 | Browser shell and fixed-tick bridge | Implemented; reviewed clean | `4a6c923` (implementation `914eb39`) | Clean; no actionable findings |
| 2 | 4v4 grey-box court and player view | Implemented, reviewed, committed, and pushed | `cd6acd1` (checkpoint `c562467`) | Clean; no code/scope findings |
| 3 | Keyboard/touch control, camera, and B1 simulation | Implemented, independently reviewed, committed, and pushed | `082b3c6` (checkpoint `e6f02a7`) | Clean; no other findings |
| 4 | Basic HUD, reset, acceptance, and handoff | Implemented, independently reviewed, committed/pushed; manual acceptance incomplete | `8000c7c` | Clean; 78/78 tests and build verified |

## Task 1 Checkpoint

- Added a local Vite browser shell with Three.js pinned to `0.128.0` and bundled from the local npm dependency; Vite is pinned to `6.4.5`. `package-lock.json` is present.
- Added the blank scene/WebGL failure message, fixed 4v4 Quick Match fixtures for a human attacker/guard/Sikka with seven neutral AI placeholders, and a DOM-free coordinator using B1 `advanceFrame`.
- Verification: `npm test` passes 63/63; `npm run build` succeeds. Vite reports the default advisory for a 533.58 kB minified JS chunk (134.94 kB gzip). `git diff --check` is clean apart from Git's line-ending advisory.
- Browser smoke remains incomplete: local HTTP access was blocked by the sandbox socket permission. No manual WebGL/browser result is claimed.
- Detailed files and known limitations are listed in `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-1-report.md`.

## Task 2 Implementation Checkpoint

- Added a Three.js grey-box view driven by B1 `createCourt('4v4')` and current B1 player state. It renders the ground, row/end/side lines, guard lane strips, spine region, and eight primitive capsule-like athletes.
- World convention: one world unit per metre; x retains B1 court-width coordinates; y is up; world z is B1 z minus half the court length, placing the court centre at z=0. Actor positions, role, controller, state ring, and stamina bar are read from B1 state. Team, role, and controller use distinct shape markers as well as color.
- Added interpolation only for presentation transforms between authoritative states. The browser coordinator slices admitted frame time at tick boundaries while using the unchanged B1 `advanceFrame` API, retaining the immediately previous state for multi-tick frames and across render frames with no new tick. No `src/rules/` changes are included.
- Focused browser tests cover every court line endpoint/width, all lane/spine geometry, all eight actor mappings, role/controller markers, transform interpolation, and the previous-tick bridge. Full suite: 68/68 pass. Vite production build succeeds; the bundled minified JS is 638.07 kB (165.57 kB gzip), producing Vite's default >500 kB advisory.
- `git diff --check` passes with only Git's existing LF-to-CRLF working-copy advisories. No `sources/` files were edited. The independent Task 2 review is clean: reviewer confirmed 68/68 tests, production build, and no code/scope findings. Task 2 is committed/pushed through checkpoint `c562467`.
- Manual screenshot/WebGL validation remains outstanding. The checklist for initial spawn and both court ends is recorded in `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-2-manual-checklist.md`; no live browser result is claimed.

## Task 3 Implementation Checkpoint

- Added a renderer-independent browser input adapter for WASD/arrow movement, sprint, and one-shot tag; normalized joystick vectors use the same B1 per-seat `{ move, sprint, tag }` contract. Pointer controls capture the active pointer, release on up/cancel/lost capture/window blur, and use `touch-action: none` over the game surface. Keyboard and touch map to identical normalized tick inputs in the focused tests.
- Deterministic tag target selection chooses the nearest active opposing attacker inside the camera's horizontal view cone, breaking equal-distance ties by lower seat. Occlusion is not modeled in the grey-box. Since B1 does not specify guard FOV, target visibility uses the attacker's 70° FOV as a B2 horizontal-cone inference. B1 remains the sole authority for tag legality, range, aim cone, cooldown and consequences.
- The fixed human seat is stored as match identity in the coordinator; role changes do not transfer control. Tests cover attacker-to-Sikka transition on the same seat and attacker/guard/Sikka fixtures. Seven AI seats receive no input. Camera follows B1 attacker and guard constants; guard/Sikka view direction is clamped to the B1 ±25° yaw limit. Sikka inheritance of guard camera distance, height, and yaw is explicitly labeled a B2 presentation inference.
- Focused Task 3 tests: 7/7 pass. Full Node suite: 75/75 pass. Production build passes (Vite transforms 19 modules; 643.60 kB minified JS / 167.50 kB gzip) with Vite's default >500 kB chunk advisory. No renderer, DOM or input code enters `src/rules/`; no files under `sources/` changed. Independent review is clean; reviewer reran tests/build and found no other issues. Window-blur regression confirms keys, held buttons, joystick state and pointer captures clear.
- §25 source wording says “Attacker — Time to run speed / stop time — 18 ticks / 12 ticks” and “Guard — Time to speed / stop time — 6 ticks / 5 ticks.” Initial measurement exposed an exponential B1 braking decrement that left 2.252772 m/s after 12 ticks from 6.4 m/s. The owner explicitly approved a scoped B1 tuning deviation: neutral braking now subtracts the role's top speed divided by its stop-time ticks, reaching zero by tick 12 for a sprinting attacker and tick 5 for a running guard. Focused regression tests cover both boundaries. No other movement/rule behavior was changed.
- Manual browser/WebGL/phone validation remains outstanding; no live browser result is claimed. The implementation report is `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-3-report.md`.

## Task 4 Implementation Checkpoint

- Added a basic DOM HUD driven by B1 state and events: controlled role/team, phase, score, half clock, stamina, and latest event/call. The screen-reader live region is limited to the call text so frame-by-frame clock/stamina changes are not announced continuously.
- Added a reset button that recreates the fixed Quick Match 4v4 fixture using its original seed and role setup. The controlled seat stays fixed; reset clears accumulated time/input and does not consume an extra toss draw.
- Browser-check fixes: source review found all four opening attackers shared one coordinate; initial and counter-attack reset formations now spread attackers across the entry box. Local-only `humanRole` query parameters expose deterministic Guard/Sikka fixtures without a menu. `?humanRole=guard&tagTest=1` places one stationary opponent in a legal tag window for QA.
- Full Node suite after fixes: 81/81. Vite production build passes (20 modules; 646.31 kB minified JS / 168.42 kB gzip) with its default >500 kB advisory. `git diff --check` passes.
- In-app browser verification now confirms WebGL, the HUD, attacker/Sikka/Guard keyboard controls, sprint stamina drain, a valid tag result in the Guard test fixture, and reset. The four opening attackers render in distinct positions, though the role camera still occludes some opponents in a single view. Physical touch and saved screenshots of both court ends remain unverified; no performance measurements were recorded. Exact details are in the Task 4 manual checklist.
- Task 4 implementation commit `8000c7c` is pushed; follow-up fixes and verification are recorded with the Task 4 report/checklist. Seven AI seats remain stationary. Do not start B3 before the remaining B2 acceptance checks pass.

## Review Log

- First plan audit found important scope mismatch: initial draft wrongly expanded B2 into later AI/content steps and misread §23 because `master.txt` omits its milestone table. Rewritten to follow authoritative v2.0 DOCX §23 and v2.1 addendum.
- Second plan review found three implementation clarifications: pin Three.js r128 and document local bundling in place of cdnjs; identify the Sikka camera as a B2 presentation inference; keep manual browser checks on the fixed Quick Match fixture. The plan was updated with all three.
- Final independent plan review: clean, no actionable findings. Task 1 independent implementation review: clean, no actionable findings. Reviewer reran the 63-test Node suite and production build successfully; the local HTTP smoke limitation is accurately recorded.
- Task 2 independent implementation review: clean, no code/scope findings; reviewer confirmed 68/68 tests and production build. Task 2 was committed/pushed through checkpoint `c562467`. Browser/WebGL screenshots remain outstanding.
- Task 3 implementation is independently reviewed clean with 75/75 tests and a passing production build. The owner-approved stop-time deviation is documented in the plan and report. Task 3 is pushed through `e6f02a7`; Task 4 is next.
- Task 4 implementation review is clean; its original 78-test suite and production build pass, and commit `8000c7c` is pushed. The follow-up fixed attacker spawn overlap and made Guard/Sikka fixtures reachable; 81/81 tests/build pass and Guard/Tag browser checks are confirmed. B2 acceptance remains incomplete pending single-view player visibility, physical touch, and screenshots.

## Handoff Rule

Before each task, read the plan and this ledger, confirm branch/HEAD/working tree, and compare the owner-supplied master plan with read-only `sources/` and `master.txt`. Tasks 1–4 are implemented and the Task 4 follow-up is recorded in the report/checklist. B2 acceptance remains incomplete pending single-view visibility, physical touch, and saved court-end screenshots. After B2 acceptance only, the next master-plan step is B3 Match flow. Never repeat completed tasks unless a concrete regression is found and separately documented.
