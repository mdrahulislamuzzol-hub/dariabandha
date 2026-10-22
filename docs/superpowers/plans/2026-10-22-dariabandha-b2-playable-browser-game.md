# Dariabandha B2 Grey-Box Game Plan

**Status:** Final plan review clean. Tasks 1–4 are implemented and independently reviewed; Task 4 code commit `8000c7c` is pushed to `codex/dariabandha-b1`. The 78-test Node suite and production build pass. B2 acceptance remains incomplete pending browser/WebGL and keyboard/touch manual checks; the in-app browser timed out connecting to the local Vite server. See the canonical status ledger and Task 4 manual checklist.
**Master-plan milestone:** B2 Grey-box game (§23).  
**Base:** `codex/dariabandha-b1` at B1-complete commit `113d739`.  
**Goal:** Deliver the master plan's first playable browser scene: a 4v4 Dariabandha court with capsule players, movement, stamina, role-appropriate camera, keyboard/touch input, a basic HUD, and seven inactive AI-controlled seats.

**Approved Task 3 tuning deviation:** The owner authorized correcting B1 stopping behavior to meet §25's maximum stop times. Braking now uses a fixed per-role top-speed decrement so an attacker at sprint speed reaches zero within 12 ticks and a guard at run speed reaches zero within 5 ticks. No other rules are changed. Regression tests cover both roles; see the Task 3 report and progress ledger.

## Source Reconciliation and Authority

The authoritative supplied v2.0 DOCX has a B1–B9 build-order table in §23. It defines B2 as **Grey-box game** and B3 as match flow. B1 already implements and tests the renderer-free rules, tag/hold/vacancy flow, scoring, clocks, transitions, and replay recorder, so B2 must integrate that work instead of rebuilding it. The v2.1 addendum says its accepted/reduced presentation items land in existing B6/B7 steps and adds no build steps.

The locked platform decision specifies Three.js r128 (`three@0.128.0`) via cdnjs. This plan makes one deployment deviation: bundle that exact version into the static build instead of loading it from a CDN, avoiding a remote runtime dependency and keeping future offline packaging possible. The library version does not change.

The root `master.txt` is a useful text reference but does not include the full §23 B1–B9 table found in the supplied v2.0 DOCX. Treat the supplied DOCX and v2.1 addendum as authoritative when they are available; compare them with `master.txt` on any resumed account. All files under `sources/` are read-only and must remain unchanged.

B2/B3/etc. are formal labels in the master plan; this plan gives B2 a sequential task breakdown. It does not redefine B2 as the whole browser game. Later milestones remain: B3 match-flow browser integration if any gaps remain, B4 AI, B5 modes/menus, B6 presentation, B7 tutorial/polish, B8 performance/release, and B9 online (v1.1). B1 rule capabilities already completed should not be repeated merely because the master plan listed some of them under B3.

The B2 row specifies 4v4 versus inactive AI but does not name a profile. This plan chooses the existing B1 Quick Match profile as the fixed grey-box fixture so the example is reproducible and can exercise its clock; this is a B2 setup choice, not a change to profile rules.

## B2 Scope and Completion Gate

Included:

- A locally runnable, static-buildable browser scene using the master-plan web 3D stack (Three.js) and a low-cost local development toolchain.
- A grey-box 4v4 Quick Match demonstration on the B1 court. The seven non-human seats are present and remain inactive; this is a deliberate B2 placeholder, not AI behavior.
- Capsule/primitive athletes and court lines derived from `createCourt('4v4')` data, a role-appropriate third-person camera, movement and stamina driven by B1 state, keyboard and touch controls, and a basic DOM HUD.
- A fixed development match setup, with deterministic seed and human seat, so another account can reproduce attacker, guard, and Sikka control checks without a lobby or seat-selection menu.
- Existing B1 match rules and events consumed as-is. The browser view must not change rule outcomes.

Excluded from B2: active AI logic (B4), full match modes/lobby/seat selection/settings/localization/results/XP/unlocks (B5), complete procedural athlete animation/referee/judges/multiple maps/time/rain/audio/replay viewer/Pro mechanics (B6), tutorial/drills/accessibility settings and final polish (B7), PWA/offline/publishing/release gates (B8), online/matchmaking/server/prediction (B9). Do not add gamepad support unless the owner expands B2; §23 specifically names keyboard and touch here. A simple reset control needed for grey-box iteration is allowed, but not a general menu system.

The user controls one fixed seat for the entire match. No role preference, team-selection, Sikka-selection, or lobby policy is introduced in B2; those belong to B5. For test scenarios, deterministic fixture seeds/seats exercise attacker, guard, and Sikka roles. Do not alter the toss or B1 role-assignment behavior to force a preferred role.

**B2 is done when:** the local build starts; the 4v4 scene shows the actual B1 court geometry and all eight players; one fixed human seat can be controlled with keyboard and touch; the other seven AI seats remain visibly present but stationary; B1 controls movement, stamina, tag/match consequences, clocks and events; the HUD displays basic match/role information; all B1 Node tests stay green; browser build/smoke and manual controls checks pass; results and known limitations are recorded and pushed.

