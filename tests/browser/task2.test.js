import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createCourt } from '../../src/rules/court.js';
import { createQuickMatchFixture } from '../../src/browser/quick-match-fixture.js';
import {
  createGreyboxView,
  describeActors,
  describeCourtGeometry,
  interpolateActor,
  metresToWorld,
} from '../../src/browser/greybox-view.js';
import { createGameCoordinator, TICK_RATE } from '../../src/browser/coordinator.js';

test('4v4 rendered line endpoints, widths, strips, and spine project from B1 court data', () => {
  const court = createCourt('4v4');
  const geometry = describeCourtGeometry(court);
  const expected = [...court.rowLines, ...court.endLines, ...court.sideLines].map((entry) => ({
    id: entry.id,
    axis: entry.axis,
    halfWidth: entry.halfWidth,
    start: entry.axis === 'z'
      ? metresToWorld(entry.minAlong, entry.centre, court.lengthMetres)
      : metresToWorld(entry.centre, entry.minAlong, court.lengthMetres),
    end: entry.axis === 'z'
      ? metresToWorld(entry.maxAlong, entry.centre, court.lengthMetres)
      : metresToWorld(entry.centre, entry.maxAlong, court.lengthMetres),
  }));
  assert.deepEqual(geometry.lines, expected);
  assert.equal(geometry.lines.length, court.rowLines.length + court.endLines.length + court.sideLines.length);
  assert.deepEqual(geometry.laneStrips, court.laneStrips.map(({ id, xMin, xMax, zMin, zMax }) => ({
    id,
    min: metresToWorld(xMin, zMin, court.lengthMetres),
    max: metresToWorld(xMax, zMax, court.lengthMetres),
  })));
  assert.deepEqual(geometry.spine, {
    id: court.spineGeometry.id,
    min: metresToWorld(court.spineGeometry.xMin, court.spineGeometry.zMin, court.lengthMetres),
    max: metresToWorld(court.spineGeometry.xMax, court.spineGeometry.zMax, court.lengthMetres),
  });
  assert.equal(geometry.ground.min.z, -court.lengthMetres / 2);
  assert.equal(geometry.ground.max.z, court.lengthMetres / 2);
});

test('all eight actors preserve seat/team/controller/role and map B1 spawn positions to metres', () => {
  const state = createQuickMatchFixture('attacker');
  const actors = describeActors(state);
  assert.equal(actors.length, 8);
  for (const [index, actor] of actors.entries()) {
    const player = state.players.find(({ seat }) => seat === actor.seat);
    assert.equal(actor.team, index < 4 ? 0 : 1);
    assert.equal(actor.controller, player.controller);
    assert.equal(actor.role, player.role);
    assert.deepEqual(actor.position, metresToWorld(player.position.x, player.position.z, state.court.lengthMetres));
  }
  assert.equal(actors.filter(({ controller }) => controller === 'human').length, 1);
  assert.equal(actors.filter(({ controller }) => controller === 'AI').length, 7);
  assert.ok(actors.some(({ role }) => role === 'sikka'));
  assert.ok(actors.some(({ role }) => role === 'guard'));
  assert.equal(new Set(actors.map(({ position }) => `${position.x},${position.z}`)).size, 8, 'opening actors should not share spawn positions');
});

test('render interpolation blends only transforms between authoritative states', () => {
  const previous = { seat: 3, position: { x: -1, z: 2 }, facing: { x: 0, z: 1 } };
  const current = { seat: 3, position: { x: 3, z: 6 }, facing: { x: 1, z: 0 } };
  assert.deepEqual(interpolateActor(previous, current, 0.25), {
    seat: 3,
    position: { x: 0, z: 3 },
    facing: { x: 0.25, z: 0.75 },
  });
  assert.deepEqual(interpolateActor(previous, current, -1).position, previous.position);
  assert.deepEqual(interpolateActor(previous, current, 2).position, current.position);
});

test('fixed-tick bridge exposes the immediately preceding authoritative state for render interpolation', () => {
  const game = createGameCoordinator();
  const frame = game.advanceFrame(3.5 / TICK_RATE);
  assert.equal(frame.steps, 3);
  assert.equal(frame.previousState.tick, 2);
  assert.equal(frame.state.tick, 3);
  const lastPrevious = frame.previousState;
  const betweenTicks = game.advanceFrame(0.1 / TICK_RATE);
  assert.equal(betweenTicks.steps, 0);
  assert.equal(betweenTicks.previousState, lastPrevious);
  assert.ok(Math.abs(betweenTicks.interpolationAlpha - 0.6) < 1e-10);
});

test('Three.js grey-box scene creates eight positioned actors with role and controller shape markers', () => {
  const state = createQuickMatchFixture('sikka');
  const view = createGreyboxView(THREE, state);
  assert.equal(view.actors.size, 8);
  for (const player of state.players) {
    const group = view.actors.get(player.seat);
    assert.ok(group);
    assert.equal(group.userData.team, player.team);
    assert.equal(group.userData.controller, player.controller);
    assert.equal(group.userData.role, player.role);
    assert.equal(group.userData.roleMarkers[player.role].visible, true);
    assert.equal(group.userData.roleMarkers[Object.keys(group.userData.roleMarkers).find((role) => role !== player.role)].visible, false);
  }
  view.update(state, state, 1);
  for (const player of state.players) {
    const rendered = view.actors.get(player.seat);
    const worldPosition = metresToWorld(player.position.x, player.position.z, state.court.lengthMetres);
    assert.deepEqual(rendered.position.toArray(), [worldPosition.x, 0, worldPosition.z]);
    assert.equal(rendered.userData.stamina, player.stamina);
  }
  const human = state.players.find(({ controller }) => controller === 'human');
  assert.equal(view.actors.get(human.seat).userData.staminaFill, undefined);
});
