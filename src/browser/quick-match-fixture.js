import { createMatch } from '../rules/state.js';

export const QUICK_MATCH_SEED = 0;

const TEAM_SIZE = 4;
const ROLE_SEAT = Object.freeze({ attacker: 0, sikka: 4, guard: 5 });
const HUMAN_ROLES = new Set(Object.keys(ROLE_SEAT));

/** Reads the local-only fixture role; this is not a player-facing menu. */
export function selectQuickMatchHumanRole(search = '') {
  const requested = new URLSearchParams(search).get('humanRole');
  return HUMAN_ROLES.has(requested) ? requested : 'attacker';
}

export function isQuickMatchTagTest(search = '') {
  const params = new URLSearchParams(search);
  return selectQuickMatchHumanRole(search) === 'guard' && params.get('tagTest') === '1';
}

/** Reproducible developer-only 4v4 Quick Match. Seed 0 tosses team 0 into
 * attack. The selected human seat is the only human; the other seven are
 * stationary AI placeholders until the later AI milestone. */
export function createQuickMatchFixture(humanRole = 'attacker', { tagTest = false } = {}) {
  const humanSeat = ROLE_SEAT[humanRole];
  if (humanSeat === undefined) throw new RangeError('humanRole must be attacker, guard, or sikka');
  const seats = Array.from({ length: TEAM_SIZE * 2 }, (_, seat) => ({
    seat,
    team: seat < TEAM_SIZE ? 0 : 1,
    controller: seat === humanSeat ? 'human' : 'AI',
    role: seat < TEAM_SIZE ? 'attacker' : (seat === TEAM_SIZE ? 'sikka' : 'guard'),
  }));
  const state = createMatch({
    profileId: 'quick-match',
    profileVersion: '0.1',
    format: '4v4',
    seed: QUICK_MATCH_SEED,
    seats,
  });
  if (tagTest) {
    if (humanRole !== 'guard') throw new RangeError('tagTest fixture requires humanRole guard');
    const guard = state.players.find((player) => player.controller === 'human');
    const target = state.players.find((player) => player.team !== guard.team && player.role === 'attacker');
    // Keep neutral AI stationary but place one attacker inside a legal tag
    // window so the manual browser check can exercise the B1 tag pipeline.
    target.position = { x: guard.position.x, z: guard.position.z - 0.8 };
  }
  return state;
}
