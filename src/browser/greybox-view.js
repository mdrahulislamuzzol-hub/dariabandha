import {
  ATTACKER_CAPSULE_HEIGHT_METRES,
  ATTACKER_CAPSULE_RADIUS_METRES,
  STAMINA_CAPACITY,
} from '../rules/constants.js';
import { createCourt } from '../rules/court.js';

/** B1 metre coordinates are centred on court width and translated so its
 * front end is at z=-length/2. One world unit equals one metre; y is up. */
export const metresToWorld = (x, z, courtLengthMetres) => ({ x, y: 0, z: z - courtLengthMetres / 2 });

function worldPoint(x, z, court) {
  return metresToWorld(x, z, court.lengthMetres);
}

/** Plain geometry manifest keeps the B1/render boundary independently testable. */
export function describeCourtGeometry(court) {
  const lineSpecs = [...court.rowLines, ...court.endLines, ...court.sideLines];
  const lines = lineSpecs.map((entry) => {
    const start = entry.axis === 'z'
      ? worldPoint(entry.minAlong, entry.centre, court)
      : worldPoint(entry.centre, entry.minAlong, court);
    const end = entry.axis === 'z'
      ? worldPoint(entry.maxAlong, entry.centre, court)
      : worldPoint(entry.centre, entry.maxAlong, court);
    return { id: entry.id, axis: entry.axis, halfWidth: entry.halfWidth, start, end };
  });
  return {
    format: court.format,
    widthMetres: court.widthMetres,
    lengthMetres: court.lengthMetres,
    ground: {
      min: worldPoint(court.bounds.xMin, court.bounds.zMin, court),
      max: worldPoint(court.bounds.xMax, court.bounds.zMax, court),
    },
    lines,
    laneStrips: court.laneStrips.map(({ id, xMin, xMax, zMin, zMax }) => ({
      id,
      min: worldPoint(xMin, zMin, court),
      max: worldPoint(xMax, zMax, court),
    })),
    spine: {
      id: court.spineGeometry.id,
      min: worldPoint(court.spineGeometry.xMin, court.spineGeometry.zMin, court),
      max: worldPoint(court.spineGeometry.xMax, court.spineGeometry.zMax, court),
    },
  };
}

export function describeActors(state) {
  return state.players.map((player) => ({
    seat: player.seat,
    team: player.team,
    controller: player.controller,
    role: player.role,
    state: player.state,
    stamina: player.stamina,
    position: metresToWorld(player.position.x, player.position.z, state.court.lengthMetres),
    facing: { ...player.facing },
  }));
}

export function interpolateActor(previous, current, alpha) {
  const t = Math.max(0, Math.min(1, alpha));
  return {
    seat: current.seat,
    position: {
      x: previous.position.x + (current.position.x - previous.position.x) * t,
      z: previous.position.z + (current.position.z - previous.position.z) * t,
    },
    facing: {
      x: previous.facing.x + (current.facing.x - previous.facing.x) * t,
      z: previous.facing.z + (current.facing.z - previous.facing.z) * t,
    },
  };
}

const TEAM_COLORS = [0x42c9a1, 0xf0a34a];

function makeBox(THREE, width, height, depth, material, parent, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function makeCourt(THREE, scene, court, geometry) {
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x244c3a, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(geometry.widthMetres, geometry.lengthMetres), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -court.lengthMetres / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xd7ca82, transparent: true, opacity: 0.13, depthWrite: false });
  for (const lane of geometry.laneStrips) {
    const width = lane.max.x - lane.min.x;
    const length = lane.max.z - lane.min.z;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length), laneMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((lane.min.x + lane.max.x) / 2, 0.012, (lane.min.z + lane.max.z) / 2);
    scene.add(mesh);
  }
  const spineMaterial = new THREE.MeshBasicMaterial({ color: 0x72aede, transparent: true, opacity: 0.12, depthWrite: false });
  const spine = new THREE.Mesh(new THREE.PlaneGeometry(geometry.spine.max.x - geometry.spine.min.x, geometry.spine.max.z - geometry.spine.min.z), spineMaterial);
  spine.rotation.x = -Math.PI / 2;
  spine.position.set((geometry.spine.min.x + geometry.spine.max.x) / 2, 0.015, (geometry.spine.min.z + geometry.spine.max.z) / 2);
  scene.add(spine);

  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f0d0, roughness: 0.8 });
  for (const line of geometry.lines) {
    const length = Math.hypot(line.end.x - line.start.x, line.end.z - line.start.z);
    const alongZ = line.axis === 'x';
    const lineWidth = line.halfWidth * 2;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(alongZ ? lineWidth : length, 0.025, alongZ ? length : lineWidth),
      lineMaterial,
    );
    mesh.position.set((line.start.x + line.end.x) / 2, 0.025, (line.start.z + line.end.z) / 2);
    scene.add(mesh);
  }
}

