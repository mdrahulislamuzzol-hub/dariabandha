import assert from 'node:assert/strict';
import test from 'node:test';
import * as C from '../../src/rules/constants.js';

const groups = {
  'units, court, and collision': {
    TICK_RATE: 60, MAX_STEPS_PER_FRAME: 5, METRES_PER_FOOT: 0.3048,
    FEET_PER_METRE: 1 / 0.3048, BOX_SIZE_METRES: 3.048, COURT_WIDTH_METRES: 6.096,
    LANE_WIDTH_METRES: 0.6, LINE_HALF_WIDTH_METRES: 0.05, FOOT_CIRCLE_RADIUS_METRES: 0.07,
    ATTACKER_CAPSULE_RADIUS_METRES: 0.3, ATTACKER_CAPSULE_HEIGHT_METRES: 1.7,
  },
  'attacker movement': {
    ATTACKER_WALK_SPEED_METRES_PER_SECOND: 1.6, ATTACKER_JOG_SPEED_METRES_PER_SECOND: 3.2,
    ATTACKER_RUN_SPEED_METRES_PER_SECOND: 5, ATTACKER_SPRINT_SPEED_METRES_PER_SECOND: 6.4,
    ATTACKER_TIME_TO_RUN_SPEED_TICKS: 18, ATTACKER_STOP_TIME_TICKS: 12,
    ATTACKER_SPRINT_TURN_180_TICKS: 27, ATTACKER_RUN_TURN_180_TICKS: 12,
  },
  'stamina and defender movement': {
    STAMINA_CAPACITY: 100, STAMINA_SPRINT_DRAIN_PER_SECOND: 18,
    STAMINA_JOG_RECOVERY_PER_SECOND: 10, STAMINA_STANDING_RECOVERY_PER_SECOND: 16,
    STAMINA_SPRINT_REENABLE_THRESHOLD: 25, GUARD_WALK_SPEED_METRES_PER_SECOND: 1.6,
    GUARD_JOG_SPEED_METRES_PER_SECOND: 2.8, GUARD_RUN_SPEED_METRES_PER_SECOND: 4.2,
    GUARD_TIME_TO_SPEED_TICKS: 6, GUARD_STOP_TIME_TICKS: 5,
  },
  'tag timing and movement': {
    TAG_REACH_METRES: 0.9, TAG_AIM_ASSIST_CONE_DEGREES: 25,
    TAG_WINDUP_TICKS: 6, TAG_ACTIVE_TICKS: 9, TAG_RECOVERY_TICKS: 18,
    TAG_HOLD_TICKS: 30, TAG_MOVEMENT_SPEED_MULTIPLIER: 0.5, TAG_HIT_STOP_TICKS: 4,
  },
  'clock and transition limits': {
    STANDARD_HALF_TICKS: 18_000, QUICK_HALF_TICKS: 12_600, BREAK_TICKS: 1_800,
    STANDARD_TIEBREAK_HALF_TICKS: 7_200, TRADITIONAL_MATCH_CAP_TICKS: 28_800,
    TRANSITION_CAP_TICKS: 360, CLOCK_ZERO_RESOLVE_WINDOW_TICKS: 120,
  },
  'Pro actions': {
    PRO_FEINT_TICKS: 12, PRO_FEINT_COOLDOWN_TICKS: 180, PRO_BURST_CUT_TICKS: 9,
    PRO_BURST_CUT_STAMINA_COST: 15, PRO_LUNGE_REACH_BONUS_METRES: 0.35,
    PRO_LUNGE_RECOVERY_BONUS_TICKS: 21, PRO_LUNGE_COOLDOWN_TICKS: 240,
  },
  'camera, AI, and network': {
    ATTACKER_CAMERA_DISTANCE_METRES: 5, ATTACKER_CAMERA_HEIGHT_METRES: 2.8,
    ATTACKER_CAMERA_PITCH_DEGREES: -22, ATTACKER_CAMERA_FOV_DEGREES: 70,
    GUARD_CAMERA_DISTANCE_METRES: 4.5, GUARD_CAMERA_HEIGHT_METRES: 2.4,
    GUARD_CAMERA_YAW_LIMIT_DEGREES: 25, AI_REACTION_TICKS: { easy: 24, standard: 18, hard: 13, expert: 10 },
    AI_TARGET_ROUND_TRIP_SUCCESS_MIN: 0.3, AI_TARGET_ROUND_TRIP_SUCCESS_MAX: 0.45,
    SERVER_TICK_RATE: 30, SERVER_SNAPSHOT_RATE: 15,
    NETWORK_INTERPOLATION_MILLISECONDS: 100, NETWORK_LAG_COMPENSATION_CAP_MILLISECONDS: 120,
  },
};

for (const [group, expected] of Object.entries(groups)) {
  test(`pins every §25 ${group} constant`, () => {
    for (const [name, value] of Object.entries(expected)) assert.deepEqual(C[name], value, name);
  });
}

test('defines immutable format team-size and row-count data', () => {
  assert.deepEqual(C.FORMAT_SPECS, {
    '2v2': { teamSize: 2, rowCount: 3 }, '4v4': { teamSize: 4, rowCount: 4 }, '6v6': { teamSize: 6, rowCount: 5 },
  });
  assert.throws(() => { C.FORMAT_SPECS['2v2'].rowCount = 99; }, TypeError);
});

test('pins the exact immutable profile and aggregate tuning records', () => {
  assert.deepEqual(C.PROFILE_SPECS, {
    traditional: { version: '0.1', timingShape: 'traditional' },
    'competitive-standard': { version: '0.1', timingShape: 'standard' },
    'quick-match': { version: '0.1', timingShape: 'quick' },
    pro: { version: '0.1', timingShape: 'selectable' },
  });
  assert.deepEqual(C.TUNING_CONSTANTS, {
    tickRate: 60, maxStepsPerFrame: 5, metresPerFoot: 0.3048,
    boxSizeMetres: 3.048, courtWidthMetres: 6.096, laneWidthMetres: 0.6,
    lineHalfWidthMetres: 0.05, footCircleRadiusMetres: 0.07,
    tagReachMetres: 0.9, tagAimAssistConeDegrees: 25, tagWindupTicks: 6,
    tagActiveTicks: 9, tagRecoveryTicks: 18, tagHoldTicks: 30,
    formats: C.FORMAT_SPECS, profiles: C.PROFILE_SPECS,
  });
  assert.throws(() => { C.PROFILE_SPECS.pro.version = '9.9'; }, TypeError);
  assert.throws(() => { C.TUNING_CONSTANTS.tickRate = 1; }, TypeError);
});
