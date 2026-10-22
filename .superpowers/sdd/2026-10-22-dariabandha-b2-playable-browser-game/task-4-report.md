# B2 Task 4 — Basic HUD, Reset, and B2 Acceptance/Handoff

Status: Task 4 implementation `8000c7c` was independently reviewed and pushed. A browser-verification follow-up fixed overlapping attacker spawns and exposed local Guard/Sikka fixtures plus a valid-tag test setup. The follow-up passes 81/81 tests and the production build; B2 acceptance remains incomplete pending a few device/visual checks.

## Implementation

- Added a compact DOM HUD showing the fixed human seat's role and team, B1 phase, score, half clock, stamina, and latest B1 event/call. The view formats public B1 state/events; it does not compute gameplay outcomes. Only the latest-call field is a live announcement region.
- Added a Reset match button that calls the existing coordinator reset, restores the fixed Quick Match 4v4 fixture, clears the coordinator's accumulated time and pending input, and preserves the same human seat. Reset does not add a toss draw.
- Browser-check follow-up: attackers now have deterministic separate entry positions in initialization and counter-attack resets. The local page accepts `?humanRole=guard` and `?humanRole=sikka` for the deterministic fixtures; `?humanRole=guard&tagTest=1` places one inactive opponent in a legal stationary tag window for manual QA. These remain local development parameters, not a player-facing menu.
- The seven non-human seats remain stationary. No active AI, menu system, alternate profiles, or later milestone content was added.

## Verification

- Full Node suite after the browser-check fixes: 81/81 passed, including unique attacker spawn positions, the 4v4 counter-attack reset formation, browser fixture selection, and a complete guard tag scenario.
- Production build: passed with Vite 6.4.5 (20 modules; 646.31 kB minified JS / 168.42 kB gzip). Vite emitted its standard advisory for bundles over 500 kB.
- `git diff --check`: passed.
- Independent reviewer found no actionable findings and independently reran the focused tests, full suite, build, and diff check.

## Manual browser acceptance

The Codex in-app browser initially could not connect to Vite, so earlier verification continued in Google Chrome on the host Windows device. On 2026-10-23, the in-app browser loaded `http://localhost:4173/` successfully with Vite bound to `0.0.0.0`. It confirmed the live HUD, WebGL court, attacker-to-Sikka boundary transition, Sikka and Guard keyboard behavior, and sprint stamina drain during movement. The new Guard fixture showed `Guard / Team 2`; clicking Tag in `?humanRole=guard&tagTest=1` showed tag contact followed by `Tag: seat 0 out (valid-contact)`, then the controlled Guard became an attacker. Reset on the default fixture restored Attacker / Team 1, `playing`, 0–0, half 1 at 3:30, stamina 100%, and `Toss: Team 1 attacks`. Source review found all four initial attackers had shared one position; spawn and counter-attack reset positions are now separated. The camera still occludes some actors in a single view, so visual confirmation of all eight remains open. Physical touch and saved screenshots of both court ends also remain unverified. No startup/performance measurements were recorded. Item-by-item results are in `task-4-manual-checklist.md`.

No startup/frame-time/memory measurement was recorded. The >500 kB Vite advisory is informational and consistent with previous B2 builds. B2 acceptance must remain incomplete until the outstanding manual checks in the checklist are resolved.

## Handoff

The next master-plan milestone is B3 Match flow, but B3 must not begin until the remaining B2 manual acceptance checks pass. Root `master.txt` omits the B1–B9 table from supplied v2.0 §23; the mismatch is documented in the canonical B2 ledger. Files under `sources/` and root `master.txt` remain unchanged.
