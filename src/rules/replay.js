import { createMatch, restoreLegacyReplayMatch } from './state.js';
import { stepMatch } from './simulation.js';

const clone = (value) => structuredClone(value);
const validSeatIds = (header) => new Set(header.seats.map((seat) => seat.seat));
const validAiTiers = new Set(['easy', 'standard', 'hard', 'expert']);
function validateHeaderTiers(seats) {
  for (const [index, seat] of seats.entries()) {
    if (!seat || !validAiTiers.has(seat.aiTier)) {
      throw new RangeError(`replay header seats[${index}].aiTier must be one of easy, standard, hard, expert`);
    }
  }
}

/** Captures the complete deterministic match setup. Task 3 has no map or AI-tier
 * state yet, so defaults are explicit and can be overridden by caller metadata. */
export function recordReplayHeader(state, options = {}) {
  if (!state || !Array.isArray(state.players)) throw new TypeError('state must be a match state');
  const map = options.map ?? state.map ?? 'school-playground';
  const aiTiers = options.aiTiers ?? {};
  if (typeof map !== 'string' || map.length === 0) throw new TypeError('map must be a non-empty string');
  if (!aiTiers || typeof aiTiers !== 'object' || Array.isArray(aiTiers)) throw new TypeError('aiTiers must be an object keyed by seat');
  const aiSeats = new Set(state.players.filter((player) => player.controller === 'AI').map((player) => player.seat));
  for (const [key, tier] of Object.entries(aiTiers)) {
    const seat = Number(key);
    if (!Number.isInteger(seat) || String(seat) !== key || !aiSeats.has(seat)) {
      throw new RangeError(`AI tier references unknown or non-AI seat ${key}`);
    }
    if (!validAiTiers.has(tier)) throw new RangeError(`AI tier must be one of easy, standard, hard, expert; received ${JSON.stringify(tier)}`);
  }
  const header = {
    profileId: state.profile.id,
    profileVersion: state.profile.version,
    format: state.format,
    timingShape: state.timingShape,
    map,
    seed: state.random.seed,
    randomState: state.random.state,
    toss: clone(state.toss),
    tossTemplateSeats: clone(state.tossTemplateSeats),
    seats: state.players.map(({ seat, team, controller, role }) => ({ seat, team, controller, role, aiTier: aiTiers[seat] ?? 'standard' })),
  };
  validateHeaderTiers(header.seats);
  return header;
}

export function createReplay(state, options) {
  return { header: recordReplayHeader(state, options), inputs: [] };
}

/** Appends exactly the next tick. Gaps, duplicate ticks, unknown seats and
 * malformed entries fail before the replay is changed. */
export function recordTickInputs(replay, tick, inputs) {
  if (!replay || !replay.header || !Array.isArray(replay.inputs)) throw new TypeError('replay must contain header and inputs');
  if (!Number.isInteger(tick) || tick !== replay.inputs.length) throw new RangeError(`replay tick must be contiguous; expected ${replay.inputs.length}, received ${String(tick)}`);
  if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) throw new TypeError('tick inputs must be an object keyed by seat');
  const seats = validSeatIds(replay.header);
  const normalized = {};
  for (const [key, input] of Object.entries(inputs)) {
    const seat = Number(key);
    if (!Number.isInteger(seat) || String(seat) !== key || !seats.has(seat)) throw new RangeError(`replay input references unknown seat ${key}`);
    normalized[seat] = clone(input);
  }
  replay.inputs.push({ tick, bySeat: normalized });
  return replay;
}

export function replayMatch(replay) {
  if (!replay || !replay.header || !Array.isArray(replay.inputs)) throw new TypeError('replay must contain header and inputs');
  const h = replay.header;
  if (typeof h.map !== 'string' || h.map.length === 0) throw new TypeError('replay header map must be a non-empty string');
  if (!Array.isArray(h.seats)) throw new TypeError('replay header seats must be an array');
  validateHeaderTiers(h.seats);
  const hasTossTemplate = Object.hasOwn(h, 'tossTemplateSeats');
  if (hasTossTemplate && !Array.isArray(h.tossTemplateSeats)) throw new TypeError('replay header tossTemplateSeats must be an array');
  if (hasTossTemplate) {
    if (!Object.hasOwn(h, 'toss') || !h.toss || typeof h.toss !== 'object' || Array.isArray(h.toss)) {
      throw new TypeError('replay header toss must be an object');
    }
    if (h.toss.algorithm !== 'mulberry32') throw new RangeError('replay header toss.algorithm must be mulberry32');
    if (!Number.isInteger(h.toss.winnerTeam) || ![0, 1].includes(h.toss.winnerTeam)) throw new RangeError('replay header toss.winnerTeam must be 0 or 1');
    if (!Number.isInteger(h.toss.attackerTeam) || ![0, 1].includes(h.toss.attackerTeam)) throw new RangeError('replay header toss.attackerTeam must be 0 or 1');
    if (h.toss.attackerTeam !== h.toss.winnerTeam) throw new RangeError('replay header toss.attackerTeam must match winnerTeam');
    if (!Number.isFinite(h.toss.draw) || h.toss.draw < 0 || h.toss.draw >= 1) throw new RangeError('replay header toss.draw must be in [0, 1)');
    if (!Object.hasOwn(h, 'randomState') || !Number.isInteger(h.randomState) || h.randomState < 0 || h.randomState > 0xffffffff) {
      throw new RangeError('replay header randomState must be an unsigned 32-bit integer');
    }
  }
  const createArgs = { profileId: h.profileId, profileVersion: h.profileVersion, format: h.format, seed: h.seed, seats: (h.tossTemplateSeats ?? h.seats).map(({ seat, team, controller, role }) => ({ seat, team, controller, role })) };
  if (h.profileId === 'pro') createArgs.timingShape = h.timingShape;
  const state = hasTossTemplate ? createMatch(createArgs) : restoreLegacyReplayMatch(createArgs);
  if (h.tossTemplateSeats !== undefined) {
    const resolvedSeats = (seats) => seats.map(({ seat, team, controller, role }) => ({ seat, team, controller, role }))
      .sort((a, b) => a.seat - b.seat);
    if (JSON.stringify(resolvedSeats(h.seats)) !== JSON.stringify(resolvedSeats(state.players))) {
      throw new RangeError('replay resolved seats do not match the toss result and template');
    }
  }
  if (hasTossTemplate && h.randomState !== state.random.state) {
    throw new RangeError('replay random state does not match its seed and opening toss');
  }
  if (hasTossTemplate && (h.toss.algorithm !== state.toss.algorithm || h.toss.winnerTeam !== state.toss.winnerTeam || h.toss.attackerTeam !== state.toss.attackerTeam || h.toss.draw !== state.toss.draw)) {
    throw new RangeError('replay toss result does not match its seed and template');
  }
  state.map = h.map;
  let current = state;
  for (let index = 0; index < replay.inputs.length; index += 1) {
    const record = replay.inputs[index];
    if (!record || record.tick !== index) throw new RangeError(`replay tick must be contiguous; expected ${index}, received ${String(record?.tick)}`);
    const seats = validSeatIds(h);
    for (const key of Object.keys(record.bySeat ?? {})) if (!seats.has(Number(key)) || String(Number(key)) !== key) throw new RangeError(`replay input references unknown seat ${key}`);
    if (!record.bySeat || typeof record.bySeat !== 'object' || Array.isArray(record.bySeat)) throw new TypeError(`replay inputs at tick ${index} must be keyed by seat`);
    current = stepMatch(current, record.bySeat).state;
  }
  return current;
}
