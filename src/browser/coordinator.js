import { MAX_STEPS_PER_FRAME, TICK_RATE } from '../rules/constants.js';
import { advanceFrame } from '../rules/simulation.js';
import { createQuickMatchFixture } from './quick-match-fixture.js';

/** Browser-facing owner of a B1 match and its fixed-tick clock. This module is
 * DOM- and renderer-free so cadence behavior is easy to verify in Node. */
export function createGameCoordinator({ humanRole = 'attacker', onUpdate = () => {} } = {}) {
  if (typeof onUpdate !== 'function') throw new TypeError('onUpdate must be a function');
  let state = createQuickMatchFixture(humanRole);
  // Seat identity is fixed for the full match. B1 may change this player's
  // role during daan/phase transitions; control never follows a role label.
  const humanSeat = state.players.find((player) => player.controller === 'human').seat;
  let previousState = state;
  let accumulator = 0;
  let humanInput = {};

  function publish(events, steps) {
    onUpdate({ state, previousState, events, steps, interpolationAlpha: accumulator * TICK_RATE });
  }

  return {
    get state() { return state; },
    get previousState() { return previousState; },
    get interpolationAlpha() { return accumulator * TICK_RATE; },
    get humanSeat() { return humanSeat; },
    setHumanInput(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('input must be an object');
      humanInput = structuredClone(input);
    },
    advanceFrame(deltaSeconds) {
      if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new TypeError('deltaSeconds must be a finite non-negative number');
      const tickSeconds = 1 / TICK_RATE;
      const admittedSeconds = Math.max(0, Math.min(accumulator + deltaSeconds, MAX_STEPS_PER_FRAME * tickSeconds) - accumulator);
      let remaining = admittedSeconds;
      let steps = 0;
      const events = [];
      while (steps < MAX_STEPS_PER_FRAME) {
        const untilTick = tickSeconds - accumulator;
        if (remaining + 1e-10 < untilTick) break;
        const before = state;
        const result = advanceFrame(accumulator, untilTick, state, () => {
          const tickInput = humanInput;
          if (humanInput.tag) {
            humanInput = { move: humanInput.move, sprint: humanInput.sprint };
          }
          return { [humanSeat]: tickInput };
        });
        if (result.steps === 0) break;
        previousState = before;
        state = result.state;
        accumulator = result.accumulator;
        events.push(...result.events);
        steps += result.steps;
        remaining = Math.max(0, remaining - untilTick);
      }
      if (remaining > 0) {
        const result = advanceFrame(accumulator, remaining, state, () => {
          const tickInput = humanInput;
          if (humanInput.tag) {
            humanInput = { move: humanInput.move, sprint: humanInput.sprint };
          }
          return { [humanSeat]: tickInput };
        });
        accumulator = result.accumulator;
        events.push(...result.events);
        steps += result.steps;
        if (result.steps > 0) {
          previousState = state;
          state = result.state;
        }
      }
      publish(events, steps);
      return { accumulator, state, previousState, events, steps, interpolationAlpha: accumulator * TICK_RATE };
    },
    reset() {
      state = createQuickMatchFixture(humanRole);
      previousState = state;
      accumulator = 0;
      humanInput = {};
      publish([], 0);
      return state;
    },
  };
}

export { MAX_STEPS_PER_FRAME, TICK_RATE };
