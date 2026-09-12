import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { ELEMENTS } from "../lib/elements.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);

const SHELL_CAP = [2, 8, 8, 18];
const protonMat = new THREE.MeshStandardMaterial({ color: 0xd9503f, roughness: 0.4 });
const neutronMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.5 });
const electronMat = new THREE.MeshBasicMaterial({ color: 0x3f7fd9 });
const nucleonGeo = new THREE.SphereGeometry(0.16, 14, 12);
const electronGeo = new THREE.SphereGeometry(0.11, 12, 10);

const state = { p: 6, n: 6, e: 6, t: 0 };
let electrons = [];

function shellsFor(count) {
  const shells = [];
  let left = count;
  for (const cap of SHELL_CAP) {
    if (left <= 0) break;
    shells.push(Math.min(cap, left));
    left -= cap;
  }
  return shells;
}

function build() {
  while (group.children.length) group.remove(group.children[0]);
  electrons = [];

  // nucleus cluster — label one representative proton and one neutron
  // (there can be dozens; labeling every one would just be visual noise).
  const total = state.p + state.n;
  let labeledProton = false;
  let labeledNeutron = false;
  for (let k = 0; k < total; k++) {
    const isProton = k < state.p;
    const m = new THREE.Mesh(nucleonGeo, isProton ? protonMat : neutronMat);
    const r = 0.05 + 0.32 * Math.cbrt(total) * Math.random();
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    m.position.set(r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), r * Math.cos(b));
    group.add(m);
    if (isProton && !labeledProton) {
      labeledProton = true;
      // Default label size overwhelms the tiny (~0.3-radius) nucleon cluster
      // and the two labeled nucleons can land close together at random —
      // shrink well below the cell/rockcycle scale and pull them apart.
      const label = createLabel("Proton", { fontSize: 24, scale: 0.3 });
      label.position.set(0, 0.3, 0);
      m.add(label);
    } else if (!isProton && !labeledNeutron) {
      labeledNeutron = true;
      const label = createLabel("Neutron", { fontSize: 24, scale: 0.3 });
      label.position.set(0, -0.3, 0);
      m.add(label);
    }
  }

  const shells = shellsFor(state.e);
  shells.forEach((num, si) => {
    const radius = 1.4 + si * 0.9;
    const ringPts = [];
    for (let j = 0; j <= 64; j++) {
      const t = (j / 64) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
    }
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({ color: 0xc9c9c4 })
    );
    ring.rotation.x = si * 0.5;
    group.add(ring);
    for (let j = 0; j < num; j++) {
      const e = new THREE.Mesh(electronGeo, electronMat);
      group.add(e);
      electrons.push({ mesh: e, radius, tilt: si * 0.5, phase: (j / num) * Math.PI * 2, speed: 1.6 - si * 0.3 });
    }
  });
}
build();

const els = {};

function info() {
  const z = state.p;
  const el = ELEMENTS.find((x) => x[0] === z);
  const name = el ? el[2] : "—";
  const sym = el ? el[1] : "?";
  const charge = state.p - state.e;
  const chargeStr = charge === 0 ? "neutral atom" : `${Math.abs(charge)}${charge > 0 ? "+" : "−"} ion`;
  return { name, sym, mass: state.p + state.n, charge: chargeStr, shells: shellsFor(state.e).join(", ") };
}

