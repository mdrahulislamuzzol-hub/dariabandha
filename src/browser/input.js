import { describeRoleCamera } from './role-camera.js';

/** Device-independent input helpers. Movement uses B1's court axes: +x is
 * toward the right edge and +z is toward the far end of the court. */
export function normalizeMovement(x = 0, z = 0) {
  const safeX = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
  const safeZ = Number.isFinite(z) ? Math.max(-1, Math.min(1, z)) : 0;
  const magnitude = Math.hypot(safeX, safeZ);
  const scale = magnitude > 1 ? 1 / magnitude : 1;
  return { x: safeX * scale, z: safeZ * scale };
}

/**
 * Select the closest eligible opposing attacker in the camera's horizontal
 * view cone. Occlusion is not modeled in this flat grey-box; ties use seat
 * order so identical states always produce the same target.
 */
export function selectTagTarget(state, humanSeat) {
  const human = state.players.find((player) => player.seat === humanSeat);
  if (!human || !['guard', 'sikka'].includes(human.role)) return null;
  const camera = describeRoleCamera(state, humanSeat);
  const viewX = camera.target.x - camera.camera.x;
  const viewZ = camera.target.z - camera.camera.z;
  const viewLength = Math.hypot(viewX, viewZ) || 1;
  const viewXUnit = viewX / viewLength;
  const viewZUnit = viewZ / viewLength;
  // Guard FOV is not specified in B1; use the attacker 70° camera FOV as the
  // B2 grey-box horizontal visibility envelope, independent of rendering.
  const minViewDot = Math.cos(35 * Math.PI / 180);
  return state.players
    .filter((player) => player.team !== human.team && player.role === 'attacker' && player.state === 'active')
    .map((player) => {
      const x = player.position.x - camera.camera.x;
      const z = player.position.z - state.court.lengthMetres / 2 - camera.camera.z;
      const distanceSquared = (player.position.x - human.position.x) ** 2 + (player.position.z - human.position.z) ** 2;
      const distance = Math.hypot(x, z) || 1;
      return { player, distanceSquared, visible: (x * viewXUnit + z * viewZUnit) / distance >= minViewDot };
    })
    .filter((candidate) => candidate.visible)
    .sort((a, b) => a.distanceSquared - b.distanceSquared || a.player.seat - b.player.seat)[0]?.player.seat ?? null;
}

/** Converts either device sample into the exact per-seat B1 input contract. */
export function normalizeTickInput(sample, state, humanSeat) {
  const move = normalizeMovement(sample?.move?.x ?? 0, sample?.move?.z ?? 0);
  const result = { move, sprint: sample?.sprint === true };
  if (sample?.tag === true) {
    const targetSeat = selectTagTarget(state, humanSeat);
    if (targetSeat !== null) result.tag = { targetSeat };
  }
  return result;
}

const KEY_MOVES = new Map([
  ['ArrowLeft', [-1, 0]], ['KeyA', [-1, 0]],
  ['ArrowRight', [1, 0]], ['KeyD', [1, 0]],
  ['ArrowUp', [0, -1]], ['KeyW', [0, -1]],
  ['ArrowDown', [0, 1]], ['KeyS', [0, 1]],
]);

/** Keyboard plus pointer/touch controls. Pointer capture is held only by the
 * joystick; up, cancel, lost capture, and window blur all release its state. */
