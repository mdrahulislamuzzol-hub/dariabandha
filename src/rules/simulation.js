import {
  ATTACKER_RUN_SPEED_METRES_PER_SECOND,
  ATTACKER_SPRINT_SPEED_METRES_PER_SECOND,
  ATTACKER_STOP_TIME_TICKS,
  ATTACKER_TIME_TO_RUN_SPEED_TICKS,
  GUARD_RUN_SPEED_METRES_PER_SECOND,
  GUARD_STOP_TIME_TICKS,
  GUARD_TIME_TO_SPEED_TICKS,
  MAX_STEPS_PER_FRAME,
  STAMINA_CAPACITY,
  STAMINA_JOG_RECOVERY_PER_SECOND,
  STAMINA_SPRINT_DRAIN_PER_SECOND,
  STAMINA_SPRINT_REENABLE_THRESHOLD,
  STAMINA_STANDING_RECOVERY_PER_SECOND,
  TICK_RATE,
} from './constants.js';
import { beginTag, resolveTags } from './tags.js';
import { applyRuleEvent, resolveClock } from './match-flow.js';

const DT = 1 / TICK_RATE;
const EPSILON = 1e-12;

function inputEntries(inputsBySeat, players) {
  let entries;
  if (inputsBySeat instanceof Map) entries = [...inputsBySeat.entries()];
  else if (inputsBySeat && typeof inputsBySeat === 'object' && !Array.isArray(inputsBySeat)) {
    entries = Object.entries(inputsBySeat).map(([seat, input]) => [Number(seat), input]);
  } else throw new TypeError('inputsBySeat must be an object or Map');
  const validSeats = new Set(players.map((player) => player.seat));
  for (const [seat, input] of entries) {
    if (!Number.isInteger(seat) || !validSeats.has(seat)) throw new RangeError(`input references unknown seat ${String(seat)}`);
    if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new TypeError(`input for seat ${seat} must be an object`);
    for (const key of Object.keys(input)) if (!['move', 'sprint', 'tag'].includes(key)) throw new RangeError(`input for seat ${seat} has unsupported field ${key}`);
    if (input.move !== undefined) {
      if (!input.move || typeof input.move !== 'object' || Array.isArray(input.move)) throw new TypeError(`input for seat ${seat}.move must be an object`);
      for (const key of Object.keys(input.move)) if (!['x', 'z'].includes(key)) throw new RangeError(`input for seat ${seat}.move has unsupported field ${key}`);
      if (!Number.isFinite(input.move.x ?? 0) || !Number.isFinite(input.move.z ?? 0)) throw new TypeError(`input for seat ${seat}.move coordinates must be finite`);
      if (Math.abs(input.move.x ?? 0) > 1 || Math.abs(input.move.z ?? 0) > 1) throw new RangeError(`input for seat ${seat}.move coordinates must be between -1 and 1`);
    }
    if (input.sprint !== undefined && typeof input.sprint !== 'boolean') throw new TypeError(`input for seat ${seat}.sprint must be a boolean`);
    if (input.tag !== undefined) {
      if (!input.tag || typeof input.tag !== 'object' || Array.isArray(input.tag) || Object.keys(input.tag).some((key) => key !== 'targetSeat')) throw new TypeError(`input for seat ${seat}.tag must be an object containing targetSeat`);
      if (!Number.isInteger(input.tag.targetSeat) || !validSeats.has(input.tag.targetSeat)) throw new RangeError(`input for seat ${seat}.tag.targetSeat references unknown seat ${String(input.tag.targetSeat)}`);
    }
  }
  return new Map(entries);
}

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(target, current + maxDelta);
  return Math.max(target, current - maxDelta);
}

function movementTarget(state, player, input) {
  let x = input?.move?.x ?? 0;
  let z = input?.move?.z ?? 0;
  if (player.role === 'guard') z = 0;
  if (player.role === 'sikka') {
    // The Sikka may travel along court length but remains in the central spine.
    x = 0;
  }
  const magnitude = Math.hypot(x, z);
  if (magnitude > 1) { x /= magnitude; z /= magnitude; }
  const attacker = player.role === 'attacker';
  const sprintAllowed = attacker && input?.sprint === true && player.stamina >= STAMINA_SPRINT_REENABLE_THRESHOLD;
  const speed = attacker
    ? (sprintAllowed ? ATTACKER_SPRINT_SPEED_METRES_PER_SECOND : ATTACKER_RUN_SPEED_METRES_PER_SECOND)
    : (player.role === 'guard' ? GUARD_RUN_SPEED_METRES_PER_SECOND : ATTACKER_RUN_SPEED_METRES_PER_SECOND);
  return { x: x * speed, z: z * speed, moving: magnitude > 0, sprintAllowed };
}

