import * as THREE from 'three';
import { mat, noiseTexture, texMaterial, grassTexture } from './materials.js';
import { buildHouse, makeTree, makeHedge } from './houses.js';

export const ROADS = [-54, -18, 18, 54];
const ROAD_W = 9;
const INSET = ROAD_W / 2 + 1.35;

export function blockLoop(i, j) {
  const xa = ROADS[i] + INSET;
  const xb = ROADS[i + 1] - INSET;
  const za = ROADS[j] + INSET;
  const zb = ROADS[j + 1] - INSET;
  return [[xa, za], [xb, za], [xb, zb], [xa, zb]];
}

function addBox(parent, w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.receiveShadow = true;
  m.castShadow = h > 0.3;
  parent.add(m);
  return m;
}

function place(scene, colliders, type, x, z, rot) {
  const h = buildHouse(type);
  h.position.set(x, 0, z);
  h.rotation.y = rot;
  scene.add(h);
  const { w, d } = h.userData.footprint;
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  const hw = (w * c + d * s) / 2;
  const hd = (w * s + d * c) / 2;
  colliders.push({ minx: x - hw, maxx: x + hw, minz: z - hd, maxz: z + hd });
  return h;
}

export function buildWorld(scene) {
  const colliders = [];
  const grassTex = grassTexture();
  grassTex.repeat.set(48, 48);
  const asphaltTex = noiseTexture('#3a3d42', '#2a2c30', 700);
  asphaltTex.repeat.set(18, 18);
  const walkTex = noiseTexture('#d9d3c8', '#b7b1a6', 600);
  walkTex.repeat.set(8, 8);

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    texMaterial(grassTex, 1, 0),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  const roadMat = texMaterial(asphaltTex, 0.95, 0.02);
  const walkMat = texMaterial(walkTex, 0.92, 0);
  const curb = mat('#c8c3ba', 0.9);
  const stripe = mat('#f2f2f0', 0.8);
  const span = 150;

  for (const z of ROADS) {
    addBox(scene, span, 0.06, ROAD_W, roadMat, 0, 0.03, z);
    addBox(scene, span, 0.1, 1.7, walkMat, 0, 0.08, z + ROAD_W / 2 + 0.95);
    addBox(scene, span, 0.1, 1.7, walkMat, 0, 0.08, z - ROAD_W / 2 - 0.95);
    addBox(scene, span, 0.12, 0.18, curb, 0, 0.06, z + ROAD_W / 2 + 0.08);
    addBox(scene, span, 0.12, 0.18, curb, 0, 0.06, z - ROAD_W / 2 - 0.08);
  }
  for (const x of ROADS) {
    addBox(scene, ROAD_W, 0.07, span, roadMat, x, 0.045, 0);
    addBox(scene, 1.7, 0.11, span, walkMat, x + ROAD_W / 2 + 0.95, 0.09, 0);
    addBox(scene, 1.7, 0.11, span, walkMat, x - ROAD_W / 2 - 0.95, 0.09, 0);
  }

  // Crosswalks at the inner intersections.
  for (const x of [-18, 18]) {
    for (const z of [-18, 18]) {
      for (let i = -3; i <= 3; i++) {
        addBox(scene, 0.28, 0.02, 2.2, stripe, x + i * 0.7, 0.09, z + 6.2);
        addBox(scene, 2.2, 0.02, 0.28, stripe, x + 6.2, 0.09, z + i * 0.7);
      }
    }
  }

  // Lots. Center block is the park.
  const lots = [
    ['cream', -36, -36, Math.PI],
    ['grey', 0, -36, Math.PI],
    ['dusk', 36, -34, Math.PI],
    ['glass', -36, 0, Math.PI],
    ['tharavad', 36, 0, 0],
    ['colonial', -36, 36, 0],
    ['mud', -4, 36, 0],
    ['cabin', 8, 38, 0],
    ['future', 32, 36, 0],
    ['minimal', 42, 34, 0],
  ];
  for (const [type, x, z, rot] of lots) place(scene, colliders, type, x, z, rot);
  place(scene, colliders, 'pool', 36, -26.2, 0);

  // Yard hedges and trees.
  const hedge = (x, z, len, rot) => {
    const h = makeHedge(len);
    h.position.set(x, 0, z);
    h.rotation.y = rot;
    scene.add(h);
  };
  hedge(-36, -28, 8, 0);
  hedge(0, -28.5, 9, 0);
  hedge(-30, 0, 6, Math.PI / 2);
  hedge(30, 6, 7, Math.PI / 2);

  const treeSpots = [
    [-28, -30, 0.9], [-42, -28, 0.75], [6, -30, 0.85], [-8, -42, 0.8],
    [28, -30, 0.9], [44, -40, 0.8], [-44, -6, 0.85], [-28, 6, 0.75],
    [28, 8, 0.9], [44, 6, 0.8], [-44, 30, 0.85], [-28, 42, 0.75],
    [4, 44, 0.7], [22, 42, 0.85], [48, 42, 0.8],
  ];
  for (const [x, z, s] of treeSpots) {
    const t = makeTree(s);
    t.position.set(x, 0, z);
    scene.add(t);
  }

  // Central park: fountain plus a ring of trees inside the sidewalk loop.
  const basin = mat('#d9d4cc', 0.7);
  const water = mat('#3c92b8', 0.12, 0.15, { transparent: true, opacity: 0.82 });
  addBox(scene, 3.4, 0.45, 3.4, basin, 0, 0.28, 0);
  addBox(scene, 2.6, 0.2, 2.6, water, 0, 0.5, 0);
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.9, 8), mat('#cfd8df', 0.3, 0.2));
  jet.position.set(0, 0.9, 0);
  jet.castShadow = true;
  scene.add(jet);
  colliders.push({ minx: -1.9, maxx: 1.9, minz: -1.9, maxz: 1.9 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const t = makeTree(0.85);
    t.position.set(Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6);
    scene.add(t);
  }

  const dash = mat('#e6e2d6', 0.8);
  for (const z of ROADS) {
    for (let x = -68; x <= 68; x += 4.2) {
      if (ROADS.some((r) => Math.abs(x - r) < 5)) continue;
      addBox(scene, 1.4, 0.02, 0.12, dash, x, 0.09, z);
    }
  }
  for (const x of ROADS) {
    for (let z = -68; z <= 68; z += 4.2) {
      if (ROADS.some((r) => Math.abs(z - r) < 5)) continue;
      addBox(scene, 0.12, 0.02, 1.4, dash, x, 0.095, z);
    }
  }

  const poleMat = mat('#2c3138', 0.45, 0.45);
  const lampMat = mat('#fff6d8', 0.3, 0.05, { emissive: '#ffe1a3', emissiveIntensity: 1.4 });
  for (const x of [-36, 0, 36]) {
    for (const z of [-24.5, -11.5, 11.5, 24.5]) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 8), poleMat);
      base.position.y = 0.06;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.1, 8), poleMat);
      pole.position.y = 1.6;
      pole.castShadow = true;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.05), poleMat);
      arm.position.set(0.22, 3.15, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.18), lampMat);
      head.position.set(0.42, 3.05, 0);
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#fff3c4' }),
      );
      glow.position.set(0.42, 2.96, 0);
      g.add(base, pole, arm, head, glow);
      g.position.set(x, 0, z);
      scene.add(g);
    }
  }

  // Keep the player inside the neighborhood.
  colliders.push({ minx: -80, maxx: 80, minz: -80, maxz: -72 });
  colliders.push({ minx: -80, maxx: 80, minz: 72, maxz: 80 });
  colliders.push({ minx: -80, maxx: -72, minz: -80, maxz: 80 });
  colliders.push({ minx: 72, maxx: 80, minz: -80, maxz: 80 });

  return { colliders };
}

export function blocked(colliders, x, z, radius) {
  for (const b of colliders) {
    const cx = Math.max(b.minx, Math.min(x, b.maxx));
    const cz = Math.max(b.minz, Math.min(z, b.maxz));
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

export function tryMove(colliders, pos, dx, dz, radius) {
  const nx = pos.x + dx;
  if (!blocked(colliders, nx, pos.z, radius)) pos.x = nx;
  const nz = pos.z + dz;
  if (!blocked(colliders, pos.x, nz, radius)) pos.z = nz;
}
