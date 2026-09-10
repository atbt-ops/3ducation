import * as THREE from "three";
import { sceneLights, groundGrid } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.6, dir: 0.85 });

const pivotY = 2.6;
const group = new THREE.Group();
scene.add(group);

const rodMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.4, roughness: 0.35 });
const bobMat = new THREE.MeshStandardMaterial({ color: 0x2c6e6b, metalness: 0.15, roughness: 0.35 });
const pivotMat = new THREE.MeshStandardMaterial({ color: 0xa9762e, metalness: 0.5, roughness: 0.3 });

const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), pivotMat);
pivot.position.set(0, pivotY, 0);
group.add(pivot);

const support = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), rodMat);
support.position.set(0, pivotY + 0.06, 0);
group.add(support);

const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10), rodMat);
group.add(rod);
const bob = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 20), bobMat);
group.add(bob);

const trailMax = 70;
let trailPts = [];
const trailGeo = new THREE.BufferGeometry();
const trailLine = new THREE.Line(
  trailGeo,
  new THREE.LineBasicMaterial({ color: 0x2c6e6b, transparent: true, opacity: 0.5 })
);
scene.add(trailLine);
scene.add(groundGrid());

const state = { L: 2.0, g: 9.8, theta0: 40, theta: 0, omega: 0, running: true };

function resetPhysics() {
  state.theta = (state.theta0 * Math.PI) / 180;
  state.omega = 0;
  trailPts = [];
}
resetPhysics();

function layout() {
  const scale = 1.5;
  const bx = pivot.position.x + state.L * scale * Math.sin(state.theta);
  const by = pivotY - state.L * scale * Math.cos(state.theta);
  const dir = new THREE.Vector3(bx, by, 0).sub(new THREE.Vector3(0, pivotY, 0));
  rod.position.set(bx * 0.5, (pivotY + by) * 0.5, 0);
  rod.scale.y = dir.length();
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  bob.position.set(bx, by, 0);
  trailPts.push(new THREE.Vector3(bx, by, 0.001));
  if (trailPts.length > trailMax) trailPts.shift();
  trailGeo.setFromPoints(trailPts);
}
layout();

const els = {};

