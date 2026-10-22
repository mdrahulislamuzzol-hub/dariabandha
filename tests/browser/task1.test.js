import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameCoordinator, MAX_STEPS_PER_FRAME, TICK_RATE } from '../../src/browser/coordinator.js';
import { createQuickMatchFixture, QUICK_MATCH_SEED } from '../../src/browser/quick-match-fixture.js';

const roles = ['attacker', 'guard', 'sikka'];

test('fixed Quick Match fixtures are deterministic 4v4 with one human and seven inactive AI seats', () => {
  for (const role of roles) {
    const first = createQuickMatchFixture(role);
    const second = createQuickMatchFixture(role);
    assert.deepEqual(first, second);
    assert.equal(first.format, '4v4');
    assert.equal(first.profile.id, 'quick-match');
    assert.equal(first.random.seed, QUICK_MATCH_SEED);
    assert.equal(first.random.state, (QUICK_MATCH_SEED + 0x6d2b79f5) >>> 0);
    assert.equal(first.toss.draw, 0.26642920868471265);
    assert.equal(first.players.filter(({ controller }) => controller === 'human').length, 1);
    assert.equal(first.players.filter(({ controller }) => controller === 'AI').length, 7);
    assert.equal(first.players.find(({ controller }) => controller === 'human').role, role);
  }
});

test('render cadence at 30, 60, and 120 Hz yields identical authoritative ticks and state', () => {
  const outcomes = [30, 60, 120].map((framesPerSecond) => {
    const game = createGameCoordinator({ humanRole: 'attacker' });
    game.setHumanInput({ move: { x: 0, z: 1 } });
    const delta = 1 / framesPerSecond;
    for (let index = 0; index < framesPerSecond * 2; index += 1) game.advanceFrame(delta);
    return game.state;
  });
  assert.equal(outcomes[0].tick, TICK_RATE * 2);
  assert.deepEqual(outcomes[1], outcomes[0]);
  assert.deepEqual(outcomes[2], outcomes[0]);
});

test('per-frame catch-up obeys the five-step cap and reports presentation interpolation only', () => {
  const game = createGameCoordinator();
  const frame = game.advanceFrame(1);
  assert.equal(frame.steps, MAX_STEPS_PER_FRAME);
  assert.equal(game.state.tick, MAX_STEPS_PER_FRAME);
  assert.ok(frame.interpolationAlpha >= 0 && frame.interpolationAlpha < 1e-8);
  const before = JSON.stringify(game.state);
  assert.equal(game.interpolationAlpha, frame.interpolationAlpha);
  assert.equal(JSON.stringify(game.state), before);
});

test('reset restores the same seeded match, toss state, and human seat', () => {
  const game = createGameCoordinator({ humanRole: 'sikka' });
  const initial = game.state;
  game.setHumanInput({ move: { x: 1, z: 1 } });
  game.advanceFrame(1 / TICK_RATE);
  const reset = game.reset();
  assert.deepEqual(reset, initial);
  assert.equal(game.humanSeat, 4);
  assert.equal(game.interpolationAlpha, 0);
});
