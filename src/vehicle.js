import * as THREE from 'three';
import { mat } from './materials.js';

export function makeSUV(color = '#1a1c1f') {
  const root = new THREE.Group();
  const body = mat(color, 0.38, 0.62);
  const trim = mat('#c5c8cc', 0.4, 0.55);
  const glass = mat('#9fd4e4', 0.08, 0.15, { transparent: true, opacity: 0.45 });
  const black = mat('#111214', 0.7, 0.1);
  const lamp = mat('#f4f1e4', 0.3, 0.1, { emissive: '#fff4d2', emissiveIntensity: 0.7 });
  const tail = new THREE.MeshStandardMaterial({ color: '#8c1d1d', roughness: 0.4, metalness: 0.1, emissive: '#ff2a2a', emissiveIntensity: 0.45 });
  const tire = mat('#1a1a1a', 0.9, 0.0);
  const rim = mat('#b9bcc0', 0.35, 0.7);

  const add = (geo, material, x, y, z) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  // Body faces +Z. Length ~4.7, width ~1.9, tall upright cabin.
  add(new THREE.BoxGeometry(1.84, 0.55, 4.35), body, 0, 0.72, 0);
  add(new THREE.BoxGeometry(1.78, 0.62, 2.15), body, 0, 1.22, -0.15);
  add(new THREE.BoxGeometry(1.7, 0.12, 1.55), body, 0, 0.95, 1.15);
  add(new THREE.BoxGeometry(1.88, 0.08, 4.5), black, 0, 0.46, 0);
  add(new THREE.BoxGeometry(1.9, 0.06, 4.2), trim, 0, 1.52, -0.1);

  const hood = add(new THREE.BoxGeometry(1.68, 0.18, 1.25), body, 0, 1.02, 1.25);
  hood.rotation.x = -0.28;
  add(new THREE.BoxGeometry(1.86, 0.16, 0.9), body, 0, 0.78, -1.85);
  for (const [x, z] of [[-0.95, 1.38], [0.95, 1.38], [-0.95, -1.38], [0.95, -1.38]]) {
    const arch = add(new THREE.TorusGeometry(0.42, 0.055, 8, 16, Math.PI), body, x, 0.38, z);
    arch.rotation.y = Math.PI / 2;
  }
  add(new THREE.BoxGeometry(0.05, 0.06, 1.7), trim, -0.55, 1.62, -0.2);
  add(new THREE.BoxGeometry(0.05, 0.06, 1.7), trim, 0.55, 1.62, -0.2);
  add(new THREE.BoxGeometry(0.04, 0.06, 0.7), trim, 0, 1.62, -0.85);
  add(new THREE.BoxGeometry(0.04, 0.06, 0.7), trim, 0, 1.62, 0.45);
  add(new THREE.BoxGeometry(0.05, 0.36, 1.2), glass, 0.9, 1.26, -0.15);
  add(new THREE.BoxGeometry(0.05, 0.36, 1.2), glass, -0.9, 1.26, -0.15);
  add(new THREE.BoxGeometry(0.02, 0.5, 0.025), black, 0.93, 0.86, 0.4);
  add(new THREE.BoxGeometry(0.02, 0.5, 0.025), black, -0.93, 0.86, 0.4);
  add(new THREE.BoxGeometry(1.55, 0.04, 0.04), black, 0, 1.05, 0.95);

  // Glass cabin.
  add(new THREE.BoxGeometry(1.62, 0.42, 1.7), glass, 0, 1.28, -0.12);
  add(new THREE.BoxGeometry(1.5, 0.28, 0.04), glass, 0, 1.18, 0.95);
  add(new THREE.BoxGeometry(1.5, 0.32, 0.04), glass, 0, 1.22, -1.25);

  // Upright grille and lamps. No brand badge.
  add(new THREE.BoxGeometry(0.72, 0.38, 0.06), black, 0, 0.78, 2.18);
  for (let i = -2; i <= 2; i++) {
    add(new THREE.BoxGeometry(0.58, 0.025, 0.04), trim, 0, 0.78 + i * 0.06, 2.21);
  }
  add(new THREE.BoxGeometry(0.22, 0.1, 0.05), lamp, -0.62, 0.8, 2.18);
  add(new THREE.BoxGeometry(0.22, 0.1, 0.05), lamp, 0.62, 0.8, 2.18);
  add(new THREE.BoxGeometry(0.16, 0.06, 0.04), lamp, -0.7, 0.62, 2.16);
  add(new THREE.BoxGeometry(0.16, 0.06, 0.04), lamp, 0.7, 0.62, 2.16);
  const tailL = add(new THREE.BoxGeometry(0.22, 0.12, 0.05), tail, -0.62, 0.86, -2.18);
  const tailR = add(new THREE.BoxGeometry(0.22, 0.12, 0.05), tail, 0.62, 0.86, -2.18);
  add(new THREE.BoxGeometry(1.2, 0.08, 0.05), trim, 0, 0.58, -2.16);
  add(new THREE.BoxGeometry(1.5, 0.06, 0.08), trim, 0, 0.5, 2.16);

  // Side steps and mirrors.
  add(new THREE.BoxGeometry(0.08, 0.06, 1.6), trim, 0.94, 0.55, 0.1);
  add(new THREE.BoxGeometry(0.08, 0.06, 1.6), trim, -0.94, 0.55, 0.1);
  add(new THREE.BoxGeometry(0.08, 0.08, 0.16), black, 0.96, 1.15, 0.55);
  add(new THREE.BoxGeometry(0.08, 0.08, 0.16), black, -0.96, 1.15, 0.55);

  const wheels = [];
  const spots = [
    [-0.82, 0.36, 1.38],
    [0.82, 0.36, 1.38],
    [-0.82, 0.36, -1.38],
    [0.82, 0.36, -1.38],
  ];
  for (const [x, y, z] of spots) {
    const steer = new THREE.Group();
    steer.position.set(x, y, z);
    const spin = new THREE.Group();
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16), tire);
    w.rotation.z = Math.PI / 2;
    w.castShadow = true;
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.27, 16), rim);
    r.rotation.z = Math.PI / 2;
    spin.add(w, r);
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.04), rim);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.y = (i / 5) * Math.PI;
      spin.add(spoke);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), rim);
    hub.rotation.z = Math.PI / 2;
    spin.add(hub);
    steer.add(spin);
    root.add(steer);
    wheels.push({ steer, spin, front: z > 0 });
  }

  root.userData.wheels = wheels;
  root.userData.tailL = tailL;
  root.userData.tailR = tailR;
  root.userData.half = { x: 0.98, z: 2.35 };
  return root;
}
