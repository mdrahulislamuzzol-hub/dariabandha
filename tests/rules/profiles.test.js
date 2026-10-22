import test from 'node:test';
import assert from 'node:assert/strict';
import { getProfile } from '../../src/rules/profiles.js';

test('returns the four exact versioned profile records', () => {
  assert.equal(getProfile('traditional', '0.1').capTicks, 28_800);
  assert.equal(getProfile('traditional', '0.1').pointsToWin, 5);
  const standard = getProfile('competitive-standard', '0.1');
  assert.equal(standard.halfTicks, 18_000);
  assert.equal(standard.breakTicks, 1_800);
  assert.equal(standard.tiebreakHalfTicks, 7_200);
  const quick = getProfile('quick-match', '0.1');
  assert.equal(quick.halfTicks, 12_600);
  assert.equal(quick.breakTicks, 1_800);
  assert.equal(quick.tiebreak, 'golden-daan');
  const pro = getProfile('pro', '0.1');
  assert.deepEqual(pro.selectableTimingShapes, ['standard', 'quick']);
  assert.deepEqual(pro.proMechanics, { feint: true, burstCut: true, guardLunge: true, captainPings: true });
});

test('profile consequences remain isolated and nested profile data is immutable', () => {
  const traditional = getProfile('traditional', '0.1');
  const standard = getProfile('competitive-standard', '0.1');
  const quick = getProfile('quick-match', '0.1');
  const pro = getProfile('pro', '0.1');
  assert.equal(traditional.tagConsequence, 'cancel-daan-swap-sides');
  assert.equal(standard.tagConsequence, 'eliminate-attacker');
  assert.equal(quick.tagConsequence, standard.tagConsequence);
  assert.equal(pro.tagConsequence, standard.tagConsequence);
  assert.equal(traditional.proMechanics.feint, false);
  assert.equal(standard.proMechanics.guardLunge, false);
  assert.equal(quick.proMechanics.captainPings, false);
  for (const profile of [traditional, standard, quick, pro]) {
    assert.ok(Object.isFrozen(profile));
    assert.ok(Object.isFrozen(profile.formats));
    assert.ok(Object.isFrozen(profile.proMechanics));
  }
  assert.throws(() => { traditional.formats.push('test'); }, TypeError);
});

test('rejects unknown ids and unsupported versions before returning data', () => {
  assert.throws(() => getProfile('unknown', '0.1'), /profile.id must be one of/);
  assert.throws(() => getProfile('quick-match', '0.2'), /profile.version must be/);
  assert.throws(() => getProfile('pro', null), /profile.version must be a string/);
});
