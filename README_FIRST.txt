DARIABANDHA — CURRENT HANDOFF

Updated: 2026-10-22
Repository: https://github.com/mdrahulislamuzzol-hub/dariabandha
Current branch: codex/dariabandha-b1
Current checkpoint: B2 Tasks 1–3 independently reviewed, committed, and pushed on `codex/dariabandha-b1` through `e6f02a7`; B2 Task 4 has not started; manual browser/WebGL validation outstanding
Workflow: sequential subagent-driven implementation, independent review, fixes and fresh re-review for each task. Push each reviewed task to GitHub.

B1 status
- B1 renderer-free deterministic rules core is complete. Its approved task groups and the user-requested Sikka/spine vacancy, smaller-format guard placement, seeded toss, and constants-test follow-ups are recorded in `.superpowers/sdd/2026-10-22-dariabandha-b1-rules-core/`.
- Latest verified suite: 59 tests pass. The independent review of the latest B1 follow-up is clean.
- B1 plan: `docs/superpowers/plans/2026-10-22-dariabandha-b1-rules-core.md`.

Next work
- Read `docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md` in full. It defines four sequential B2 task groups, scope boundaries, interfaces, acceptance gates, and the review/push process.
- The master plan formally defines B2 as Grey-box game in §23. The repository plan breaks B2 into four reviewed tasks; it does not expand B2 into later AI, menu, presentation, tutorial, performance/release, or online milestones.
- Note: root `master.txt` omits the full B1–B9 table. Read the supplied read-only v2.0 and v2.1 DOCX sources in `sources/` before implementation and compare them with `master.txt`.
- B2 Task 1 adds a Vite/Three.js browser shell, deterministic 4v4 Quick Match attacker/guard/Sikka fixtures, and a DOM-free fixed-tick coordinator. Dependencies are pinned (`three@0.128.0`, `vite@6.4.5`); 63/63 tests and the build passed; independent review was clean. The local HTTP smoke check was blocked by sandbox socket permissions. Task 1 is pushed in commit `6cc52b2`.
- B2 Task 2 adds the B1-derived court, lane/spine markings, eight state-driven primitive players, shape-coded team/controller/role markers, stamina/state visuals, and transform interpolation. Focused checks pass 5/5 and full Node suite passes 68/68; production build succeeds with Vite's default >500 kB chunk advisory. Independent review is clean. Task 2 is committed/pushed through checkpoint `c562467`. Manual browser/WebGL validation remains outstanding. Its initial-spawn/both-ends screenshot checklist is `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-2-manual-checklist.md`.
- B2 Task 3 adds normalized keyboard/touch controls, deterministic camera-cone tag targeting, role cameras, persistent human-seat control, and seven neutral AI seats. The owner approved a scoped §25 stop-time fix in the B1 simulation: at maximum speed an attacker stops within 12 ticks and a guard within 5. Focused checks pass 7/7; full suite passes 75/75; production build passes with Vite's default >500 kB chunk advisory. Independent review is clean; the task is committed and pushed through `e6f02a7`. Details and the initial measured mismatch are in `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-3-report.md`.
- The canonical B2 status ledger is `docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md`; the detailed SDD ledger/report under `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/` must remain consistent with it.
- Do not redo B1. Use the B1 APIs/tests as existing contracts and update the canonical B2 ledger plus detailed task reports after every task. Exact current status and known limits are in `docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md` and `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/`.
- Next: begin B2 Task 4 only. No Task 4 code was started or left uncommitted at this checkpoint. First inspect branch/HEAD/status and the canonical ledger; do not redo Tasks 1–3. Before implementation, compare the master plan the owner supplies with the read-only reference text in `master.txt` and any `sources/` files. Record any differences in the B2 ledger. Treat all files under `sources/` as read-only.

Safety and scope
- Do not start later B3 content, online play, publish/host, merge, or connect external services without explicit approval.
- Keep the rules core renderer-independent. Browser/Three.js code belongs in presentation/platform modules; no renderer imports in `src/rules/`.
- Keep GitHub current after each task has passed independent review. Do not push an unreviewed task.
