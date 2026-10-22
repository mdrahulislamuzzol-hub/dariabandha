import {
  ATTACKER_CAPSULE_RADIUS_METRES,
  FOOT_CIRCLE_RADIUS_METRES,
  LINE_HALF_WIDTH_METRES,
  QUICK_HALF_TICKS,
  STANDARD_HALF_TICKS,
  STAMINA_CAPACITY,
} from './constants.js';
import { createCourt } from './court.js';
import { getProfile } from './profiles.js';
import { assertValidFormat } from './validation.js';
import { drawMulberry32 } from './random.js';

// Deterministic entry-box spacing keeps simultaneous attackers legible while
// remaining wholly inside every supported court width.
const ATTACKER_SPAWN_SPACING_METRES = 0.75;

function finite(value, field) {
  if (!Number.isFinite(value)) throw new TypeError(`${field} must be a finite number`);
}

function validateSeats(seats, format) {
  if (!Array.isArray(seats)) throw new TypeError('seats must be an array');
  const teamSize = Number(format[0]);
  if (seats.length !== teamSize * 2) {
    throw new RangeError(`seats must contain exactly ${teamSize * 2} players for ${format}`);
  }
  const seen = new Set();
  return seats.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new TypeError(`seats[${index}] must be an object`);
    }
    const { seat, team, controller = 'AI', role } = entry;
    if (!Number.isInteger(seat) || seat < 0) throw new TypeError(`seats[${index}].seat must be a non-negative integer`);
    if (seen.has(seat)) throw new RangeError(`seat ${seat} is duplicated`);
    seen.add(seat);
    if (team !== 0 && team !== 1) throw new RangeError(`seats[${index}].team must be 0 or 1`);
    if (!['human', 'AI', 'replay'].includes(controller)) throw new RangeError(`seats[${index}].controller is invalid`);
    if (!['attacker', 'guard', 'sikka'].includes(role)) throw new RangeError(`seats[${index}].role is invalid`);
    return { seat, team, controller, role };
  }).sort((a, b) => a.seat - b.seat);
}

export function positionAttackersAtEntry(state, player, attackerOrdinal = 0) {
  const court = state.court ?? state;
  const { zMin, zMax } = court.bounds;
  const lateralOrdinal = attackerOrdinal === 0
    ? 0
    : (attackerOrdinal % 2 === 1 ? -Math.ceil(attackerOrdinal / 2) : attackerOrdinal / 2);
  return {
    x: lateralOrdinal * ATTACKER_SPAWN_SPACING_METRES,
    z: player.team === 0 ? zMin + court.boxSizeMetres / 2 : zMax - court.boxSizeMetres / 2,
  };
}

function initialPosition(player, court, guardLaneIndex = 0, attackerOrdinal = 0) {
  const { xMin, xMax, zMin, zMax } = court.bounds;
  if (player.role === 'sikka') return { x: 0, z: (zMin + zMax) / 2 };
  if (player.role === 'guard') {
    // Guards begin at the centre of their assigned row/end strip.
    const laneId = court.guardLaneIds[guardLaneIndex % court.guardLaneIds.length];
    const lane = court.laneStrips.find((entry) => entry.id === laneId);
    // Guards stand within their lane but clear of the marked line by more
    // than the inclusive foot-circle overlap threshold.
    const laneZ = lane.zMin + LINE_HALF_WIDTH_METRES + FOOT_CIRCLE_RADIUS_METRES + 0.01;
    return { x: player.team === 0 ? xMin / 2 : xMax / 2, z: laneZ };
  }
  // Attackers enter from opposing ends, within the first/last box.
  return positionAttackersAtEntry(court, player, attackerOrdinal);
}

/** Creates a serializable, renderer-independent match state. Seat objects are
 * {seat, team, controller?, role}; seat IDs are canonicalized in ascending order.
 * Pro accepts timingShape 'standard' or 'quick'; it defaults to 'standard'. */
