import * as THREE from 'three';
import './style.css';
import { createGameCoordinator } from './coordinator.js';

const root = document.querySelector('#game-root');
const status = document.querySelector('#game-status');
const game = createGameCoordinator();

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(root.clientWidth || window.innerWidth, 480, false);
  renderer.setClearColor(0x14221d, 1);
  root.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, (root.clientWidth || window.innerWidth) / 480, 0.1, 100);
  camera.position.set(0, 8, 14);
  camera.lookAt(0, 0, 0);

  status.textContent = `B2 Task 1 shell ready · Quick Match 4v4 · ${game.state.players.length} seats · human ${game.humanSeat} (${game.state.players[game.humanSeat].role}) · tick ${game.state.tick}`;

  let previousTimestamp;
  function frame(timestamp) {
    const deltaSeconds = previousTimestamp === undefined ? 0 : (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;
    game.advanceFrame(Math.max(0, deltaSeconds));
    renderer.render(scene, camera);
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
  window.addEventListener('resize', () => {
    const width = root.clientWidth || window.innerWidth;
    renderer.setSize(width, 480, false);
    camera.aspect = width / 480;
    camera.updateProjectionMatrix();
  });
} catch (error) {
  status.textContent = 'This device could not start WebGL. Try a browser with hardware acceleration enabled.';
  status.dataset.state = 'webgl-unavailable';
  console.error('Dariabandha WebGL initialization failed:', error);
}