## Architecture and Integration Rules

1. `src/rules/` stays renderer-free, browser-global-free, and Node-testable. Do not move Three.js, DOM, device input, animation, or audio into the rules core.
2. The browser loop uses the B1 fixed 60 Hz accumulator and maximum catch-up step count. Call the B1 simulation exactly once for each authoritative tick; render interpolation only interpolates between returned states.
3. Render positions/velocities, stamina, role, state, court lines, and event feedback from B1 public state/events. Do not create a second movement, collision, stamina, tagging, scoring, or transition implementation in the view layer.
4. Use the existing four-player-per-team `createMatch` setup, with exactly one human seat and seven `AI` seats. For B2, AI input is always neutral/empty; no decisions, reactions, target selection, coordinator, or AI random draws are implemented.
5. Device input is converted to the B1 accepted per-seat input shape and passed through the existing rules API. Guard and Sikka movement constraints remain rules-owned. Tag targets must be selected deterministically by a small adapter from currently visible eligible seats; final legality remains owned by B1.
6. Use court coordinates in metres and derive every rendered rule line/region from B1 `createCourt` data. Keep the renderer's world scale explicit and test metre-to-world conversion.
7. Use the locked Three.js r128 (`three@0.128.0`) version. Bundle it locally instead of using the source's cdnjs delivery (the sole B2 platform deviation; see above), pin the browser build tooling and commit the lockfile. `npm test` must still run the B1 rules tests in Node without a browser, WebGL, or Three.js scene. No paid APIs, online services, analytics, accounts, or remote runtime assets.
8. Keep the simple demonstration match setup fixed and documented. Any B1 inference policy shown in B2 remains identified as an implementation choice, not a newly verified traditional rule.

## Sequential Task Breakdown

Use the established project workflow for every task: fresh implementer → independent reviewer → fixes → fresh re-review. Tasks are sequential. Each task ends runnable, with focused checks and the full Node suite, a clean review, an updated B2 ledger/report, a commit, and a push. Do not start the next task until review is clean.

### Task 1 — Browser Shell and Fixed-Tick Bridge

**Deliver:** local browser entry/build, canvas shell, renderer initialization, and a minimal fixed 4v4 fixture with a blank/basic scene.

**Work:**

- Add the smallest suitable free/open-source static browser build/dev-server tool and the locked `three@0.128.0` dependency. Bundle Three locally as described above. Pin dependencies and commit the lockfile; document commands to install, run locally, build, and test.
- Add the browser entry point and a resilient WebGL initialization/failure message. No hosting, CDN-only runtime dependencies, or external service.
- Define the application coordinator that owns `createMatch`, fixed 60 Hz accumulator advancement using B1 timing limits, input collection seam, and state/event publication to presentation.
- Add one deterministic 4v4 Quick Match developer fixture with one human seat, seven AI seats, seed, team/seat template, and reproducible fixtures for human attacker, guard, and Sikka control. Keep this fixture out of the normal player menu.
- Prove requestAnimationFrame cadence only affects interpolation/catch-up, not authoritative simulation outcomes. Keep rendering imports out of `src/rules/`.

**Acceptance:** browser build and local page run; WebGL failure is handled; Node rule tests pass unchanged; fixed-seed fixture reproduces the same initial B1 state; no toss draw or random state is consumed a second time; 30/60/120 render-rate checks produce identical tick/state results within the B1 frame cap.

### Task 2 — 4v4 Grey-Box Court and Player View

**Deliver:** all court lines and eight primitive players visible in the browser, with state-driven transforms and role markers.

**Work:**

- Build the 4v4 ground/court and render lines from `createCourt('4v4')`; use distinct but simple line/spine/box materials so legal regions are visible.
- Build capsule/primitive player groups for every B1 seat. Use team-identifying color plus a simple pattern/shape marker, and distinct human, inactive-AI, guard, and Sikka indicators that do not rely on color alone.
- Map B1 metre positions to a documented Three.js world coordinate convention. Render stamina/state/role visuals from the state only.
- Add render interpolation for transforms and a basic idle pose. No procedural action animations, crowd, weather, textured map, referee, or non-4v4 mode selector in this milestone.
- Add geometry tests that compare rendered line endpoints and actor positions with B1 court/state values; add a manual screenshot checklist for initial spawn and both court ends.

**Acceptance:** each line/spine/box agrees with B1 court geometry; all eight actors exist and map to the correct seat/role; all actors remain on renderer positions derived from state; changing viewport size does not distort world coordinates or lose the court.

### Task 3 — Keyboard/Touch Control, Camera, and B1 Simulation

**Deliver:** playable movement and legal actions for the single fixed human seat, role-specific camera/control handling, and seven neutral AI placeholders.

**Work:**

