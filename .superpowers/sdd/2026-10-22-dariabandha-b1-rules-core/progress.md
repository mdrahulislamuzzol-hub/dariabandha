# SDD ledger — plan: docs/superpowers/plans/2026-10-22-dariabandha-b1-rules-core.md

## Preflight: plan conflict scan

| Pair / task | Shared interface or files | Finding |
|---|---|---|
| Task 1 → Task 2 | validation/profile data used by profiles.js; no shared output files | Compatible. Task 1 exposes generic validation/constants; Task 2 owns concrete profile records. |
| Task 1 → Task 3 | constants and validation consumed by simulation | Compatible. Task 3 may import only the named constants and validation functions produced by Task 1. |
| Task 2 → Task 3 | createCourt, getProfile feed match creation and state | Compatible. Task 2 owns immutable geometry/profile data; Task 3 owns match/player state and stepping. |
| Task 3 → Task 4 | match state, tick events, deterministic inputs consumed by tags/flow/replay | Compatible. Task 4 adds rule-event resolution and replay around the Task 3 state contract. |

| Task | Internal consistency |
|---|---|
| 1 | Consistent: package, constants, validation, and tests are created together. |
| 2 | Consistent: court/profile files and their tests are created together; Task 1 validators are available. |
| 3 | Consistent: state/simulation files and tests are created together; Tasks 1–2 interfaces are available. |
| 4 | Consistent: tags, match flow, replay, and tests are created together; Task 3 state and stepping are available. |

Ruling: Keep B1 implementation on the approved renderer-free deterministic rules-core scope — the master plan specifies that boundary — cost if wrong: later renderer or network integration may require interface changes.

## Task progress

- Base before Task 1: 9ac8e4101e19e4042f96767703dd4dcc39fdf48e
- Task 1: complete (implementation and review fix recorded above)
- Task 2: complete (snapshot continuation; implementation and independent review clean)
- Task 3: complete (review fix round 1; re-review clean)
- Task 4: complete; follow-up rule interpretation and lifecycle review complete.
Task 1: fix round 1/5 — reviewer found supported timing-shape validation missing; constants coverage note deferred.
Ruling: Task 1 validation must reject unsupported timing shapes because the approved plan explicitly requires timing-shape validation and §6/§25 define the allowed profiles — cost if wrong: valid profile inputs may be rejected or an invalid timing configuration may enter match simulation.
Task 1: minor (deferred): Expand constants tests to pin the remaining §25 movement, stamina, timing, Pro, camera, AI, and network values; constants implementation itself includes the values.
Task 1: complete (commits 9ac8e41..5c5ff92, review clean after 1 fix round).

Task 2: complete from portable snapshot (recorded checkpoint 5c5ff92e885cd5a1c34a22c25416d6ba418a4bdf; archive contains no .git directory, so no new commit IDs can be recorded here).
Task 2: implementation added court geometry and immutable versioned profiles with focused tests; focused and full suites pass (16/16).
Task 2: independent review clean; no fixes required. See task-2-report.md.
Task 2 placement decision: follow-up research assigned all three interior row lanes to 4v4 and the frontmost interior row to the sole 2v2 guard; the latter is documented as a B1 inference because source material gives no exact 2v2 placement.

Task 3: initial implementation review found sparse seat IDs could mismatch guard spawn lane and lane clamping; fixed by using sorted guard ordinal and added regression coverage.
Task 3: review identified Pro's selectable Standard/Quick clock was unspecified in the createMatch signature. Added optional `timingShape` for Pro, validated against standard/quick; deterministic default is standard. This small signature extension resolves the §6/§22.3 gap; see task-3-report.md.
Task 3: focused 7/7 and full suite 23/23 passed after fix; independent re-review clean.
Task 3: seeded random draws remain deferred; the API receives already assigned seat roles and no random simulation behavior is implemented in B1. The seed is retained in state/replays. Current initialization assumes team 0 is the opening attacker; the master-plan toss is not yet represented as a seeded choice. See the checked plan note and task-3-report.md.

Task 4: complete — tags, match flow, scoring, and replay inputs integrated into fixed tick simulation.
Task 4: first independent review identified missing profile clock/end flow, repeat-event acceptance, hold-target eligibility and simultaneous-contact handling; fixes added with focused regressions.
Task 4: focused and full suite passed after fixes (45/45); independent re-review clean.
Task 4: integration clarifications (tag input `tag: {targetSeat}`, routeStage/route scoring, one-tick rule transitions, and replay map metadata) are described in task-4-report.md.
Task 4: replay header validation rejects unknown/non-AI tier overrides and malformed serialized tiers; reviewed and full suite re-run clean (45/45).

## User-directed follow-up: resolve two traditional-rule ambiguities

- Researched British Council International Inspiration's Daria Bandha guide and the Traditional Games of Bangladesh survey. The survey identifies the central walkway as the Sikka's permitted route, horizontal row walkways for other defenders, and court-count variation with participant count; British Council describes equal spaces matching defender count and each defender restricted to an allocated space.
- Smaller-format rule decision: preserve approved D18 6v6 layout (four interior row guards plus back-end guard), assign the three interior row lanes to 4v4, and assign the frontmost interior row to the sole 2v2 guard. The 2v2 selection is a documented B1 implementation inference, not claimed as a sourced traditional rule. Added `guardLaneIds`, wired through spawn, movement clamp, and reset.
- Sikka spine foul decision: keep the attempted tag void and record the whole region as vacated (`state: spine-vacated`, `vacatedRegions: ['spine']`), with stable event `reason: sikka-spine-line-foul`, `effect: spine-vacated`, `regionId: spine`. No fake numbered lane is assigned. Clear lane/spine vacancy at next point/daan or role transition; reset Sikka to neutral spawn.
- Added tests for guard spawn placement in 2v2/4v4/6v6, Sikka foul state/event and persistence, vacancy reset after a point and role change, and integrated Sikka-to-attacker spawn after a Traditional side swap. Review confirmed `resetAttackers` sets the transitioned player's active state and entry position before vacancy cleanup, so the side-swap test verifies the resulting flow but does not isolate the cleanup guard. The role-aware position check remains defensive for any future transition path that reaches cleanup with a still-vacated state. Final full suite: 48/48 passed using bundled Node.js. Source citations and analysis are recorded in task-2-report.md and task-4-report.md. `sources/` remained untouched.
