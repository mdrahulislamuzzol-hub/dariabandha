import { getProfile } from './profiles.js';
import { BREAK_TICKS, CLOCK_ZERO_RESOLVE_WINDOW_TICKS, FOOT_CIRCLE_RADIUS_METRES, STANDARD_TIEBREAK_HALF_TICKS } from './constants.js';

const copy = (value) => structuredClone(value);
const ordered = (events) => [...events].sort((a, b) => (a.tick ?? 0) - (b.tick ?? 0) || (a.guardSeat ?? a.seat ?? 0) - (b.guardSeat ?? b.seat ?? 0) || (a.targetSeat ?? 0) - (b.targetSeat ?? 0));

function setAttackers(state, team, count) {
  const roster = state.players.filter((p) => p.team === team).sort((a, b) => a.seat - b.seat);
  roster.forEach((p, index) => {
    p.role = index < count ? 'attacker' : (index === count ? 'sikka' : 'guard');
    p.routeStage = p.role === 'attacker' ? 0 : null;
  });
}

function resetAttackers(state, team) {
  const { zMin, zMax } = state.court.bounds;
  for (const p of state.players) {
    if (p.team !== team || p.role !== 'attacker') continue;
    p.position = { x: 0, z: p.team === 0 ? zMin + state.court.boxSizeMetres / 2 : zMax - state.court.boxSizeMetres / 2 };
    p.velocity = { x: 0, z: 0 };
    p.routeStage = 0;
    p.state = 'active';
  }
}

function resetDefenders(state, team) {
  const roster = state.players.filter((p) => p.team === team && p.role !== 'attacker').sort((a, b) => a.seat - b.seat);
  const guards = roster.filter((p) => p.role === 'guard');
  guards.forEach((p, index) => {
    if (p.state === 'eliminated') return;
    const laneId = state.court.guardLaneIds[index % state.court.guardLaneIds.length];
    const lane = state.court.laneStrips.find((entry) => entry.id === laneId);
    p.position = { x: p.team === 0 ? state.court.bounds.xMin / 2 : state.court.bounds.xMax / 2, z: lane.zMin + state.court.lineHalfWidthMetres + FOOT_CIRCLE_RADIUS_METRES + 0.01 };
    p.velocity = { x: 0, z: 0 };
    p.state = 'active';
  });
  const sikka = roster.find((p) => p.role === 'sikka');
  if (sikka && sikka.state !== 'eliminated') {
    sikka.position = { x: 0, z: (state.court.bounds.zMin + state.court.bounds.zMax) / 2 };
    sikka.velocity = { x: 0, z: 0 };
    sikka.state = 'active';
  }
}

function clearVacancies(state) {
  state.vacatedLanes = [];
  state.vacatedRegions = [];
  state.players.forEach((p) => {
    if (p.state === 'spine-vacated') {
      // A role transition may have already spawned this player as an attacker.
      // Only restore the neutral spine spawn while they remain the Sikka.
      if (p.role === 'sikka') {
        p.position = { x: 0, z: (state.court.bounds.zMin + state.court.bounds.zMax) / 2 };
      }
      p.velocity = { x: 0, z: 0 };
      p.state = 'active';
    } else if (p.state === 'lane-vacated') p.state = 'active';
  });
}

function swapFullTeams(state) {
  const teamSize = Number(state.format[0]);
  state.attackerTeam = 1 - state.attackerTeam;
  setAttackers(state, state.attackerTeam, teamSize);
  setAttackers(state, 1 - state.attackerTeam, 0);
  state.players.forEach((p) => { p.state = 'active'; });
  state.eliminated = [];
  resetAttackers(state, state.attackerTeam);
  resetDefenders(state, 1 - state.attackerTeam);
  clearVacancies(state);
  state.pendingTags = [];
}

function event(state, type, reason, extra = {}) {
  const record = { type, reason, tick: state.tick, ...extra };
  state.eventLog.push(record);
  return record;
}

function endMatch(state, reason) {
  state.phase = 'ended';
  const winner = state.score[0] === state.score[1] ? null : (state.score[0] > state.score[1] ? 0 : 1);
  state.result = { winner, reason };
  return event(state, 'match-ended', reason, { winner, score: [...state.score] });
}

function enterGolden(state) {
  state.phase = 'golden';
  state.clock.remainingTicks = null;
  state.clock.zeroResolveRemaining = null;
  return event(state, 'golden-daan-started', 'scores-tied');
}

function enterBreak(state, nextHalf, ticks, reason) {
  swapFullTeams(state);
  state.phase = 'transition';
  state.transitionTicksRemaining = BREAK_TICKS;
  state.transitionResumePhase = 'playing';
  state.transitionReason = reason;
  state.clock.half = nextHalf;
  state.clock.remainingTicks = ticks;
  return event(state, 'break-started', reason, { nextHalf, breakTicks: BREAK_TICKS });
}

