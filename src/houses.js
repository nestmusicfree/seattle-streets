import * as THREE from 'three';
import { mat, tileTexture, wallMat, woodPlanks } from './materials.js';

const cream = wallMat('#f4efe6', 3, 2);
const creamTrim = mat('#e4d3b8', 0.85);
const stone = wallMat('#c9b79a', 2, 2);
const wood = mat('#7a4e2d', 0.75);
const woodDark = mat('#5a3a24', 0.8);
const glass = mat('#c5e4ef', 0.15, 0.05, { transparent: true, opacity: 0.55 });
const glow = mat('#ffe0ad', 0.45, 0.0, { emissive: '#ffb45a', emissiveIntensity: 1.25 });
const frame = mat('#3d342c', 0.7);
const roofRed = mat('#a24b34', 0.8);
const roofGrey = mat('#6d675f', 0.85);
const roofDark = mat('#2c3138', 0.7, 0.15);
const plaster = wallMat('#e6d7c4', 3, 2);
const stoneGrey = wallMat('#4c535c', 2, 2);
const charcoal = mat('#3a3f46', 0.55, 0.2);
const slat = mat('#6b4a30', 0.8);
const hedgeMat = mat('#3f7a45', 0.9);
const water = mat('#3d8eb5', 0.15, 0.1, { transparent: true, opacity: 0.8 });
const metal = mat('#c5ccd4', 0.3, 0.7);
const solar = mat('#1d4e89', 0.35, 0.4, { emissive: '#163e78', emissiveIntensity: 0.25 });

function M(parent, geo, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function windows(parent, cols, rows, x0, y0, z, gapX, gapY, w = 0.7, h = 0.9, glowMat = glow) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * gapX;
      const y = y0 + r * gapY;
      M(parent, new THREE.BoxGeometry(w, h, 0.08), frame, x, y, z);
      M(parent, new THREE.BoxGeometry(w * 0.82, h * 0.82, 0.04), glowMat, x, y, z + 0.03);
      M(parent, new THREE.BoxGeometry(0.04, h * 0.82, 0.05), frame, x, y, z + 0.045);
      M(parent, new THREE.BoxGeometry(w * 0.82, 0.04, 0.05), frame, x, y, z + 0.045);
      M(parent, new THREE.BoxGeometry(w + 0.08, 0.06, 0.1), frame, x, y - h * 0.52, z);
    }
  }
}

function roofGeo(w, d, rise) {
  const hw = w / 2;
  const hd = d / 2;
  const ridgeL = [-hw, rise, 0];
  const ridgeR = [hw, rise, 0];
  const fL = [-hw, 0, hd];
  const fR = [hw, 0, hd];
  const bL = [-hw, 0, -hd];
  const bR = [hw, 0, -hd];
  const pos = [];
  const norm = [];
  const push = (a, b, c) => {
    pos.push(...a, ...b, ...c);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    norm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  };
  push(fL, fR, ridgeR); push(fL, ridgeR, ridgeL);
  push(bR, bL, ridgeL); push(bR, ridgeL, ridgeR);
  push(fL, ridgeL, bL); push(ridgeR, fR, bR);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  return geo;
}

const tiles = tileTexture();
function pitched(color) {
  return new THREE.MeshStandardMaterial({ color, map: tiles, roughness: 0.82, side: THREE.DoubleSide });
}
const roofRedMat = pitched('#b85032');
const roofGreyMat = pitched('#6d675f');
const roofDarkMat = pitched('#3c4148');
const roofMudMat = pitched('#8d5a32');

function gable(parent, w, d, ridgeY, matRoof, rise = 1.55) {
  const mesh = new THREE.Mesh(roofGeo(w, d, rise), matRoof);
  mesh.position.y = ridgeY - rise;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  M(parent, new THREE.BoxGeometry(w + 0.15, 0.08, 0.18), matRoof, 0, ridgeY + 0.02, 0);
  M(parent, new THREE.BoxGeometry(w, 0.12, 0.16), mat('#efe8dc', 0.8), 0, ridgeY - rise + 0.02, d / 2);
  M(parent, new THREE.BoxGeometry(w, 0.12, 0.16), mat('#efe8dc', 0.8), 0, ridgeY - rise + 0.02, -d / 2);
}

