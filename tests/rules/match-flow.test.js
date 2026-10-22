import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRuleEvent, applyRuleEvents } from '../../src/rules/match-flow.js';
import { createMatch } from '../../src/rules/state.js';
import { stepMatch } from '../../src/rules/simulation.js';
import { resolveClock } from '../../src/rules/match-flow.js';

function make(profileId) {
  return createMatch({ profileId, profileVersion: '0.1', format: '2v2', seed: 0, seats: [
    { seat: 0, team: 0, role: 'attacker' }, { seat: 1, team: 0, role: 'attacker' },
    { seat: 2, team: 1, role: 'sikka' }, { seat: 3, team: 1, role: 'guard' },
  ] });
}

test('Traditional tag cancels daan and swaps sides while round trip scores a point', () => {
  const before = make('traditional');
  const tagged = applyRuleEvent(before, { type: 'tag-valid', guardSeat: 3, targetSeat: 0, tick: 9 });
  assert.equal(before.attackerTeam, 0);
  assert.equal(tagged.attackerTeam, 1);
  assert.equal(tagged.phase, 'transition');
  assert.equal(tagged.eventLog.find((event) => event.type === 'tagged').consequence, 'daan-cancelled-sides-swapped');
  const point = applyRuleEvent(make('traditional'), { type: 'round-trip', seat: 0, tick: 10 });
  assert.deepEqual(point.score, [1, 0]);
  assert.equal(point.eventLog.find((event) => event.type === 'point-scored').consequence, 'traditional-point-same-team-attacks');
});

test('Competitive tag eliminates attacker and starts half-team counter-attack deterministically', () => {
  const s = make('competitive-standard');
  const a = applyRuleEvents(s, [{ type: 'tagged', guardSeat: 3, targetSeat: 0, tick: 1 }]);
  assert.deepEqual(a.eliminated, [0]);
  assert.equal(a.attackerTeam, 1);
  assert.equal(a.phase, 'transition');
  assert.equal(a.transitionReason, 'half-team-counter-attack');
  assert.ok(a.players.find((p) => p.seat === 0).state === 'eliminated');
  assert.equal(a.players.filter((p) => p.team === 1 && p.role === 'attacker').length, 1);
  assert.equal(a.eventLog.find((event) => event.type === 'tagged').consequence, 'attacker-eliminated');
});

test('period clock transitions through halftime, standard tie-break, golden daan, and full time', () => {
  let s = make('competitive-standard'); s.clock.remainingTicks = 1;
  let result = stepMatch(s, {}); s = result.state;
  assert.equal(s.phase, 'transition');
  assert.equal(s.transitionTicksRemaining, 1800);
  assert.equal(s.clock.half, 2);
  assert.equal(s.clock.remainingTicks, 18_000);
  assert.equal(s.attackerTeam, 1);
  const breakClock = s.clock.ticks;
  s = stepMatch(s, {}).state;
  assert.equal(s.clock.ticks, breakClock, 'break ticks do not advance the match clock');

  s = make('competitive-standard'); s.clock.half = 2; s.clock.remainingTicks = 1;
  result = stepMatch(s, {}); s = result.state;
  assert.equal(s.phase, 'playing');
  assert.equal(s.clock.half, 3);
  assert.equal(s.clock.remainingTicks, 7_200);
  s.score = [2, 2]; s.clock.remainingTicks = 1;
  s = stepMatch(s, {}).state;
  assert.equal(s.phase, 'transition');
  assert.equal(s.clock.half, 4);
  assert.equal(s.clock.remainingTicks, 7_200);
  s.transitionTicksRemaining = 1;
  s = stepMatch(s, {}).state;
  assert.equal(s.phase, 'playing');
  s.clock.remainingTicks = 1;
  s = stepMatch(s, {}).state;
  assert.equal(s.phase, 'golden');
  const goldenPoint = applyRuleEvent(s, { type: 'round-trip', seat: s.players.find((p) => p.team === s.attackerTeam && p.role === 'attacker').seat, tick: s.tick });
  assert.equal(goldenPoint.phase, 'ended');
  assert.equal(goldenPoint.result.reason, 'golden-point');
});