/** Resolves a period clock reaching zero, including the 2-second active-action
 * window and each profile's half, tie-break, golden-daan and match-end flow. */
export function resolveClock(state) {
  if (!state || !state.clock || !['playing', 'golden'].includes(state.phase)) throw new TypeError('state must be a live match state');
  const next = copy(state); const profile = getProfile(state.profile.id, state.profile.version); const events = [];
  if (next.phase === 'golden' || next.clock.remainingTicks !== 0) return { state: next, events };
  if (next.pendingTags.length > 0) {
    if (next.clock.zeroResolveRemaining === undefined || next.clock.zeroResolveRemaining === null) next.clock.zeroResolveRemaining = CLOCK_ZERO_RESOLVE_WINDOW_TICKS;
    next.clock.zeroResolveRemaining = Math.max(0, next.clock.zeroResolveRemaining - 1);
    if (next.pendingTags.length > 0 && next.clock.zeroResolveRemaining > 0) return { state: next, events };
    next.pendingTags = [];
  }
  next.clock.zeroResolveRemaining = null;
  if (profile.id === 'traditional') {
    if (next.score[0] === next.score[1]) events.push(enterGolden(next));
    else events.push(endMatch(next, 'time-expired'));
  } else if (next.clock.half === 1) {
    events.push(enterBreak(next, 2, profile.halfTicks ?? (next.timingShape === 'quick' ? 12_600 : 18_000), 'half-time'));
  } else if (next.clock.half === 2) {
    if (next.score[0] !== next.score[1]) events.push(endMatch(next, 'time-expired'));
    else if (profile.tiebreak === 'two-halves-then-golden-daan' || (profile.tiebreak === 'selected-timing' && next.timingShape === 'standard')) {
      next.clock.half = 3;
      next.clock.remainingTicks = profile.tiebreakHalfTicks ?? STANDARD_TIEBREAK_HALF_TICKS;
      events.push(event(next, 'tiebreak-half-started', 'scores-tied', { half: 1 }));
    } else events.push(enterGolden(next));
  } else if (next.clock.half === 3) {
    if (next.score[0] !== next.score[1]) events.push(endMatch(next, 'tiebreak-time-expired'));
    else events.push(enterBreak(next, 4, profile.tiebreakHalfTicks ?? STANDARD_TIEBREAK_HALF_TICKS, 'tiebreak-break'));
  } else if (next.clock.half === 4) {
    if (next.score[0] === next.score[1]) events.push(enterGolden(next));
    else events.push(endMatch(next, 'tiebreak-time-expired'));
  } else events.push(endMatch(next, 'time-expired'));
  return { state: next, events };
}

/** Applies one authoritative rules event and returns a cloned state. Supported
 * B1 event types: tag-contact/tagged, attacker-boundary, round-trip, tag-void. */