function creamVilla(g) {
  M(g, new THREE.BoxGeometry(11, 0.3, 8), stone, 0, 0.15, 0);
  M(g, new THREE.BoxGeometry(10.4, 3.1, 7.4), cream, 0, 1.9, 0);
  M(g, new THREE.BoxGeometry(6.2, 2.6, 6.6), cream, -1.2, 4.2, -0.2);
  M(g, new THREE.BoxGeometry(10.8, 0.18, 7.8), creamTrim, 0, 3.5, 0);
  M(g, new THREE.BoxGeometry(6.6, 0.18, 7), creamTrim, -1.2, 5.55, -0.2);
  M(g, new THREE.BoxGeometry(1.1, 2.1, 0.12), wood, 0, 1.2, 3.76);
  M(g, new THREE.BoxGeometry(2.4, 0.12, 1.1), creamTrim, 0, 2.35, 4.15);
  for (let i = 0; i < 4; i++) M(g, new THREE.BoxGeometry(2.2, 0.08, 0.08), mat('#d5dde2', 0.3, 0.4), 2.4, 1.15 + i * 0.18, 4.05);
  M(g, new THREE.BoxGeometry(3.6, 0.14, 1.6), creamTrim, 2.1, 3.52, 4.35);
  for (const x of [0.7, 2.1, 3.5]) {
    M(g, new THREE.BoxGeometry(0.06, 0.9, 0.06), mat('#d5dde4', 0.3, 0.5), x, 4.05, 5.05);
  }
  M(g, new THREE.BoxGeometry(3.2, 0.06, 0.06), mat('#d5dde4', 0.3, 0.5), 2.1, 4.45, 5.05);
  M(g, new THREE.BoxGeometry(11.6, 0.28, 8.4), mat('#d9c7a4', 0.8), 0, 3.55, 0.15);
  windows(g, 2, 1, -2.6, 1.7, 3.75, 1.5, 1);
  windows(g, 2, 1, -2.4, 4.3, 3.15, 1.5, 1, 0.65, 0.85);
  M(g, new THREE.BoxGeometry(3.4, 0.25, 1.6), stone, 0, 0.2, 4.3);
  g.userData.footprint = { w: 11.2, d: 9.2 };
}

function greyModern(g) {
  M(g, new THREE.BoxGeometry(12, 0.25, 8.2), stoneGrey, 0, 0.12, 0);
  M(g, new THREE.BoxGeometry(11.4, 2.8, 7.4), stoneGrey, 0, 1.6, 0);
  M(g, new THREE.BoxGeometry(7.2, 2.5, 6.8), mat('#8e8a82', 0.7), 1.4, 4.15, -0.1);
  M(g, new THREE.BoxGeometry(1.4, 5.2, 7.2), charcoal, -4.6, 2.7, 0);
  M(g, new THREE.BoxGeometry(0.12, 4.6, 6.4), slat, -4.5, 2.7, 0);
  M(g, new THREE.BoxGeometry(4.2, 0.12, 2.2), charcoal, -1.5, 3.05, 2.8);
  for (let i = 0; i < 5; i++) M(g, new THREE.BoxGeometry(3.6, 0.05, 0.06), mat('#dfe7ee', 0.3, 0.5), -1.5, 2.4 + i * 0.12, 3.7);
  windows(g, 3, 1, -1.2, 1.6, 3.75, 1.3, 1, 0.85, 1.05);
  windows(g, 2, 1, 1.2, 4.2, 3.35, 1.4, 1, 0.8, 1);
  M(g, new THREE.BoxGeometry(1.2, 2.2, 0.1), woodDark, 3.6, 1.25, 3.76);
  g.userData.footprint = { w: 12.2, d: 8.6 };
}

