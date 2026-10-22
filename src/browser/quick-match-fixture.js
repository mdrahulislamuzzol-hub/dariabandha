import { createMatch } from '../rules/state.js';

export const QUICK_MATCH_SEED = 0;

const TEAM_SIZE = 4;
const ROLE_SEAT = Object.freeze({ attacker: 0, sikka: 4, guard: 5 });

/** Reproducible developer-only 4v4 Quick Match. Seed 0 tosses team 0 into
 * attack. The selected human seat is the only human; the other seven are
 * stationary AI placeholders until the later AI milestone. */
export function createQuickMatchFixture(humanRole = 'attacker') {
  const humanSeat = ROLE_SEAT[humanRole];
  if (humanSeat === undefined) throw new RangeError('humanRole must be attacker, guard, or sikka');
  const seats = Array.from({ length: TEAM_SIZE * 2 }, (_, seat) => ({
    seat,
    team: seat < TEAM_SIZE ? 0 : 1,
    controller: seat === humanSeat ? 'human' : 'AI',
    role: seat < TEAM_SIZE ? 'attacker' : (seat === TEAM_SIZE ? 'sikka' : 'guard'),
  }));
  return createMatch({
    profileId: 'quick-match',
    profileVersion: '0.1',
    format: '4v4',
    seed: QUICK_MATCH_SEED,
    seats,
  });
}
