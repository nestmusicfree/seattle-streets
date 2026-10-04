import * as THREE from 'three';
import { mat, denimTexture, seattleDecal } from './materials.js';

function pivot(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

function addMesh(geo, material, parent, x, y, z) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function cap(r, len) {
  return new THREE.CapsuleGeometry(r, len, 6, 12);
}

function shadow(parent, radius = 0.34) {
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 20),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.2, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.025;
  parent.add(blob);
}

function makeRig({
  hipY = 0.92,
  thigh = 0.4,
  shin = 0.38,
  thighR = 0.075,
  shoulderY = 1.42,
  shoulderW = 0.2,
  upperArm = 0.28,
  foreArm = 0.26,
  armR = 0.05,
  headR = 0.115,
  skinMat,
}) {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);
  shadow(root);

  const legGeo = cap(thighR, thigh);
  const shinGeo = cap(thighR * 0.86, shin);
  const legL = pivot(rig, -0.09, hipY, 0);
  addMesh(legGeo, skinMat, legL, 0, -(thigh * 0.5 + thighR * 0.15), 0);
  const kneeL = pivot(legL, 0, -(thigh + thighR * 0.2), 0);
  addMesh(shinGeo, skinMat, kneeL, 0, -(shin * 0.5), 0);

  const legR = pivot(rig, 0.09, hipY, 0);
  addMesh(legGeo, skinMat, legR, 0, -(thigh * 0.5 + thighR * 0.15), 0);
  const kneeR = pivot(legR, 0, -(thigh + thighR * 0.2), 0);
  addMesh(shinGeo, skinMat, kneeR, 0, -(shin * 0.5), 0);

  const torso = addMesh(cap(0.15, 0.34), skinMat, rig, 0, hipY + 0.28, 0);
  const armGeo = cap(armR, upperArm);
  const foreGeo = cap(armR * 0.88, foreArm);
  const armL = pivot(rig, -shoulderW, shoulderY, 0);
  armL.rotation.z = 0.16;
  addMesh(armGeo, skinMat, armL, 0, -(upperArm * 0.5 + armR * 0.1), 0);
  const elbowL = pivot(armL, 0, -(upperArm + armR * 0.15), 0);
  addMesh(foreGeo, skinMat, elbowL, 0, -(foreArm * 0.5), 0);

  const armRgt = pivot(rig, shoulderW, shoulderY, 0);
  armRgt.rotation.z = -0.16;
  addMesh(armGeo, skinMat, armRgt, 0, -(upperArm * 0.5 + armR * 0.1), 0);
  const elbowR = pivot(armRgt, 0, -(upperArm + armR * 0.15), 0);
  addMesh(foreGeo, skinMat, elbowR, 0, -(foreArm * 0.5), 0);

  const headY = shoulderY + headR + 0.08;
  const head = addMesh(new THREE.SphereGeometry(headR, 20, 16), skinMat, rig, 0, headY, 0.01);
  head.scale.set(1, 1.08, 0.96);

  root.userData.parts = {
    rig, torso, head,
    legL, legR, kneeL, kneeR,
    armL, armR: armRgt, elbowL, elbowR,
    phase: Math.random() * Math.PI * 2,
    hipY, shoulderY, headY, headR,
    restZL: 0.16, restZR: -0.16,
    handY: -(foreArm + armR),
  };
  root.userData.emote = null;
  root.userData.emoteT = 0;
  root.userData.stun = 0;
  root.userData.punch = 0;
  return root;
}

