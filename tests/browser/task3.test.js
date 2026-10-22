import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ATTACKER_RUN_SPEED_METRES_PER_SECOND,
  GUARD_RUN_SPEED_METRES_PER_SECOND,
  STAMINA_SPRINT_DRAIN_PER_SECOND,
  TICK_RATE,
} from '../../src/rules/constants.js';
import { applyRuleEvent } from '../../src/rules/match-flow.js';
import { stepMatch } from '../../src/rules/simulation.js';
import { createQuickMatchFixture } from '../../src/browser/quick-match-fixture.js';
import { createGameCoordinator } from '../../src/browser/coordinator.js';
import { createDeviceControls, normalizeMovement, normalizeTickInput, selectTagTarget } from '../../src/browser/input.js';
import { describeRoleCamera } from '../../src/browser/role-camera.js';

class FakeElement {
  constructor() { this.listeners = new Map(); this.children = []; this.captured = new Set(); this.removed = false; }
  set innerHTML(value) {
    this.markup = value;
    this.childrenByClass = new Map(['touch-stick', 'sprint-button', 'tag-button'].map((name) => [name, new FakeElement()]));
  }
  setAttribute() {}
  append(child) { this.children.push(child); }
  remove() { this.removed = true; }
  querySelector(name) { return this.childrenByClass.get(name.slice(1)); }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(fn); }
  dispatch(name, fields = {}) {
    const event = { pointerId: 1, clientX: 50, clientY: 50, preventDefault() { this.prevented = true; }, ...fields };
    for (const fn of this.listeners.get(name) ?? []) fn(event);
    return event;
  }
  setPointerCapture(id) { this.captured.add(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
}

function makeControls() {
  const root = new FakeElement();
  const windowRef = new FakeElement();
  const documentRef = { createElement: () => new FakeElement() };
  const controls = createDeviceControls(root, { windowRef, documentRef });
  const shell = root.children[0];
  return { root, windowRef, controls, stick: shell.querySelector('.touch-stick'), sprint: shell.querySelector('.sprint-button'), tag: shell.querySelector('.tag-button') };
}

test('keyboard and pointer/touch produce identical normalized move, sprint, and tag tick input', () => {
  const state = createQuickMatchFixture('guard');
  const seat = 5;
  const keyboard = makeControls();
  keyboard.windowRef.dispatch('keydown', { code: 'KeyW' });
  keyboard.windowRef.dispatch('keydown', { code: 'ShiftLeft' });
  keyboard.windowRef.dispatch('keydown', { code: 'Space' });
  const keyboardInput = normalizeTickInput(keyboard.controls.sample(), state, seat);

  const touch = makeControls();
  touch.stick.dispatch('pointerdown', { pointerId: 2, clientX: 50, clientY: 8 });
  touch.sprint.dispatch('pointerdown', { pointerId: 3 });
  touch.tag.dispatch('pointerdown', { pointerId: 4 });
  const touchInput = normalizeTickInput(touch.controls.sample(), state, seat);
  assert.deepEqual(touchInput, keyboardInput);
  assert.deepEqual(touchInput.move, { x: 0, z: -1 });
  assert.equal(touchInput.sprint, true);
  assert.ok(Number.isInteger(touchInput.tag.targetSeat));
  keyboard.controls.destroy();
  touch.controls.destroy();
});

test('diagonal movement is normalized and deterministic target selection breaks distance ties by seat', () => {
  const diagonal = normalizeMovement(1, -1);
  assert.ok(Math.abs(diagonal.x - Math.SQRT1_2) < 1e-15);
  assert.ok(Math.abs(diagonal.z + Math.SQRT1_2) < 1e-15);
  const state = createQuickMatchFixture('guard');
  const guard = state.players.find((player) => player.seat === 5);
  const candidates = state.players.filter((player) => player.role === 'attacker');
  const camera = describeRoleCamera(state, guard.seat);
  const forwardZ = Math.sign(camera.target.z - camera.camera.z);
  candidates[0].position = { x: guard.position.x + 0.5, z: guard.position.z + forwardZ * 2 };
  candidates[1].position = { x: guard.position.x - 0.5, z: guard.position.z + forwardZ * 2 };
  candidates[2].position = { x: guard.position.x + 40, z: guard.position.z + forwardZ * 2 };
  candidates[3].position = { x: guard.position.x + 50, z: guard.position.z + forwardZ * 2 };
  assert.equal(selectTagTarget(state, 5), Math.min(candidates[0].seat, candidates[1].seat));
  assert.equal(selectTagTarget(state, 0), null, 'attackers do not receive a defender tag target');
});

test('pointer capture is released on cancellation and browser gestures are prevented', () => {
  const { controls, windowRef, stick, sprint, tag } = makeControls();
  const down = stick.dispatch('pointerdown', { pointerId: 7, clientX: 90, clientY: 50 });
  assert.equal(down.prevented, true);
  assert.equal(stick.hasPointerCapture(7), true);
  assert.ok(Math.abs(controls.sample().move.x - 40 / 42) < 1e-12);
  assert.equal(controls.sample().move.z, 0);
  stick.dispatch('pointercancel', { pointerId: 7 });
  assert.equal(stick.hasPointerCapture(7), false);
  assert.deepEqual(controls.sample().move, { x: 0, z: 0 });
  sprint.dispatch('pointerdown', { pointerId: 8 });
  sprint.dispatch('pointercancel', { pointerId: 8 });
  assert.equal(controls.sample().sprint, false);
  tag.dispatch('pointerdown', { pointerId: 9 });
  tag.dispatch('pointercancel', { pointerId: 9 });
  assert.equal(controls.sample().tag, true, 'a quick tag press remains queued until an authoritative tick');
  controls.consumeTag();
  assert.equal(controls.sample().tag, false);

  stick.dispatch('pointerdown', { pointerId: 10, clientX: 90, clientY: 50 });
  sprint.dispatch('pointerdown', { pointerId: 11 });
  tag.dispatch('pointerdown', { pointerId: 12 });
  windowRef.dispatch('keydown', { code: 'KeyW' });
  windowRef.dispatch('blur');
  assert.equal(stick.hasPointerCapture(10), false);
  assert.equal(sprint.hasPointerCapture(11), false);
  assert.equal(tag.hasPointerCapture(12), false);
  assert.deepEqual(controls.sample(), { move: { x: 0, z: 0 }, sprint: false, tag: false });
  controls.destroy();
});

test('fixed human seat remains controlled when a B1 tag transition changes that seat role', () => {
  const game = createGameCoordinator({ humanRole: 'attacker' });
  const seat = game.humanSeat;
  assert.equal(game.state.players.find((player) => player.seat === seat).role, 'attacker');
  const changed = applyRuleEvent(game.state, { type: 'tagged', tick: 1, guardSeat: 5, targetSeat: seat });
  assert.equal(changed.players.find((player) => player.seat === seat).role, 'sikka');
  assert.equal(changed.players.find((player) => player.seat === seat).controller, 'human');
  assert.equal(game.humanSeat, seat);
  game.setHumanInput({ move: { x: 1, z: 0 }, sprint: false });
  const moved = stepMatch({ ...changed, phase: 'playing' }, { [game.humanSeat]: { move: { x: 1, z: 0 } } }).state;
  assert.equal(moved.players.find((player) => player.seat === seat).position.x, changed.players.find((player) => player.seat === seat).position.x, 'Sikka x movement is constrained by B1');
});

test('role camera uses B1 attacker/guard constants and labels the B2 Sikka inference', () => {
  const attackerState = createQuickMatchFixture('attacker');
  const attackerCamera = describeRoleCamera(attackerState, 0);
  assert.equal(attackerCamera.distance, 5);
  assert.equal(attackerCamera.height, 2.8);
  assert.equal(attackerCamera.fovDegrees, 70);
  const guardState = createQuickMatchFixture('guard');
  const guardCamera = describeRoleCamera(guardState, 5);
  assert.equal(guardCamera.distance, 4.5);
  assert.equal(guardCamera.height, 2.4);
  assert.equal(guardCamera.yawLimitDegrees, 25);
  assert.ok(Math.abs(guardCamera.yawDegrees) <= guardCamera.yawLimitDegrees);
  const sikkaState = createQuickMatchFixture('sikka');
  const sikkaCamera = describeRoleCamera(sikkaState, 4);
  assert.match(sikkaCamera.inference, /B2 Sikka camera inherits guard/);
  assert.equal(sikkaCamera.camera.x, 0);
});

test('§25 run and sprint movement/stamina follow B1 tick tuning; neutral AI stays still', () => {
  let state = createQuickMatchFixture('attacker');
  const original = state.players.map((player) => ({ seat: player.seat, position: { ...player.position } }));
  const seat = 0;
  for (let i = 0; i < 18; i += 1) state = stepMatch(state, { [seat]: { move: { x: 0, z: 1 }, sprint: true } }).state;
  const runner = state.players.find((player) => player.seat === seat);
  assert.ok(Math.abs(Math.hypot(runner.velocity.x, runner.velocity.z) - 6.4) < 1e-12);
  assert.ok(Math.abs(Math.abs(runner.position.z - original.find((player) => player.seat === seat).position.z) - 6.4 * (18 * 19 / 2) / 18 / TICK_RATE) < 1e-12, 'acceleration travel follows the per-tick ramp');
  assert.ok(Math.abs(runner.stamina - (100 - STAMINA_SPRINT_DRAIN_PER_SECOND * 18 / TICK_RATE)) < 1e-9);
  for (let i = 0; i < 12; i += 1) state = stepMatch(state, {}).state;
  const afterTwelveBrakeTicks = state.players.find((player) => player.seat === seat);
  assert.ok(Math.hypot(afterTwelveBrakeTicks.velocity.x, afterTwelveBrakeTicks.velocity.z) < 1e-12, 'attacker reaches rest within §25 12-tick stop time');
  for (let i = 0; i < 6; i += 1) state = stepMatch(state, {}).state;
  const recovering = state.players.find((player) => player.seat === seat);
  assert.ok(Math.abs(recovering.stamina - (runner.stamina + 16 * 18 / TICK_RATE)) < 1e-9, 'standing recovery is 16 stamina per second');
  const ai = state.players.find((player) => player.controller === 'AI' && player.role === 'attacker');
  assert.deepEqual(ai.position, original.find((player) => player.seat === ai.seat).position);
  const guardState = createQuickMatchFixture('guard');
  const guard = guardState.players.find((player) => player.seat === 5);
  const moved = stepMatch(guardState, { [guard.seat]: { move: { x: 1, z: -1 } } }).state.players.find((player) => player.seat === guard.seat);
  assert.ok(Math.abs(Math.hypot(moved.velocity.x, moved.velocity.z) - GUARD_RUN_SPEED_METRES_PER_SECOND / 6) < 1e-12);
  assert.equal(moved.position.z, guard.position.z, 'guard z movement is constrained by B1');
  assert.equal(ATTACKER_RUN_SPEED_METRES_PER_SECOND, 5);
});

test('§25 maximum stop times bring top-speed attacker and guard to rest in 12 and 5 ticks', () => {
  let attackerState = createQuickMatchFixture('attacker');
  for (let i = 0; i < 18; i += 1) attackerState = stepMatch(attackerState, { 0: { move: { x: 1, z: 0 }, sprint: true } }).state;
  for (let i = 0; i < 11; i += 1) attackerState = stepMatch(attackerState, {}).state;
  assert.ok(Math.hypot(attackerState.players.find((player) => player.seat === 0).velocity.x, attackerState.players.find((player) => player.seat === 0).velocity.z) > 0);
  attackerState = stepMatch(attackerState, {}).state;
  assert.ok(Math.hypot(attackerState.players.find((player) => player.seat === 0).velocity.x, attackerState.players.find((player) => player.seat === 0).velocity.z) < 1e-12);

  let guardState = createQuickMatchFixture('guard');
  for (let i = 0; i < 6; i += 1) guardState = stepMatch(guardState, { 5: { move: { x: 1, z: 0 } } }).state;
  assert.ok(Math.abs(Math.hypot(guardState.players.find((player) => player.seat === 5).velocity.x, guardState.players.find((player) => player.seat === 5).velocity.z) - GUARD_RUN_SPEED_METRES_PER_SECOND) < 1e-12);
  for (let i = 0; i < 4; i += 1) guardState = stepMatch(guardState, {}).state;
  assert.ok(Math.hypot(guardState.players.find((player) => player.seat === 5).velocity.x, guardState.players.find((player) => player.seat === 5).velocity.z) > 0);
  guardState = stepMatch(guardState, {}).state;
  assert.ok(Math.hypot(guardState.players.find((player) => player.seat === 5).velocity.x, guardState.players.find((player) => player.seat === 5).velocity.z) < 1e-12);
});
