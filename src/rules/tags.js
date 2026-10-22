import {
  ATTACKER_CAPSULE_RADIUS_METRES, FOOT_CIRCLE_RADIUS_METRES,
  TAG_ACTIVE_TICKS, TAG_AIM_ASSIST_CONE_DEGREES, TAG_HOLD_TICKS,
  TAG_REACH_METRES, TAG_RECOVERY_TICKS, TAG_WINDUP_TICKS,
} from './constants.js';
import { circleOverlapsLineZone } from './court.js';

const bySeat = (state, seat) => state.players.find((player) => player.seat === seat);
const lines = (court) => [...court.rowLines, ...court.endLines, ...court.sideLines];
const hasLineFoot = (player, court) => lines(court).some((line) => circleOverlapsLineZone({ ...player.position, radius: FOOT_CIRCLE_RADIUS_METRES }, line));
function inLegalRegion(state, player) {
  if (player.role === 'sikka') {
    const spine = state.court.spineGeometry; const b = state.court.bounds;
    return player.position.x >= spine.xMin && player.position.x <= spine.xMax && player.position.z >= b.zMin && player.position.z <= b.zMax;
  }
  const guards = state.players.filter((p) => p.team === player.team && p.role === 'guard').sort((a, b) => a.seat - b.seat);
  const index = guards.findIndex((p) => p.seat === player.seat);
  const lane = state.court.laneStrips[Math.max(0, index) % state.court.laneStrips.length];
  return index >= 0 && player.position.x >= lane.xMin && player.position.x <= lane.xMax && player.position.z >= lane.zMin && player.position.z <= lane.zMax;
}
const distanceToSegment = (p, a, b) => {
  const dx = b.x - a.x; const dz = b.z - a.z;
  const length2 = dx * dx + dz * dz;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / length2));
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
};

/** Schedules a tag. Contact is checked against the authoritative state on
 * active ticks; callers may supply lineStepTick to report a simultaneous step. */
export function beginTag(state, guardSeat, targetSeat) {
  if (!state || !Number.isInteger(state.tick)) throw new TypeError('state must be a match state');
  const guard = bySeat(state, guardSeat); const target = bySeat(state, targetSeat);
  if (!guard) throw new RangeError(`unknown guard seat ${String(guardSeat)}`);
  if (!target) throw new RangeError(`unknown target seat ${String(targetSeat)}`);
  if (!['guard', 'sikka'].includes(guard.role)) throw new RangeError(`seat ${guardSeat} is not a defender`);
  if (target.role !== 'attacker') throw new RangeError(`seat ${targetSeat} is not an attacker`);
  const startTick = state.tick;
  return { guardSeat, targetSeat, startTick, activeFromTick: startTick + TAG_WINDUP_TICKS, activeThroughTick: startTick + TAG_WINDUP_TICKS + TAG_ACTIVE_TICKS - 1, recoveryThroughTick: startTick + TAG_WINDUP_TICKS + TAG_ACTIVE_TICKS + TAG_RECOVERY_TICKS - 1, holdThroughTick: null, contactTick: null, holdSamples: [], resolved: false };
}

function voidEvent(attempt, tick, reason) {
  attempt.resolved = true;
  return { type: 'tag-void', reason, tick, guardSeat: attempt.guardSeat, targetSeat: attempt.targetSeat, recoveryThroughTick: attempt.recoveryThroughTick, attemptResolved: true };
}

/** Resolves contacts sampled at state.tick. Call once per tick while an attempt
 * is pending so the full 30-tick stationary hold is verified. Candidate ordering
 * is tick, reach distance, then guard seat. */