export function applyRuleEvent(state, event) {
  if (!state || !Array.isArray(state.players)) throw new TypeError('state must be a match state');
  if (!event || typeof event.type !== 'string') throw new TypeError('event.type must be a string');
  const next = copy(state); const profile = getProfile(state.profile.id, state.profile.version);
  const player = (seat) => next.players.find((entry) => entry.seat === seat);
  const emit = (entry) => { next.eventLog.push(entry); return next; };
  if (event.type === 'tag-void') {
    const guard = player(event.guardSeat);
    if (guard && event.attemptResolved !== false) guard.cooldowns.tagRecoveryUntil = event.recoveryThroughTick ?? ((event.tick ?? next.tick) + 18);
    if (event.reason === 'guard-foot-on-line' && guard) {
      if (guard.role === 'sikka') {
        guard.state = 'spine-vacated';
        next.vacatedRegions ??= [];
        if (!next.vacatedRegions.includes('spine')) next.vacatedRegions.push('spine');
        return emit({ ...event, reason: 'sikka-spine-line-foul', effect: 'spine-vacated', regionId: 'spine' });
      }
      guard.state = 'lane-vacated';
      const teamGuards = next.players.filter((p) => p.team === guard.team && p.role === 'guard').sort((a, b) => a.seat - b.seat);
      const lane = next.court.laneStrips[Math.max(0, teamGuards.findIndex((p) => p.seat === guard.seat)) % next.court.laneStrips.length];
      next.vacatedLanes ??= [];
      if (lane && !next.vacatedLanes.includes(lane.id)) next.vacatedLanes.push(lane.id);
      return emit({ ...event, laneId: lane?.id, reason: 'guard-foot-on-line', effect: 'lane-vacated' });
    }
    return emit({ ...event });
  }
  if (event.type === 'attacker-boundary') {
    const attacker = player(event.seat);
    if (!attacker || attacker.role !== 'attacker') throw new RangeError(`event references unknown attacker seat ${String(event.seat)}`);
    return applyRuleEvent(next, { type: 'tagged', reason: 'attacker-left-court', tick: event.tick, guardSeat: null, targetSeat: event.seat });
  }
  if (event.type === 'tag-contact') return emit({ ...event });
  if (event.type === 'tag-valid' || event.type === 'tagged') {
    if (!['playing', 'golden'].includes(next.phase)) throw new RangeError(`cannot apply tag consequence while phase is ${JSON.stringify(next.phase)}`);
    const resumePhase = next.phase;
    next.pendingTags = [];
    const attacker = player(event.targetSeat);
    const guard = event.guardSeat == null ? null : player(event.guardSeat);
    if (!attacker || attacker.role !== 'attacker') throw new RangeError(`event references unknown attacker seat ${String(event.targetSeat)}`);
    if (profile.tagConsequence === 'cancel-daan-swap-sides') {
      next.attackerTeam = 1 - next.attackerTeam;
      setAttackers(next, next.attackerTeam, next.players.filter((p) => p.team === next.attackerTeam).length);
      setAttackers(next, 1 - next.attackerTeam, 0);
      next.players.forEach((p) => { if (p.state === 'out' || p.state === 'eliminated') p.state = 'active'; });
      resetAttackers(next, next.attackerTeam);
      resetDefenders(next, 1 - next.attackerTeam);
      clearVacancies(next);
      next.eliminated = [];
      next.phase = 'transition';
      next.transitionTicksRemaining = 1;
      next.transitionResumePhase = resumePhase;
      next.transitionReason = 'tagged';
      return emit({ ...event, type: 'tagged', reason: event.reason ?? 'valid-contact', consequence: 'daan-cancelled-sides-swapped' });
    }
    attacker.state = 'eliminated';
    if (!next.eliminated.includes(attacker.seat)) next.eliminated.push(attacker.seat);
    if (guard) guard.cooldowns.tagRecoveryUntil = event.recoveryThroughTick ?? ((event.tick ?? next.tick) + 18);
    next.eliminated.sort((a, b) => a - b);
    const teamSize = Number(next.format[0]);
    next.attackerTeam = 1 - next.attackerTeam;
    setAttackers(next, next.attackerTeam, teamSize / 2);
    setAttackers(next, 1 - next.attackerTeam, 0);
    next.players.filter((p) => p.team === next.attackerTeam).forEach((p) => { if (p.state === 'eliminated') p.state = 'active'; });
    resetAttackers(next, next.attackerTeam);
    resetDefenders(next, 1 - next.attackerTeam);
    clearVacancies(next);
    next.phase = 'transition';
    next.transitionTicksRemaining = 1;
    next.transitionResumePhase = resumePhase;
    next.transitionReason = 'half-team-counter-attack';
    return emit({ ...event, type: 'tagged', reason: event.reason ?? 'valid-contact', consequence: 'attacker-eliminated' });
  }
  if (event.type === 'round-trip') {
    if (!['playing', 'golden'].includes(next.phase)) throw new RangeError(`cannot apply round-trip while phase is ${JSON.stringify(next.phase)}`);
    const seat = event.seat;
    if (seat !== undefined) {
      const attacker = player(seat);
      if (!attacker || attacker.role !== 'attacker' || attacker.team !== next.attackerTeam) throw new RangeError(`event references unknown attacking seat ${String(seat)}`);
    }
    next.score[next.attackerTeam] += 1;
    resetAttackers(next, next.attackerTeam);
    clearVacancies(next);
    const wasGolden = next.phase === 'golden';
    const pointEvent = { ...event, type: 'point-scored', reason: event.reason ?? 'round-trip-complete', team: next.attackerTeam, score: [...next.score], consequence: profile.id === 'traditional' ? 'traditional-point-same-team-attacks' : 'game-point' };
    if (wasGolden || (profile.pointsToWin && next.score[next.attackerTeam] >= profile.pointsToWin)) {
      next.phase = 'ended';
      next.result = { winner: next.attackerTeam, reason: wasGolden ? 'golden-point' : 'points-to-win' };
      next.pendingTags = [];
      return emit({ ...pointEvent, matchEnded: true, winner: next.attackerTeam });
    }
    next.phase = 'transition';
    next.transitionTicksRemaining = 1;
    next.transitionResumePhase = wasGolden ? 'golden' : 'playing';
    next.transitionReason = 'point';
    return emit(pointEvent);
  }
  throw new RangeError(`unsupported rule event type ${JSON.stringify(event.type)}`);
}

/** Applies a stable batch in tick/seat order. */
export function applyRuleEvents(state, events) {
  if (!Array.isArray(events)) throw new TypeError('events must be an array');
  return ordered(events).reduce((current, event) => applyRuleEvent(current, event), state);
}
