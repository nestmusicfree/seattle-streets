import * as THREE from 'three';
import { makePlayer, makeBandit, makeWanderer, animateHuman } from './characters.js';
import { makeSUV } from './vehicle.js';
import { buildWorld, blockLoop, tryMove } from './world.js';
import { cloudTexture } from './materials.js';

const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.insertBefore(renderer.domElement, stage.firstChild);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#7ecbff');
scene.fog = new THREE.Fog('#b9def8', 70, 210);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(380, 24, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color('#2f8fe8') },
      horizon: { value: new THREE.Color('#d7f0ff') },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 horizon; void main(){ float h = clamp(vP.y / 380.0 * 0.5 + 0.45, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, smoothstep(0.0, 1.0, h)), 1.0); }',
  }),
);
scene.add(sky);

const cloudMat = new THREE.MeshBasicMaterial({ map: cloudTexture(), transparent: true, depthWrite: false });
const clouds = [];
for (let i = 0; i < 14; i++) {
  const c = new THREE.Mesh(new THREE.PlaneGeometry(18 + (i % 4) * 6, 8 + (i % 3) * 2), cloudMat);
  c.position.set(-80 + (i % 7) * 28, 28 + (i % 3) * 4, -60 + Math.floor(i / 7) * 40);
  c.lookAt(0, 20, 0);
  scene.add(c);
  clouds.push(c);
}

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 500);
const sun = new THREE.DirectionalLight('#fffaf0', 2.15);
sun.position.set(40, 80, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 180;
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight('#cfe7ff', '#8aaa62', 0.85));
scene.add(new THREE.AmbientLight('#ffffff', 0.28));

const world = buildWorld(scene);
const player = makePlayer();
player.position.set(0, 0, -7.2);
scene.add(player);

const settings = loadSettings();

const cam = { yaw: Math.PI * 0.75, pitch: 0.32 };
let vy = 0;
let mode = 'title';
let settingsFrom = 'title';
const EMOTE_NAMES = ['wave', 'dance', 'laugh', 'sit'];
const EMOTE_LABELS = ['Wave', 'Dance', 'Laugh', 'Sit'];
let emoteIndex = 0;

function spawnWalker(mesh, loop, speed, phase) {
  const points = loop.map(([x, z]) => new THREE.Vector3(x, 0, z));
  mesh.position.copy(points[phase % points.length]);
  scene.add(mesh);
  return { mesh, points, seg: phase % points.length, dist: 0, speed };
}

const npcs = [];
const park = blockLoop(1, 1);
npcs.push(spawnWalker(makeWanderer(0), park, 1.15, 0));
npcs.push(spawnWalker(makeWanderer(1), park, 0.95, 1));
npcs.push(spawnWalker(makeBandit(0), park, 1.25, 2));
npcs.push(spawnWalker(makeBandit(1), park, 1.05, 3));
npcs.push(spawnWalker(makeWanderer(2), blockLoop(1, 0), 1.05, 0));
npcs.push(spawnWalker(makeWanderer(0), blockLoop(2, 1), 1.2, 2));
npcs.push(spawnWalker(makeBandit(2), blockLoop(0, 1), 1.3, 1));
npcs.push(spawnWalker(makeBandit(0), blockLoop(1, 2), 1.1, 2));
npcs.push(spawnWalker(makeBandit(1), blockLoop(0, 0), 1.15, 0));
npcs.push(spawnWalker(makeBandit(2), blockLoop(2, 2), 1.2, 3));

function parkSUV(x, z, yaw, color) {
  const car = makeSUV(color);
  car.position.set(x, 0, z);
  car.rotation.y = yaw;
  scene.add(car);
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  const hx = 0.98 * c + 2.35 * s;
  const hz = 0.98 * s + 2.35 * c;
  world.colliders.push({ minx: x - hx, maxx: x + hx, minz: z - hz, maxz: z + hz });
  return car;
}
parkSUV(-30, -30, Math.PI, '#23262b');
parkSUV(8, -30, Math.PI / 2, '#141618');
parkSUV(44, -30, -Math.PI / 2, '#2a2e33');
parkSUV(-30, 30, 0, '#101214');

