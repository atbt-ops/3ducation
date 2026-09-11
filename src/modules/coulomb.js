import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);

function chargeSphere(color) {
  return new THREE.Mesh(new THREE.SphereGeometry(0.45, 28, 22), new THREE.MeshStandardMaterial({ color, roughness: 0.35 }));
}
const qA = chargeSphere(0xc23b2b);
const qB = chargeSphere(0x3a5fa8);
group.add(qA, qB);

const arrowA = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xe3b23c, 0.22, 0.13);
const arrowB = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 1, 0xe3b23c, 0.22, 0.13);
group.add(arrowA, arrowB);

const state = { qa: 3, qb: -3, dist: 3.2 };
const K = 6; // scaled constant for a readable force number

function force() {
  const f = (K * Math.abs(state.qa) * Math.abs(state.qb)) / (state.dist * state.dist);
  const attract = state.qa * state.qb < 0;
  return { f, attract };
}

function layout() {
  qA.position.set(-state.dist / 2, 0, 0);
  qB.position.set(state.dist / 2, 0, 0);
  qA.material.color.setHex(state.qa >= 0 ? 0xc23b2b : 0x3a5fa8);
  qB.material.color.setHex(state.qb >= 0 ? 0xc23b2b : 0x3a5fa8);
  qA.scale.setScalar(0.6 + Math.min(1, Math.abs(state.qa) / 6));
  qB.scale.setScalar(0.6 + Math.min(1, Math.abs(state.qb) / 6));

  const { f, attract } = force();
  const len = Math.min(2, 0.3 + f * 0.15);
  arrowA.position.copy(qA.position);
  arrowB.position.copy(qB.position);
  arrowA.setDirection(new THREE.Vector3(attract ? 1 : -1, 0, 0));
  arrowB.setDirection(new THREE.Vector3(attract ? -1 : 1, 0, 0));
  arrowA.setLength(len, 0.2, 0.12);
  arrowB.setLength(len, 0.2, 0.12);
}
layout();

const els = {};

export default {
  id: "coulomb",
  name: "Electric charges",
  tag: "Physics · Electrostatics",
  subject: "Physics",
  grades: [9, 12],
  blurb: "Like repels, unlike attracts — Coulomb's law.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="20" r="6" stroke="currentColor" stroke-width="2"/><circle cx="29" cy="20" r="6" stroke="currentColor" stroke-width="2"/><path d="M8 20h6M26 20h6M29 17v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8, theta: 0.15, phi: 1.4, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>Like charges push apart; opposite charges pull together. The strength of that push or pull
    follows <strong>Coulomb's law</strong>:</p>
    <p><span class="mono">F = k·|q₁·q₂| / r²</span></p>
    <p>Double either charge and the force doubles. Double the <em>distance</em> and the force drops to
    a <strong>quarter</strong> — it's an inverse-square law, the same shape as gravity, just enormously
    stronger.</p>
  `,

  quiz: [
    { q: "Two positive charges near each other will…", choices: ["attract", "repel", "do nothing", "merge"], answer: 1, explain: "Like charges repel." },
    { q: "Doubling the distance between two charges changes the force to…", choices: ["half", "double", "a quarter", "the same"], answer: 2, explain: "Inverse-square law: F ∝ 1/r², so doubling r divides F by 4." },
    { q: "Doubling one of the two charge magnitudes (same sign) makes the force…", choices: ["double", "quadruple", "half", "unchanged"], answer: 0, explain: "F ∝ q₁·q₂, so doubling one charge doubles the force." },
  ],

  presets: [
    { label: "Opposite charges", note: "Attraction — the arrows point inward.", values: { "cb-qa": 3, "cb-qb": -3, "cb-dist": 3 } },
    { label: "Like charges", note: "Repulsion — the arrows point outward.", values: { "cb-qa": 3, "cb-qb": 3, "cb-dist": 3 } },
    { label: "Close & strong", note: "Small distance — the inverse-square law makes force shoot up.", values: { "cb-dist": 1 } },
    { label: "Far & weak", note: "Same charges, much further apart — a much weaker pull.", values: { "cb-dist": 6 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>F = k·q₁q₂ / r²</span><b class="mono" id="cb-force">—</b></div>
      <div class="control"><div class="row"><label for="cb-qa">Charge q₁</label><output id="cb-qaval" for="cb-qa"></output></div>
        <input type="range" id="cb-qa" min="-6" max="6" step="0.5" value="${state.qa}"></div>
      <div class="control"><div class="row"><label for="cb-qb">Charge q₂</label><output id="cb-qbval" for="cb-qb"></output></div>
        <input type="range" id="cb-qb" min="-6" max="6" step="0.5" value="${state.qb}"></div>
      <div class="control"><div class="row"><label for="cb-dist">Distance</label><output id="cb-distval" for="cb-dist"></output></div>
        <input type="range" id="cb-dist" min="1" max="6" step="0.1" value="${state.dist}"></div>
      <p class="fact" id="cb-effect">—</p>
    `;
  },

  wire(root) {
    els.qa = root.querySelector("#cb-qa");
    els.qb = root.querySelector("#cb-qb");
    els.dist = root.querySelector("#cb-dist");
    els.qaval = root.querySelector("#cb-qaval");
    els.qbval = root.querySelector("#cb-qbval");
    els.distval = root.querySelector("#cb-distval");
    els.force = root.querySelector("#cb-force");
    els.effect = root.querySelector("#cb-effect");

    const sync = () => {
      els.qaval.textContent = `${state.qa > 0 ? "+" : ""}${state.qa}`;
      els.qbval.textContent = `${state.qb > 0 ? "+" : ""}${state.qb}`;
      els.distval.textContent = `${state.dist.toFixed(1)}`;
      const { f, attract } = force();
      els.force.textContent = f.toFixed(2);
      els.effect.textContent = state.qa === 0 || state.qb === 0 ? "No charge, no force." : attract ? "Attracting." : "Repelling.";
      layout();
    };
    els.qa.addEventListener("input", () => ((state.qa = +els.qa.value), sync()));
    els.qb.addEventListener("input", () => ((state.qb = +els.qb.value), sync()));
    els.dist.addEventListener("input", () => ((state.dist = +els.dist.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
