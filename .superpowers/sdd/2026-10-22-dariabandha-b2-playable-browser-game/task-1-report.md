# B2 Task 1 — Browser Shell and Fixed-Tick Bridge

Status: implementation ready for independent review; not reviewed, committed, or pushed.

## Implemented

- Added a Vite-powered static browser entry, minimal page shell, and a blank Three.js scene. The renderer is pinned to the master-plan's exact `three@0.128.0` package. WebGL construction failures are caught and shown in the page status region.
- Added a deterministic 4v4 Quick Match fixture with seed 0, the standard team/seat role template, exactly one human controller, and seven AI seats. Developer fixtures put the human in attacker, guard, or Sikka roles without adding toss draws or changing B1 rules.
- Added a renderer/DOM-free coordinator that owns match creation, accepts one human input seam, calls B1's fixed-tick `advanceFrame`, and publishes state/events/steps/interpolation alpha to presentation.
- Added focused tests for reproducible fixture states, one-human/seven-AI setup, role fixtures, toss/RNG state, 30/60/120 Hz cadence equality, the B1 five-step cap, and reset determinism.

## Verification

- `npm ls --depth=0` confirms exact direct dependencies `three@0.128.0` and `vite@6.4.5`. `package-lock.json` was generated and pins the full install graph.
- `npm test`: 63 passed, 0 failed (four Task 1 tests plus all existing B1 tests).
- `npm run build`: succeeds with Vite 6.4.5; 16 modules transformed. Vite reports its advisory that the minified main chunk is 533.58 kB (134.94 kB gzip), above its 500 kB default warning threshold.
- Browser smoke: `vite preview` starts at `http://127.0.0.1:4173/`; the sandbox denied HTTP access with `An attempt was made to access a socket in a way forbidden by its access permissions.` Therefore no live-page or WebGL/manual browser smoke is claimed.
- `git diff --check`: passed (only Git line-ending advisory warnings).

## Review and handoff

- Independent review: pending.
- No files under `sources/` and no B1 rule-core files were changed.
- Next action: independent review. The build and test gates are green, but the reviewer should account for the documented sandbox-limited browser smoke. Do not start Task 2 until review and any re-review are clean.