- Add keyboard movement, sprint, and tag; add a touch joystick with large sprint/tag buttons via pointer events. Support pointer cancellation and prevent browser page gestures from swallowing active controls.
- Normalize each device to B1 per-tick input. Tag target selection is deterministic among visible opponents (stable distance then seat tie-break); `stepMatch` remains the sole authority for tag legality, range, cone, cooldown, and outcomes.
- Use B1 camera constants for attacker and guard. B1 has no Sikka camera constants; for the B2 grey-box only, use the guard camera's distance/height/yaw limits, align its view down the central spine toward the opposing entry, and label this as a B2 presentation inference for later tuning. Camera never changes reach, collision, legal region, or hidden information.
- Send no input for the seven AI seats. Their B1 simulation motion remains neutral/zero; they are not removed from the scene and no AI behavior is added.
- Keep one human seat as the same persistent identity when B1 changes the player's role during a daan/phase transition. Add test fixtures for attacker, guard, and Sikka roles and verify control remains on that seat through a role change.
- Compare observed travel distance, acceleration, stopping, sprint drain/recovery, and camera defaults with the §25 tuning constants. Fix integration mistakes in the adapter; change rule tuning only with an explicit plan deviation and regression evidence.

**Acceptance:** keyboard and touch can each move/sprint/tag with identical normalized tick inputs; inactive AI seats receive no actions; the human controls attacker, guard, and Sikka in fixtures; the human seat remains constant through a B1 role transition; controls do not bypass B1 validation; movement/stamina matches §25 values within tick quantization.

### Task 4 — Basic HUD, Reset, and B2 Acceptance/Handoff

**Deliver:** clear bare-minimum match information, reproducible reset, browser QA record, and a new-account handoff.

**Work:**

- Add DOM HUD for human role/team, current phase, score, clock, stamina, and most recent B1 event/call. Keep it intentionally basic: no complete lobby, settings, results/XP/unlocks, localization catalog, or full audio layer.
- Add a reset/restart control that recreates the fixed fixture exactly, with no change to its seed/setup and no second toss draw.
- Run the Node unit suite (which covers all implemented B1 profile/format rule behavior), browser production build/smoke, frame-rate determinism check, court parity checks, and keyboard/touch manual scenarios for the fixed 4v4 Quick Match attacker/guard/Sikka fixtures. Do not claim that the browser fixture is a Traditional/Competitive profile selector.
- Record browser/OS/device/resolution and measured startup/frame-time/memory if available. §15 proposed targets are measurement references, not new locked gates. Note that only a grey-box 4v4 fixture is in scope.
- Update the B2 ledger and README handoff with task/review states, commit SHA, test results, exact next task, and any failure/known limitation. Push after each task's clean independent review.

**Acceptance:** HUD values update from B1 state/events; reset restores the same seeded fixture; all B1 tests/build/smoke checks pass; manual keyboard/touch checklist is complete; handoff states B2 status and next task without suggesting that AI or later milestones are complete.

## Test and Review Requirements

- Keep B1 rules regression tests unchanged and green; add B2-only tests alongside browser/presentation modules.
- Verify frame-rate independence at 30/60/120 render updates for identical tick inputs and starting state; include the B1 five-step catch-up cap case.
- Verify rendered court lines and player coordinates are derived from B1 data; test all 4v4 lines, spawn/role states, and the human actor.
- Verify input device mapping, diagonal normalization, tag target tie-breaking, reset determinism, and persistent controlled seat across role changes.
- Manual browser check: WebGL available/unavailable, keyboard, touch on phone or emulator, court-edge camera, line visibility, and every fixed fixture role.
- Do not add AI success-rate/soak tests in B2; those are B4 acceptance gates. Do not count stationary AI as implemented AI.

## GitHub and New-Account Handoff

- Continue on the existing `codex/dariabandha-b1` branch; do not create an unrelated branch or repeat B1. Verify the remote branch and working tree before coding.
- Commit/push each independently reviewed B2 task. Keep the task ledger and this handoff note synchronized to the pushed HEAD.
- Preserve `sources/` and `master.txt` as read-only reference material. The owner may provide the authoritative plan files again in a new account; compare them with the repository's `sources/Dariabandha_Final_Master_Plan_v2.0.docx` and `sources/Dariabandha Master Plan v2.1 Addendum.docx` before proceeding.
- Do not publish/host/merge, add online networking, or connect other external services without a separate explicit request.

## Later Master-Plan Steps (Not B2)

- **B3 Match flow:** browser presentation of full tag/hold/vacate, scoring, transitions, halves, clocks/tie-breaks, and call banners. B1 has corresponding rules/state/event functionality; B3 is not permission to reimplement it.
- **B4 AI:** delayed perception, guard/attacker/coordinator behavior, four tiers, disconnect takeover and soak tests.
- **B5 Modes and menus:** all profiles/formats, lobby and seat selection, spectate, settings, bilingual UI, results, XP/unlocks.
- **B6 Presentation:** procedural athletes/animations, officials, maps/time/weather, audio, replay viewer, Pro mechanics. The v2.1 addendum assigns its accepted presentation work to B6/B7.
- **B7 Tutorial and polish:** tutorial/drills and accessibility options.
- **B8 Performance and release:** presets, dynamic resolution, PWA/offline caching, device checks, release report and publish.
- **B9 Online (v1.1):** server, prediction, lobbies, reconnect. Explicitly outside this project task.