function face(head, headR, hairMat, beard = false) {
  const eyeW = mat('#f4f1ea', 0.4);
  const pupil = mat('#1a120e', 0.3);
  const brow = hairMat;
  addMesh(new THREE.SphereGeometry(0.016, 8, 8), eyeW, head, -0.038, 0.02, headR * 0.86);
  addMesh(new THREE.SphereGeometry(0.016, 8, 8), eyeW, head, 0.038, 0.02, headR * 0.86);
  addMesh(new THREE.SphereGeometry(0.01, 8, 8), pupil, head, -0.038, 0.018, headR * 0.98);
  addMesh(new THREE.SphereGeometry(0.01, 8, 8), pupil, head, 0.038, 0.018, headR * 0.98);
  addMesh(new THREE.BoxGeometry(0.04, 0.01, 0.012), brow, head, -0.04, 0.05, headR * 0.9);
  addMesh(new THREE.BoxGeometry(0.04, 0.01, 0.012), brow, head, 0.04, 0.05, headR * 0.9);
  const nose = addMesh(new THREE.SphereGeometry(0.018, 8, 8), head.material, head, 0, -0.01, headR * 0.98);
  nose.scale.set(0.8, 1.1, 1.2);
  if (beard) {
    const scruff = addMesh(new THREE.SphereGeometry(0.055, 12, 10), hairMat, head, 0, -0.07, 0.04);
    scruff.scale.set(1.05, 0.7, 0.75);
  }
}

function logoPlane(map, w, h) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
}

export function animateHuman(root, dt, speed) {
  const p = root.userData.parts;
  p.phase += dt * (2.2 + Math.min(speed, 6) * 1.2);
  const swing = Math.min(1, speed / 1.2);
  const s = Math.sin(p.phase);
  p.rig.rotation.x = 0;
  p.rig.rotation.z = 0;
  p.rig.scale.set(1, 1, 1);
  if (p.chest) p.chest.scale.y = 1;
  p.armL.rotation.z = p.restZL;
  p.armR.rotation.z = p.restZR;
  p.elbowL.rotation.x = 0;
  p.elbowR.rotation.x = 0;

  if (root.userData.stun > 0) {
    root.userData.stun -= dt;
    p.rig.rotation.x = 0.9;
    p.rig.position.y = -0.42;
    p.legL.rotation.x = 0.2;
    p.legR.rotation.x = -0.15;
    p.kneeL.rotation.x = 0.4;
    p.kneeR.rotation.x = 0.3;
    p.armL.rotation.x = 0.4;
    p.armR.rotation.x = -0.2;
    return;
  }

  const emote = root.userData.emote;
  if (emote) {
    root.userData.emoteT += dt;
    const t = root.userData.emoteT;
    p.rig.position.y = 0;
    if (emote === 'wave') {
      p.armR.rotation.x = -2.5;
      p.armR.rotation.z = -0.35 + Math.sin(t * 8) * 0.45;
      p.elbowR.rotation.x = -0.4;
      p.legL.rotation.x = 0;
      p.legR.rotation.x = 0;
      p.kneeL.rotation.x = 0;
      p.kneeR.rotation.x = 0;
    } else if (emote === 'dance') {
      const d = Math.sin(t * 7);
      p.rig.rotation.z = d * 0.18;
      p.rig.position.y = Math.abs(d) * 0.06;
      p.armL.rotation.x = -2.2;
      p.armR.rotation.x = -2.2;
      p.armL.rotation.z = 0.5;
      p.armR.rotation.z = -0.5;
      p.elbowL.rotation.x = -0.7;
      p.elbowR.rotation.x = -0.7;
      p.legL.rotation.x = d * 0.35;
      p.legR.rotation.x = -d * 0.35;
      p.kneeL.rotation.x = 0.25;
      p.kneeR.rotation.x = 0.25;
    } else if (emote === 'laugh') {
      p.rig.rotation.x = -0.18 + Math.sin(t * 12) * 0.06;
      p.armL.rotation.x = -0.7;
      p.armR.rotation.x = -0.7;
      p.elbowL.rotation.x = -1.2;
      p.elbowR.rotation.x = -1.2;
      p.legL.rotation.x = 0.05;
      p.legR.rotation.x = 0.05;
      p.kneeL.rotation.x = 0.1;
      p.kneeR.rotation.x = 0.1;
    } else if (emote === 'sit') {
      p.rig.position.y = -0.42;
      p.legL.rotation.x = -1.35;
      p.legR.rotation.x = -1.35;
      p.kneeL.rotation.x = 1.45;
      p.kneeR.rotation.x = 1.45;
      p.armL.rotation.x = -0.35;
      p.armR.rotation.x = -0.35;
      p.elbowL.rotation.x = -0.5;
      p.elbowR.rotation.x = -0.5;
    }
    if (p.cloak) p.cloak.rotation.x = 0.06;
    return;
  }

  p.legL.rotation.x = s * 0.85 * swing;
  p.legR.rotation.x = -s * 0.85 * swing;
  p.kneeL.rotation.x = Math.max(0, -s) * 0.9 * swing;
  p.kneeR.rotation.x = Math.max(0, s) * 0.9 * swing;
  // Arms hang at rest and swing opposite the legs while moving.
  p.armL.rotation.x = -s * 1.05 * swing;
  p.armR.rotation.x = s * 1.05 * swing;
  p.elbowL.rotation.x = -0.12 - Math.max(0, s) * 0.45 * swing;
  p.elbowR.rotation.x = -0.12 - Math.max(0, -s) * 0.45 * swing;
  p.rig.position.y = Math.abs(s) * 0.04 * swing;
  if (swing < 0.05 && root.userData.punch <= 0) {
    const b = Math.sin(p.phase * 0.9);
    p.rig.position.y = b * 0.012;
    if (p.chest) p.chest.scale.y = 1 + b * 0.025;
  } else if (p.chest) {
    p.chest.scale.y = 1;
  }
  if (root.userData.punch > 0) {
    root.userData.punch -= dt;
    const u = 1 - root.userData.punch / 0.32;
    p.armR.rotation.x = -0.3 - Math.sin(u * Math.PI) * 1.7;
    p.elbowR.rotation.x = -0.2;
    p.armR.rotation.z = -0.1;
  }
  if (p.cloak) p.cloak.rotation.x = 0.08 + Math.sin(p.phase * 0.5) * 0.04 * Math.max(swing, 0.3);
}