export function resolveTags(state, attempts) {
  if (!state || !Array.isArray(state.players) || !state.court) throw new TypeError('state must be a match state');
  if (!Array.isArray(attempts)) throw new TypeError('attempts must be an array');
  const candidates = []; const calls = [];
  for (const attempt of attempts) {
    if (!attempt || !Number.isInteger(attempt.guardSeat) || !Number.isInteger(attempt.targetSeat)) throw new TypeError('each attempt must identify integer guardSeat and targetSeat');
    const tick = state.tick;
    if (attempt.resolved) continue;
    const activeGuard = bySeat(state, attempt.guardSeat);
    if (attempt.contactTick !== null && attempt.contactTick !== undefined) {
      const holdTarget = bySeat(state, attempt.targetSeat);
      if (!activeGuard) { attempt.resolved = true; calls.push(voidEvent(attempt, tick, 'unknown-seat')); continue; }
      if (tick > attempt.contactTick && tick <= attempt.holdThroughTick) {
        const b = state.court.bounds;
        const targetOnCourt = holdTarget && holdTarget.position.x >= b.xMin && holdTarget.position.x <= b.xMax && holdTarget.position.z >= b.zMin && holdTarget.position.z <= b.zMax;
        attempt.holdSamples.push({ tick, legal: inLegalRegion(state, activeGuard) && !hasLineFoot(activeGuard, state.court), targetLegal: Boolean(holdTarget && holdTarget.role === 'attacker' && holdTarget.state === 'active' && targetOnCourt) });
      }
      if (tick >= attempt.holdThroughTick) {
        attempt.resolved = true;
        const expected = TAG_HOLD_TICKS - 1;
        const samples = attempt.holdSamples;
        const complete = samples.length === expected && samples.every((sample, i) => sample.tick === attempt.contactTick + i + 1);
        if (!complete) calls.push(voidEvent(attempt, tick, 'hold-window-incomplete'));
        else if (samples.some((sample) => !sample.targetLegal)) calls.push(voidEvent(attempt, tick, 'target-no-longer-eligible'));
        else if (samples.some((sample) => !sample.legal) || (Number.isInteger(attempt.lineStepTick) && attempt.lineStepTick <= attempt.holdThroughTick)) calls.push(voidEvent(attempt, tick, 'guard-foot-on-line'));
        else candidates.push({ type: 'tag-valid', reason: 'valid-contact', tick: attempt.contactTick, guardSeat: attempt.guardSeat, targetSeat: attempt.targetSeat, distance: attempt.contactDistance, holdThroughTick: attempt.holdThroughTick, recoveryThroughTick: attempt.recoveryThroughTick, attempt });
      }
      continue;
    }
    if (tick > attempt.activeThroughTick) { calls.push(voidEvent(attempt, tick, 'no-contact')); continue; }
    if (tick < attempt.activeFromTick || tick > attempt.activeThroughTick) continue;
    const guard = bySeat(state, attempt.guardSeat); const target = bySeat(state, attempt.targetSeat);
    if (!guard || !target) { calls.push(voidEvent(attempt, tick, 'unknown-seat')); continue; }
    if (!['playing', 'golden'].includes(state.phase) || target.role !== 'attacker' || target.state !== 'active' || guard.state !== 'active' || !['guard', 'sikka'].includes(guard.role) || guard.team === target.team || (guard.cooldowns?.tagRecoveryUntil ?? -1) >= tick) {
      calls.push(voidEvent(attempt, tick, 'ineligible')); continue;
    }
    if (hasLineFoot(guard, state.court)) { calls.push(voidEvent(attempt, tick, 'guard-foot-on-line')); continue; }
    if (!inLegalRegion(state, guard)) { calls.push(voidEvent(attempt, tick, 'guard-outside-region')); continue; }
    if (Number.isInteger(attempt.lineStepTick) && attempt.lineStepTick <= tick && attempt.lineStepTick <= attempt.activeThroughTick) {
      calls.push(voidEvent(attempt, tick, 'guard-foot-on-line')); continue;
    }
    const dx = target.position.x - guard.position.x; const dz = target.position.z - guard.position.z;
    const facingLength = Math.hypot(guard.facing?.x ?? 0, guard.facing?.z ?? 0);
    const targetLength = Math.hypot(dx, dz);
    if (targetLength === 0) { calls.push({ ...voidEvent(attempt, tick, 'overlapping-centres'), attemptResolved: false }); attempt.resolved = false; continue; }
    const dot = facingLength === 0 ? 1 : ((guard.facing.x * dx + guard.facing.z * dz) / (facingLength * targetLength));
    if (dot < Math.cos(TAG_AIM_ASSIST_CONE_DEGREES * Math.PI / 180)) { calls.push({ ...voidEvent(attempt, tick, 'outside-aim-cone'), attemptResolved: false }); attempt.resolved = false; continue; }
    const end = { x: guard.position.x + (facingLength === 0 ? dx / targetLength : guard.facing.x / facingLength) * TAG_REACH_METRES, z: guard.position.z + (facingLength === 0 ? dz / targetLength : guard.facing.z / facingLength) * TAG_REACH_METRES };
    const distance = distanceToSegment(target.position, guard.position, end);
    if (distance <= ATTACKER_CAPSULE_RADIUS_METRES) {
      attempt.contactTick = tick;
      attempt.contactDistance = distance;
      attempt.holdThroughTick = tick + TAG_HOLD_TICKS - 1;
      attempt.holdSamples = [];
      candidates.push({ type: 'tag-contact', reason: 'contact-detected', tick, guardSeat: guard.seat, targetSeat: target.seat, distance, holdThroughTick: attempt.holdThroughTick, attempt });
    }
    else { calls.push({ ...voidEvent(attempt, tick, 'out-of-reach'), attemptResolved: false }); attempt.resolved = false; }
  }
  candidates.sort((a, b) => a.tick - b.tick || a.distance - b.distance || a.guardSeat - b.guardSeat || a.targetSeat - b.targetSeat);
  const contacts = candidates.filter((candidate) => candidate.type === 'tag-contact');
  const validCandidates = candidates.filter((candidate) => candidate.type === 'tag-valid');
  const winners = validCandidates.length ? [validCandidates[0]] : [];
  for (const loser of validCandidates.slice(1)) {
    loser.attempt.resolved = true;
    calls.push({ type: 'tag-void', reason: 'simultaneous-tag-lost', tick: loser.tick, guardSeat: loser.guardSeat, targetSeat: loser.targetSeat, recoveryThroughTick: loser.recoveryThroughTick, attemptResolved: true });
  }
  // Calls are ordered after successful contacts with deterministic seat order.
  calls.sort((a, b) => a.tick - b.tick || a.guardSeat - b.guardSeat || a.targetSeat - b.targetSeat);
  return [...contacts, ...winners, ...calls].map(({ attempt, ...event }) => event);
}
