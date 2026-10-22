# B2 Task 3 — Keyboard/Touch Control, Camera, and B1 Simulation

Status: implementation independently reviewed clean; commit/push pending. Manual browser/WebGL checks remain outstanding.

## Implementation

- `src/browser/input.js` adds WASD/arrow movement, sprint, and one-shot tag inputs; a pointer joystick; and large pointer sprint/tag buttons. Both devices normalize to the same per-seat B1 input shape. The adapter normalizes diagonals and selects the nearest active opposing attacker inside the camera's horizontal view cone, breaking ties by lower seat. Occlusion is not modeled. Since B1 does not define guard FOV, target visibility uses the attacker's 70° FOV as a B2 horizontal-cone inference; B1 remains the only authority for legality, reach, tag aim cone, cooldown, and outcome.
- Pointer capture ends on up, cancel, lost capture, and window blur. The game surface and controls set `touch-action: none`. Tag is queued until an authoritative tick and consumed only once, even if a rendered frame advances several ticks.
- `src/browser/role-camera.js` uses B1 attacker camera distance/height/pitch/FOV and guard distance/height/yaw limit. Guard/Sikka views follow the central spine toward the opposing entry and clamp yaw to ±25°. The Sikka camera's use of guard limits is labeled a B2 presentation inference.
- The coordinator retains the initial human seat ID for the match, independent of changing roles. Only that seat receives input; the seven AI seats remain neutral. A role-transition test verifies the human attacker seat becomes Sikka while the controlled seat remains unchanged.
- A scoped, owner-approved B1 tuning deviation fixes stopping time in `src/rules/simulation.js`. Before the change, proportional braking left `6.4 × (11/12)^12 = 2.252772 m/s` after 12 neutral ticks. The source §25 wording is “Attacker — Time to run speed / stop time — 18 ticks / 12 ticks” and “Guard — Time to speed / stop time — 6 ticks / 5 ticks.” Braking now subtracts the role's top speed divided by the role's stop-time ticks, so a sprinting attacker stops on tick 12 and a running guard stops on tick 5. No other rules were changed.

## Verification

- Focused Task 3 tests: 7/7 pass. They cover device input parity, diagonal normalization, deterministic tie-breaking, pointer capture/cancellation/window blur, human-seat identity across role transition, role camera constants/inference, B1 movement/stamina and neutral AI, plus attacker/guard stop-time boundaries.
- Full Node suite: 75/75 pass. Vite production build passes after the stop-time change (19 modules, 643.60 kB minified JS / 167.50 kB gzip) with the default >500 kB chunk advisory. Independent review is clean; reviewer reran suite/build and reported no other findings.
- Manual browser/WebGL, keyboard, and phone/emulator checks were not performed in this environment. No live browser behavior is claimed as verified.
- `src/rules/` remains renderer- and DOM-free. No `sources/` files changed. The deviation is limited to neutral-input braking in the B1 simulation and is recorded in the approved B2 plan and canonical ledger.

## Review and next steps

- No commit/push has been made. The fresh review's status and blur-coverage notes were resolved and re-reviewed clean.
- Commit and push Task 3, then begin Task 4. Keep the manual browser limitations visible in the handoff.