const driveCar = makeSUV('#121417');
driveCar.position.set(6.5, 0, -14.2);
driveCar.rotation.y = Math.PI / 2;
scene.add(driveCar);
const marker = new THREE.Mesh(
  new THREE.RingGeometry(1.7, 2.05, 28),
  new THREE.MeshBasicMaterial({ color: '#f0c14a', transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
);
marker.rotation.x = -Math.PI / 2;
marker.position.set(6.5, 0.12, -14.2);
scene.add(marker);

let driving = false;
let carSpeed = 0;
let steer = 0;
const keys = {};
const joy = { x: 0, y: 0, id: null };

const statusEl = document.getElementById('status');
const promptEl = document.getElementById('prompt');
const emoteEl = document.getElementById('emote-label');
const titleEl = document.getElementById('title-screen');
const settingsEl = document.getElementById('settings-screen');
const pauseEl = document.getElementById('pause-screen');

function showMenus() {
  titleEl.classList.toggle('hidden', mode !== 'title');
  settingsEl.classList.toggle('hidden', mode !== 'settings');
  pauseEl.classList.toggle('hidden', mode !== 'pause');
  const placing = mode === 'settings';
  if (!placing && document.body.classList.contains('placing')) applyButtonLayout();
  document.body.classList.toggle('placing', placing);
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('seattle-streets-settings') || '{}');
    return {
      music: saved.music ?? 0.35,
      sfx: saved.sfx ?? 0.8,
      camDist: saved.camDist ?? 4.6,
      shadows: saved.shadows ?? true,
    };
  } catch {
    return { music: 0.35, sfx: 0.8, camDist: 4.6, shadows: true };
  }
}
function saveSettings() {
  localStorage.setItem('seattle-streets-settings', JSON.stringify(settings));
}
function applySettings() {
  sun.castShadow = !!settings.shadows;
  renderer.shadowMap.enabled = !!settings.shadows;
  document.getElementById('set-music').value = String(Math.round(settings.music * 100));
  document.getElementById('set-sfx').value = String(Math.round(settings.sfx * 100));
  document.getElementById('set-cam').value = String(settings.camDist);
  document.getElementById('set-shadows').checked = !!settings.shadows;
  if (audio.music) audio.music.gain.value = settings.music * 0.08;
  if (audio.sfx) audio.sfx.gain.value = settings.sfx;
}

const audio = { ctx: null, music: null, sfx: null };
applySettings();
function ensureAudio() {
  if (audio.ctx) return;
  const ctx = new AudioContext();
  const music = ctx.createGain();
  const sfx = ctx.createGain();
  music.gain.value = settings.music * 0.08;
  sfx.gain.value = settings.sfx;
  music.connect(ctx.destination);
  sfx.connect(ctx.destination);
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc.type = 'sine';
  osc2.type = 'triangle';
  osc.frequency.value = 220;
  osc2.frequency.value = 277;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 640;
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(music);
  osc.start();
  osc2.start();
  audio.ctx = ctx;
  audio.music = music;
  audio.sfx = sfx;
}
function blip(freq = 520, dur = 0.08) {
  ensureAudio();
  const ctx = audio.ctx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  g.gain.value = 0.2;
  o.connect(g);
  g.connect(audio.sfx);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.stop(ctx.currentTime + dur);
}

