# B2 Task 4 — Basic HUD, Reset, and B2 Acceptance/Handoff

Status: implementation committed and pushed as `8000c7c`, independently reviewed clean. Automated checks pass; B2 acceptance remains incomplete pending manual browser/WebGL and keyboard/touch validation.

## Implementation

- Added a compact DOM HUD showing the fixed human seat's role and team, B1 phase, score, half clock, stamina, and latest B1 event/call. The view formats public B1 state/events; it does not compute gameplay outcomes. Only the latest-call field is a live announcement region.
- Added a Reset match button that calls the existing coordinator reset, restores the fixed Quick Match 4v4 fixture, clears the coordinator's accumulated time and pending input, and preserves the same human seat. Reset does not add a toss draw.
- The seven non-human seats remain stationary. No active AI, menu system, alternate profiles, or later milestone content was added.

## Verification

- Focused Task 4 tests: 3/3 passed.
- Full Node suite: 78/78 passed.
- Production build: passed with Vite 6.4.5 (20 modules; 645.49 kB minified JS / 168.14 kB gzip). Vite emitted its standard advisory for bundles over 500 kB.
- `git diff --check`: passed.
- Independent reviewer found no actionable findings and independently reran the focused tests, full suite, build, and diff check.

## Manual browser acceptance

The Codex in-app browser initially could not connect to Vite, so earlier verification continued in Google Chrome on the host Windows device. On 2026-10-23, a final Codex in-app browser retry loaded `http://localhost:4173/` successfully with Vite bound to `0.0.0.0`. The accessibility tree and screenshot showed the game, live HUD, WebGL court, player figures, and touch controls. Sustained ArrowLeft input again transitioned the controlled attacker to Sikka with an attacker-left-court call. Sustained ArrowRight while Sikka visibly changed the court/camera view. Holding Shift with ArrowDown while controlling the attacker reduced stamina from 100% to 67% and the attacker reached the boundary, confirming sprint input/drain alongside movement. Clicking Tag while Sikka did not change the latest call. Reset restored Attacker / Team 1, phase `playing`, score 0–0, half 1 at 3:30, stamina 100%, and the same `Toss: Team 1 attacks` call. A side view displayed figures for both teams, but some overlapped; it does not establish that all eight are visible without overlap. The fixed page still offers no controlled Guard fixture. Physical touch, saved screenshots of both court ends, and startup/performance measurements remain unverified. B2 acceptance remains incomplete. Item-by-item results are recorded in `task-4-manual-checklist.md`.

No startup/frame-time/memory measurement was available. The >500 kB Vite advisory is informational and consistent with previous B2 builds. B2 acceptance must remain incomplete until the outstanding manual checks in the checklist are resolved.

## Handoff

The next master-plan milestone is B3 Match flow, but B3 must not begin until the remaining B2 manual acceptance checks pass. Root `master.txt` omits the B1–B9 table from supplied v2.0 §23; the mismatch is documented in the canonical B2 ledger. Files under `sources/` and root `master.txt` remain unchanged.