function duskVilla(g) {
  M(g, new THREE.BoxGeometry(12, 0.3, 8.5), plaster, 0, 0.15, 0);
  M(g, new THREE.BoxGeometry(11.2, 2.7, 7.6), plaster, 0, 1.65, 0);
  M(g, new THREE.BoxGeometry(8.4, 2.4, 6.6), plaster, 0.4, 4.05, -0.2);
  gable(g, 9.6, 7.6, 5.7, roofDarkMat, 1.7);
  M(g, new THREE.BoxGeometry(0.35, 2.6, 6.8), slat, -4.4, 4.0, 0);
  M(g, new THREE.BoxGeometry(0.35, 2.6, 6.8), slat, 4.6, 1.6, 0);
  M(g, new THREE.BoxGeometry(4.6, 0.12, 1.8), charcoal, -2.2, 3.05, 3.1);
  windows(g, 3, 1, -1.5, 1.55, 3.85, 1.35, 1, 0.9, 1.15, mat('#ffd7a1', 0.4, 0, { emissive: '#ff9a3c', emissiveIntensity: 0.9 }));
  windows(g, 2, 1, 0.2, 4.15, 3.15, 1.5, 1, 0.95, 1.05, mat('#ffd7a1', 0.4, 0, { emissive: '#ff9a3c', emissiveIntensity: 0.9 }));
  M(g, new THREE.BoxGeometry(1.15, 2.15, 0.1), wood, 3.5, 1.25, 3.86);
  // carport
  M(g, new THREE.BoxGeometry(4.2, 0.16, 4.4), charcoal, 7.2, 2.7, 0.4);
  M(g, new THREE.BoxGeometry(0.2, 2.6, 0.2), charcoal, 5.4, 1.4, 2.3);
  M(g, new THREE.BoxGeometry(0.2, 2.6, 0.2), charcoal, 8.9, 1.4, 2.3);
  g.userData.footprint = { w: 14.5, d: 9.2 };
}

function pool(g) {
  M(g, new THREE.BoxGeometry(5.2, 0.25, 3.2), mat('#d7d2c8'), 0, 0.12, 0);
  M(g, new THREE.BoxGeometry(4.6, 0.18, 2.6), water, 0, 0.22, 0);
  g.userData.footprint = { w: 5.2, d: 3.2 };
}

function glassVilla(g) {
  M(g, new THREE.BoxGeometry(10.5, 0.35, 8), mat('#dedad4'), 0, 0.18, 0);
  M(g, new THREE.BoxGeometry(9.6, 2.8, 7.2), plaster, 0, 1.7, -0.2);
  M(g, new THREE.BoxGeometry(7.4, 0.25, 6.4), charcoal, 1.2, 3.3, 0.6);
  M(g, new THREE.BoxGeometry(6.6, 2.2, 5.2), glass, 1.4, 4.5, 0.5);
  M(g, new THREE.BoxGeometry(6.8, 0.16, 5.4), charcoal, 1.4, 5.65, 0.5);
  windows(g, 4, 1, -3.2, 1.7, 3.5, 1.15, 1, 0.8, 1.3);
  M(g, new THREE.BoxGeometry(1.3, 2.2, 0.1), woodDark, 3.8, 1.25, 3.46);
  g.userData.footprint = { w: 10.8, d: 8.4 };
}

function tharavad(g) {
  M(g, new THREE.BoxGeometry(12, 0.4, 8), mat('#efe6d4'), 0, 0.2, 0);
  M(g, new THREE.BoxGeometry(11, 2.8, 6.6), cream, 0, 1.8, 0);
  gable(g, 12.6, 8.8, 4.15, roofRedMat, 1.85);
  M(g, new THREE.BoxGeometry(8, 0.16, 2.2), woodDark, 0, 2.5, 3.5);
  for (const x of [-3.2, -1.1, 1.1, 3.2]) {
    M(g, new THREE.CylinderGeometry(0.12, 0.12, 2.3, 8), wood, x, 1.25, 4.2);
  }
  M(g, new THREE.BoxGeometry(1.3, 2.1, 0.1), woodDark, 0, 1.2, 3.36);
  windows(g, 4, 1, -3.6, 1.8, 3.35, 1.7, 1, 0.7, 1.05);
  g.userData.footprint = { w: 12.4, d: 9 };
}

