DARIABANDHA — CURRENT HANDOFF

Updated: 2026-10-23
Repository: https://github.com/mdrahulislamuzzol-hub/dariabandha
Current branch: codex/dariabandha-b1
Task 4 implementation commit: 8000c7c (basic HUD and deterministic reset; independent review clean)
Current status: Task 4 implementation commit `8000c7c` is pushed to `codex/dariabandha-b1`; 78/78 Node tests pass and the production build succeeds. B2 acceptance is INCOMPLETE pending browser/WebGL and keyboard/touch manual checks.
Next: complete B2 manual browser checks. Only after B2 acceptance is complete, proceed to B3 Match flow. Do not start B3 or any later milestone yet.

B1 status
- B1 renderer-free deterministic rules core is complete. The approved implementation/review records are under `.superpowers/sdd/2026-10-22-dariabandha-b1-rules-core/`.
- The owner-approved B1 stop-time correction was limited to neutral braking: attacker stop within 12 ticks and guard stop within 5. Do not broaden or redo it.

B2 status
- Task 1: local Vite/Three.js browser shell, deterministic Quick Match fixtures, and fixed-tick bridge; independently reviewed and pushed.
- Task 2: B1-derived 4v4 grey-box court and eight state-driven primitive players; independently reviewed and pushed.
- Task 3: normalized keyboard/touch inputs, role cameras, deterministic targeting, persistent human seat, and seven neutral AI seats; independently reviewed and pushed. AI remains stationary in B2.
- Task 4: basic HUD for human role/team, phase, score, clock, stamina, and latest B1 call; reset recreates the fixed-seed fixture without an extra toss draw. Independent review is clean. Focused tests pass 3/3; full suite passes 78/78; production build passes (645.49 kB minified JS, 168.14 kB gzip) with Vite's default >500 kB advisory.
- Browser attempt: Vite reported ready at `http://127.0.0.1:4173/`. The Codex in-app browser timed out with `ERR_CONNECTION_TIMED_OUT`, including after the server was started outside the sandbox. WebGL startup, screenshots, keyboard play, and phone/touch play are not verified. See `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-4-manual-checklist.md`.
- Earlier Task 1–3 browser/WebGL checks also remain outstanding; Task 2's checklist is `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/task-2-manual-checklist.md`.

Source and scope authority
- The owner-supplied v2.0 master plan and v2.1 addendum were compared with repository copies under `sources/`; their SHA-256 hashes match exactly. Both `sources/` and root `master.txt` are read-only.
- Root `master.txt` omits the B1–B9 build-order table in v2.0 §23. The authoritative v2.0 DOCX defines B2 as Grey-box game and B3 as Match flow; the v2.1 addendum adds no build steps and assigns its accepted presentation items to existing B6/B7 work. This mismatch is recorded in the canonical ledger.
- B2 is only the playable grey-box 4v4 Quick Match fixture. The seven non-human seats stay neutral/stationary. Active AI, full modes/menus, online play, publishing, and all B3–B9 work remain out of scope.

Required handoff records: `docs/superpowers/progress/2026-10-22-dariabandha-b2-progress.md`, `.superpowers/sdd/2026-10-22-dariabandha-b2-playable-browser-game/progress.md`, and the Task 4 report/checklist in that SDD folder.
