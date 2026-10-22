# Task 4 Report: Tags, match flow, scoring, and replay inputs

## Status

Complete — initial review and follow-up lifecycle review are complete.

## Delivered

- `src/rules/tags.js`: fixed wind-up, active and recovery windows; reach-segment/capsule check; aim cone bounded by reach; guard legal-region/line checks; post-touch hold; stable void reasons and deterministic tick/distance/seat resolution.
- `src/rules/match-flow.js`: profile-specific Traditional swap and Competitive/Quick/Pro elimination/half-team counter-attack; round-trip scoring; Traditional point cap and clock cap; Standard/Quick/Pro halves, breaks, tie-breaks, golden daan and match end; reason-coded events; daan-scoped vacated lane/region tracking.
- `src/rules/replay.js`: replay headers with profile/version, format, selected timing, map, seed, seats and AI tiers; contiguous per-tick input recording; malformed, gapped, unknown-seat and invalid AI-tier data rejected; replay re-simulates the match.
- Integrated tag inputs and tag resolution into `stepMatch`; integrated forward/return route detection and point scoring; transitions freeze gameplay input and match clock.
- Added focused coverage for tag edges, holds, tie-breaking, profile flow, clock endings, replay validation/determinism and integrated matches.

## Review findings and fixes

- Added missing clock-driven half, break, tie-break and match-end flow for Traditional, Competitive Standard, Quick Match and Pro timing.
- Prevented duplicate/out-of-phase terminal rule events from scoring or changing sides repeatedly.
- Rechecked target eligibility and court presence throughout tag hold; retained all simultaneous contact candidates until hold validity is known.
- Corrected the Task 3 boundary-event expectation to include its profile consequence.
- Follow-up research resolved Sikka line fouls by applying the general defender line-foul consequence to the Sikka's distinct region: the tag remains void, the Sikka enters `spine-vacated`, `vacatedRegions` records `spine`, and the event carries stable reason `sikka-spine-line-foul`, effect `spine-vacated`, and `regionId: spine`. This does not invent a lane index. The [Traditional Games of Bangladesh survey](https://www.researchgate.net/publication/372515215_Traditional_Games_of_Bangladeshpdf_Dr_Sydur_Rahman_Lipon_and_Sudip_Chakroborthy) describes the Sikka as the sole player allowed on the full central vertical walkway, notes regional rule variation, and describes courts and walkway counts as varying with participants. The user's chosen B1 interpretation applies the known defender vacate-position rule to the Sikka's own spine region. Vacancies clear on the next point/daan or side-role transition, with the Sikka returned to the spine's neutral spawn position.
- Independent re-review confirmed previous findings are addressed and found no remaining actionable code issues.
- Final replay-header re-review confirmed tier overrides must target known AI seats and serialized header tiers are validated.
- Follow-up review questioned whether vacancy cleanup could overwrite a transitioned Sikka's attacker spawn. Inspection confirmed the Traditional side-swap path calls `resetAttackers` first, which sets the player's state to active and assigns the attacker entry before `clearVacancies`; therefore the reported overwrite is not reachable through that path. Cleanup now restores the midpoint only when a still-vacated player remains the Sikka, preserving any role-specific position if another path reaches cleanup before resetting state. The side-swap regression verifies integrated role and spawn behavior, but does not isolate the cleanup branch. Re-review found no additional runtime issue; this branch-level defensive behavior is not separately exposed or tested.

## Interface clarifications

- `stepMatch` accepts `tag: { targetSeat }` on guard input; serializable attempts persist through active and hold ticks and are consumed by deterministic simulation and replay.
- `createMatch` accepts optional `timingShape` for Pro, with a deterministic Standard default, as documented in Task 3 report.
- Player state includes `routeStage` for entry, far-end crossing and return tracking. `stepMatch` emits round-trip events when an attacker completes the route.
- Tag/score consequences use a one-tick input/clock-frozen transition before resuming play. Replay headers preserve map metadata, which Task 3 state did not previously contain.
- Guards spawn clear of the boundary overlap zone while inside their assigned lane so the locked foot-circle rule permits valid tags.

## Verification

- Full suite after initial fixes: 45 passed, 0 failed. After the follow-up rules clarification: 47 passed, 0 failed. Final suite after the spawn regression: 48 passed, 0 failed.
- Follow-up independent lifecycle review: the reported side-swap overwrite was not reachable because role/spawn reset precedes vacancy cleanup; no remaining actionable runtime issue was identified. The role-aware guard is retained defensively.
- No files under `sources/` were changed. No renderer or external service was introduced.

## Portable snapshot note

The ZIP has no `.git` directory. The recorded base branch/commit remains in `README_FIRST.txt`; this continuation did not fabricate new commit IDs or publish/push anything.
