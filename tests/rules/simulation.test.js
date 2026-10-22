import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceFrame, stepMatch } from '../../src/rules/simulation.js';
import { createMatch } from '../../src/rules/state.js';
import { TICK_RATE } from '../../src/rules/constants.js';

function seats2v2() {
  return [
    { seat: 3, team: 1, controller: 'AI', role: 'guard' },
    { seat: 0, team: 0, controller: 'human', role: 'attacker' },
    { seat: 2, team: 1, controller: 'AI', role: 'sikka' },
    { seat: 1, team: 0, controller: 'AI', role: 'attacker' },
  ];
}

function makeState() {
  return createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '2v2', seed: 0, seats: seats2v2() });
}

test('createMatch validates and canonicalizes seats into serializable initialized state', () => {
  const state = makeState();
  assert.deepEqual(state.players.map((p) => p.seat), [0, 1, 2, 3]);
  assert.equal(state.tick, 0);
  assert.equal(state.phase, 'playing');
  assert.deepEqual(state.players[0].velocity, { x: 0, z: 0 });
  assert.equal(state.players[0].stamina, 100);
  assert.equal(state.players[2].stamina, null);
  assert.doesNotThrow(() => JSON.stringify(state));
  assert.throws(() => createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '2v2', seed: 1, seats: [] }), /exactly 4 players/);
  assert.throws(() => createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '2v2', seed: 1, seats: [...seats2v2(), seats2v2()[0]] }), /exactly 4 players/);
});

test('Mulberry32 seeded toss chooses either opening side and maps the template Sikka ordinal', () => {
  const teamZero = createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '2v2', seed: 0, seats: seats2v2() });
  const teamOne = createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '2v2', seed: 1, seats: seats2v2() });
  assert.equal(teamZero.toss.winnerTeam, 0);
  assert.equal(teamZero.attackerTeam, 0);
  assert.deepEqual(teamZero.players.filter((p) => p.team === 1).map((p) => p.role), ['sikka', 'guard']);
  assert.equal(teamOne.toss.winnerTeam, 1);
  assert.equal(teamOne.attackerTeam, 1);
  assert.deepEqual(teamOne.players.filter((p) => p.team === 0).map((p) => p.role), ['sikka', 'guard']);
  assert.equal(teamOne.players.filter((p) => p.role === 'attacker').length, 2);
  assert.equal(teamOne.players.find((p) => p.role === 'sikka').position.x, 0);
  assert.ok(teamOne.eventLog[0].type === 'toss-resolved');
  assert.ok(teamOne.random.state !== teamOne.random.seed);
  assert.deepEqual(teamOne, createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '2v2', seed: 1, seats: seats2v2() }));
});

test('sparse seat IDs do not change a guard lane between spawn and the first tick', () => {
  const seats = [
    ...[1, 7, 12, 18, 24, 29].map((seat) => ({ seat, team: 0, role: 'attacker' })),
    ...[101, 205, 309, 412, 518].map((seat) => ({ seat, team: 1, role: 'guard' })),
    { seat: 900, team: 1, role: 'sikka' },
  ];
  const state = createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '6v6', seed: 0, seats });
  const guards = state.players.filter((player) => player.role === 'guard');
  for (const [index, guard] of guards.entries()) assert.ok(Math.abs(guard.position.z - (state.court.laneStrips[index].zMin + 0.13)) < 1e-12);
  const next = stepMatch(state, {}).state;
  assert.deepEqual(next.players.filter((player) => player.role === 'guard').map((player) => player.position.z), guards.map((player) => player.position.z));
});

test('Pro timing selector defaults to standard, accepts quick, and rejects invalid selectors', () => {
  const args = { profileId: 'pro', profileVersion: '0.1', format: '2v2', seed: 0, seats: seats2v2() };
  const standard = createMatch(args);
  const quick = createMatch({ ...args, timingShape: 'quick' });
  assert.equal(standard.timingShape, 'standard');
  assert.equal(standard.clock.remainingTicks, 18_000);
  assert.equal(quick.timingShape, 'quick');
  assert.equal(quick.clock.remainingTicks, 12_600);
  assert.throws(() => createMatch({ ...args, timingShape: 'traditional' }), /timingShape must be one of/);
  assert.throws(() => createMatch({ ...args, profileId: 'quick-match', timingShape: 'quick' }), /only selectable for profile/);
});

