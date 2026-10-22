# Dariabandha B2 Progress Ledger

**Status:** Task 1 is reviewed, committed, and pushed. Task 2 implementation and automated review are clean; commit/push pending. Manual browser/WebGL validation remains outstanding. Tasks 3–4 have not started.
**Plan:** `docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md`  
**B2 Task 2 base:** branch `codex/dariabandha-b1`, commit `6cc52b2`. B1 is complete at `113d739` (59 tests passing, independent review clean).
**B2 workflow:** sequential fresh implementer → independent reviewer → fixes → fresh re-review, then commit/push before beginning the next task.

This file is the **canonical B2 progress/status ledger**. `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/progress.md` and the task reports/checklists are detailed execution records and must stay consistent with this checkpoint.

## Source and Scope Checkpoint

- Read-only source review completed: v2.0 DOCX §23 defines B1–B9; B2 is specifically Grey-box game and calls for capsule players, court lines, movement, stamina, camera, keyboard/touch, basic HUD, and playable 4v4 vs inactive AI. The v2.1 addendum says its work lands in existing B6/B7 steps and adds no build steps.
- `master.txt` at repository root does not include the full B1–B9 build-order table. On a new account, compare the supplied v2.0 DOCX and v2.1 addendum, both under `sources/`, with the text snapshot before implementation. `sources/` and `master.txt` are read-only.
- B1 already implemented deterministic rules, tag/hold/vacancy, scoring, match flow, clocks, transitions, toss, and replay. B2 consumes these interfaces; it does not reimplement them.
- B2 explicitly uses seven neutral/inactive AI seats. Active AI is master-plan B4, not B2. Online networking is B9/v1.1. Public hosting, accounts, paid services, publishing, and external integrations are not part of B2.
- B2 preserves the B1 rules core as renderer-free. Current B1 boundaries include `createMatch`, `stepMatch`, `advanceFrame`, `createCourt`, `recordReplayHeader`, `createReplay`, `recordTickInputs`, and `replayMatch`.

## B2 Task Status

| Task | Scope | Status | Implementation commit | Independent review |
|---|---|---|---|---|
| 1 | Browser shell and fixed-tick bridge | Implemented; reviewed clean | `4a6c923` (implementation `914eb39`) | Clean; no actionable findings |
| 2 | 4v4 grey-box court and player view | Implemented; reviewed clean | `cd6acd1` | Clean; no code/scope findings |
| 3 | Keyboard/touch control, camera, and B1 simulation | Not started | — | — |
| 4 | Basic HUD, reset, acceptance, and handoff | Not started | — | — |

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
- `git diff --check` passes with only Git's existing LF-to-CRLF working-copy advisories. No `sources/` files were edited. The independent Task 2 review is clean: reviewer confirmed 68/68 tests, production build, and no code/scope findings. Commit/push is pending; no commit hash is recorded yet.
- Manual screenshot/WebGL validation remains outstanding. The checklist for initial spawn and both court ends is recorded in `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-2-manual-checklist.md`; no live browser result is claimed.

## Review Log

- First plan audit found important scope mismatch: initial draft wrongly expanded B2 into later AI/content steps and misread §23 because `master.txt` omits its milestone table. Rewritten to follow authoritative v2.0 DOCX §23 and v2.1 addendum.
- Second plan review found three implementation clarifications: pin Three.js r128 and document local bundling in place of cdnjs; identify the Sikka camera as a B2 presentation inference; keep manual browser checks on the fixed Quick Match fixture. The plan was updated with all three.
- Final independent plan review: clean, no actionable findings. Task 1 independent implementation review: clean, no actionable findings. Reviewer reran the 63-test Node suite and production build successfully; the local HTTP smoke limitation is accurately recorded. Tasks 3–4 remain not started.
- Task 2 independent implementation review: clean, no code/scope findings; reviewer confirmed 68/68 tests and production build. Browser/WebGL screenshots remain outstanding. Task 2 is ready to commit/push, but no commit hash is recorded yet.

## Handoff Rule

Before each task, read the plan and this ledger, confirm branch/HEAD/working tree, and compare the owner-supplied master plan with read-only `sources/` and `master.txt`. Task 1 is cleanly reviewed and pushed. Task 2 is cleanly reviewed; commit/push it before Task 3. Manual browser/WebGL validation remains outstanding and must be reported accurately. Never repeat B1 unless a concrete regression is found and separately documented.