function colonial(g) {
  M(g, new THREE.BoxGeometry(11, 0.35, 7.5), plaster, 0, 0.18, 0);
  M(g, new THREE.BoxGeometry(10.4, 3.1, 6.8), plaster, 0, 1.85, 0);
  gable(g, 11.6, 8.0, 4.2, roofGreyMat, 1.6);
  M(g, new THREE.BoxGeometry(7.2, 0.14, 2), plaster, 0, 2.55, 3.3);
  for (const x of [-2.6, -0.9, 0.9, 2.6]) {
    M(g, new THREE.CylinderGeometry(0.1, 0.12, 2.4, 8), plaster, x, 1.3, 4);
  }
  M(g, new THREE.BoxGeometry(1.2, 2.15, 0.1), wood, 0, 1.2, 3.46);
  windows(g, 4, 1, -3.3, 1.9, 3.45, 1.6, 1, 0.65, 1);
  M(g, new THREE.BoxGeometry(0.35, 0.7, 0.35), stone, -3.6, 4.3, 0.4);
  g.userData.footprint = { w: 11.2, d: 8.2 };
}

function mudHouse(g) {
  const wall = wallMat('#c4a06a', 2, 2);
  M(g, new THREE.BoxGeometry(6.2, 2.4, 5), wall, 0, 1.2, 0);
  gable(g, 7.0, 5.8, 3.05, roofMudMat, 1.25);
  M(g, new THREE.BoxGeometry(0.9, 1.7, 0.1), woodDark, 0, 0.95, 2.55);
  windows(g, 2, 1, -1.5, 1.35, 2.55, 3, 1, 0.6, 0.7, mat('#f0d7a4', 0.5, 0, { emissive: '#e7a85a', emissiveIntensity: 0.35 }));
  g.userData.footprint = { w: 6.6, d: 5.4 };
}

function cabin(g) {
  const wall = new THREE.MeshStandardMaterial({ map: woodPlanks('#6b4630'), roughness: 0.86 });
  wall.map.repeat.set(2, 2);
  M(g, new THREE.BoxGeometry(6.4, 2.6, 5.2), wall, 0, 1.3, 0);
  gable(g, 7.2, 6.0, 3.35, roofDarkMat, 1.45);
  M(g, new THREE.BoxGeometry(0.16, 2.4, 4.6), mat('#3e2a1c'), -3.15, 1.4, 0);
  M(g, new THREE.BoxGeometry(0.9, 1.9, 0.1), woodDark, 0.8, 1.05, 2.66);
  windows(g, 2, 1, -1.6, 1.5, 2.66, 1.5, 1, 0.6, 0.75);
  g.userData.footprint = { w: 6.8, d: 5.6 };
}

function futurePod(g) {
  M(g, new THREE.BoxGeometry(6.6, 2.3, 6.2), metal, 0, 1.25, 0);
  M(g, new THREE.BoxGeometry(5.4, 1.8, 5.2), metal, 0, 3.2, 0);
  M(g, new THREE.BoxGeometry(5.2, 0.12, 4.6), solar, 0, 4.2, 0);
  M(g, new THREE.BoxGeometry(5.0, 0.02, 0.06), mat('#d6e6f5', 0.4, 0.3), 0, 4.28, 0);
  M(g, new THREE.CylinderGeometry(0.4, 0.5, 2.2, 12), mat('#9aa3ad', 0.35, 0.6), -2.6, 1.2, 2.4);
  windows(g, 2, 1, -0.8, 1.3, 3.15, 1.8, 1, 1.1, 1.1, mat('#b9e7ff', 0.2, 0.1, { emissive: '#7fd0ff', emissiveIntensity: 0.4 }));
  windows(g, 2, 1, -0.7, 3.2, 2.65, 1.6, 1, 0.9, 0.8, mat('#b9e7ff', 0.2, 0.1, { emissive: '#7fd0ff', emissiveIntensity: 0.35 }));
  g.userData.footprint = { w: 7, d: 6.6 };
}