export function makePlayer() {
  const skinMat = mat('#c4845a', 0.78, 0);
  const root = makeRig({
    skinMat,
    hipY: 0.9,
    thigh: 0.4,
    shin: 0.36,
    shoulderY: 1.38,
    shoulderW: 0.2,
    upperArm: 0.28,
    foreArm: 0.24,
    armR: 0.046,
    headR: 0.145,
  });
  const p = root.userData.parts;
  p.restZL = 0.08;
  p.restZR = -0.08;
  p.armL.rotation.z = 0.08;
  p.armR.rotation.z = -0.08;
  for (const part of [p.legL, p.legR, p.kneeL, p.kneeR, p.armL, p.armR, p.elbowL, p.elbowR]) {
    const skin = part.children.find((c) => c.isMesh);
    if (skin) skin.visible = false;
  }
  p.torso.visible = false;

  const sweater = mat('#141414', 0.9, 0.02);
  const jean = new THREE.MeshStandardMaterial({ map: denimTexture(), roughness: 0.82 });
  const shoe = mat('#c8c9cb', 0.55, 0.08);
  const sole = mat('#2e2e2e', 0.7);
  const hair = mat('#1a120e', 0.72);
  const faceMap = new THREE.TextureLoader().load('/player-face.png');
  faceMap.colorSpace = THREE.SRGBColorSpace;
  faceMap.anisotropy = 8;

  const torsoGeo = new THREE.LatheGeometry([
    new THREE.Vector2(0.12, 0),
    new THREE.Vector2(0.155, 0.1),
    new THREE.Vector2(0.17, 0.26),
    new THREE.Vector2(0.19, 0.4),
    new THREE.Vector2(0.13, 0.5),
  ], 18);
  const chest = addMesh(torsoGeo, sweater, p.rig, 0, p.hipY, 0);
  p.chest = chest;
  addMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 12), sweater, p.rig, 0, p.shoulderY + 0.02, 0);
  for (const x of [-0.16, 0.16]) {
    const shoulder = addMesh(new THREE.SphereGeometry(0.075, 14, 10), sweater, p.rig, x, p.shoulderY, 0);
    shoulder.scale.set(1.15, 0.75, 0.9);
  }
  const logo = logoPlane(seattleDecal(), 0.38, 0.2);
  logo.position.set(0, p.hipY + 0.3, 0.24);
  p.rig.add(logo);

  const sleeve = new THREE.CylinderGeometry(0.055, 0.046, 0.28, 12);
  const forearm = new THREE.CylinderGeometry(0.046, 0.04, 0.24, 12);
  addMesh(sleeve, sweater, p.armL, 0, -0.15, 0);
  addMesh(sleeve, sweater, p.armR, 0, -0.15, 0);
  addMesh(forearm, sweater, p.elbowL, 0, -0.13, 0);
  addMesh(forearm, sweater, p.elbowR, 0, -0.13, 0);
  addMesh(new THREE.SphereGeometry(0.046, 12, 10), skinMat, p.elbowL, 0, -0.26, 0.01);
  addMesh(new THREE.SphereGeometry(0.046, 12, 10), skinMat, p.elbowR, 0, -0.26, 0.01);

  const thigh = new THREE.CylinderGeometry(0.095, 0.072, 0.4, 14);
  const shin = new THREE.CylinderGeometry(0.072, 0.055, 0.34, 14);
  addMesh(thigh, jean, p.legL, 0, -0.2, 0);
  addMesh(thigh, jean, p.legR, 0, -0.2, 0);
  addMesh(shin, jean, p.kneeL, 0, -0.17, 0);
  addMesh(shin, jean, p.kneeR, 0, -0.17, 0);
  for (const knee of [p.kneeL, p.kneeR]) {
    addMesh(new THREE.BoxGeometry(0.11, 0.07, 0.22), shoe, knee, 0, -0.36, 0.04);
    addMesh(new THREE.BoxGeometry(0.12, 0.025, 0.24), sole, knee, 0, -0.4, 0.045);
  }

  p.head.material = hair;
  p.head.scale.set(1.02, 1.12, 0.95);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(p.headR * 1.7, p.headR * 2.2),
    new THREE.MeshBasicMaterial({
      map: faceMap,
      transparent: true,
      alphaTest: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    }),
  );
  // Sit on the outside of the hair sphere so the photo is not buried inside it.
  face.position.set(0, -0.01, p.headR + 0.012);
  face.renderOrder = 2;
  p.head.add(face);

  root.userData.kind = 'player';
  return root;
}

