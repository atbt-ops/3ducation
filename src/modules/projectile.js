import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { projectile as solveProjectile } from "../lib/physics.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.62, dir: 0.85 });

const WORLD = 12; // metres shown across the ground
const SCALE = 1; // 1 unit = 1 m

const groundMat = new THREE.MeshStandardMaterial({ color: 0x3f4a3c, roughness: 0.95 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD * 2, 8), groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const grid = new THREE.GridHelper(WORLD * 2, WORLD * 2, 0xd8d0bc, 0x6f7a68);
grid.material.transparent = true;
grid.material.opacity = 0.25;
scene.add(grid);

const cannon = new THREE.Mesh(
  new THREE.CylinderGeometry(0.16, 0.2, 1.1, 16),
  new THREE.MeshStandardMaterial({ color: 0xa9762e, metalness: 0.5, roughness: 0.3 })
);
cannon.position.set(-WORLD, 0.35, 0);
scene.add(cannon);

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 20, 16),
  new THREE.MeshStandardMaterial({ color: 0x2c6e6b, roughness: 0.35 })
);
scene.add(ball);

const predGeo = new THREE.BufferGeometry();
const predLine = new THREE.Line(
  predGeo,
  new THREE.LineDashedMaterial({ color: 0xd9a54a, dashSize: 0.25, gapSize: 0.16 })
);
scene.add(predLine);

const trailGeo = new THREE.BufferGeometry();
const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x2c6e6b }));
scene.add(trail);

const origin = new THREE.Vector3(-WORLD, 0.6, 0);
const state = { v: 12, angle: 45, g: 9.8, t: 0, flying: false, trailPts: [] };

function kinematics() {
  const { vx, vy, tFlight, range, apex } = solveProjectile({
    speed: state.v,
    angleDeg: state.angle,
    gravity: state.g,
    height: origin.y,
  });
  return { vx, vy, tFlight, range, hMax: apex };
}

function drawPrediction() {
  const { vx, vy, tFlight } = kinematics();
  const pts = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * tFlight;
    pts.push(
      new THREE.Vector3(
        origin.x + vx * t * SCALE,
        Math.max(0, origin.y + (vy * t - 0.5 * state.g * t * t) * SCALE),
        0
      )
    );
  }
  predGeo.setFromPoints(pts);
  predLine.computeLineDistances();
}

function placeCannon() {
  cannon.position.copy(origin).setY(0.35);
  cannon.rotation.z = (state.angle * Math.PI) / 180 - Math.PI / 2;
  if (!state.flying) {
    ball.position.copy(origin);
    state.trailPts = [];
    trailGeo.setFromPoints([]);
  }
}

function launch() {
  state.t = 0;
  state.flying = true;
  state.trailPts = [];
}

placeCannon();
drawPrediction();

const els = {};

