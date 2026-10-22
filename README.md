# Dariabandha — B1 Complete, B2 Planned

The B1 renderer-free deterministic rules core is complete. The next planned milestone is B2: a playable local browser game built on that core. B2 has not started.

## Run the tests

```sh
npm test
```

The current suite contains 59 tests covering validation, court geometry and format profiles, fixed-tick simulation, seeded toss, tags, match flow, scoring, and replay inputs.

## Scope

Tasks 1–4 from the B1 plan and the seeded-toss/constants follow-up are implemented and reviewed. Browser rendering, AI, controls, menus, and audio are not implemented yet. See [the B1 plan](docs/superpowers/plans/2026-10-22-dariabandha-b1-rules-core.md), [the proposed B2 plan](docs/superpowers/plans/2026-10-22-dariabandha-b2-playable-browser-game.md), and `.superpowers/sdd/2026-10-22-dariabandha-b1-rules-core/` for the current checkpoint and decisions.

Files in `sources/` are read-only reference copies of the supplied master plan documents.