export function makeBandit(variant = 0) {
  const skinMat = mat('#c47a48', 0.8);
  const root = makeRig({
    skinMat,
    hipY: 0.78,
    thigh: 0.3,
    shin: 0.26,
    thighR: 0.095,
    shoulderY: 1.22,
    shoulderW: 0.24,
    upperArm: 0.22,
    foreArm: 0.2,
    armR: 0.065,
    headR: 0.14,
  });
  const p = root.userData.parts;
  p.restZL = 0.28;
  p.restZR = -0.28;
  p.armL.rotation.z = 0.28;
  p.armR.rotation.z = -0.28;
  const shirt = mat('#f3ecdf', 0.88);
  const overall = mat(variant % 2 ? '#3c6496' : '#2c5284', 0.75);
  const bandana = mat('#c7362a', 0.65);
  const boot = mat('#5b3a22', 0.72);
  const hair = mat(variant === 2 ? '#e18432' : '#ef6420', 0.65);
  const sack = mat('#6d4b2c', 0.86);

  p.torso.visible = false;
  addMesh(cap(0.24, 0.32), overall, p.rig, 0, p.hipY + 0.26, 0.02);
  addMesh(cap(0.16, 0.12), shirt, p.rig, 0, p.shoulderY - 0.02, 0.02);
  const scarf = addMesh(new THREE.TorusGeometry(0.13, 0.035, 8, 16), bandana, p.rig, 0, p.shoulderY + 0.02, 0.03);
  scarf.rotation.x = Math.PI / 2;
  addMesh(new THREE.SphereGeometry(0.055, 10, 8), mat('#e8edf2', 0.35, 0.45), p.rig, 0.1, p.hipY + 0.32, 0.2);

  addMesh(cap(0.075, 0.18), shirt, p.armL, 0, -0.1, 0);
  addMesh(cap(0.075, 0.18), shirt, p.armR, 0, -0.1, 0);
  addMesh(cap(0.1, 0.26), overall, p.legL, 0, -0.16, 0);
  addMesh(cap(0.1, 0.26), overall, p.legR, 0, -0.16, 0);
  addMesh(cap(0.085, 0.2), overall, p.kneeL, 0, -0.12, 0);
  addMesh(cap(0.085, 0.2), overall, p.kneeR, 0, -0.12, 0);
  for (const knee of [p.kneeL, p.kneeR]) {
    addMesh(new THREE.BoxGeometry(0.15, 0.09, 0.22), boot, knee, 0, -0.28, 0.03);
  }

  addMesh(new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, p.head, 0, 0.05, -0.02);
  for (const x of [-0.07, 0, 0.07]) {
    addMesh(new THREE.ConeGeometry(0.04, 0.13, 8), hair, p.head, x, 0.16, -0.01);
  }
  face(p.head, p.headR, hair, false);
  addMesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), mat('#f7f7f7'), p.head, 0, -0.055, p.headR * 0.95);

  const pack = addMesh(new THREE.SphereGeometry(0.16, 14, 12), sack, p.rig, 0, p.shoulderY - 0.02, -0.28);
  pack.scale.set(1, 1.2, 0.8);
  addMesh(new THREE.SphereGeometry(0.05, 8, 8), mat('#161616'), p.rig, -0.05, p.shoulderY + 0.04, -0.36);
  addMesh(new THREE.SphereGeometry(0.045, 8, 8), mat('#111'), p.rig, 0.06, p.shoulderY - 0.01, -0.38);
  if (variant === 1) {
    const hat = mat('#8a5a32', 0.8);
    addMesh(new THREE.CylinderGeometry(0.1, 0.11, 0.09, 12), hat, p.head, 0, 0.16, 0);
    addMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 14), hat, p.head, 0, 0.11, 0);
  }
  root.userData.kind = 'bandit';
  return root;
}

