import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.64, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);

const wireMat = new THREE.MeshStandardMaterial({ color: 0xb0803f, metalness: 0.7, roughness: 0.35 });
const resMat = new THREE.MeshStandardMaterial({ color: 0x2b2b31, roughness: 0.6 });
const bandColors = [0xc25e1c, 0xc9931f, 0x4fa032, 0x5878ad];

function resistorMesh(len = 0.9) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, len, 16), resMat);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  bandColors.forEach((c, i) => {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: c })
    );
    band.rotation.z = Math.PI / 2;
    band.position.x = -len / 2 + 0.16 + i * 0.16;
    g.add(band);
  });
  return g;
}

const state = { mode: "series", r1: 6, r2: 6, volts: 9 };
let dynamic = new THREE.Group();
group.add(dynamic);

function rebuild() {
  group.remove(dynamic);
  dynamic = new THREE.Group();
  group.add(dynamic);

  // battery on the left
  const batt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), resMat);
  batt.position.set(-2.6, 0, 0);
  dynamic.add(batt);

  const wire = (a, b) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, dir.length(), 8), wireMat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    dynamic.add(m);
  };

  if (state.mode === "series") {
    const r1 = resistorMesh();
    r1.position.set(-0.4, 1.4, 0);
    const r2 = resistorMesh();
    r2.position.set(1.2, 1.4, 0);
    dynamic.add(r1, r2);
    wire(new THREE.Vector3(-2.6, 0.6, 0), new THREE.Vector3(-2.6, 1.4, 0));
    wire(new THREE.Vector3(-2.6, 1.4, 0), new THREE.Vector3(-0.85, 1.4, 0));
    wire(new THREE.Vector3(0.05, 1.4, 0), new THREE.Vector3(0.75, 1.4, 0));
    wire(new THREE.Vector3(1.65, 1.4, 0), new THREE.Vector3(2.8, 1.4, 0));
    wire(new THREE.Vector3(2.8, 1.4, 0), new THREE.Vector3(2.8, -0.9, 0));
    wire(new THREE.Vector3(2.8, -0.9, 0), new THREE.Vector3(-2.6, -0.9, 0));
    wire(new THREE.Vector3(-2.6, -0.9, 0), new THREE.Vector3(-2.6, -0.6, 0));
  } else {
    const r1 = resistorMesh();
    r1.position.set(0.6, 1.2, 0);
    const r2 = resistorMesh();
    r2.position.set(0.6, -0.2, 0);
    dynamic.add(r1, r2);
    wire(new THREE.Vector3(-2.6, 0.6, 0), new THREE.Vector3(-2.6, 1.2, 0));
    wire(new THREE.Vector3(-2.6, 1.2, 0), new THREE.Vector3(-1.4, 1.2, 0));
    wire(new THREE.Vector3(-1.4, 1.2, 0), new THREE.Vector3(-1.4, -0.2, 0));
    wire(new THREE.Vector3(-1.4, 1.2, 0), new THREE.Vector3(0.15, 1.2, 0));
    wire(new THREE.Vector3(-1.4, -0.2, 0), new THREE.Vector3(0.15, -0.2, 0));
    wire(new THREE.Vector3(1.05, 1.2, 0), new THREE.Vector3(2.4, 1.2, 0));
    wire(new THREE.Vector3(1.05, -0.2, 0), new THREE.Vector3(2.4, -0.2, 0));
    wire(new THREE.Vector3(2.4, 1.2, 0), new THREE.Vector3(2.4, -0.2, 0));
    wire(new THREE.Vector3(2.4, -0.2, 0), new THREE.Vector3(2.4, -0.9, 0));
    wire(new THREE.Vector3(2.4, -0.9, 0), new THREE.Vector3(-2.6, -0.9, 0));
    wire(new THREE.Vector3(-2.6, -0.9, 0), new THREE.Vector3(-2.6, -0.6, 0));
  }
}
rebuild();

function totals() {
  const { r1, r2, volts, mode } = state;
  const rTotal = mode === "series" ? r1 + r2 : (r1 * r2) / (r1 + r2);
  const current = volts / rTotal;
  return { rTotal, current, mode };
}

const els = {};

