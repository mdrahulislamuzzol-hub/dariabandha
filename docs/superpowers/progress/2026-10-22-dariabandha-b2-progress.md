# Dariabandha B2 Progress Ledger

**Status:** Task 1 implementation is independently reviewed clean and ready to commit/push; Tasks 2–4 have not started.
**Plan:** `docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md`  
**B2 implementation base:** branch `codex/dariabandha-b1`, commit `1a105f3`. B1 is complete at `113d739` (59 tests passing, independent review clean).
**B2 workflow:** sequential fresh implementer → independent reviewer → fixes → fresh re-review, then commit/push before beginning the next task.

This file is the **canonical B2 progress/status ledger**. `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/progress.md` and `task-1-report.md` are detailed execution records and must stay consistent with this checkpoint.

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
| 2 | 4v4 grey-box court and player view | Not started | — | — |
| 3 | Keyboard/touch control, camera, and B1 simulation | Not started | — | — |
| 4 | Basic HUD, reset, acceptance, and handoff | Not started | — | — |

## Task 1 Checkpoint

- Added a local Vite browser shell with Three.js pinned to `0.128.0` and bundled from the local npm dependency; Vite is pinned to `6.4.5`. `package-lock.json` is present.
- Added the blank scene/WebGL failure message, fixed 4v4 Quick Match fixtures for a human attacker/guard/Sikka with seven neutral AI placeholders, and a DOM-free coordinator using B1 `advanceFrame`.
- Verification: `npm test` passes 63/63; `npm run build` succeeds. Vite reports the default advisory for a 533.58 kB minified JS chunk (134.94 kB gzip). `git diff --check` is clean apart from Git's line-ending advisory.
- Browser smoke remains incomplete: local HTTP access was blocked by the sandbox socket permission. No manual WebGL/browser result is claimed.
- Detailed files and known limitations are listed in `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-1-report.md`.

## Review Log

- First plan audit found important scope mismatch: initial draft wrongly expanded B2 into later AI/content steps and misread §23 because `master.txt` omits its milestone table. Rewritten to follow authoritative v2.0 DOCX §23 and v2.1 addendum.
- Second plan review found three implementation clarifications: pin Three.js r128 and document local bundling in place of cdnjs; identify the Sikka camera as a B2 presentation inference; keep manual browser checks on the fixed Quick Match fixture. The plan was updated with all three.
- Final independent plan review: clean, no actionable findings. Task 1 independent implementation review: clean, no actionable findings. Reviewer reran the 63-test Node suite and production build successfully; the local HTTP smoke limitation is accurately recorded. Tasks 2–4 remain not started.

## Handoff Rule

Before each task, read the plan and this ledger, confirm branch/HEAD/working tree, and compare the owner-supplied master plan with read-only `sources/` and `master.txt`. Task 1 is cleanly reviewed; do not begin Task 2 until it is committed and pushed. Never repeat B1 unless a concrete regression is found and separately documented.
