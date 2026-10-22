import { MAX_STEPS_PER_FRAME, TICK_RATE } from '../rules/constants.js';
import { advanceFrame } from '../rules/simulation.js';
import { createQuickMatchFixture } from './quick-match-fixture.js';

/** Browser-facing owner of a B1 match and its fixed-tick clock. This module is
 * DOM- and renderer-free so cadence behavior is easy to verify in Node. */
export function createGameCoordinator({ humanRole = 'attacker', onUpdate = () => {} } = {}) {
  if (typeof onUpdate !== 'function') throw new TypeError('onUpdate must be a function');
  let state = createQuickMatchFixture(humanRole);
  let accumulator = 0;
  let humanInput = {};

  function publish(events, steps) {
    onUpdate({ state, events, steps, interpolationAlpha: accumulator * TICK_RATE });
  }

  return {
    get state() { return state; },
    get interpolationAlpha() { return accumulator * TICK_RATE; },
    get humanSeat() { return state.players.find((player) => player.controller === 'human').seat; },
    setHumanInput(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('input must be an object');
      humanInput = structuredClone(input);
    },
    advanceFrame(deltaSeconds) {
      const result = advanceFrame(accumulator, deltaSeconds, state, () => ({
        [this.humanSeat]: humanInput,
      }));
      accumulator = result.accumulator;
      state = result.state;
      publish(result.events, result.steps);
      return { ...result, interpolationAlpha: accumulator * TICK_RATE };
    },
    reset() {
      state = createQuickMatchFixture(humanRole);
      accumulator = 0;
      humanInput = {};
      publish([], 0);
      return state;
    },
  };
}

export { MAX_STEPS_PER_FRAME, TICK_RATE };
