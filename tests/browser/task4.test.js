import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameCoordinator } from '../../src/browser/coordinator.js';
import { describeHud, updateHud } from '../../src/browser/hud.js';
import { QUICK_MATCH_SEED } from '../../src/browser/quick-match-fixture.js';

test('HUD describes the controlled seat and current B1 match state', () => {
  const game = createGameCoordinator({ humanRole: 'attacker' });
  const snapshot = describeHud(game.state, game.humanSeat);

  assert.deepEqual(snapshot, {
    role: 'Attacker',
    team: 'Team 1',
    phase: 'playing',
    score: '0 – 0',
    clock: '3:30',
    half: '1',
    stamina: '100%',
    call: 'Toss: Team 1 attacks',
  });
});

test('HUD reflects role changes, score, clock, stamina, and the latest B1 call', () => {
  const game = createGameCoordinator({ humanRole: 'guard' });
  const state = structuredClone(game.state);
  const human = state.players.find((player) => player.seat === game.humanSeat);
  human.role = 'sikka';
  human.stamina = null;
  state.phase = 'golden';
  state.clock.remainingTicks = 59;
  state.score = [2, 1];
  const call = { type: 'point-scored', team: 0, reason: 'round-trip-complete' };
  const fields = Object.fromEntries(['role', 'team', 'phase', 'score', 'clock', 'half', 'stamina', 'call']
    .map((key) => [key, { textContent: '' }]));

  const snapshot = updateHud(fields, state, game.humanSeat, [call]);
  assert.equal(snapshot.role, 'Sikka');
  assert.equal(snapshot.team, 'Team 2');
  assert.equal(snapshot.phase, 'golden');
  assert.equal(snapshot.score, '2 – 1');
  assert.equal(snapshot.clock, '0:01');
  assert.equal(snapshot.stamina, '—');
  assert.equal(snapshot.call, 'Point: Team 1 scored');
  assert.equal(fields.call.textContent, snapshot.call);
});

test('reset recreates the original fixture and retains exactly its single seeded toss draw', () => {
  const game = createGameCoordinator({ humanRole: 'guard' });
  const initial = structuredClone(game.state);
  game.setHumanInput({ move: { x: 1, z: 0 }, sprint: true });
  for (let tick = 0; tick < 120; tick += 1) game.advanceFrame(1 / 60);
  assert.notDeepEqual(game.state, initial);

  const reset = game.reset();
  assert.deepEqual(reset, initial);
  assert.equal(reset.random.seed, QUICK_MATCH_SEED);
  assert.equal(reset.random.state, (QUICK_MATCH_SEED + 0x6d2b79f5) >>> 0);
  assert.equal(reset.eventLog.filter((event) => event.type === 'toss-resolved').length, 1);
  assert.equal(reset.toss.draw, initial.toss.draw);
  assert.equal(game.humanSeat, 5);
  assert.equal(game.interpolationAlpha, 0);
});