function minimal(g) {
  const wall = mat('#5c4636', 0.82);
  M(g, new THREE.BoxGeometry(6.2, 2.8, 4.8), wall, 0, 1.4, 0);
  M(g, new THREE.BoxGeometry(6.6, 0.16, 5.2), roofDark, 0, 2.9, 0);
  M(g, new THREE.BoxGeometry(0.9, 2, 0.1), mat('#d8d2c8'), 1.6, 1.1, 2.46);
  windows(g, 2, 2, -1.6, 1.15, 2.46, 1.3, 1.15, 0.7, 0.7);
  g.userData.footprint = { w: 6.6, d: 5.2 };
}

const builders = {
  cream: creamVilla,
  grey: greyModern,
  dusk: duskVilla,
  glass: glassVilla,
  tharavad,
  colonial,
  mud: mudHouse,
  cabin,
  future: futurePod,
  minimal,
  pool,
};

function addYard(g) {
  const { w, d } = g.userData.footprint;
  const wall = mat('#e7dfd0', 0.9);
  const cap = mat('#c4b49a', 0.85);
  const hw = w / 2 + 0.35;
  const hd = d / 2 + 0.35;
  M(g, new THREE.BoxGeometry(w + 0.7, 0.5, 0.14), wall, 0, 0.28, -hd);
  M(g, new THREE.BoxGeometry(w + 0.7, 0.08, 0.18), cap, 0, 0.54, -hd);
  M(g, new THREE.BoxGeometry(0.14, 0.5, d * 0.72), wall, -hw, 0.28, -0.4);
  M(g, new THREE.BoxGeometry(0.14, 0.5, d * 0.72), wall, hw, 0.28, -0.4);
  M(g, new THREE.BoxGeometry(2.4, 0.14, 1.2), mat('#d7cfc0'), 0, 0.1, d / 2 + 0.15);
  g.userData.footprint = { w: w + 0.8, d: d + 0.5 };
}

export function buildHouse(type) {
  const g = new THREE.Group();
  (builders[type] || cabin)(g);
  if (!g.userData.footprint) g.userData.footprint = { w: 8, d: 7 };
  if (type !== 'pool') addYard(g);
  return g;
}

export function makeTree(scale = 1) {
  const g = new THREE.Group();
  const s = Math.min(scale, 1) * 0.78;
  const trunk = mat('#6a4630', 0.9);
  const leaves = [mat('#2f6d38', 0.9), mat('#3f8a48', 0.88), mat('#246332', 0.9)];
  M(g, new THREE.CylinderGeometry(0.07 * s, 0.11 * s, 1.35 * s, 8), trunk, 0, 0.68 * s, 0);
  const puffs = [[0, 1.55, 0, 0.42], [0.28, 1.4, 0.12, 0.32], [-0.26, 1.38, -0.08, 0.3], [0.05, 1.75, -0.18, 0.28], [-0.08, 1.62, 0.22, 0.26]];
  puffs.forEach(([x, y, z, r], i) => {
    const puff = M(g, new THREE.IcosahedronGeometry(r * s, 1), leaves[i % 3], x * s, y * s, z * s);
    puff.castShadow = true;
  });
  return g;
}

export function makeHedge(len) {
  const g = new THREE.Group();
  M(g, new THREE.BoxGeometry(len, 0.7, 0.45), hedgeMat, 0, 0.35, 0);
  return g;
}