function carForward(yaw) {
  return { x: Math.sin(yaw), z: Math.cos(yaw) };
}
function dynamicCarBox() {
  const yaw = driveCar.rotation.y;
  const c = Math.abs(Math.cos(yaw));
  const s = Math.abs(Math.sin(yaw));
  return {
    minx: driveCar.position.x - (1.05 * c + 2.45 * s),
    maxx: driveCar.position.x + (1.05 * c + 2.45 * s),
    minz: driveCar.position.z - (1.05 * s + 2.45 * c),
    maxz: driveCar.position.z + (1.05 * s + 2.45 * c),
  };
}
function toggleDrive() {
  if (mode !== 'play') return;
  const d = player.position.distanceTo(driveCar.position);
  if (!driving && d > 3.2) return;
  driving = !driving;
  player.visible = !driving;
  marker.visible = !driving;
  player.userData.emote = null;
  if (!driving) {
    const f = carForward(driveCar.rotation.y);
    player.position.set(driveCar.position.x - f.z * 1.8, 0, driveCar.position.z + f.x * 1.8);
    vy = 0;
    carSpeed = 0;
  }
  statusEl.textContent = driving ? 'Driving the black SUV' : 'On foot';
  blip(driving ? 360 : 240, 0.07);
}
function doPunch() {
  if (mode !== 'play' || driving) return;
  player.userData.punch = 0.32;
  player.userData.emote = null;
  blip(180, 0.06);
  for (const npc of npcs) {
    if (player.position.distanceTo(npc.mesh.position) < 1.8) npc.mesh.userData.stun = 1.7;
  }
}
function doEmote(index) {
  if (mode !== 'play' || driving) return;
  emoteIndex = index;
  const name = EMOTE_NAMES[index];
  const cur = player.userData.emote;
  player.userData.emote = cur === name ? null : name;
  player.userData.emoteT = 0;
  emoteEl.textContent = player.userData.emote ? EMOTE_LABELS[index] : '';
  emoteEl.classList.toggle('show', !!player.userData.emote);
  blip(640, 0.05);
}

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (mode === 'play' && (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD')) {
    player.userData.emote = null;
    emoteEl.classList.remove('show');
  }
  if (e.code === 'KeyF') toggleDrive();
  if (e.code === 'KeyJ') doPunch();
  if (e.code === 'Digit1') doEmote(0);
  if (e.code === 'Digit2') doEmote(1);
  if (e.code === 'Digit3') doEmote(2);
  if (e.code === 'Digit4') doEmote(3);
  if (e.code === 'Escape') {
    if (mode === 'play') { mode = 'pause'; document.exitPointerLock?.(); }
    else if (mode === 'pause') mode = 'play';
    else if (mode === 'settings') mode = settingsFrom;
    showMenus();
  }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });

renderer.domElement.addEventListener('click', () => {
  if (mode !== 'play') return;
  renderer.domElement.requestPointerLock?.();
});
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement || mode !== 'play') return;
  cam.yaw -= e.movementX * 0.0022;
  cam.pitch -= e.movementY * 0.0016;
  cam.pitch = Math.max(-0.25, Math.min(0.7, cam.pitch));
});

document.getElementById('btn-start').onclick = () => {
  ensureAudio();
  mode = 'play';
  showMenus();
};
document.getElementById('btn-open-settings').onclick = () => { settingsFrom = 'title'; mode = 'settings'; showMenus(); };
document.getElementById('btn-settings-back').onclick = () => { mode = settingsFrom; showMenus(); };
document.getElementById('btn-resume').onclick = () => { mode = 'play'; showMenus(); };
document.getElementById('btn-pause-settings').onclick = () => { settingsFrom = 'pause'; mode = 'settings'; showMenus(); };
document.getElementById('btn-main-menu').onclick = () => {
  mode = 'title';
  if (driving) toggleDrive();
  showMenus();
};
for (const id of ['set-music', 'set-sfx', 'set-cam', 'set-shadows']) {
  document.getElementById(id).addEventListener('input', () => {
    settings.music = Number(document.getElementById('set-music').value) / 100;
    settings.sfx = Number(document.getElementById('set-sfx').value) / 100;
    settings.camDist = Number(document.getElementById('set-cam').value);
    settings.shadows = document.getElementById('set-shadows').checked;
    ensureAudio();
    applySettings();
    saveSettings();
  });
}
const LAYOUT_KEY = 'worlds-frvr-buttons';
const actionEls = ['btn-punch', 'btn-emote', 'btn-vehicle'].map((id) => document.getElementById(id));
const doorPoint = new THREE.Vector3();

