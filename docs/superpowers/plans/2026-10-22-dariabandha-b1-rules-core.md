# Dariabandha B1 Rules Core Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build the deterministic, renderer-free JavaScript rules core for Dariabandha milestone B1.

**Architecture:** Plain JavaScript ES modules with no runtime dependencies. The core advances in fixed 60 Hz ticks and owns match state, court geometry, profiles, movement, tag validation, scoring, events, and replay inputs; a later browser renderer will consume public state and events without changing rule outcomes.

**Tech Stack:** JavaScript ES modules, Node.js for the headless runtime and tests; no game-engine runtime, physics engine, account service, analytics, or paid API.

**Spec:** `sources/Dariabandha_Final_Master_Plan_v2.0.docx` §§ 6–10, 14–16, 19, 22–25; amended by `sources/Dariabandha Master Plan v2.1 Addendum.docx` (no B1 rule changes).

## Global Constraints

- Simulation tick rate is 60 Hz; maximum accumulated steps per rendered frame is 5.
- Rules must run without Three.js or a browser renderer.
- Court box size is 3.048 m; width is 6.096 m; row counts are 5, 4, and 3 for 6v6, 4v4, and 2v2.
- Lane width is 0.60 m; line half-width is 0.05 m; foot-circle radius is 0.07 m.
- Tag reach is 0.90 m; aim-assist cone is 25 degrees and never extends reach; wind-up, active, recovery, and hold windows are 6, 9, 18, and 30 ticks.
- Attacker out-of-court movement is resolved by the selected profile's rule; all simulation tie-breaks are deterministic.
- Profile IDs and versions are stable replay data. Traditional, Competitive Standard, Quick Match, and Pro consequences remain isolated by data profile.
- Player cosmetics and rendering data cannot affect simulation results.
- Synced project files under `sources/` are read-only.

## Review Focus

- Invalid or missing profile/format input must fail with a clear validation error before a match starts.
- Line-zone boundary contact must use the specified overlap convention consistently at exact edges.
- Equal-tick tag candidates must resolve by distance and then seat, with no dependence on object iteration order.
- Fixed-tick advancement must produce the same authoritative state from the same seed and inputs regardless of render-frame cadence.
- Replay input for a missing tick or unknown seat must be rejected rather than silently changing the result.

---

### Task 1: Project runtime and shared simulation data

**Files:**
- Create: `package.json`
- Create: `src/rules/constants.js`
- Create: `src/rules/validation.js`
- Create: `tests/rules/constants.test.js`
- Create: `tests/rules/validation.test.js`

**Interfaces:**
- Produces `TICK_RATE`, `MAX_STEPS_PER_FRAME`, immutable tuning constants, `assertValidFormat(format)`, and `assertValidProfile(profile)`.
- Validation errors identify the field and rejected value; no implicit coercion.

- [x] Define an ES-module Node project with a test command and no product dependencies.
- [x] Add exact unit conversions and tuning values from §25 as named exports.
- [x] Add format/profile validation for supported team sizes, row counts, timing shapes, and profile versions.
- [x] Verify invalid and boundary inputs are reported with stable messages.

### Task 2: Court geometry and profile data

**Files:**
- Create: `src/rules/court.js`
- Create: `src/rules/profiles.js`
- Create: `tests/rules/court.test.js`
- Create: `tests/rules/profiles.test.js`

**Interfaces:**
- `createCourt(format) -> Court` returns metric dimensions, row/end/side line zones, lane strips, and spine geometry.
- `getProfile(profileId, version) -> RuleProfile` returns immutable versioned data or a validation error.

- [x] Implement 2v2, 4v4, and 6v6 geometry with fixed 10 ft boxes and the specified row count.
- [x] Represent court bounds and lines in one coordinate convention, documented in the module.
- [x] Encode Traditional, Competitive Standard, Quick Match, and Pro as separate profiles with timing and consequence flags from §6.
- [x] Pin exact court edges, line overlaps, and profile separation in unit tests.

### Task 3: Deterministic state and fixed-tick simulation

**Files:**
- Create: `src/rules/state.js`
- Create: `src/rules/simulation.js`
- Create: `tests/rules/simulation.test.js`

**Interfaces:**
- `createMatch({profileId, profileVersion, format, seed, seats}) -> MatchState` creates a fully initialized state.
- `stepMatch(state, inputsBySeat) -> {state, events}` advances exactly one authoritative tick and returns ordered rule events.
- `advanceFrame(accumulator, deltaSeconds, state, inputProvider) -> {accumulator, state, events, steps}` caps catch-up at 5 steps and never changes tick duration.

- [x] Define serializable match and player state, including phase, match clock, scores, roles, positions, velocities, stamina, cooldowns, and eliminated seats.
- [ ] Implement deterministic seeded random values where the spec allows variation; isolate randomness from rendering. (Deferred: current B1 inputs carry resolved seat roles, and no random simulation action is defined; see task-3-report.md.)
- [x] Implement input validation and canonical seat ordering before each tick.
- [x] Implement normalized movement, acceleration, stopping, stamina drain/recovery, and court-boundary outcomes from §§9–10 and §22.
- [x] Verify deterministic state and event ordering for identical seeds and inputs.

### Task 4: Tag validation, match flow, scoring, and replay inputs

**Files:**
- Create: `src/rules/tags.js`
- Create: `src/rules/match-flow.js`
- Create: `src/rules/replay.js`
- Create: `tests/rules/tags.test.js`
- Create: `tests/rules/match-flow.test.js`
- Create: `tests/rules/replay.test.js`

**Interfaces:**
- `beginTag(state, guardSeat, targetSeat) -> TagAttempt` schedules wind-up, active, and recovery windows.
- `resolveTags(state, attempts) -> ordered RuleEvent[]` applies eligibility, reach, foot-circle line checks, hold window, and deterministic tie-breaks.
- `applyRuleEvent(state, event) -> MatchState` updates score, daan, side changes, elimination, or transitions by profile.
- `recordReplayHeader(state) -> ReplayHeader`; `recordTickInputs(replay, tick, inputs) -> Replay`; `replayMatch(replay) -> MatchState` re-simulates the recorded inputs.

- [x] Implement tag eligibility, reach-segment versus attacker capsule overlap, aim-assist cone limits, void-tag reasons, and post-touch hold.
- [x] Implement round-trip scoring and profile-specific Traditional cancellation/swap and Competitive half-team attack flow.
- [x] Emit ordered events with stable reason codes for the future HUD, officials, and replay viewer.
- [x] Store seed, profile/version, format, map, seats, AI tiers, and per-tick inputs; reject malformed replay inputs.
- [x] Verify edge cases and replay determinism using focused tests.

## Self-Review Notes

- This plan covers B1 only. Browser rendering, input devices, AI, menus, persistence, PWA delivery, and online play remain separate milestones as defined by §§23 and 26.
- The workspace currently has no game source tree or Git repository; this plan creates the proposed `src/` and `tests/` layout only after approval.
- The rules document leaves some regional interpretations unresolved; B1 must preserve the selected profile flags and avoid adding unapproved regional variants.
