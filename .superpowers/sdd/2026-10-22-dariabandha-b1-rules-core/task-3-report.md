# Task 3 Report: Deterministic state and fixed-tick simulation

## Status

DONE — review fix round 1 complete; independent re-review clean.

## Delivered

- `src/rules/state.js`: serializable match/player initialization, canonical seats, profile/format checks, role and team validation, seed state, clocks, and starting positions.
- `src/rules/simulation.js`: one-tick deterministic movement, stamina drain/recovery, guard/Sikka legal-region clamps, attacker boundary events, input validation, and bounded fixed-step frame advancement.
- `tests/rules/simulation.test.js`: initialization, input validation, update ordering, determinism, stamina, legal regions, boundary event and frame cap coverage.

## Review and fix

- First independent review found initial lane placement used seat modulo while per-tick clamping used sorted guard ordinal. Fixed to use the same canonical ordinal; sparse-seat regression now confirms no first-tick lane snap.
- Re-review verified the fix and found no residual actionable findings.
- Added optional `timingShape` to `createMatch` for Pro. It accepts `standard` or `quick`, defaults to `standard`, and initializes the corresponding 18,000 or 12,600 tick half clock. The plan's createMatch signature omitted this choice despite Pro's selectable timing in §6; this extension is documented as a necessary interface clarification.
- Inputs currently expose normalized move vector and sprint flag. Walk/jog selection details are not defined in the Task 3 interface; movement uses the approved run and sprint values and the Section 25 acceleration/stop times. The seeded opening-toss behavior superseding the original fixed-team initialization is documented in the follow-up below.

## Verification

- Focused simulation suite after fix: 7 passed, 0 failed.
- Full suite after fix: 23 passed, 0 failed.
- Independent re-review: clean.

## Portability note

The extracted ZIP has no `.git` directory. Changes therefore continue in the portable snapshot without fabricated commit IDs. No files under `sources/` were modified.

---

## Follow-up: seeded opening toss

### Status

Implementation complete; independent review clean after three fix rounds.

### Decision and delivered behavior

- Added dependency-free `drawMulberry32(state)`, which returns one normalized draw and its advanced uint32 state. `createMatch` consumes exactly one draw from the supplied seed.
- The source references a seeded toss but does not specify whether the toss winner attacks, nor how the Sikka is assigned if roles mirror. B1 resolves this by treating the selected team as toss winner and opening attacker; when team 1 is selected, the opposing team's Sikka is assigned to the same sorted within-team seat ordinal as the template Sikka. Both choices are implementation inferences.
- `seats` is the opening-role template: team 0 all attackers and team 1 one Sikka plus guards. The result is persisted as `state.toss`, an initial `toss-resolved` event, and `state.random.state`. Final roles and starting positions follow the selected attacker side.
- Replay headers include the canonical template, toss metadata, and post-draw RNG state. Replay reconstructs from template + seed and rejects toss/RNG metadata that does not agree with the deterministic draw.

### Added verification

- Tests cover seeds producing each winner, role symmetry by Sikka ordinal, attacker/defender counts and initialization, same-seed state equality, and replay reconstruction/tamper rejection.
- Full suite after implementation: 59 passed, 0 failed.
- No files under `sources/` were modified.

### Fix round 1

- Independent review found replay metadata validation compared the toss winner but omitted the explicit `attackerTeam` field. `replayMatch` now checks both, with a regression that tampers with `header.toss.attackerTeam`.
- Added known Mulberry32 vectors for seeds 0 and 1, including advanced-state assertions.
- Added exact expected records and immutability checks for exported `PROFILE_SPECS` and `TUNING_CONSTANTS`, completing aggregate constant coverage.
- Replay now verifies that resolved `header.seats` team/controller/role metadata matches the toss-reconstructed players when the newer `tossTemplateSeats` field is present. Headers predating that field retain the legacy path without this new consistency rejection. Added a seat-role tampering regression.
- Re-review found legacy headers were being re-tossed and modern headers could omit toss/RNG metadata. Added the dedicated `restoreLegacyReplayMatch` setup helper, preserving recorded resolved roles and seed-as-pre-draw RNG state for old headers. Modern headers are distinguished by the presence of `tossTemplateSeats` and must supply a valid toss object and uint32 `randomState`; all required values are checked against reconstruction.
- Added regressions for the legacy team-0 opening with seed 1, legacy RNG state, missing/null/malformed modern metadata, and malformed templates.
- Re-ran the full suite: 59 passed, 0 failed. Independent re-review of fix round 3 is clean; `git diff --check` is clean and no files under `sources/` were modified.