function makeActor(THREE, scene, actor) {
  const group = new THREE.Group();
  group.userData = { seat: actor.seat, team: actor.team, controller: actor.controller, role: actor.role };
  const teamMaterial = new THREE.MeshStandardMaterial({ color: TEAM_COLORS[actor.team], roughness: 0.62 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x183026, roughness: 0.8 });
  const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xf5e8a5, emissive: 0x40350e });
  const radius = ATTACKER_CAPSULE_RADIUS_METRES;
  const height = ATTACKER_CAPSULE_HEIGHT_METRES;
  const shaftHeight = Math.max(0.2, height - 2 * radius);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, shaftHeight, 12), teamMaterial);
  body.position.y = radius + shaftHeight / 2;
  group.add(body);
  const lower = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), teamMaterial);
  lower.position.y = radius;
  group.add(lower);
  const upper = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), teamMaterial);
  upper.position.y = radius + shaftHeight;
  group.add(upper);
  // Team emblem: a triangular tetrahedron for team 0, a square plate for team 1.
  const emblem = new THREE.Mesh(
    actor.team === 0 ? new THREE.TetrahedronGeometry(0.16) : new THREE.BoxGeometry(0.22, 0.12, 0.22),
    darkMaterial,
  );
  emblem.position.set(0, height + 0.22, 0);
  group.add(emblem);
  // Controller marker is shape-coded: human = octahedron, inactive AI = cube.
  const controllerMark = new THREE.Mesh(
    actor.controller === 'human' ? new THREE.OctahedronGeometry(0.15) : new THREE.BoxGeometry(0.15, 0.15, 0.15),
    markerMaterial,
  );
  controllerMark.position.set(0, height + 0.52, 0);
  group.add(controllerMark);
  // Role marker: attacker = sphere, guard = cone, Sikka = ring.
  const roleMarkers = {
    attacker: new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), markerMaterial),
    guard: new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 6), markerMaterial),
    sikka: new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 12), markerMaterial),
  };
  for (const [role, roleMark] of Object.entries(roleMarkers)) {
    roleMark.position.set(0.2, height + 0.23, 0);
    roleMark.visible = role === actor.role;
    if (role === 'guard') roleMark.rotation.x = Math.PI;
    group.add(roleMark);
  }
  // State ring and a B1 stamina meter (present only for players with stamina).
  const stateRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius + 0.08, 0.025, 5, 20),
    new THREE.MeshBasicMaterial({ color: actor.state === 'active' ? 0x8cda78 : 0xb2b2b2 }),
  );
  stateRing.rotation.x = Math.PI / 2;
  stateRing.position.y = 0.045;
  group.add(stateRing);
  let staminaFill;
  if (actor.stamina !== null) {
    const background = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.055, 0.04), new THREE.MeshBasicMaterial({ color: 0x382821 }));
    background.position.set(0, height + 0.78, 0);
    group.add(background);
    staminaFill = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.035, 0.045), new THREE.MeshBasicMaterial({ color: 0x9be27f }));
    staminaFill.position.set(0, height + 0.78, 0.025);
    group.add(staminaFill);
  }
  scene.add(group);
  group.userData.staminaFill = staminaFill;
  group.userData.stateRing = stateRing;
  group.userData.roleMarkers = roleMarkers;
  return group;
}

export function createGreyboxView(THREE, initialState) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14221d);
  const court = initialState.court ?? createCourt('4v4');
  const geometry = describeCourtGeometry(court);
  makeCourt(THREE, scene, court, geometry);
  scene.add(new THREE.HemisphereLight(0xe9f3e8, 0x25372d, 2.0));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(-4, 10, 5);
  scene.add(keyLight);
  const actors = new Map(describeActors(initialState).map((actor) => [actor.seat, makeActor(THREE, scene, actor)]));
  return {
    scene,
    courtGeometry: geometry,
    actors,
    update(state, previousState = state, alpha = 1) {
      const previousBySeat = new Map(describeActors(previousState).map((actor) => [actor.seat, actor]));
      for (const actor of describeActors(state)) {
        const group = actors.get(actor.seat);
        const prior = previousBySeat.get(actor.seat) ?? actor;
        const blended = interpolateActor(prior, actor, alpha);
        group.position.set(blended.position.x, 0, blended.position.z);
        group.rotation.y = Math.atan2(blended.facing.x, blended.facing.z);
        group.userData.role = actor.role;
        group.userData.controller = actor.controller;
        group.userData.state = actor.state;
        group.userData.stamina = actor.stamina;
        for (const [role, marker] of Object.entries(group.userData.roleMarkers)) marker.visible = role === actor.role;
        group.userData.staminaFill?.scale.setX(Math.max(0.001, actor.stamina / STAMINA_CAPACITY));
        group.userData.staminaFill?.position.setX(-0.22 + 0.22 * (actor.stamina / STAMINA_CAPACITY));
        group.userData.stateRing.material.color.set(actor.state === 'active' ? 0x8cda78 : 0xb2b2b2);
      }
    },
  };
}
