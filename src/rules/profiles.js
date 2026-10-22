import {
  BREAK_TICKS,
  QUICK_HALF_TICKS,
  PROFILE_SPECS,
  STANDARD_HALF_TICKS,
  STANDARD_TIEBREAK_HALF_TICKS,
  TRADITIONAL_MATCH_CAP_TICKS,
} from './constants.js';
import { assertValidProfile } from './validation.js';

const allFormats = Object.freeze(['2v2', '4v4', '6v6']);
const competitiveFormats = Object.freeze(['2v2', '4v4', '6v6']);
const profileData = Object.freeze({
  traditional: Object.freeze({
    id: 'traditional', version: '0.1', name: 'Traditional (Village Gadi)',
    timingShape: 'traditional', formats: allFormats,
    halves: 0, halfTicks: 0, breakTicks: 0, tiebreak: 'golden-daan',
    capTicks: TRADITIONAL_MATCH_CAP_TICKS, pointsToWin: 5,
    tagConsequence: 'cancel-daan-swap-sides', scoring: 'round-trip-point',
    halfAttackRule: 'none', vacateOnLine: true, spineForFrontGuard: false,
    proMechanics: Object.freeze({ feint: false, burstCut: false, guardLunge: false, captainPings: false }),
  }),
  'competitive-standard': Object.freeze({
    id: 'competitive-standard', version: '0.1', name: 'Competitive Standard',
    timingShape: 'standard', formats: competitiveFormats,
    halves: 2, halfTicks: STANDARD_HALF_TICKS, breakTicks: BREAK_TICKS,
    tiebreak: 'two-halves-then-golden-daan', tiebreakHalfTicks: STANDARD_TIEBREAK_HALF_TICKS,
    capTicks: null, tagConsequence: 'eliminate-attacker', scoring: 'round-trip-game-point',
    halfAttackRule: 'immediate-half-team-counter-attack', vacateOnLine: true, spineForFrontGuard: false,
    proMechanics: Object.freeze({ feint: false, burstCut: false, guardLunge: false, captainPings: false }),
  }),
  'quick-match': Object.freeze({
    id: 'quick-match', version: '0.1', name: 'Quick Match',
    timingShape: 'quick', formats: allFormats,
    halves: 2, halfTicks: QUICK_HALF_TICKS, breakTicks: BREAK_TICKS,
    tiebreak: 'golden-daan', capTicks: null,
    tagConsequence: 'eliminate-attacker', scoring: 'round-trip-game-point',
    halfAttackRule: 'immediate-half-team-counter-attack', vacateOnLine: true, spineForFrontGuard: false,
    proMechanics: Object.freeze({ feint: false, burstCut: false, guardLunge: false, captainPings: false }),
  }),
  pro: Object.freeze({
    id: 'pro', version: '0.1', name: 'Pro',
    timingShape: 'selectable', formats: allFormats,
    halves: 2, halfTicks: null, breakTicks: BREAK_TICKS,
    selectableTimingShapes: Object.freeze(['standard', 'quick']),
    tiebreak: 'selected-timing', capTicks: null,
    tagConsequence: 'eliminate-attacker', scoring: 'round-trip-game-point',
    halfAttackRule: 'immediate-half-team-counter-attack', vacateOnLine: true, spineForFrontGuard: false,
    proMechanics: Object.freeze({ feint: true, burstCut: true, guardLunge: true, captainPings: true }),
  }),
});

for (const profile of Object.values(profileData)) {
  assertValidProfile(profile);
}

/** Returns the immutable rule record for the exact replay-safe profile version. */
export function getProfile(profileId, version) {
  const profile = profileData[profileId];
  if (!profile) {
    assertValidProfile({ id: profileId, version, timingShape: PROFILE_SPECS[profileId]?.timingShape });
  }
  assertValidProfile({ id: profileId, version, timingShape: profile.timingShape });
  return profile;
}
