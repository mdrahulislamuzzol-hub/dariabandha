### Task 1: Project runtime and shared simulation data

**Files:**
- Create: package.json
- Create: src/rules/constants.js
- Create: src/rules/validation.js
- Create: tests/rules/constants.test.js
- Create: tests/rules/validation.test.js

**Interfaces:**
- Produces TICK_RATE, MAX_STEPS_PER_FRAME, immutable tuning constants, assertValidFormat(format), and assertValidProfile(profile).
- Validation errors identify the field and rejected value; no implicit coercion.

- Define an ES-module Node project with a test command and no product dependencies.
- Add exact unit conversions and tuning values from §25 as named exports.
- Add format/profile validation for supported team sizes, row counts, timing shapes, and profile versions.
- Verify invalid and boundary inputs are reported with stable messages.