function initializeMatch({ profileId, profileVersion, format, seed, seats, timingShape }, legacyReplay = false) {
  finite(seed, 'seed');
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('seed must be an unsigned 32-bit integer');
  }
  assertValidFormat(format);
  const profile = getProfile(profileId, profileVersion);
  if (!profile.formats.includes(format)) throw new RangeError(`profile ${profileId} does not support format ${format}`);
  let selectedTimingShape = profile.timingShape;
  let halfTicks = profile.halfTicks;
  if (profileId === 'pro') {
    selectedTimingShape = timingShape ?? 'standard';
    if (!profile.selectableTimingShapes.includes(selectedTimingShape)) {
      throw new RangeError(`timingShape must be one of ${profile.selectableTimingShapes.join(', ')} for profile ${JSON.stringify(profileId)}`);
    }
    halfTicks = selectedTimingShape === 'quick' ? QUICK_HALF_TICKS : STANDARD_HALF_TICKS;
  } else if (timingShape !== undefined) {
    throw new RangeError(`timingShape is only selectable for profile ${JSON.stringify('pro')}`);
  }
  const ordered = validateSeats(seats, format);
  const teamSize = Number(format[0]);
  for (const team of [0, 1]) {
    const teamPlayers = ordered.filter((p) => p.team === team);
    if (teamPlayers.length !== teamSize) throw new RangeError(`team ${team} must contain exactly ${teamSize} players`);
  }
  let toss;
  let attackerTeam;
  let roleSeats;
  if (legacyReplay) {
    // Pre-toss replay headers stored already-resolved roles and began with the
    // seed as RNG state. Restore those values directly without consuming a draw.
    const fullAttackerTeams = [0, 1].filter((team) => ordered.filter((p) => p.team === team && p.role === 'attacker').length === teamSize);
    if (fullAttackerTeams.length !== 1) throw new RangeError('legacy replay seats must identify exactly one full attacking team');
    attackerTeam = fullAttackerTeams[0];
    const defenders = ordered.filter((p) => p.team !== attackerTeam);
    if (defenders.filter((p) => p.role === 'sikka').length !== 1 || defenders.filter((p) => p.role === 'guard').length !== teamSize - 1) {
      throw new RangeError('legacy replay defending team must have one sikka and the remaining guards');
    }
    roleSeats = ordered;
  } else {
    // Caller supplies the opening-role template; the seeded toss selects the
    // attacker. Team 0 is the canonical template side, not a fixed winner.
    if (ordered.filter((p) => p.team === 0 && p.role === 'attacker').length !== teamSize) {
      throw new RangeError(`team 0 must have ${teamSize} attackers at match start`);
    }
    if (ordered.filter((p) => p.team === 1 && p.role === 'sikka').length !== 1) {
      throw new RangeError('team 1 must have exactly one sikka at match start');
    }
    if (ordered.filter((p) => p.team === 1 && p.role === 'guard').length !== teamSize - 1) {
      throw new RangeError(`team 1 must have exactly ${teamSize - 1} guards at match start`);
    }
    toss = drawMulberry32(seed >>> 0);
    attackerTeam = toss.value < 0.5 ? 0 : 1;
    const templateSikkaOrdinal = ordered.filter((p) => p.team === 1).findIndex((p) => p.role === 'sikka');
    roleSeats = ordered.map((player) => {
      if (player.team === attackerTeam) return { ...player, role: 'attacker' };
      const ordinal = ordered.filter((p) => p.team === player.team).findIndex((p) => p.seat === player.seat);
      return { ...player, role: ordinal === templateSikkaOrdinal ? 'sikka' : 'guard' };
    });
  }
  const court = createCourt(format);
  const guardLaneBySeat = new Map();
  const attackersBySeat = new Map();
  for (const team of [0, 1]) {
    roleSeats.filter((player) => player.team === team && player.role === 'attacker')
      .forEach((player, index) => attackersBySeat.set(player.seat, index));
  }
  roleSeats.filter((player) => player.team !== attackerTeam && player.role === 'guard')
    .forEach((player, index) => guardLaneBySeat.set(player.seat, index));
  const players = roleSeats.map((player) => ({
    ...player,
    position: initialPosition(
      player,
      court,
      guardLaneBySeat.get(player.seat) ?? 0,
      attackersBySeat.get(player.seat) ?? 0,
    ),
    velocity: { x: 0, z: 0 },
    facing: { x: 0, z: player.team === 0 ? 1 : -1 },
    stamina: player.role === 'attacker' ? STAMINA_CAPACITY : null,
    routeStage: player.role === 'attacker' ? 0 : null,
    state: 'active',
    cooldowns: {},
  }));
  return {
    profile: { id: profile.id, version: profile.version },
    format,
    timingShape: selectedTimingShape,
    court,
    phase: 'playing',
    ...(legacyReplay ? {} : { toss: { algorithm: 'mulberry32', winnerTeam: attackerTeam, attackerTeam, draw: toss.value } }),
    tick: 0,
    clock: { ticks: 0, remainingTicks: halfTicks || profile.capTicks || null, half: 1 },
    halves: profile.halves,
    score: [0, 0],
    attackerTeam,
    players,
    vacatedLanes: [],
    vacatedRegions: [],
    eliminated: [],
    pendingTags: [],
    eventLog: legacyReplay ? [] : [{ type: 'toss-resolved', reason: 'seeded-opening-toss', tick: 0, algorithm: 'mulberry32', winnerTeam: attackerTeam, attackerTeam, draw: toss.value }],
    random: { seed: seed >>> 0, state: legacyReplay ? seed >>> 0 : toss.state },
    ...(legacyReplay ? {} : { tossTemplateSeats: ordered.map(({ seat, team, controller, role }) => ({ seat, team, controller, role })) }),
    capsuleRadiusMetres: ATTACKER_CAPSULE_RADIUS_METRES,
  };
}

export function createMatch(args) {
  return initializeMatch(args, false);
}

/** Restores a pre-toss replay's resolved roles and original pre-draw RNG state. */
export function restoreLegacyReplayMatch(args) {
  return initializeMatch(args, true);
}
