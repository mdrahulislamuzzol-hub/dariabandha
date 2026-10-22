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

function initialPosition(player, court, guardLaneIndex = 0) {
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
  return { x: 0, z: player.team === 0 ? zMin + court.boxSizeMetres / 2 : zMax - court.boxSizeMetres / 2 };
}

/** Creates a serializable, renderer-independent match state. Seat objects are
 * {seat, team, controller?, role}; seat IDs are canonicalized in ascending order.
 * Pro accepts timingShape 'standard' or 'quick'; it defaults to 'standard'. */
export function createMatch({ profileId, profileVersion, format, seed, seats, timingShape }) {
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
  // Team 0 begins the daan; the defending side has its Sikka and line guards.
  if (ordered.filter((p) => p.team === 0 && p.role === 'attacker').length !== teamSize) {
    throw new RangeError(`team 0 must have ${teamSize} attackers at match start`);
  }
  if (ordered.filter((p) => p.team === 1 && p.role === 'sikka').length !== 1) {
    throw new RangeError('team 1 must have exactly one sikka at match start');
  }
  if (ordered.filter((p) => p.team === 1 && p.role === 'guard').length !== teamSize - 1) {
    throw new RangeError(`team 1 must have exactly ${teamSize - 1} guards at match start`);
  }
  const court = createCourt(format);
  const guardLaneBySeat = new Map();
  ordered.filter((player) => player.team === 1 && player.role === 'guard')
    .forEach((player, index) => guardLaneBySeat.set(player.seat, index));
  const players = ordered.map((player) => ({
    ...player,
    position: initialPosition(player, court, guardLaneBySeat.get(player.seat) ?? 0),
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
    tick: 0,
    clock: { ticks: 0, remainingTicks: halfTicks || profile.capTicks || null, half: 1 },
    halves: profile.halves,
    score: [0, 0],
    attackerTeam: 0,
    players,
    vacatedLanes: [],
    vacatedRegions: [],
    eliminated: [],
    pendingTags: [],
    eventLog: [],
    random: { seed: seed >>> 0, state: seed >>> 0 },
    capsuleRadiusMetres: ATTACKER_CAPSULE_RADIUS_METRES,
  };
}
