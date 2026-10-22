import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATTACKER_CAPSULE_HEIGHT_METRES,
  ATTACKER_CAPSULE_RADIUS_METRES,
  BOX_SIZE_METRES,
  COURT_WIDTH_METRES,
  FORMAT_SPECS,
  FOOT_CIRCLE_RADIUS_METRES,
  LANE_WIDTH_METRES,
  LINE_HALF_WIDTH_METRES,
  MAX_STEPS_PER_FRAME,
  METRES_PER_FOOT,
  TAG_ACTIVE_TICKS,
  TAG_AIM_ASSIST_CONE_DEGREES,
  TAG_HOLD_TICKS,
  TAG_REACH_METRES,
  TAG_RECOVERY_TICKS,
  TAG_WINDUP_TICKS,
  TICK_RATE,
} from '../../src/rules/constants.js';

test('exports the exact fixed-tick and court dimensions', () => {
  assert.equal(TICK_RATE, 60);
  assert.equal(MAX_STEPS_PER_FRAME, 5);
  assert.equal(METRES_PER_FOOT, 0.3048);
  assert.equal(BOX_SIZE_METRES, 3.048);
  assert.equal(COURT_WIDTH_METRES, 6.096);
  assert.equal(LANE_WIDTH_METRES, 0.6);
  assert.equal(LINE_HALF_WIDTH_METRES, 0.05);
  assert.equal(FOOT_CIRCLE_RADIUS_METRES, 0.07);
  assert.equal(ATTACKER_CAPSULE_RADIUS_METRES, 0.3);
  assert.equal(ATTACKER_CAPSULE_HEIGHT_METRES, 1.7);
});

test('exports the exact tag timing and reach tuning', () => {
  assert.equal(TAG_REACH_METRES, 0.9);
  assert.equal(TAG_AIM_ASSIST_CONE_DEGREES, 25);
  assert.equal(TAG_WINDUP_TICKS, 6);
  assert.equal(TAG_ACTIVE_TICKS, 9);
  assert.equal(TAG_RECOVERY_TICKS, 18);
  assert.equal(TAG_HOLD_TICKS, 30);
});

test('defines immutable format team-size and row-count data', () => {
  assert.deepEqual(FORMAT_SPECS, {
    '2v2': { teamSize: 2, rowCount: 3 },
    '4v4': { teamSize: 4, rowCount: 4 },
    '6v6': { teamSize: 6, rowCount: 5 },
  });
  assert.throws(() => {
    FORMAT_SPECS['2v2'].rowCount = 99;
  }, TypeError);
});
