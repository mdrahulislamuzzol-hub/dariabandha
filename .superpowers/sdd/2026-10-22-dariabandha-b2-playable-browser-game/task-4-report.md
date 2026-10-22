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

The Codex in-app browser could not connect to Vite. At the user's request, verification continued in Google Chrome on the host Windows device. Chrome loaded `http://127.0.0.1:4173/`; its accessibility tree showed the game and changing HUD values, and screenshots showed the WebGL court, lines, role markers, player figures, and touch controls. A keyboard direction input moved the controlled attacker out of court and the HUD transitioned the seat to Sikka with an attacker-boundary call. A pointer drag on the movement joystick visibly changed the scene/camera position. After these gameplay changes, clicking Reset restored Attacker / Team 1, phase `playing`, score 0–0, half 1 at 3:30, stamina 100%, and the same `Toss: Team 1 attacks` call seen at the initial setup. B2 acceptance remains incomplete: all eight players were not visually confirmed, keyboard movement as Sikka was inconclusive, the fixed page offers no controlled Guard fixture, Sprint/Tag effects and physical touch were not confirmed, both court-end screenshots were not saved, and startup/performance timings were not measured. Item-by-item results are recorded in `task-4-manual-checklist.md`.

No startup/frame-time/memory measurement was available. The >500 kB Vite advisory is informational and consistent with previous B2 builds. B2 acceptance must remain incomplete until the manual checks can run in a browser that can reach the local server.

## Handoff

The next master-plan milestone is B3 Match flow, but B3 must not begin until the remaining B2 manual acceptance checks pass. Root `master.txt` omits the B1–B9 table from supplied v2.0 §23; the mismatch is documented in the canonical B2 ledger. Files under `sources/` and root `master.txt` remain unchanged.