test('stepMatch validates inputs, orders player updates, and is deterministic', () => {
  const original = makeState();
  const input = { 0: { move: { x: 1, z: 1 }, sprint: true }, 1: { move: { z: 1 } } };
  const a = stepMatch(original, input);
  const b = stepMatch(original, new Map([[1, { move: { z: 1 } }], [0, { move: { x: 1, z: 1 }, sprint: true }]]));
  assert.deepEqual(a, b);
  assert.equal(original.tick, 0, 'step does not mutate its input state');
  assert.equal(a.state.tick, 1);
  assert.ok(Math.hypot(a.state.players[0].velocity.x, a.state.players[0].velocity.z) <= 5 + 1e-12);
  assert.throws(() => stepMatch(original, { 99: { move: { x: 0, z: 0 } } }), /unknown seat/);
  assert.throws(() => stepMatch(original, { 0: { move: { x: 2, z: 0 } } }), /between -1 and 1/);
  assert.throws(() => stepMatch(original, { 0: { sprint: 1 } }), /sprint must be a boolean/);
});

test('attacker sprints drain stamina and standing recovers it; guard stays in lane and Sikka in spine', () => {
  let state = makeState();
  state = stepMatch(state, { 0: { move: { z: 1 }, sprint: true } }).state;
  assert.ok(state.players[0].stamina < 100);
  const prior = state.players[0].stamina;
  state = stepMatch(state, {}).state;
  assert.ok(state.players[0].stamina > prior);
  const guard = state.players.find((p) => p.role === 'guard');
  const sikka = state.players.find((p) => p.role === 'sikka');
  const lane = state.court.laneStrips[0];
  state = stepMatch(state, { [guard.seat]: { move: { x: 0, z: -1 } }, [sikka.seat]: { move: { x: 1, z: 1 } } }).state;
  const movedGuard = state.players.find((p) => p.seat === guard.seat);
  const movedSikka = state.players.find((p) => p.seat === sikka.seat);
  assert.ok(movedGuard.position.z >= lane.zMin && movedGuard.position.z <= lane.zMax);
  assert.ok(movedSikka.position.x >= state.court.spineGeometry.xMin && movedSikka.position.x <= state.court.spineGeometry.xMax);
});

test('attacker court departure emits a stable boundary event for Task 4 rule handling', () => {
  const state = makeState();
  state.players[0].position.x = state.court.bounds.xMax - 0.001;
  state.players[0].velocity.x = 6;
  const result = stepMatch(state, {});
  assert.deepEqual(result.events, [
    { type: 'attacker-boundary', reason: 'attacker-left-court', tick: 1, seat: 0, team: 0 },
    { type: 'tagged', reason: 'attacker-left-court', tick: 1, guardSeat: null, targetSeat: 0, consequence: 'attacker-eliminated' },
  ]);
  assert.equal(result.state.players[0].state, 'eliminated');
});

test('advanceFrame keeps 60 Hz ticks, caps catch-up at five, and yields cadence-independent state', () => {
  const state = makeState();
  const capped = advanceFrame(0, 1, state, () => ({}));
  assert.equal(capped.steps, 5);
  assert.ok(capped.accumulator < 1 / TICK_RATE);
  let slow = { accumulator: 0, state, events: [] };
  for (let i = 0; i < 60; i += 1) {
    const r = advanceFrame(slow.accumulator, 1 / TICK_RATE, slow.state, () => ({ 0: { move: { z: 1 } } }));
    slow = r;
  }
  let fast = advanceFrame(0, 1, state, () => ({ 0: { move: { z: 1 } } }));
  assert.equal(slow.state.tick, 60);
  assert.equal(fast.state.tick, 5);
  const batched = advanceFrame(0, 5 / TICK_RATE, state, () => ({ 0: { move: { z: 1 } } }));
  assert.deepEqual(batched.state, advanceFrame(0, 5 / TICK_RATE, state, () => ({ 0: { move: { z: 1 } } })).state);
  assert.throws(() => advanceFrame(-1, 0, state, () => ({})), /accumulator/);
  assert.throws(() => advanceFrame(0, 0, state, null), /inputProvider/);
});