export default {
  id: "resistors",
  name: "Series & parallel",
  tag: "Physics · Circuits",
  subject: "Physics",
  grades: [9, 12],
  blurb: "Two resistors, two ways to wire them.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 14h6l3-4 4 8 4-8 3 4h8M4 26h6l3-4 4 8 4-8 3 4h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 0.4, 0], radius: 9, theta: 0.1, phi: 1.4, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>Wire two resistors <strong>in series</strong> — one after the other — and the current must fight
    through both, so resistances add: <span class="mono">R = R₁ + R₂</span>.</p>
    <p>Wire them <strong>in parallel</strong> — side by side — and you've given the current a second
    path, so the total resistance <em>drops below either one</em>:
    <span class="mono">1/R = 1/R₁ + 1/R₂</span>. Two equal resistors in parallel give exactly half.</p>
  `,

  quiz: [
    { q: "Two 6 Ω resistors in series have a combined resistance of…", choices: ["3 Ω", "6 Ω", "12 Ω", "36 Ω"], answer: 2, explain: "In series, resistances add: 6 + 6 = 12 Ω." },
    { q: "The same two 6 Ω resistors in parallel give…", choices: ["3 Ω", "6 Ω", "12 Ω", "0 Ω"], answer: 0, explain: "1/R = 1/6 + 1/6 = 1/3, so R = 3 Ω — half of one." },
    { q: "Adding a resistor in parallel makes the circuit's total resistance…", choices: ["go up", "go down", "stay the same", "become infinite"], answer: 1, explain: "Each extra path lets more current flow, lowering total resistance." },
  ],

  presets: [
    { label: "6 Ω + 6 Ω series", note: "12 Ω total — current is halved compared to one alone.", values: { "rs-mode": "series", "rs-r1": 6, "rs-r2": 6 } },
    { label: "6 Ω ∥ 6 Ω parallel", note: "3 Ω total — current doubles.", values: { "rs-mode": "parallel", "rs-r1": 6, "rs-r2": 6 } },
    { label: "Big + small parallel", note: "A 20 Ω beside a 2 Ω: total is just under 2 Ω — the small one dominates.", values: { "rs-mode": "parallel", "rs-r1": 20, "rs-r2": 2 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="rs-eq">R = R₁ + R₂</span><b class="mono" id="rs-rtot">—</b></div>
      <select id="rs-mode" class="text-input" aria-label="Wiring">
        <option value="series">Series</option>
        <option value="parallel">Parallel</option>
      </select>
      <div class="control"><div class="row"><label for="rs-r1">R₁</label><output id="rs-r1val" for="rs-r1"></output></div>
        <input type="range" id="rs-r1" min="1" max="20" step="1" value="${state.r1}"></div>
      <div class="control"><div class="row"><label for="rs-r2">R₂</label><output id="rs-r2val" for="rs-r2"></output></div>
        <input type="range" id="rs-r2" min="1" max="20" step="1" value="${state.r2}"></div>
      <dl class="stat-grid">
        <div><dt>Total resistance</dt><dd class="mono" id="rs-r">—</dd></div>
        <div><dt>Current (${state.volts} V)</dt><dd class="mono" id="rs-i">—</dd></div>
      </dl>
    `;
  },

  wire(root) {
    els.mode = root.querySelector("#rs-mode");
    els.r1 = root.querySelector("#rs-r1");
    els.r2 = root.querySelector("#rs-r2");
    els.r1val = root.querySelector("#rs-r1val");
    els.r2val = root.querySelector("#rs-r2val");
    els.eq = root.querySelector("#rs-eq");
    els.rtot = root.querySelector("#rs-rtot");
    els.r = root.querySelector("#rs-r");
    els.i = root.querySelector("#rs-i");

    const sync = () => {
      const t = totals();
      els.r1val.textContent = `${state.r1} Ω`;
      els.r2val.textContent = `${state.r2} Ω`;
      els.eq.textContent = state.mode === "series" ? "R = R₁ + R₂" : "1/R = 1/R₁ + 1/R₂";
      els.rtot.textContent = `${t.rTotal.toFixed(2)} Ω`;
      els.r.textContent = `${t.rTotal.toFixed(2)} Ω`;
      els.i.textContent = `${t.current.toFixed(2)} A`;
    };
    els.mode.addEventListener("input", () => {
      state.mode = els.mode.value;
      rebuild();
      sync();
    });
    els.r1.addEventListener("input", () => ((state.r1 = +els.r1.value), sync()));
    els.r2.addEventListener("input", () => ((state.r2 = +els.r2.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