function clampActor(state, player) {
  if (player.state === 'lane-vacated') return;
  const { xMin, xMax, zMin, zMax } = state.court.bounds;
  if (player.role === 'guard') {
    const teamGuards = state.players.filter((p) => p.team === player.team && p.role === 'guard').sort((a, b) => a.seat - b.seat);
    const laneIndex = Math.max(0, teamGuards.findIndex((p) => p.seat === player.seat)) % state.court.laneStrips.length;
    const laneId = state.court.guardLaneIds[laneIndex % state.court.guardLaneIds.length];
    const lane = state.court.laneStrips.find((entry) => entry.id === laneId);
    player.position.x = Math.max(xMin, Math.min(xMax, player.position.x));
    player.position.z = Math.max(lane.zMin, Math.min(lane.zMax, player.position.z));
  } else if (player.role === 'sikka') {
    player.position.x = Math.max(state.court.spineGeometry.xMin, Math.min(state.court.spineGeometry.xMax, player.position.x));
    player.position.z = Math.max(zMin, Math.min(zMax, player.position.z));
  }
}

/** Advances exactly one authoritative tick. Missing live inputs mean neutral input. */
export function stepMatch(state, inputsBySeat = {}) {
  if (!state || !Array.isArray(state.players) || !state.court) throw new TypeError('state must be a match state created by createMatch');
  if (!Number.isInteger(state.tick) || state.tick < 0) throw new TypeError('state.tick must be a non-negative integer');
  const inputs = inputEntries(inputsBySeat, state.players);
  const next = structuredClone(state);
  const events = [];
  next.players.sort((a, b) => a.seat - b.seat);
  if (state.phase === 'ended') return { state: next, events };
  if (state.phase === 'transition') {
    next.tick += 1;
    next.transitionTicksRemaining = Math.max(0, (next.transitionTicksRemaining ?? 1) - 1);
    if (next.transitionTicksRemaining === 0) {
      next.phase = next.transitionResumePhase ?? 'playing';
      delete next.transitionResumePhase;
    }
    return { state: next, events };
  }
  for (const player of next.players) {
    if (player.state !== 'active') continue;
    const input = inputs.get(player.seat);
    const target = movementTarget(next, player, input);
    const accelTicks = player.role === 'guard' ? GUARD_TIME_TO_SPEED_TICKS : ATTACKER_TIME_TO_RUN_SPEED_TICKS;
    const stopTicks = player.role === 'guard' ? GUARD_STOP_TIME_TICKS : ATTACKER_STOP_TIME_TICKS;
    const targetSpeed = Math.hypot(target.x, target.z);
    const maxDelta = (targetSpeed > 0 ? targetSpeed / accelTicks : Math.max(Math.hypot(player.velocity.x, player.velocity.z), 0.001) / stopTicks);
    const magnitude = Math.hypot(player.velocity.x, player.velocity.z);
    if (targetSpeed === 0 && magnitude > 0) {
      const newMagnitude = Math.max(0, magnitude - maxDelta);
      const scale = magnitude === 0 ? 0 : newMagnitude / magnitude;
      player.velocity.x *= scale;
      player.velocity.z *= scale;
    } else {
      player.velocity.x = approach(player.velocity.x, target.x, maxDelta);
      player.velocity.z = approach(player.velocity.z, target.z, maxDelta);
      const velocityMagnitude = Math.hypot(player.velocity.x, player.velocity.z);
      if (velocityMagnitude > targetSpeed && targetSpeed > 0) {
        const scale = targetSpeed / velocityMagnitude;
        player.velocity.x *= scale;
        player.velocity.z *= scale;
      }
    }
    player.position.x += player.velocity.x * DT;
    player.position.z += player.velocity.z * DT;
    if (targetSpeed > EPSILON) player.facing = { x: player.velocity.x / (Math.hypot(player.velocity.x, player.velocity.z) || 1), z: player.velocity.z / (Math.hypot(player.velocity.x, player.velocity.z) || 1) };
    if (player.role === 'attacker') {
      if (target.sprintAllowed && targetSpeed > 0) player.stamina = Math.max(0, player.stamina - STAMINA_SPRINT_DRAIN_PER_SECOND * DT);
      else if (targetSpeed > 0) player.stamina = Math.min(STAMINA_CAPACITY, player.stamina + STAMINA_JOG_RECOVERY_PER_SECOND * DT);
      else player.stamina = Math.min(STAMINA_CAPACITY, player.stamina + STAMINA_STANDING_RECOVERY_PER_SECOND * DT);
    }
    if (player.role === 'attacker') {
      const { xMin, xMax, zMin, zMax } = next.court.bounds;
      const sideOut = player.position.x < xMin || player.position.x > xMax;
      const forwardOut = player.team === 0 ? player.position.z > zMax : player.position.z < zMin;
      const returnOut = player.team === 0 ? player.position.z < zMin : player.position.z > zMax;
      if (player.routeStage === 1 && returnOut) {
        player.routeStage = 2;
        player.position.z = player.team === 0 ? zMin : zMax;
        events.push({ type: 'round-trip', reason: 'round-trip-complete', tick: state.tick + 1, seat: player.seat, team: player.team });
      } else if (sideOut || returnOut || (forwardOut && player.routeStage !== 0)) {
        player.state = 'out';
        events.push({ type: 'attacker-boundary', reason: 'attacker-left-court', tick: state.tick + 1, seat: player.seat, team: player.team });
      } else if (forwardOut && player.routeStage === 0) {
        player.routeStage = 1;
        player.position.z = player.team === 0 ? zMax : zMin;
      }
    } else clampActor(next, player);
  }
  // Tag intents are seat-targeted. Begin once per guard while an attempt for
  // that guard is pending; the state stays serializable for replay.
  for (const player of next.players) {
    const intent = inputs.get(player.seat)?.tag;
    if (!intent || !['guard', 'sikka'].includes(player.role) || player.state !== 'active') continue;
    if (next.pendingTags.some((attempt) => attempt.guardSeat === player.seat && !attempt.resolved)) continue;
    const target = next.players.find((candidate) => candidate.seat === intent.targetSeat);
    if (!target || target.team === player.team || target.role !== 'attacker') continue;
    next.pendingTags.push(beginTag(next, player.seat, target.seat));
  }
  next.tick += 1;
  next.clock.ticks += 1;
  if (next.clock.remainingTicks !== null) next.clock.remainingTicks = Math.max(0, next.clock.remainingTicks - 1);
  next.eventLog.push(...events);
  const tagEvents = resolveTags(next, next.pendingTags);
  next.pendingTags = next.pendingTags.filter((attempt) => !attempt.resolved);
  const ruleEvents = [...tagEvents, ...events.filter((event) => event.type === 'attacker-boundary' || event.type === 'round-trip')];
  for (const event of ruleEvents) {
    const updated = applyRuleEvent(next, event);
    Object.assign(next, updated);
    if (!events.includes(event)) events.push(event);
    if (event.type === 'round-trip' || event.type === 'attacker-boundary') events.push(next.eventLog[next.eventLog.length - 1]);
    if (next.phase !== 'playing') break;
  }
  if (['playing', 'golden'].includes(next.phase) && next.clock.remainingTicks === 0) {
    const clockResult = resolveClock(next);
    Object.assign(next, clockResult.state);
    events.push(...clockResult.events);
  }
  return { state: next, events };
}

/** Fixed 60 Hz accumulator. A single rendered frame performs at most five ticks;
 * excess frame time is discarded to bound catch-up work. */
export function advanceFrame(accumulator, deltaSeconds, state, inputProvider) {
  if (!Number.isFinite(accumulator) || accumulator < 0) throw new TypeError('accumulator must be a finite non-negative number');
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new TypeError('deltaSeconds must be a finite non-negative number');
  if (typeof inputProvider !== 'function') throw new TypeError('inputProvider must be a function');
  let remaining = Math.min(accumulator + deltaSeconds, MAX_STEPS_PER_FRAME / TICK_RATE);
  let current = state;
  const events = [];
  let steps = 0;
  while (remaining + EPSILON >= DT && steps < MAX_STEPS_PER_FRAME) {
    const result = stepMatch(current, inputProvider(current.tick, current));
    current = result.state;
    events.push(...result.events);
    remaining -= DT;
    steps += 1;
  }
  return { accumulator: Math.max(0, remaining), state: current, events, steps };
}
