# Task 1 Report: Project runtime and shared simulation data

## Status

DONE

## Commit

`4489188c11cba49787f138403e400aaba18584a2` — `feat: add deterministic rules constants and validation`

## Delivered

- ES-module Node project with a dependency-free `test` script.
- Immutable B1 tuning and format/profile reference data from the v1 tuning sheet.
- Strict format and replay-safe profile-reference validation with stable, field-specific errors and no coercion.
- Node test coverage for required exact values, immutable format data, valid boundaries, invalid values, missing fields, and type coercion attempts.

## Test results

- Focused: `node --test tests/rules/constants.test.js tests/rules/validation.test.js` — 9 passed, 0 failed.
- Full: `npm.cmd test` — 9 passed, 0 failed.

## Self-review and concerns

- Reviewed the committed files and ran `git diff --check` before committing; no whitespace errors found.
- No implementation concerns. The host shell did not resolve `npm` by name, so the full script was run through the installed `npm.cmd` path.

## Report path

`C:\Users\Laptop Forest\.codex\worktrees\dariabandha-b1\g-p-6ad9fa012bdc81918f2b51a16af5f674\.superpowers\sdd\2026-10-22-dariabandha-b1-rules-core\task-1-report.md`

---

## Fix round 1: Profile timing-shape validation

### Status

DONE

### Commit

`5c5ff92e885cd5a1c34a22c25416d6ba418a4bdf` — `fix: validate profile timing shapes`

### Delivered

- `assertValidProfile` now requires `timingShape` to be a string and checks it against the immutable profile-specific shape data.
- Validated mappings: Traditional → `traditional`, Competitive Standard → `standard`, Quick Match → `quick`, and Pro → `selectable`.
- Added tests for valid profile references and missing, mistyped, and mismatched timing shapes.

### Test results

- Focused: `node --test tests/rules/validation.test.js` — 7 passed, 0 failed.
- Full: `npm.cmd test` — 10 passed, 0 failed.

### Self-review and concerns

- The new checks preserve Task 2 integration: complete profile data can be passed directly without rewriting it.
- Ran `git diff --check` before commit; no whitespace errors found.
- No concerns.