function clientToStage(clientX, clientY) {
  const stage = document.getElementById('stage');
  const rect = stage.getBoundingClientRect();
  if (window.innerHeight <= window.innerWidth) {
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return {
    x: (clientY - cy) + stage.clientWidth / 2,
    y: -(clientX - cx) + stage.clientHeight / 2,
  };
}

function applyButtonLayout() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null'); } catch { saved = null; }
  const stage = document.getElementById('stage');
  for (const el of actionEls) {
    const spot = saved && saved[el.id.replace('btn-', '')];
    if (spot) {
      el.style.left = `${spot.x * stage.clientWidth}px`;
      el.style.top = `${spot.y * stage.clientHeight}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    } else {
      el.style.left = '';
      el.style.top = '';
      el.style.right = '';
      el.style.bottom = '';
    }
  }
}

function readFractions() {
  const stage = document.getElementById('stage');
  const w = stage.clientWidth || 1;
  const h = stage.clientHeight || 1;
  const out = {};
  for (const el of actionEls) {
    out[el.id.replace('btn-', '')] = {
      x: Math.min(0.92, Math.max(0, el.offsetLeft / w)),
      y: Math.min(0.92, Math.max(0, el.offsetTop / h)),
    };
  }
  return out;
}

applyButtonLayout();
addEventListener('resize', applyButtonLayout);

let drag = null;
for (const el of actionEls) {
  el.addEventListener('pointerdown', (e) => {
    if (!document.body.classList.contains('placing')) return;
    e.preventDefault();
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    const local = clientToStage(e.clientX, e.clientY);
    drag = { el, pointer: e.pointerId, ox: local.x - el.offsetLeft, oy: local.y - el.offsetTop };
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || drag.el !== el || drag.pointer !== e.pointerId) return;
    const stage = document.getElementById('stage');
    const local = clientToStage(e.clientX, e.clientY);
    const x = Math.max(0, Math.min(stage.clientWidth - el.offsetWidth, local.x - drag.ox));
    const y = Math.max(0, Math.min(stage.clientHeight - el.offsetHeight, local.y - drag.oy));
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  });
  const endDrag = (e) => { if (drag && drag.pointer === e.pointerId) drag = null; };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
}

document.getElementById('btn-gear').onclick = () => {
  if (mode === 'settings') return;
  settingsFrom = mode === 'title' || mode === 'pause' ? mode : 'play';
  if (mode === 'play') document.exitPointerLock?.();
  mode = 'settings';
  showMenus();
};
document.getElementById('btn-layout-save').onclick = () => {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(readFractions()));
  const btn = document.getElementById('btn-layout-save');
  btn.textContent = 'Saved';
  setTimeout(() => { btn.textContent = 'Save'; }, 900);
};

document.getElementById('btn-punch').onclick = () => {
  if (document.body.classList.contains('placing')) return;
  doPunch();
};
document.getElementById('btn-emote').onclick = () => {
  if (document.body.classList.contains('placing')) return;
  doEmote((emoteIndex + (player.userData.emote ? 1 : 0)) % 4);
};
document.getElementById('btn-vehicle').onclick = () => {
  if (document.body.classList.contains('placing')) return;
  toggleDrive();
};

let contextDoor = null;
function nearestDoor() {
  let best = null;
  let bestD = 2.5;
  for (const door of world.doors) {
    doorPoint.set(door.userData.halfW, 0, 0.4);
    door.localToWorld(doorPoint);
    const dist = doorPoint.distanceTo(player.position);
    if (dist < bestD) { bestD = dist; best = door; }
  }
  return best ? { door: best, dist: bestD } : null;
}
function refreshContext() {
  const btn = document.getElementById('btn-context');
  const label = document.getElementById('ctx-label');
  contextDoor = null;
  if (!playing || mode !== 'play') {
    btn.classList.add('hidden');
    return;
  }
  if (driving) {
    btn.dataset.kind = 'exit';
    label.textContent = 'Exit';
    btn.classList.remove('hidden');
    return;
  }
  const carD = player.position.distanceTo(driveCar.position);
  const found = nearestDoor();
  if (found && (carD >= 3.2 || found.dist <= carD)) {
    contextDoor = found.door;
    const open = found.door.userData.open;
    btn.dataset.kind = open ? 'close' : 'open';
    label.textContent = open ? 'Close' : 'Open';
    btn.classList.remove('hidden');
  } else if (carD < 3.2) {
    btn.dataset.kind = 'getin';
    label.textContent = 'Get In';
    btn.classList.remove('hidden');
  } else {
    btn.classList.add('hidden');
  }
}
document.getElementById('btn-context').onclick = () => {
  const kind = document.getElementById('btn-context').dataset.kind;
  if (kind === 'getin' || kind === 'exit') toggleDrive();
  else if (contextDoor) {
    contextDoor.userData.open = !contextDoor.userData.open;
    blip(contextDoor.userData.open ? 520 : 300, 0.06);
  }
};

const stick = document.getElementById('joystick');
const knob = document.getElementById('knob');
function joyVector(e) {
  const rect = stick.getBoundingClientRect();
  let dx = e.clientX - (rect.left + rect.width / 2);
  let dy = e.clientY - (rect.top + rect.height / 2);
  if (window.innerHeight > window.innerWidth) {
    const sx = dx;
    dx = dy;
    dy = -sx;
  }
  const max = rect.width * 0.38;
  const mag = Math.hypot(dx, dy) || 1;
  const clamp = Math.min(mag, max);
  dx = (dx / mag) * clamp;
  dy = (dy / mag) * clamp;
  return { dx, dy, nx: dx / max, ny: dy / max };
}
function setKnob(dx, dy) {
  knob.style.left = `${40 + dx}px`;
  knob.style.top = `${40 + dy}px`;
}
stick.addEventListener('pointerdown', (e) => {
  joy.id = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  const v = joyVector(e);
  joy.x = v.nx;
  joy.y = v.ny;
  setKnob(v.dx, v.dy);
  player.userData.emote = null;
});
stick.addEventListener('pointermove', (e) => {
  if (e.pointerId !== joy.id) return;
  const v = joyVector(e);
  joy.x = v.nx;
  joy.y = v.ny;
  setKnob(v.dx, v.dy);
});
function endJoy(e) {
  if (e.pointerId !== joy.id) return;
  joy.id = null;
  joy.x = 0;
  joy.y = 0;
  setKnob(0, 0);
}
stick.addEventListener('pointerup', endJoy);
stick.addEventListener('pointercancel', endJoy);

function updateWalker(w, dt) {
  if (w.mesh.userData.stun > 0) {
    animateHuman(w.mesh, dt, 0);
    return;
  }
  const a = w.points[w.seg];
  let b = w.points[(w.seg + 1) % w.points.length];
  let delta = new THREE.Vector3().subVectors(b, a);
  let len = delta.length() || 1;
  w.dist += w.speed * dt;
  while (w.dist >= len) {
    w.dist -= len;
    w.seg = (w.seg + 1) % w.points.length;
    const a2 = w.points[w.seg];
    b = w.points[(w.seg + 1) % w.points.length];
    delta = new THREE.Vector3().subVectors(b, a2);
    len = delta.length() || 1;
  }
  const u = w.dist / len;
  const a3 = w.points[w.seg];
  b = w.points[(w.seg + 1) % w.points.length];
  w.mesh.position.lerpVectors(a3, b, u);
  w.mesh.rotation.y = Math.atan2(b.x - a3.x, b.z - a3.z);
  animateHuman(w.mesh, dt, w.speed);
}

function resize() {
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
resize();
addEventListener('resize', resize);
new ResizeObserver(resize).observe(stage);

const clock = new THREE.Clock();
const look = new THREE.Vector3();
const camPos = new THREE.Vector3();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const playing = mode === 'play';
  const forward = playing ? ((keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y) : 0;
  const strafe = playing ? ((keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x) : 0;
  const dist = settings.camDist;

  if (!driving) {
    const speed = (keys.ShiftLeft || keys.ShiftRight) ? 6.2 : 3.4;
    const fx = Math.sin(cam.yaw);
    const fz = Math.cos(cam.yaw);
    const rx = Math.cos(cam.yaw);
    const rz = -Math.sin(cam.yaw);
    const mx = fx * forward + rx * strafe;
    const mz = fz * forward + rz * strafe;
    const mag = Math.hypot(mx, mz) || 1;
    const moving = playing && (forward || strafe) && mag > 0.2;
    if (moving) {
      tryMove(world.colliders, player.position, (mx / mag) * speed * dt, (mz / mag) * speed * dt, 0.38);
      const hit = dynamicCarBox();
      const cx = Math.max(hit.minx, Math.min(player.position.x, hit.maxx));
      const cz = Math.max(hit.minz, Math.min(player.position.z, hit.maxz));
      if ((player.position.x - cx) ** 2 + (player.position.z - cz) ** 2 < 0.38 ** 2) {
        player.position.x -= (mx / mag) * speed * dt;
        player.position.z -= (mz / mag) * speed * dt;
      }
      player.rotation.y = Math.atan2(mx, mz);
      player.userData.emote = null;
    }
    if (playing) {
      const jump = keys.Space && player.position.y <= 0.001;
      vy = player.position.y > 0 || keys.Space ? vy - 22 * dt : 0;
      if (jump) { vy = 6.2; blip(700, 0.04); }
      player.position.y = Math.max(0, player.position.y + vy * dt);
    }
    animateHuman(player, dt, moving ? speed : 0);
    if (!playing) cam.yaw += dt * 0.08;
    look.set(player.position.x, player.position.y + 1.35, player.position.z);
    camPos.set(
      player.position.x - Math.sin(cam.yaw) * dist * Math.cos(cam.pitch),
      player.position.y + 1.55 + Math.sin(cam.pitch) * dist * 0.45,
      player.position.z - Math.cos(cam.yaw) * dist * Math.cos(cam.pitch),
    );
  } else if (playing) {
    const accel = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
    const turn = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - joy.x;
    carSpeed += accel * 12 * dt;
    carSpeed *= 1 - Math.min(1, 1.4 * dt);
    if (!accel) carSpeed *= 1 - Math.min(1, 2.2 * dt);
    carSpeed = Math.max(-5, Math.min(16, carSpeed));
    steer = turn;
    if (Math.abs(carSpeed) > 0.15) driveCar.rotation.y += turn * 1.5 * dt * Math.sign(carSpeed || 1);
    const f = carForward(driveCar.rotation.y);
    const before = driveCar.position.clone();
    tryMove(world.colliders, driveCar.position, f.x * carSpeed * dt, f.z * carSpeed * dt, 2.15);
    if (before.distanceTo(driveCar.position) < Math.abs(carSpeed) * dt * 0.25) carSpeed *= 0.4;
    for (const w of driveCar.userData.wheels) {
      w.spin.rotation.x -= carSpeed * dt / 0.36;
      if (w.front) w.steer.rotation.y = steer * 0.35;
    }
    const braking = accel < 0;
    const glow = braking ? 1.5 : 0.4;
    driveCar.userData.tailL.material.emissiveIntensity = glow;
    driveCar.userData.tailR.material.emissiveIntensity = glow;
    marker.position.x = driveCar.position.x;
    marker.position.z = driveCar.position.z;
    look.set(driveCar.position.x, 1.25, driveCar.position.z);
    camPos.set(driveCar.position.x - f.x * (dist + 2.2), 3.2, driveCar.position.z - f.z * (dist + 2.2));
  } else {
    const f = carForward(driveCar.rotation.y);
    look.set(driveCar.position.x, 1.25, driveCar.position.z);
    camPos.set(driveCar.position.x - f.x * (dist + 2.2), 3.2, driveCar.position.z - f.z * (dist + 2.2));
  }

  if (mode !== 'pause') {
    for (const npc of npcs) updateWalker(npc, dt);
    for (const c of clouds) { c.position.x += dt * 0.8; c.lookAt(camera.position); }
    if (clouds[0] && clouds[0].position.x > 100) {
      for (const c of clouds) c.position.x -= 180;
    }
  }

  const focus = driving ? driveCar.position : player.position;
  sun.target.position.set(focus.x, 0, focus.z);
  sun.position.set(focus.x + 40, 80, focus.z + 24);
  sun.target.updateMatrixWorld();

  if (!frame.ready) {
    camera.position.copy(camPos);
    frame.ready = true;
  } else {
    camera.position.lerp(camPos, 1 - Math.pow(0.0015, dt));
  }
  camera.lookAt(look);

  for (const door of world.doors) {
    const target = door.userData.open ? -1.15 : 0;
    door.rotation.y += (target - door.rotation.y) * Math.min(1, dt * 7);
  }
  refreshContext();

  const near = player.position.distanceTo(driveCar.position) < 3.2;
  promptEl.classList.toggle('show', playing && (near || driving));
  promptEl.textContent = driving ? 'F or Vehicle to get out' : near ? 'F or Vehicle to drive' : '';

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
showMenus();
requestAnimationFrame(frame);