test('Quick and Traditional clock endings resolve golden daan or a time winner', () => {
  let s = make('quick-match'); s.clock.half = 2; s.clock.remainingTicks = 1;
  s = stepMatch(s, {}).state;
  assert.equal(s.phase, 'golden');
  s = make('traditional'); s.clock.remainingTicks = 1; s.score = [3, 2];
  s = stepMatch(s, {}).state;
  assert.equal(s.phase, 'ended');
  assert.deepEqual(s.result, { winner: 0, reason: 'time-expired' });
  s = make('traditional'); s.score = [4, 4];
  const golden = applyRuleEvent(s, { type: 'round-trip', seat: 0, tick: 1 });
  assert.equal(golden.phase, 'ended');
  assert.equal(golden.score[0], 5);
});

test('Pro timing shape selects Quick golden or Standard tie-break clock flow', () => {
  const seats = [
    { seat: 0, team: 0, role: 'attacker' }, { seat: 1, team: 0, role: 'attacker' },
    { seat: 2, team: 1, role: 'sikka' }, { seat: 3, team: 1, role: 'guard' },
  ];
  let s = createMatch({ profileId: 'pro', profileVersion: '0.1', format: '2v2', seed: 0, seats, timingShape: 'standard' });
  s.clock.half = 2; s.clock.remainingTicks = 1;
  s = stepMatch(s, {}).state;
  assert.equal(s.clock.half, 3);
  assert.equal(s.clock.remainingTicks, 7_200);
  s = createMatch({ profileId: 'pro', profileVersion: '0.1', format: '2v2', seed: 0, seats, timingShape: 'quick' });
  s.clock.half = 2; s.clock.remainingTicks = 1;
  s = stepMatch(s, {}).state;
  assert.equal(s.phase, 'golden');
});

test('clock zero waits up to the configured resolve window for a pending tag attempt', () => {
  const s = make('quick-match'); s.clock.remainingTicks = 1;
  s.pendingTags = [{ guardSeat: 3, targetSeat: 0, startTick: 0, activeFromTick: 20, activeThroughTick: 28, recoveryThroughTick: 46, contactTick: null, holdThroughTick: null, holdSamples: [], resolved: false }];
  const next = stepMatch(s, {}).state;
  assert.equal(next.phase, 'playing');
  assert.equal(next.clock.remainingTicks, 0);
  assert.equal(next.clock.zeroResolveRemaining, 119);
});

test('duplicate terminal consequences are rejected after phase transition', () => {
  const s = make('traditional');
  const point = applyRuleEvent(s, { type: 'round-trip', seat: 0, tick: 1 });
  assert.throws(() => applyRuleEvent(point, { type: 'round-trip', seat: 0, tick: 2 }), /cannot apply round-trip/);
  const tagged = applyRuleEvent(make('quick-match'), { type: 'tag-valid', guardSeat: 3, targetSeat: 0, tick: 1 });
  assert.throws(() => applyRuleEvent(tagged, { type: 'tag-valid', guardSeat: 3, targetSeat: 1, tick: 2 }), /cannot apply tag consequence/);
});

test('attacker leaving court routes through profile tag consequence; event order is stable', () => {
  const s = make('quick-match');
  const a = applyRuleEvent(s, { type: 'attacker-boundary', seat: 0, tick: 4 });
  assert.equal(a.players.find((p) => p.seat === 0).state, 'eliminated');
  assert.equal(a.eventLog.find((event) => event.reason === 'attacker-left-court').reason, 'attacker-left-court');
  const sorted = applyRuleEvents(make('traditional'), [
    { type: 'tagged', guardSeat: 3, targetSeat: 0, tick: 5 },
    { type: 'tag-void', guardSeat: 2, targetSeat: 1, reason: 'ineligible', tick: 2 },
  ]);
  assert.equal(sorted.eventLog.find((event) => event.reason === 'ineligible').tick, 2);
});

