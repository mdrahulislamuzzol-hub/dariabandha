import test from 'node:test';
import assert from 'node:assert/strict';
import { beginTag, resolveTags } from '../../src/rules/tags.js';
import { createMatch } from '../../src/rules/state.js';

function state() {
  const s = createMatch({ profileId: 'quick-match', profileVersion: '0.1', format: '2v2', seed: 0, seats: [
    { seat: 0, team: 0, role: 'attacker' }, { seat: 1, team: 0, role: 'attacker' },
    { seat: 2, team: 1, role: 'sikka' }, { seat: 3, team: 1, role: 'guard' },
  ] });
  const g = s.players.find((p) => p.seat === 3); const a = s.players.find((p) => p.seat === 0);
  g.position = { x: 0, z: s.court.rowLines[0].centre + 0.2 }; g.facing = { x: 0, z: -1 };
  a.position = { x: 0, z: g.position.z - 0.8 };
  return s;
}

test('beginTag schedules fixed wind-up, active, and recovery windows', () => {
  const s = state(); const attempt = beginTag(s, 3, 0);
  assert.equal(attempt.activeFromTick, 6);
  assert.equal(attempt.activeThroughTick, 14);
  assert.equal(attempt.recoveryThroughTick, 32);
  assert.equal(attempt.holdThroughTick, null);
  assert.throws(() => beginTag(s, 0, 3), /not a defender/);
});

test('resolveTags waits for active ticks and applies reach plus cone without extending reach', () => {
  const s = state(); const attempt = beginTag(s, 3, 0);
  assert.deepEqual(resolveTags(s, [attempt]), []);
  s.tick = attempt.activeFromTick;
  assert.equal(resolveTags(s, [attempt])[0].type, 'tag-contact');
  for (s.tick += 1; s.tick <= attempt.holdThroughTick; s.tick += 1) {
    const result = resolveTags(s, [attempt]);
    if (s.tick === attempt.holdThroughTick) assert.equal(result[0].type, 'tag-valid');
  }
  const beyond = { ...beginTag(s, 3, 0) };
  beyond.activeFromTick = s.tick;
  beyond.activeThroughTick = s.tick;
  s.players.find((p) => p.seat === 0).position.x = 0.8;
  const miss = resolveTags(s, [beyond])[0];
  assert.equal(miss.reason, 'outside-aim-cone');
  assert.equal(miss.attemptResolved, false);
});

test('line overlap voids a tag with stable reason and line step wins a same-tick tie', () => {
  const s = state(); const attempt = beginTag(s, 3, 0); s.tick = attempt.activeFromTick;
  s.players.find((p) => p.seat === 3).position.z = s.court.rowLines[0].centre;
  assert.equal(resolveTags(s, [attempt])[0].reason, 'guard-foot-on-line');
  const clean = state(); const cleanAttempt = { ...beginTag(clean, 3, 0), lineStepTick: 6 };
  clean.tick = 6;
  assert.equal(resolveTags(clean, [cleanAttempt])[0].reason, 'guard-foot-on-line');
});

test('a line step during the post-touch hold voids the tag', () => {
  const s = state(); const attempt = beginTag(s, 3, 0); s.tick = attempt.activeFromTick;
  assert.equal(resolveTags(s, [attempt])[0].type, 'tag-contact');
  for (s.tick += 1; s.tick <= attempt.holdThroughTick; s.tick += 1) {
    if (s.tick === attempt.contactTick + 4) s.players.find((p) => p.seat === 3).position.z = s.court.rowLines[0].centre;
    const result = resolveTags(s, [attempt]);
    if (s.tick === attempt.holdThroughTick) assert.equal(result[0].reason, 'guard-foot-on-line');
  }
});

test('simultaneous contact candidates remain eligible until each hold resolves', () => {
  const s = state(); const g3 = s.players.find((p) => p.seat === 3); const g2 = s.players.find((p) => p.seat === 2);
  g2.position = { ...g3.position }; g2.facing = { ...g3.facing };
  const attempts = [beginTag(s, 3, 0), beginTag(s, 2, 0)]; s.tick = 6;
  assert.equal(resolveTags(s, attempts).length, 2);
  for (s.tick += 1; s.tick <= attempts[0].holdThroughTick; s.tick += 1) {
    if (s.tick === attempts[0].contactTick + 4) g3.position.z = s.court.rowLines[0].centre;
    const result = resolveTags(s, attempts);
    if (s.tick === attempts[0].holdThroughTick) {
      assert.equal(result.find((event) => event.type === 'tag-valid')?.guardSeat, 2);
      assert.equal(result.find((event) => event.type === 'tag-void')?.guardSeat, 3);
    }
  }
});

test('target leaving court or becoming ineligible during hold invalidates contact', () => {
  const s = state(); const attempt = beginTag(s, 3, 0); s.tick = 6;
  resolveTags(s, [attempt]);
  for (s.tick += 1; s.tick <= attempt.holdThroughTick; s.tick += 1) {
    if (s.tick === attempt.contactTick + 5) s.players.find((p) => p.seat === 0).state = 'out';
    const result = resolveTags(s, [attempt]);
    if (s.tick === attempt.holdThroughTick) assert.equal(result[0].reason, 'target-no-longer-eligible');
  }
});

test('equal tick candidates sort by distance then lower guard seat, independent of input order', () => {
  const s = state(); const target = s.players.find((p) => p.seat === 0);
  const g3 = s.players.find((p) => p.seat === 3); const g2 = s.players.find((p) => p.seat === 2);
  g2.position = { x: 0.04, z: g3.position.z }; g2.facing = { x: -0.05, z: -1 };
  target.position = { x: 0, z: g3.position.z - 0.8 };
  const attempts = [beginTag(s, 3, 0), beginTag(s, 2, 0)]; s.tick = 6;
  const nearest = resolveTags(s, attempts);
  assert.equal(nearest[0].guardSeat, 3); // nearer segment
  assert.equal(nearest[1].guardSeat, 2); // both contacts persist through hold validation
  g2.position = { ...g3.position }; g2.facing = { ...g3.facing };
  s.tick = 0;
  const tied = [beginTag(s, 3, 0), beginTag(s, 2, 0)];
  s.tick = 6;
  const tie = resolveTags(s, [...tied].reverse());
  assert.equal(tie[0].guardSeat, 2);
  assert.equal(tie[1].guardSeat, 3);
});