export function createDeviceControls(root, { windowRef = globalThis.window, documentRef = globalThis.document } = {}) {
  const controls = documentRef.createElement('div');
  controls.className = 'game-controls';
  controls.setAttribute('aria-label', 'Game controls');
  controls.innerHTML = '<div class="touch-stick" role="group" aria-label="Movement joystick"><span>Move</span></div><div class="touch-actions"><button type="button" class="sprint-button">Sprint</button><button type="button" class="tag-button">Tag</button></div>';
  root.append(controls);
  const stick = controls.querySelector('.touch-stick');
  const sprintButton = controls.querySelector('.sprint-button');
  const tagButton = controls.querySelector('.tag-button');
  const keys = new Set();
  let stickPointer = null;
  let stickMove = { x: 0, z: 0 };
  let sprintPointer = null;
  let tagPointer = null;
  let tagPending = false;
  const keydown = (event) => {
    if (KEY_MOVES.has(event.code) || ['ShiftLeft', 'ShiftRight', 'Space', 'Enter'].includes(event.code)) event.preventDefault();
    if (event.repeat && ['Space', 'Enter'].includes(event.code)) return;
    keys.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') tagPending = true;
  };
  const keyup = (event) => keys.delete(event.code);
  const releaseStick = (event) => {
    if (stickPointer !== event.pointerId) return;
    stickPointer = null;
    stickMove = { x: 0, z: 0 };
    if (stick.hasPointerCapture?.(event.pointerId)) stick.releasePointerCapture(event.pointerId);
  };
  const updateStick = (event) => {
    if (stickPointer !== event.pointerId) return;
    const rect = stick.getBoundingClientRect();
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.42);
    const dx = (event.clientX - (rect.left + rect.width / 2)) / radius;
    const dy = (event.clientY - (rect.top + rect.height / 2)) / radius;
    stickMove = normalizeMovement(dx, dy);
    event.preventDefault();
  };
  const beginStick = (event) => {
    if (stickPointer !== null) return;
    event.preventDefault();
    stickPointer = event.pointerId;
    stick.setPointerCapture?.(event.pointerId);
    updateStick(event);
  };
  const beginSprint = (event) => { event.preventDefault(); sprintPointer = event.pointerId; sprintButton.setPointerCapture?.(event.pointerId); };
  const endSprint = (event) => { if (sprintPointer === event.pointerId) sprintPointer = null; };
  const beginTag = (event) => { event.preventDefault(); tagPointer = event.pointerId; tagButton.setPointerCapture?.(event.pointerId); tagPending = true; };
  const endTag = (event) => { if (tagPointer === event.pointerId) tagPointer = null; };
  const clear = () => {
    keys.clear();
    if (sprintPointer !== null && sprintButton.hasPointerCapture?.(sprintPointer)) sprintButton.releasePointerCapture(sprintPointer);
    if (tagPointer !== null && tagButton.hasPointerCapture?.(tagPointer)) tagButton.releasePointerCapture(tagPointer);
    sprintPointer = null;
    tagPointer = null;
    tagPending = false;
    if (stickPointer !== null) releaseStick({ pointerId: stickPointer });
  };

  windowRef.addEventListener('keydown', keydown);
  windowRef.addEventListener('keyup', keyup);
  windowRef.addEventListener('blur', clear);
  stick.addEventListener('pointerdown', beginStick);
  stick.addEventListener('pointermove', updateStick);
  stick.addEventListener('pointerup', releaseStick);
  stick.addEventListener('pointercancel', releaseStick);
  stick.addEventListener('lostpointercapture', releaseStick);
  sprintButton.addEventListener('pointerdown', beginSprint);
  sprintButton.addEventListener('pointerup', endSprint);
  sprintButton.addEventListener('pointercancel', endSprint);
  sprintButton.addEventListener('lostpointercapture', endSprint);
  tagButton.addEventListener('pointerdown', beginTag);
  tagButton.addEventListener('pointerup', endTag);
  tagButton.addEventListener('pointercancel', endTag);
  tagButton.addEventListener('lostpointercapture', endTag);

  return {
    sample() {
      let x = 0; let z = 0;
      for (const code of keys) {
        const move = KEY_MOVES.get(code);
        if (move) { x += move[0]; z += move[1]; }
      }
      const keyboardMove = normalizeMovement(x, z);
      const usingKeyboard = keyboardMove.x !== 0 || keyboardMove.z !== 0;
      return {
        move: usingKeyboard ? keyboardMove : stickMove,
        sprint: keys.has('ShiftLeft') || keys.has('ShiftRight') || sprintPointer !== null,
        tag: tagPending,
      };
    },
    consumeTag() { tagPending = false; },
    destroy() { clear(); controls.remove(); },
  };
}
