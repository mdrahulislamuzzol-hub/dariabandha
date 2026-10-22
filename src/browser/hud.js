import { TICK_RATE } from '../rules/constants.js';

function formatClock(remainingTicks) {
  if (remainingTicks === null || remainingTicks === undefined) return '—:—';
  const totalSeconds = Math.ceil(remainingTicks / TICK_RATE);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function describeEvent(event) {
  if (!event) return 'No calls yet';
  const team = (number) => `Team ${number + 1}`;
  switch (event.type) {
    case 'toss-resolved': return `Toss: ${team(event.attackerTeam)} attacks`;
    case 'tagged': return `Tag: seat ${event.targetSeat} out (${event.reason ?? 'valid contact'})`;
    case 'tag-void': return `Void tag: ${event.reason ?? 'no call'}`;
    case 'point-scored': return `Point: ${team(event.team)} scored`;
    case 'round-trip': return `Round trip: seat ${event.seat}`;
    case 'attacker-boundary': return `Boundary: seat ${event.seat}`;
    case 'phase-changed': return `Phase: ${event.phase ?? event.toPhase ?? 'changed'}`;
    default: return `${String(event.type).replaceAll('-', ' ')}${event.reason ? `: ${String(event.reason).replaceAll('-', ' ')}` : ''}`;
  }
}

/** Formats only public B1 state and event data for the compact grey-box HUD. */
export function describeHud(state, humanSeat, events = []) {
  const human = state.players.find((player) => player.seat === humanSeat);
  if (!human) throw new RangeError(`human seat ${humanSeat} is not present in match state`);
  const latestEvent = events.at(-1) ?? state.eventLog.at(-1) ?? null;
  return {
    role: human.role[0].toUpperCase() + human.role.slice(1),
    team: `Team ${human.team + 1}`,
    phase: String(state.phase).replaceAll('-', ' '),
    score: `${state.score[0]} – ${state.score[1]}`,
    clock: formatClock(state.clock.remainingTicks),
    half: String(state.clock.half),
    stamina: human.stamina === null ? '—' : `${Math.round(human.stamina)}%`,
    call: describeEvent(latestEvent),
  };
}

/** Writes a HUD snapshot into the matching pre-existing DOM fields. */
export function updateHud(elements, state, humanSeat, events = []) {
  const snapshot = describeHud(state, humanSeat, events);
  for (const [key, value] of Object.entries(snapshot)) elements[key].textContent = value;
  return snapshot;
}