export function makeWanderer(variant = 0) {
  const skinMat = mat('#c4845a', 0.8);
  const root = makeRig({ skinMat, shoulderW: 0.19, headR: 0.11 });
  const p = root.userData.parts;
  const cloakCol = ['#1b5836', '#164832', '#21633c'][variant % 3];
  const cloak = mat(cloakCol, 0.86);
  const cloakDark = mat('#102e20', 0.9);
  const tunic = mat('#173628', 0.84);
  const leather = mat('#6a4324', 0.6, 0.08);
  const leatherDark = mat('#4a3018', 0.7);
  const gold = mat('#e0bc62', 0.28, 0.82);
  const armor = mat('#9aa18c', 0.4, 0.4);
  const boot = mat('#5a3a22', 0.7);
  const hair = mat('#24160f', 0.8);

  p.torso.visible = false;
  addMesh(cap(0.17, 0.46), tunic, p.rig, 0, p.hipY + 0.28, 0.02);
  const cloakPivot = pivot(p.rig, 0, p.shoulderY + 0.04, -0.06);
  p.cloak = cloakPivot;
  const panel = new THREE.Shape();
  panel.moveTo(-0.26, 0);
  panel.lineTo(0.26, 0);
  panel.quadraticCurveTo(0.5, -0.6, 0.42, -1.25);
  panel.lineTo(-0.42, -1.25);
  panel.quadraticCurveTo(-0.5, -0.6, -0.26, 0);
  const cloakGeo = new THREE.ExtrudeGeometry(panel, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
  const cloakMesh = new THREE.Mesh(cloakGeo, cloak);
  cloakMesh.castShadow = true;
  cloakPivot.add(cloakMesh);
  addMesh(new THREE.BoxGeometry(0.08, 1.05, 0.03), cloakDark, cloakPivot, -0.2, -0.58, 0.12);
  addMesh(new THREE.BoxGeometry(0.08, 1.05, 0.03), cloakDark, cloakPivot, 0.2, -0.58, 0.12);

  addMesh(new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.7), cloak, p.head, 0, 0.04, -0.04);
  const cowl = addMesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), cloakDark, p.head, 0, -0.01, 0.03);
  cowl.rotation.x = Math.PI / 2.3;

  for (const side of [-1, 1]) {
    const pad = addMesh(new THREE.SphereGeometry(0.08, 14, 10), armor, p.rig, side * 0.22, p.shoulderY + 0.02, 0.01);
    pad.scale.set(1.35, 0.62, 1.15);
    const ring = addMesh(new THREE.TorusGeometry(0.07, 0.012, 6, 14), gold, p.rig, side * 0.23, p.shoulderY + 0.01, 0.04);
    ring.rotation.y = Math.PI / 2;
  }

  for (const arm of [p.armL, p.armR]) {
    addMesh(cap(0.055, 0.2), tunic, arm, 0, -0.12, 0);
  }
  for (const elbow of [p.elbowL, p.elbowR]) {
    addMesh(new THREE.CylinderGeometry(0.048, 0.055, 0.14, 12), leather, elbow, 0, -0.12, 0);
    addMesh(new THREE.CylinderGeometry(0.058, 0.058, 0.018, 12), gold, elbow, 0, -0.06, 0);
    addMesh(new THREE.CylinderGeometry(0.056, 0.056, 0.016, 12), gold, elbow, 0, -0.18, 0);
    addMesh(new THREE.SphereGeometry(0.04, 8, 8), leatherDark, elbow, 0, -0.28, 0);
  }

  const belt = addMesh(new THREE.TorusGeometry(0.16, 0.026, 8, 18), leather, p.rig, 0, p.hipY + 0.1, 0);
  belt.rotation.x = Math.PI / 2;
  addMesh(new THREE.BoxGeometry(0.045, 0.045, 0.02), gold, p.rig, 0, p.hipY + 0.1, 0.17);
  addMesh(new THREE.BoxGeometry(0.09, 0.11, 0.05), leatherDark, p.rig, -0.14, p.hipY + 0.02, 0.12);
  addMesh(new THREE.BoxGeometry(0.08, 0.09, 0.045), leather, p.rig, 0.14, p.hipY, 0.11);

  addMesh(cap(0.08, 0.34), tunic, p.legL, 0, -0.2, 0);
  addMesh(cap(0.08, 0.34), tunic, p.legR, 0, -0.2, 0);
  for (const knee of [p.kneeL, p.kneeR]) {
    addMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.34, 12), boot, knee, 0, -0.18, 0.02);
    addMesh(new THREE.BoxGeometry(0.11, 0.05, 0.18), boot, knee, 0, -0.36, 0.05);
    const band = addMesh(new THREE.TorusGeometry(0.065, 0.01, 6, 12), gold, knee, 0, -0.06, 0.02);
    band.rotation.x = Math.PI / 2;
  }

  face(p.head, p.headR, hair, false);
  addMesh(new THREE.SphereGeometry(0.06, 10, 8), hair, p.head, 0, -0.02, 0.01);
  root.userData.kind = 'wanderer';
  return root;
}
