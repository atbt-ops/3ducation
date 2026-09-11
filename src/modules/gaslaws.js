import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

const W = 2.2;
const FLOOR = -2;
const cylinderMat = new THREE.MeshStandardMaterial({ color: 0x9a9a94, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
const cyl = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, 5, 24, 1, true), cylinderMat);
cyl.position.y = FLOOR + 2.5;
group.add(cyl);

const piston = new THREE.Mesh(
  new THREE.CylinderGeometry(W / 2 - 0.02, W / 2 - 0.02, 0.2, 24),
  new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.4, roughness: 0.4 })
);
group.add(piston);
const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 12), piston.material);
group.add(rod);

const N = 60;
const geo = new THREE.SphereGeometry(0.09, 8, 6);
const pmat = new THREE.MeshStandardMaterial({ color: 0x0f6b63 });
const mesh = new THREE.InstancedMesh(geo, pmat, N);
group.add(mesh);
const pos = [];
const vel = [];
for (let i = 0; i < N; i++) {
  pos.push(new THREE.Vector3((Math.random() - 0.5) * W * 0.8, FLOOR + Math.random() * 2, (Math.random() - 0.5) * W * 0.8));
  vel.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5));
}

const state = { volume: 0.6, temp: 0.5 }; // both 0..1
const dummy = new THREE.Object3D();

function pistonY() {
  return FLOOR + 0.6 + state.volume * 3.6;
}
function pressure() {
  // P ∝ T / V
  return (0.4 + state.temp) / (0.15 + state.volume);
}

function layout() {
  const py = pistonY();
  piston.position.y = py;
  rod.position.y = py + 0.8;
}
layout();

const els = {};

export default {
  id: "gaslaws",
  name: "Gas laws",
  tag: "Chemistry · Gases",
  subject: "Chemistry",
  grades: [8, 12],
  blurb: "Squeeze it, heat it, read the pressure.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="6" width="16" height="6" rx="1" fill="currentColor"/><path d="M20 12v4M13 16h14v18H13z" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="24" r="1.5" fill="currentColor"/><circle cx="23" cy="28" r="1.5" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, -0.4, 0], radius: 8.5, theta: 0.5, phi: 1.15, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>A gas is mostly empty space, its particles bouncing off the walls. Each hit is a tiny push —
    add them all up and that's <strong>pressure</strong>.</p>
    <p>Squeeze the gas into half the volume and the particles hit the walls twice as often:
    <span class="mono">P ∝ 1/V</span> (Boyle's law). Heat it and they move faster and hit harder:
    <span class="mono">P ∝ T</span> (Gay-Lussac). Hold the pressure fixed instead and heating pushes
    the piston out — volume grows with temperature (Charles's law).</p>
  `,

  quiz: [
    { q: "At constant temperature, halving a gas's volume changes its pressure to…", choices: ["half", "double", "the same", "a quarter"], answer: 1, explain: "Boyle's law: P ∝ 1/V, so half the volume means double the pressure." },
    { q: "Heating a sealed, rigid container of gas causes its pressure to…", choices: ["fall", "rise", "stay the same", "become zero"], answer: 1, explain: "Faster particles hit the walls harder and more often." },
    { q: "Gas pressure on the container walls comes from…", choices: ["the particles' weight", "particles colliding with the walls", "the container shrinking", "gravity"], answer: 1, explain: "Countless tiny collisions add up to a steady push." },
  ],

  presets: [
    { label: "Compress (Boyle)", note: "Same temperature, half the volume — watch the pressure roughly double.", values: { "gl-vol": 0.2, "gl-temp": 0.5 } },
    { label: "Heat it up", note: "Same volume, more heat — faster particles, higher pressure.", values: { "gl-vol": 0.5, "gl-temp": 1 } },
    { label: "Cool and expand", note: "Low temperature, large volume — a slow, gentle gas.", values: { "gl-vol": 0.9, "gl-temp": 0.1 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>P ∝ T / V</span><b class="mono" id="gl-p">—</b></div>
      <div class="control"><div class="row"><label for="gl-vol">Volume</label><output id="gl-volval" for="gl-vol"></output></div>
        <input type="range" id="gl-vol" min="0.1" max="1" step="0.01" value="${state.volume}"></div>
      <div class="control"><div class="row"><label for="gl-temp">Temperature</label><output id="gl-tempval" for="gl-temp"></output></div>
        <input type="range" id="gl-temp" min="0.05" max="1" step="0.01" value="${state.temp}"></div>
      <p class="fact">Particle speed tracks temperature; wall-hit frequency tracks pressure.</p>
    `;
  },

  wire(root) {
    els.vol = root.querySelector("#gl-vol");
    els.temp = root.querySelector("#gl-temp");
    els.volval = root.querySelector("#gl-volval");
    els.tempval = root.querySelector("#gl-tempval");
    els.p = root.querySelector("#gl-p");

    const sync = () => {
      els.volval.textContent = `${Math.round(state.volume * 100)}%`;
      els.tempval.textContent = `${Math.round(state.temp * 100)}%`;
      els.p.textContent = `${pressure().toFixed(2)}`;
      layout();
    };
    els.vol.addEventListener("input", () => ((state.volume = +els.vol.value), sync()));
    els.temp.addEventListener("input", () => ((state.temp = +els.temp.value), sync()));
    sync();
  },

  update(dt) {
    const h = Math.min(dt, 0.04);
    const speed = 0.7 + state.temp * 3;
    const ceil = pistonY() - 0.15;
    const rad = W / 2 - 0.12;
    for (let i = 0; i < N; i++) {
      const p = pos[i];
      const v = vel[i];
      p.addScaledVector(v, speed * h);
      if (p.y < FLOOR + 0.1) { p.y = FLOOR + 0.1; v.y = Math.abs(v.y); }
      if (p.y > ceil) { p.y = ceil; v.y = -Math.abs(v.y); }
      const rxz = Math.hypot(p.x, p.z);
      if (rxz > rad) {
        const nx = p.x / rxz;
        const nz = p.z / rxz;
        p.x = nx * rad;
        p.z = nz * rad;
        const dot = v.x * nx + v.z * nz;
        v.x -= 2 * dot * nx;
        v.z -= 2 * dot * nz;
      }
      dummy.position.copy(p);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  },

  onEnter() {},
  onExit() {},
};
