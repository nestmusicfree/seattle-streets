import * as THREE from 'three';

const cache = new Map();

export function mat(color, roughness = 0.72, metalness = 0.02, extras = {}) {
  const key = JSON.stringify({ color, roughness, metalness, extras });
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    ...extras,
  });
  cache.set(key, m);
  return m;
}

export function texMaterial(texture, roughness = 0.9, metalness = 0) {
  return new THREE.MeshStandardMaterial({ map: texture, roughness, metalness });
}

export function noiseTexture(base, fleck, count = 900, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    g.globalAlpha = 0.08 + Math.random() * 0.22;
    g.fillStyle = fleck;
    const s = 1 + Math.random() * 2.5;
    g.fillRect(Math.random() * size, Math.random() * size, s, s);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function seattleDecal() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 512);
  g.fillStyle = '#ffffff';
  g.strokeStyle = '#111111';
  g.lineJoin = 'round';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '800 210px Arial Black, Impact, sans-serif';
  g.lineWidth = 18;
  g.strokeText('SEATTLE', 512, 170);
  g.fillText('SEATTLE', 512, 170);
  g.font = '700 150px Arial Black, Impact, sans-serif';
  g.lineWidth = 14;
  g.strokeText('1834', 512, 360);
  g.fillText('1834', 512, 360);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function paintedWall(hex) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = hex;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = Math.random() > 0.55 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function wallMat(hex, rx = 2, ry = 2) {
  const map = paintedWall(hex);
  map.repeat.set(rx, ry);
  return new THREE.MeshStandardMaterial({ map, roughness: 0.88, metalness: 0.02 });
}

export function woodPlanks(hex = '#6e4b32') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = hex;
  g.fillRect(0, 0, 128, 256);
  g.strokeStyle = 'rgba(0,0,0,0.28)';
  for (let x = 0; x < 128; x += 18) {
    g.strokeRect(x, 0, 16, 256);
    g.fillStyle = 'rgba(255,255,255,0.04)';
    g.fillRect(x + 2, 0, 4, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function denimTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#7fa6cc';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(40,70,110,0.45)';
  for (let i = -128; i < 256; i += 6) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 128, 128);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function tileTexture(mortar = '#c46a48') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = mortar;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(70,30,18,0.55)';
  g.lineWidth = 3;
  for (let row = 0; row < 5; row++) {
    const y = 8 + row * 24;
    const shift = row % 2 ? 16 : 0;
    for (let x = -16 + shift; x < 140; x += 32) {
      g.strokeRect(x, y, 28, 18);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(3, 2);
  return tex;
}

export function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const puff = (x, y, r) => {
    const grd = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  puff(100, 140, 70);
  puff(150, 120, 80);
  puff(190, 150, 60);
  puff(130, 160, 55);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function grassTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#5f9a45';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    g.strokeStyle = Math.random() > 0.5 ? '#3e7330' : '#8fce63';
    g.globalAlpha = 0.45 + Math.random() * 0.5;
    g.lineWidth = 1 + Math.random();
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() - 0.5) * 3, y - 4 - Math.random() * 6);
    g.stroke();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