export default {
  id: "atom",
  name: "Atom builder",
  tag: "Chemistry · Atomic structure",
  subject: "Chemistry",
  grades: [8, 11],
  blurb: "Add protons and electrons, name the element.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="3" fill="currentColor"/><ellipse cx="20" cy="20" rx="15" ry="6" stroke="currentColor" stroke-width="2"/><ellipse cx="20" cy="20" rx="15" ry="6" stroke="currentColor" stroke-width="2" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="15" ry="6" stroke="currentColor" stroke-width="2" transform="rotate(120 20 20)"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 10, theta: 0.6, phi: 1.15, minRadius: 4, maxRadius: 20 },

  lesson: `
    <p>An atom is a tiny dense <strong>nucleus</strong> of protons and neutrons, surrounded by
    <strong>electrons</strong> in shells. The number of protons — the <em>atomic number</em> — is what
    makes it a particular element.</p>
    <p>Add or remove <em>neutrons</em> and you get a different <strong>isotope</strong> of the same
    element (same chemistry, different mass). Add or remove <em>electrons</em> and the atom picks up a
    charge, becoming an <strong>ion</strong>. Electron shells fill 2, then 8, then 8.</p>
  `,

  quiz: [
    { q: "What decides which element an atom is?", choices: ["number of neutrons", "number of protons", "number of electrons", "total mass"], answer: 1, explain: "The proton count is the atomic number, and it names the element." },
    { q: "Two atoms with the same protons but different neutrons are…", choices: ["ions", "isotopes", "different elements", "impossible"], answer: 1, explain: "Isotopes: same element, different mass number." },
    { q: "An atom that has lost two electrons has a charge of…", choices: ["2−", "0", "2+", "1+"], answer: 2, explain: "Fewer electrons than protons → net positive charge, here 2+." },
  ],

  presets: [
    { label: "Hydrogen", note: "1 proton, 0 neutrons, 1 electron — the simplest atom.", values: { "at-p": 1, "at-n": 0, "at-e": 1 } },
    { label: "Carbon-12", note: "6 protons, 6 neutrons, 6 electrons. Shells fill 2 then 4.", values: { "at-p": 6, "at-n": 6, "at-e": 6 } },
    { label: "Carbon-14", note: "Same element, 2 extra neutrons — a radioactive isotope used for dating.", values: { "at-p": 6, "at-n": 8, "at-e": 6 } },
    { label: "Sodium ion Na⁺", note: "11 protons, 10 electrons: it lost one electron to get a full outer shell.", values: { "at-p": 11, "at-n": 12, "at-e": 10 } },
    { label: "Neon (full shells)", note: "2, 8 — both shells full, so neon is unreactive.", values: { "at-p": 10, "at-n": 10, "at-e": 10 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="at-name">Carbon</span><b class="mono" id="at-sym">C</b></div>
      <div class="control"><div class="row"><label for="at-p">Protons</label><output id="at-pval" for="at-p"></output></div>
        <input type="range" id="at-p" min="1" max="20" step="1" value="${state.p}"></div>
      <div class="control"><div class="row"><label for="at-n">Neutrons</label><output id="at-nval" for="at-n"></output></div>
        <input type="range" id="at-n" min="0" max="24" step="1" value="${state.n}"></div>
      <div class="control"><div class="row"><label for="at-e">Electrons</label><output id="at-eval" for="at-e"></output></div>
        <input type="range" id="at-e" min="1" max="20" step="1" value="${state.e}"></div>
      <dl class="stat-grid">
        <div><dt>Mass number</dt><dd class="mono" id="at-mass">—</dd></div>
        <div><dt>Charge</dt><dd id="at-charge">—</dd></div>
      </dl>
      <p class="fact">Shell filling: <span class="mono" id="at-shells">—</span></p>
    `;
  },

  wire(root) {
    els.p = root.querySelector("#at-p");
    els.n = root.querySelector("#at-n");
    els.e = root.querySelector("#at-e");
    els.pval = root.querySelector("#at-pval");
    els.nval = root.querySelector("#at-nval");
    els.eval = root.querySelector("#at-eval");
    els.name = root.querySelector("#at-name");
    els.sym = root.querySelector("#at-sym");
    els.mass = root.querySelector("#at-mass");
    els.charge = root.querySelector("#at-charge");
    els.shells = root.querySelector("#at-shells");

    const sync = () => {
      els.pval.textContent = String(state.p);
      els.nval.textContent = String(state.n);
      els.eval.textContent = String(state.e);
      const inf = info();
      els.name.textContent = inf.name;
      els.sym.textContent = inf.sym;
      els.mass.textContent = String(inf.mass);
      els.charge.textContent = inf.charge;
      els.shells.textContent = inf.shells;
    };
    els.p.addEventListener("input", () => ((state.p = +els.p.value), build(), sync()));
    els.n.addEventListener("input", () => ((state.n = +els.n.value), build(), sync()));
    els.e.addEventListener("input", () => ((state.e = +els.e.value), build(), sync()));
    sync();
  },

  update(dt) {
    state.t += dt;
    for (const e of electrons) {
      const a = e.phase + state.t * e.speed;
      const v = new THREE.Vector3(Math.cos(a) * e.radius, 0, Math.sin(a) * e.radius);
      v.applyAxisAngle(new THREE.Vector3(1, 0, 0), e.tilt);
      e.mesh.position.copy(v);
    }
  },

  onEnter() {},
  onExit() {},
};
