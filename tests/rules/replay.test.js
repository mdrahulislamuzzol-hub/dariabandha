import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplay, recordReplayHeader, recordTickInputs, replayMatch } from '../../src/rules/replay.js';
import { createMatch } from '../../src/rules/state.js';
import { stepMatch } from '../../src/rules/simulation.js';

function make() {
  return createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '2v2', seed: 14, seats: [
    { seat: 0, team: 0, controller: 'human', role: 'attacker' }, { seat: 1, team: 0, role: 'AI', role: 'attacker' },
    { seat: 2, team: 1, role: 'AI', role: 'sikka' }, { seat: 3, team: 1, role: 'AI', role: 'guard' },
  ] });
}

test('replay header captures setup and replay re-simulates deterministic per-tick input', () => {
  const state = make();
  const header = recordReplayHeader(state, { map: 'village-field', aiTiers: { 3: 'hard' } });
  assert.equal(header.map, 'village-field');
  assert.equal(header.seats.find((s) => s.seat === 3).aiTier, 'hard');
  const replay = createReplay(state);
  recordTickInputs(replay, 0, { 0: { move: { z: 1 } } });
  recordTickInputs(replay, 1, { 0: { move: { z: 1 }, sprint: true } });
  const end = replayMatch(replay);
  assert.equal(end.tick, 2);
  assert.deepEqual(end.players, replayMatch(structuredClone(replay)).players);
});

test('replay rejects gaps, duplicate ticks, unknown seats and malformed stream records', () => {
  const replay = createReplay(make());
  assert.throws(() => recordTickInputs(replay, 1, {}), /expected 0/);
  assert.throws(() => recordTickInputs(replay, 0, { 99: {} }), /unknown seat/);
  recordTickInputs(replay, 0, {});
  assert.throws(() => recordTickInputs(replay, 0, {}), /expected 1/);
  replay.inputs.push({ tick: 2, bySeat: {} });
  assert.throws(() => replayMatch(replay), /contiguous/);
  const malformed = createReplay(make()); malformed.inputs.push({ tick: 0, bySeat: { 99: {} } });
  assert.throws(() => replayMatch(malformed), /unknown seat/);
});

test('replay validates AI tier keys against AI seats and validates header tiers', () => {
  const state = make();
  assert.throws(() => recordReplayHeader(state, { aiTiers: { 99: 'hard' } }), /unknown or non-AI seat 99/);
  assert.throws(() => recordReplayHeader(state, { aiTiers: { 0: 'hard' } }), /unknown or non-AI seat 0/);
  const replay = createReplay(state);
  replay.header.seats.find((seat) => seat.seat === 2).aiTier = 'impossible';
  assert.throws(() => replayMatch(replay), /seats\[2\]\.aiTier/);
});

test('replay re-simulates a complete tag hold and profile consequence from tick inputs', () => {
  const initial = make();
  const replay = createReplay(initial);
  const map = replay.header.map;
  let live = initial;
  for (let tick = 0; tick < 90; tick += 1) {
    const input = tick < 20 ? { 0: { move: { x: 1 } } }
      : tick < 30 ? {}
        : tick < 40 ? { 0: { move: { z: 1 } }, ...(tick === 30 ? { 3: { tag: { targetSeat: 0 } } } : {}) }
        : {};
    recordTickInputs(replay, tick, input);
    live = stepMatch(live, input).state;
  }
  live.map = map;
  const restored = replayMatch(replay);
  assert.deepEqual(restored, live);
  assert.equal(restored.players.find((p) => p.seat === 0).state, 'eliminated');
  assert.ok(restored.eventLog.some((event) => event.type === 'tagged'));
});