test('Sikka spine-line foul voids the tag and vacates the spine until the next daan', () => {
  const s = make('quick-match');
  const foul = applyRuleEvent(s, {
    type: 'tag-void', guardSeat: 2, targetSeat: 0,
    reason: 'guard-foot-on-line', tick: 3,
  });
  assert.deepEqual(foul.vacatedLanes, []);
  assert.deepEqual(foul.vacatedRegions, ['spine']);
  assert.equal(foul.players.find((p) => p.seat === 2).state, 'spine-vacated');
  const foulEvent = foul.eventLog.find((event) => event.reason === 'sikka-spine-line-foul');
  assert.equal(foulEvent.effect, 'spine-vacated');
  assert.equal(foulEvent.regionId, 'spine');
  const resumed = stepMatch(foul, {}).state;
  assert.equal(resumed.players.find((p) => p.seat === 2).state, 'spine-vacated');
  const reset = applyRuleEvent(foul, { type: 'tagged', guardSeat: 3, targetSeat: 0, tick: 4 });
  assert.deepEqual(reset.vacatedRegions, []);
  assert.equal(reset.players.find((p) => p.seat === 2).state, 'active');
});

test('fouled Sikka keeps attacker entry spawn after a Traditional side change', () => {
  const s = make('traditional');
  const foul = applyRuleEvent(s, {
    type: 'tag-void', guardSeat: 2, targetSeat: 0,
    reason: 'guard-foot-on-line', tick: 3,
  });
  const swapped = applyRuleEvent(foul, { type: 'tagged', guardSeat: 3, targetSeat: 0, tick: 4 });
  const sikka = swapped.players.find((p) => p.seat === 2);
  assert.equal(sikka.role, 'attacker');
  assert.equal(sikka.position.z, swapped.court.bounds.zMax - swapped.court.boxSizeMetres / 2);
  assert.equal(sikka.state, 'active');
  assert.deepEqual(swapped.vacatedRegions, []);
});

test('round trip starts the next attack attempt with cleared lane and spine vacancies', () => {
  const s = make('traditional');
  s.vacatedLanes = ['lane-1']; s.vacatedRegions = ['spine'];
  s.players.find((p) => p.seat === 2).state = 'spine-vacated';
  s.players.find((p) => p.seat === 3).state = 'lane-vacated';
  const next = applyRuleEvent(s, { type: 'round-trip', seat: 0, tick: 4 });
  assert.deepEqual(next.vacatedLanes, []);
  assert.deepEqual(next.vacatedRegions, []);
  assert.equal(next.players.find((p) => p.seat === 2).state, 'active');
  assert.equal(next.players.find((p) => p.seat === 3).state, 'active');
});

test('stepMatch owns the deterministic tag, hold, and profile consequence pipeline', () => {
  let s = make('quick-match');
  const guard = s.players.find((p) => p.seat === 3); const attacker = s.players.find((p) => p.seat === 0);
  guard.position = { x: 0, z: s.court.rowLines[0].centre + 0.2 };
  guard.facing = { x: 0, z: -1 };
  attacker.position = { x: 0, z: guard.position.z - 0.8 };
  const resultEvents = [];
  s = stepMatch(s, { 3: { tag: { targetSeat: 0 } } }).state;
  while (s.phase === 'playing' && s.tick < 50) {
    const result = stepMatch(s, {}); s = result.state; resultEvents.push(...result.events);
  }
  assert.ok(resultEvents.some((event) => event.type === 'tag-contact'));
  assert.ok(resultEvents.some((event) => event.type === 'tag-valid'));
  assert.equal(s.players.find((p) => p.seat === 0).state, 'eliminated');
  assert.equal(s.attackerTeam, 1);
  assert.equal(s.phase, 'transition');
});

test('stepMatch detects an attacker round trip and awards the profile point', () => {
  const s = make('traditional');
  const attacker = s.players.find((p) => p.seat === 0);
  attacker.routeStage = 1;
  attacker.position.z = s.court.bounds.zMin + 0.001;
  attacker.velocity.z = -1;
  const result = stepMatch(s, {});
  assert.deepEqual(result.state.score, [1, 0]);
  assert.equal(result.state.phase, 'transition');
  assert.equal(result.state.players.find((p) => p.seat === 0).routeStage, 0);
  assert.ok(result.events.some((event) => event.type === 'point-scored'));
});
