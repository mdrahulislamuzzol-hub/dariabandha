# Dariabandha B2 Task 4 Resume Prompt

Use this instruction after connecting the Dariabandha GitHub repository and adding the owner-provided master plan to the new project instructions.

## Objective

Continue the Dariabandha game build at **B2 Task 4 — Basic HUD, Reset, and B2 Acceptance/Handoff**. First inspect the actual repository state and reconcile it with the checkpoint below. Do not redo completed work. Do not start B3 or any later milestone.

## Repository checkpoint

- Repository: `https://github.com/mdrahulislamuzzol-hub/dariabandha`
- Branch: `codex/dariabandha-b1`
- B2 implementation base: `e6f02a7` (Task 3 implementation `082b3c6` plus reviewed checkpoint `e6f02a7`)
- Tasks 1–3 were independently reviewed, committed, and pushed. A later documentation-only handoff commit may be ahead of `e6f02a7`; inspect `git log` and `git status` before coding.
- Task 4 was stopped before any implementation edits. The worktree was clean at `e6f02a7`; no partial Task 4 code/tests need to be resumed or discarded.
- The user authorized continuing the approved B2 work and keeping GitHub current. Commit and push each task only after a clean independent review.

## Read these files first

1. Repository `AGENTS.md` and the new project instructions. Treat every file under `sources/` as read-only and do not edit synced project files.
2. `README_FIRST.txt`.
3. `docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md` in full.
4. Canonical status: `docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md`.
5. Detailed execution log and reports: `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/`.
6. Compare the supplied v2.0 master plan and v2.1 addendum with `master.txt` and their copies in `sources/`; the repository notes that root `master.txt` omits the B1–B9 table in v2.0 §23. Record any mismatch in the canonical ledger. Never change `sources/` or `master.txt`.

## Completed work: do not repeat

- **Task 1:** Local static Vite shell with bundled `three@0.128.0` and `vite@6.4.5`; deterministic 4v4 fixtures for attacker/guard/Sikka; fixed-tick coordinator uses B1 `advanceFrame`. Independently reviewed clean and pushed. 63 tests passed at that checkpoint.
- **Task 2:** B1-derived 4v4 court, geometry and eight state-driven primitive players, shape-coded markers, metre/world mapping and presentation interpolation. Independently reviewed clean and pushed. 68 tests passed at that checkpoint.
- **Task 3:** Normalized keyboard/touch controls, deterministic camera-cone tag targeting, role cameras, fixed human-seat identity and seven neutral AI seats. Independently reviewed clean and pushed. Current suite: 75 passing tests; production build passes.
- The user approved a narrow B1 §25 stopping-time correction in Task 3. Neutral braking now subtracts the role's maximum speed divided by its stop-time ticks; an attacker stops within 12 ticks and a guard within 5. The deviation and boundary tests are documented. Do not redo or broaden it.
- B1 remains renderer-free. Three.js, DOM, input, camera, and presentation code belong under browser modules.

## Task 4 scope

Implement only what the approved plan assigns to Task 4:

- Add a basic DOM HUD driven by B1 state/events: human role/team, phase, score, clock, stamina, and latest event/call.
- Add deterministic reset that recreates the same fixed-seed fixture and does not consume an extra toss draw.
- Add focused HUD/reset tests; run the full Node suite and production build.
- Complete and record B2 acceptance/handoff results. Keep the seven AI seats stationary. Do not add menus, active AI, other match modes, online behavior, or later milestones.
- Update the canonical ledger, detailed SDD report/checklist, plan status, README, and `README_FIRST.txt` with exact test/build results, known limitations, pushed commit, and next master-plan step.

## Workflow and acceptance limits

- Use a fresh implementer, a separate independent reviewer, fixes, and a fresh re-review. Keep task groups sequential.
- Do not commit/push Task 4 until its independent review is clean. Then push it to `codex/dariabandha-b1` and verify the remote commit and a clean worktree.
- Browser/WebGL, phone/touch, and screenshot checks for Tasks 1–3 were not completed because the previous environment denied local socket access. Task 4 must try available browser/manual verification; never report a check as passed unless it was actually run. If the environment still blocks it, record the exact limitation and leave B2 acceptance clearly incomplete pending that check.
- Existing build emits Vite's default advisory because the Three.js bundle exceeds 500 kB; this was recorded and is not itself a failure.
- B2 means the grey-box 4v4 playable scene. B3–B9 remain later milestones. Do not publish, host, merge, or connect external services.

## First actions in the new account

1. Inspect the branch, exact HEAD, remote tracking state, worktree cleanliness, and recent commits. Confirm Task 4 is still next; do not assume the checkpoint without checking.
2. Read the documents above and the owner-provided master plan. Report a concise checkpoint summary before edits.
3. Start Task 4 only, following its approved plan and review workflow. Do not redo Tasks 1–3.
