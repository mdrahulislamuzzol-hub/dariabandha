import test from 'node:test';
import assert from 'node:assert/strict';
import { createCourt, circleOverlapsLineZone } from '../../src/rules/court.js';
import { createMatch } from '../../src/rules/state.js';

test('creates metric courts with fixed 10 ft boxes and format row counts', () => {
  for (const [format, rows, length] of [['2v2', 3, 9.144], ['4v4', 4, 12.192], ['6v6', 5, 15.24]]) {
    const court = createCourt(format);
    assert.equal(court.rowCount, rows);
    assert.equal(court.boxSizeMetres, 3.048);
    assert.equal(court.lengthMetres, length);
    assert.equal(court.widthMetres, 6.096);
    assert.equal(court.bounds.xMin, -3.048);
    assert.equal(court.bounds.xMax, 3.048);
    assert.equal(court.bounds.zMin, 0);
    assert.equal(court.bounds.zMax, length);
    assert.equal(court.rowLines.length, rows - 1);
    assert.equal(court.laneStrips.length, rows);
    assert.equal(court.spineGeometry.widthMetres, 1.2);
  }
});

test('line zones use inclusive overlap at exact edges and no overlap just beyond', () => {
  const court = createCourt('6v6');
  const line = court.rowLines[0];
  const edgeX = 0;
  const edgeZ = line.centre + line.halfWidth + 0.07;
  assert.equal(circleOverlapsLineZone({ x: edgeX, z: edgeZ, radius: 0.07 }, line), true);
  assert.equal(circleOverlapsLineZone({ x: edgeX, z: edgeZ + 1e-9, radius: 0.07 }, line), false);
  assert.equal(circleOverlapsLineZone({ x: 0, z: line.centre, radius: 0 }, line), true);
});

test('court geometry is deeply immutable and invalid formats are rejected', () => {
  const court = createCourt('2v2');
  assert.ok(Object.isFrozen(court));
  assert.ok(Object.isFrozen(court.rowLines));
  assert.ok(Object.isFrozen(court.rowLines[0]));
  assert.throws(() => createCourt('3v3'), /format must be one of/);
  assert.throws(() => circleOverlapsLineZone({ x: 0, z: 0, radius: -1 }, court.endLines[0]), /radius/);
});

test('guard placement scales across interior rows, retaining the approved 6v6 back guard', () => {
  const cases = [
    ['2v2', ['lane-1']],
    ['4v4', ['lane-1', 'lane-2', 'lane-3']],
    ['6v6', ['lane-1', 'lane-2', 'lane-3', 'lane-4', 'lane-5']],
  ];
  for (const [format, laneIds] of cases) {
    const court = createCourt(format);
    assert.deepEqual(court.guardLaneIds, laneIds);
    const size = Number(format[0]);
    const seats = [
      ...Array.from({ length: size }, (_, i) => ({ seat: i, team: 0, role: 'attacker' })),
      { seat: size * 2 - 1, team: 1, role: 'sikka' },
      ...Array.from({ length: size - 1 }, (_, i) => ({ seat: size + i, team: 1, role: 'guard' })),
    ];
    const match = createMatch({ profileId: 'quick-match', profileVersion: '0.1', format, seed: 0, seats });
    const actual = match.players.filter((player) => player.role === 'guard').map((player) => player.position.z);
    const expected = laneIds.slice(0, size - 1).map((id) => {
      const lane = court.laneStrips.find((entry) => entry.id === id);
      return lane.zMin + court.lineHalfWidthMetres + 0.07 + 0.01;
    });
    assert.deepEqual(actual, expected);
  }
});