export default {
  id: "projectile",
  name: "Projectile range",
  tag: "Physics · Kinematics",
  subject: "Physics",
  blurb: "Fire a cannon and chase the 45° sweet spot.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 32C14 12 26 8 34 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3"/><circle cx="34" cy="8" r="3" fill="currentColor"/><path d="M4 33h10l-4-6" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 2, 0], radius: 16, theta: 0.5, phi: 1.25, minRadius: 6, maxRadius: 34 },

  lesson: `
    <p>Once it leaves the barrel, a projectile has only gravity acting on it. Its motion splits cleanly
    into two independent parts: <strong>constant</strong> horizontal velocity, and vertical motion that
    slows, stops and falls back — exactly like a ball thrown straight up.</p>
    <p>On flat ground the range is <span class="mono">R = v²·sin(2θ) / g</span>. That
    <span class="mono">sin(2θ)</span> peaks at θ = 45°, and because sin(2θ) is symmetric, 30° and 60°
    give the same range.</p>
  `,

  quiz: [
    {
      q: "On flat ground, which launch angle gives the greatest range?",
      choices: ["30°", "45°", "60°", "75°"],
      answer: 1,
      explain: "R ∝ sin(2θ), which is largest when 2θ = 90°, i.e. θ = 45°.",
    },
    {
      q: "Ignoring air, 25° and 65° launches at the same speed produce…",
      choices: ["the same range", "the same maximum height", "the same flight time", "nothing in common"],
      answer: 0,
      explain: "sin(2·25°) = sin(2·65°) = sin(50°) = sin(130°), so the ranges match.",
    },
    {
      q: "During the flight, the horizontal velocity…",
      choices: ["increases", "decreases", "stays constant", "reverses at the top"],
      answer: 2,
      explain: "Gravity is purely vertical, so nothing changes the horizontal component.",
    },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>R = v²·sin(2θ) / g</span><b class="mono" id="pj-range">—</b></div>
      <div class="control"><div class="row"><label for="pj-v">Launch speed</label><output id="pj-vval" for="pj-v"></output></div>
        <input type="range" id="pj-v" min="4" max="20" step="0.5" value="${state.v}"></div>
      <div class="control"><div class="row"><label for="pj-a">Launch angle</label><output id="pj-aval" for="pj-a"></output></div>
        <input type="range" id="pj-a" min="5" max="85" step="1" value="${state.angle}"></div>
      <div class="control"><div class="row"><label for="pj-g">Gravity</label><output id="pj-gval" for="pj-g"></output></div>
        <input type="range" id="pj-g" min="1.6" max="24.8" step="0.1" value="${state.g}"></div>
      <dl class="stat-grid">
        <div><dt>Max height</dt><dd class="mono" id="pj-h">—</dd></div>
        <div><dt>Flight time</dt><dd class="mono" id="pj-t">—</dd></div>
      </dl>
      <div class="btn-row"><button class="btn primary" id="pj-fire" type="button">Fire</button></div>
    `;
  },

  wire(root) {
    els.v = root.querySelector("#pj-v");
    els.vval = root.querySelector("#pj-vval");
    els.a = root.querySelector("#pj-a");
    els.aval = root.querySelector("#pj-aval");
    els.g = root.querySelector("#pj-g");
    els.gval = root.querySelector("#pj-gval");
    els.range = root.querySelector("#pj-range");
    els.h = root.querySelector("#pj-h");
    els.tOut = root.querySelector("#pj-t");
    els.fire = root.querySelector("#pj-fire");

    const sync = () => {
      const k = kinematics();
      els.vval.textContent = `${state.v.toFixed(1)} m/s`;
      els.aval.textContent = `${Math.round(state.angle)}°`;
      els.gval.textContent = `${state.g.toFixed(1)} m/s²`;
      els.range.textContent = `${k.range.toFixed(1)} m`;
      els.h.textContent = `${k.hMax.toFixed(1)} m`;
      els.tOut.textContent = `${k.tFlight.toFixed(2)} s`;
      placeCannon();
      drawPrediction();
    };
    els.v.addEventListener("input", () => ((state.v = parseFloat(els.v.value)), sync()));
    els.a.addEventListener("input", () => ((state.angle = parseFloat(els.a.value)), sync()));
    els.g.addEventListener("input", () => ((state.g = parseFloat(els.g.value)), sync()));
    els.fire.addEventListener("click", launch);
    sync();
  },

  update(dt) {
    if (!state.flying) return;
    state.t += Math.min(dt, 0.05);
    const { vx, vy } = kinematics();
    const x = origin.x + vx * state.t * SCALE;
    const y = origin.y + (vy * state.t - 0.5 * state.g * state.t * state.t) * SCALE;
    if (y <= 0) {
      state.flying = false;
      ball.position.set(x, 0, 0);
      return;
    }
    ball.position.set(x, y, 0);
    state.trailPts.push(ball.position.clone());
    trailGeo.setFromPoints(state.trailPts);
  },

  onEnter() {
    state.flying = false;
    placeCannon();
    drawPrediction();
  },
  onExit() {},
};
