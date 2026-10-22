import {
  ATTACKER_CAMERA_DISTANCE_METRES,
  ATTACKER_CAMERA_FOV_DEGREES,
  ATTACKER_CAMERA_HEIGHT_METRES,
  ATTACKER_CAMERA_PITCH_DEGREES,
  GUARD_CAMERA_DISTANCE_METRES,
  GUARD_CAMERA_HEIGHT_METRES,
  GUARD_CAMERA_YAW_LIMIT_DEGREES,
} from '../rules/constants.js';

const unit = (vector) => {
  const length = Math.hypot(vector.x, vector.z) || 1;
  return { x: vector.x / length, z: vector.z / length };
};

/** B2 camera policy. Sikka intentionally inherits guard camera limits as a
 * presentation inference: B1 defines no Sikka camera constants. For guards
 * and Sikka, yaw is held on the central spine toward the attackers' entry end;
 * its fixed offset is within B1's guard yaw limit (there is no camera rule). */
export function describeRoleCamera(state, humanSeat) {
  const player = state.players.find((entry) => entry.seat === humanSeat);
  if (!player) throw new RangeError(`unknown human seat ${humanSeat}`);
  if (player.role === 'attacker') {
    const facing = unit(player.facing);
    const cameraY = ATTACKER_CAMERA_HEIGHT_METRES;
    const targetY = cameraY - Math.tan(Math.abs(ATTACKER_CAMERA_PITCH_DEGREES) * Math.PI / 180) * ATTACKER_CAMERA_DISTANCE_METRES;
    const target = { x: player.position.x + facing.x * 1.5, y: targetY, z: player.position.z + facing.z * 1.5 - state.court.lengthMetres / 2 };
    const camera = {
      x: target.x - facing.x * ATTACKER_CAMERA_DISTANCE_METRES,
      y: cameraY,
      z: target.z - facing.z * ATTACKER_CAMERA_DISTANCE_METRES,
    };
    return { role: player.role, camera, target, distance: ATTACKER_CAMERA_DISTANCE_METRES, height: ATTACKER_CAMERA_HEIGHT_METRES, pitchDegrees: ATTACKER_CAMERA_PITCH_DEGREES, fovDegrees: ATTACKER_CAMERA_FOV_DEGREES };
  }
  const forwardZ = state.attackerTeam === 0 ? -1 : 1;
  const spineDirection = unit({ x: -player.position.x, z: forwardZ * state.court.lengthMetres / 2 - player.position.z });
  const desiredYaw = Math.atan2(Math.abs(spineDirection.x), Math.abs(spineDirection.z)) * 180 / Math.PI;
  const yawDegrees = Math.min(GUARD_CAMERA_YAW_LIMIT_DEGREES, desiredYaw);
  const yawRadians = yawDegrees * Math.PI / 180;
  const direction = { x: Math.sign(spineDirection.x) * Math.sin(yawRadians), z: forwardZ * Math.cos(yawRadians) };
  const lookDistance = state.court.lengthMetres;
  const target = { x: player.position.x + direction.x * lookDistance, y: 1, z: player.position.z + direction.z * lookDistance - state.court.lengthMetres / 2 };
  const camera = {
    x: player.position.x - direction.x * GUARD_CAMERA_DISTANCE_METRES,
    y: GUARD_CAMERA_HEIGHT_METRES,
    z: player.position.z - direction.z * GUARD_CAMERA_DISTANCE_METRES - state.court.lengthMetres / 2,
  };
  return { role: player.role, camera, target, distance: GUARD_CAMERA_DISTANCE_METRES, height: GUARD_CAMERA_HEIGHT_METRES, yawDegrees, yawLimitDegrees: GUARD_CAMERA_YAW_LIMIT_DEGREES, inference: player.role === 'sikka' ? 'B2 Sikka camera inherits guard distance/height/yaw limits; view aligns down the central spine toward the opposing entry.' : undefined };
}

export function applyRoleCamera(camera, descriptor) {
  camera.position.set(descriptor.camera.x, descriptor.camera.y, descriptor.camera.z);
  camera.lookAt(descriptor.target.x, descriptor.target.y, descriptor.target.z);
  if (descriptor.fovDegrees !== undefined && camera.fov !== descriptor.fovDegrees) {
    camera.fov = descriptor.fovDegrees;
    camera.updateProjectionMatrix();
  }
}