export default {
  id: "pendulum",
  name: "Pendulum",
  tag: "Physics · Mechanics",
  subject: "Physics",
  blurb: "Swing a bob and read its rhythm.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="11" r="2.2" fill="currentColor"/><path d="M20 11L29 30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="29" cy="33" r="4.2" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 1.6, 0], radius: 6.5, theta: 0.9, phi: 1.15, minRadius: 3, maxRadius: 14 },

  lesson: `
    <p>A pendulum trades <strong>height</strong> for <strong>speed</strong> and back again. At the top of a
    swing it is momentarily still but high — all potential energy. At the bottom it is fast but low —
    all kinetic energy.</p>
    <p>For small swings the time for one full back-and-forth, the <em>period</em>, is
    <span class="mono">T = 2π√(L/g)</span>. Notice what is <em>missing</em>: the mass of the bob and
    (for small angles) the size of the swing. Only the length and gravity matter.</p>
    <p>Try it: does a longer rod swing faster or slower? What happens to the period on the Moon?</p>
  `,

  quiz: [
    {
      q: "You double the length of the rod. The period…",
      choices: ["doubles", "is multiplied by √2 (≈1.41)", "halves", "does not change"],
      answer: 1,
      explain: "T ∝ √L, so multiplying L by 2 multiplies T by √2.",
    },
    {
      q: "Which change makes a pendulum swing faster (shorter period)?",
      choices: ["A heavier bob", "Stronger gravity", "A longer rod", "A larger starting angle"],
      answer: 1,
      explain: "T = 2π√(L/g): larger g means a smaller period. Mass doesn't appear at all.",
    },
    {
      q: "At the lowest point of its swing, the bob's energy is mostly…",
      choices: ["potential", "kinetic", "split evenly", "zero"],
      answer: 1,
      explain: "Lowest point = lowest height = least potential energy, so it's moving fastest: kinetic.",
    },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>T = 2π√(L/g)</span><b class="mono" id="pd-period">—</b></div>
      <div class="control"><div class="row"><label for="pd-L">Rod length</label><output id="pd-Lval" for="pd-L"></output></div>
        <input type="range" id="pd-L" min="0.6" max="3.2" step="0.05" value="${state.L}"></div>
      <div class="control"><div class="row"><label for="pd-g">Gravity</label><output id="pd-gval" for="pd-g"></output></div>
        <input type="range" id="pd-g" min="1.6" max="24.8" step="0.1" value="${state.g}"></div>
      <div class="control"><div class="row"><label for="pd-a">Start angle</label><output id="pd-aval" for="pd-a"></output></div>
        <input type="range" id="pd-a" min="5" max="85" step="1" value="${state.theta0}"></div>
      <div class="section-label">Energy</div>
      <div class="energy-bars">
        <div class="ebar ke"><span class="name mono">KE</span><span class="track"><span class="fill" id="pd-ke"></span></span></div>
        <div class="ebar pe"><span class="name mono">PE</span><span class="track"><span class="fill" id="pd-pe"></span></span></div>
      </div>
      <p class="fact">Gravity presets: <strong>1.6</strong> Moon, <strong>3.7</strong> Mars,
        <strong>9.8</strong> Earth, <strong>24.8</strong> Jupiter.</p>
      <div class="btn-row">
        <button class="btn primary" id="pd-toggle" type="button">Pause</button>
        <button class="btn" id="pd-reset" type="button">Reset swing</button>
      </div>
    `;
  },

  wire(root) {
    els.L = root.querySelector("#pd-L");
    els.Lval = root.querySelector("#pd-Lval");
    els.g = root.querySelector("#pd-g");
    els.gval = root.querySelector("#pd-gval");
    els.a = root.querySelector("#pd-a");
    els.aval = root.querySelector("#pd-aval");
    els.period = root.querySelector("#pd-period");
    els.ke = root.querySelector("#pd-ke");
    els.pe = root.querySelector("#pd-pe");
    els.toggle = root.querySelector("#pd-toggle");
    els.reset = root.querySelector("#pd-reset");

    const sync = () => {
      els.Lval.textContent = `${state.L.toFixed(2)} m`;
      els.gval.textContent = `${state.g.toFixed(1)} m/s²`;
      els.aval.textContent = `${Math.round(state.theta0)}°`;
      els.period.textContent = `${(2 * Math.PI * Math.sqrt(state.L / state.g)).toFixed(2)} s`;
    };
    els.L.addEventListener("input", () => ((state.L = parseFloat(els.L.value)), sync()));
    els.g.addEventListener("input", () => ((state.g = parseFloat(els.g.value)), sync()));
    els.a.addEventListener("input", () => {
      state.theta0 = parseFloat(els.a.value);
      sync();
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    els.reset.addEventListener("click", () => {
      resetPhysics();
      layout();
    });
    sync();
  },

  update(dt) {
    if (state.running) {
      const steps = 4;
      const h = Math.min(dt, 0.05) / steps;
      for (let i = 0; i < steps; i++) {
        const acc = -(state.g / state.L) * Math.sin(state.theta) - 0.02 * state.omega;
        state.omega += acc * h;
        state.theta += state.omega * h;
      }
      layout();
    }
    const v = state.L * state.omega;
    const ke = 0.5 * v * v;
    const pe = state.g * state.L * (1 - Math.cos(state.theta));
    const total = ke + pe || 1;
    if (els.ke) els.ke.style.width = `${Math.min(100, (ke / total) * 100)}%`;
    if (els.pe) els.pe.style.width = `${Math.min(100, (pe / total) * 100)}%`;
  },

  onEnter() {},
  onExit() {},
};
