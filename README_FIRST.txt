DARIABANDHA — CURRENT HANDOFF

Updated: 2026-10-22
Repository: https://github.com/mdrahulislamuzzol-hub/dariabandha
Current branch: codex/dariabandha-b1
Current checkpoint: B1 at 113d739; B2 plan and handoff are being committed now; B2 implementation not started
Workflow: sequential subagent-driven implementation, independent review, fixes and fresh re-review for each task. Push each reviewed task to GitHub.

B1 status
- B1 renderer-free deterministic rules core is complete. Its approved task groups and the user-requested Sikka/spine vacancy, smaller-format guard placement, seeded toss, and constants-test follow-ups are recorded in `.superpowers/sdd/2026-10-22-dariabandha-b1-rules-core/`.
- Latest verified suite: 59 tests pass. The independent review of the latest B1 follow-up is clean.
- B1 plan: `docs/superpowers/plans/2026-10-22-dariabandha-b1-rules-core.md`.

Next work
- Read `docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md` in full. It defines four sequential B2 task groups, scope boundaries, interfaces, acceptance gates, and the review/push process.
- The master plan formally defines B2 as Grey-box game in §23. The repository plan breaks B2 into four reviewed tasks; it does not expand B2 into later AI, menu, presentation, tutorial, performance/release, or online milestones.
- Note: root `master.txt` omits the full B1–B9 table. Read the supplied read-only v2.0 and v2.1 DOCX sources in `sources/` before implementation and compare them with `master.txt`.
- Start at B2 Task 1 only after confirming the current branch/HEAD and clean working tree. Do not redo B1. Use the B1 APIs/tests as existing contracts and update the B2 ledger/report after every task.
- Before implementation, compare the master plan the owner supplies with the read-only reference text in `master.txt` and any `sources/` files. Record any differences in the B2 ledger. Treat all files under `sources/` as read-only.

Safety and scope
- Do not start later B3 content, online play, publish/host, merge, or connect external services without explicit approval.
- Keep the rules core renderer-independent. Browser/Three.js code belongs in presentation/platform modules; no renderer imports in `src/rules/`.
- Keep GitHub current after each task has passed independent review. Do not push an unreviewed task.
