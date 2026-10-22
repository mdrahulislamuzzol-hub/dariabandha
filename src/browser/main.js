import * as THREE from 'three';
import './style.css';
import { createGameCoordinator } from './coordinator.js';
import { createGreyboxView } from './greybox-view.js';
import { createDeviceControls, normalizeTickInput } from './input.js';
import { applyRoleCamera, describeRoleCamera } from './role-camera.js';

const root = document.querySelector('#game-root');
const status = document.querySelector('#game-status');
const game = createGameCoordinator();

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const sceneHeight = 640;
  renderer.setSize(root.clientWidth || window.innerWidth, sceneHeight, false);
  renderer.setClearColor(0x14221d, 1);
  root.append(renderer.domElement);

  const view = createGreyboxView(THREE, game.state);
  const controls = createDeviceControls(root);
  const scene = view.scene;
  const camera = new THREE.PerspectiveCamera(44, (root.clientWidth || window.innerWidth) / sceneHeight, 0.1, 100);
  applyRoleCamera(camera, describeRoleCamera(game.state, game.humanSeat));

  status.textContent = `B2 grey-box · Quick Match 4v4 · ${game.state.players.length} players · human seat ${game.humanSeat} (${game.state.players[game.humanSeat].role}) · seven inactive AI · court lines and role markers shown`;

  let previousTimestamp;
  function frame(timestamp) {
    const deltaSeconds = previousTimestamp === undefined ? 0 : (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;
    game.setHumanInput(normalizeTickInput(controls.sample(), game.state, game.humanSeat));
    const frameState = game.advanceFrame(Math.max(0, deltaSeconds));
    if (frameState.steps > 0) controls.consumeTag();
    view.update(frameState.state, frameState.previousState, frameState.interpolationAlpha);
    applyRoleCamera(camera, describeRoleCamera(frameState.state, game.humanSeat));
    renderer.render(scene, camera);
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
  window.addEventListener('resize', () => {
    const width = root.clientWidth || window.innerWidth;
    renderer.setSize(width, sceneHeight, false);
    camera.aspect = width / sceneHeight;
    camera.updateProjectionMatrix();
  });
} catch (error) {
  status.textContent = 'This device could not start WebGL. Try a browser with hardware acceleration enabled.';
  status.dataset.state = 'webgl-unavailable';
  console.error('Dariabandha WebGL initialization failed:', error);
}
