import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.68, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);

const v3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const WASTE_RED = 0x7a1f1f;
const CLEAN_RED = 0xd23b3b;

// Patient (a simplified arm/torso blob) with an artery (blood out) and vein (blood in) access.
const patient = new THREE.Mesh(
  new THREE.SphereGeometry(0.75, 20, 16),
  new THREE.MeshStandardMaterial({ color: 0xe0b08c, roughness: 0.7 })
);
patient.scale.set(1, 1.5, 1);
patient.position.set(-4.4, -0.7, 0);
group.add(patient);
const patientLabel = createLabel("Patient", { fontSize: 26 });
patientLabel.position.set(-4.4, 0.65, 0);
group.add(patientLabel);

// Blood pump.
const pump = new THREE.Mesh(
  new THREE.CylinderGeometry(0.32, 0.32, 0.5, 20),
  new THREE.MeshStandardMaterial({ color: 0x555a63, roughness: 0.4, metalness: 0.5 })
);
pump.rotation.z = Math.PI / 2;
pump.position.set(-2.2, 0.3, 0);
group.add(pump);
const pumpLabel = createLabel("Blood pump", { fontSize: 26 });
pumpLabel.position.set(-2.2, 0.9, 0);
group.add(pumpLabel);

// The dialyzer: an outer shell, a dialyzing-fluid bath, and the inner membrane bundle
// the blood actually flows through — built along local X, then dropped in at its
// world position (the same trick resistors.js uses for a horizontal resistor body).
const dialyzerCenter = [0.2, 0.3, 0];
const dialyzer = new THREE.Group();
dialyzer.position.set(...dialyzerCenter);
group.add(dialyzer);

const shell = new THREE.Mesh(
  new THREE.CylinderGeometry(0.85, 0.85, 2.8, 32, 1, true),
  new THREE.MeshStandardMaterial({ color: 0xcfd3d6, transparent: true, opacity: 0.22, side: THREE.DoubleSide, roughness: 0.3 })
);
shell.rotation.z = Math.PI / 2;
dialyzer.add(shell);

const fluidBath = new THREE.Mesh(
  new THREE.CylinderGeometry(0.68, 0.68, 2.6, 24, 1, true),
  new THREE.MeshStandardMaterial({ color: 0xbfe3e0, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
);
fluidBath.rotation.z = Math.PI / 2;
dialyzer.add(fluidBath);

const membrane = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.28, 2.6, 24, 1, true),
  new THREE.MeshStandardMaterial({ color: 0xe8d9a0, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
);
membrane.rotation.z = Math.PI / 2;
dialyzer.add(membrane);

const dialyzerLabel = createLabel("Dialyzer", { fontSize: 26 });
dialyzerLabel.position.set(0, 1.15, 0);
dialyzer.add(dialyzerLabel);
const fluidLabel = createLabel("Dialyzing fluid", { fontSize: 26 });
fluidLabel.position.set(0, -1.15, 0);
dialyzer.add(fluidLabel);

// Waste particles: drift out of the membrane into the surrounding fluid bath as
// blood passes through — nitrogenous wastes moving from high to low concentration.
const WASTE_N = 10;
const wasteParticles = Array.from({ length: WASTE_N }, (_, i) => {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xd9b23c })
  );
  dialyzer.add(m);
  return { mesh: m, angle: (i / WASTE_N) * Math.PI * 2, axial: THREE.MathUtils.lerp(-1.1, 1.1, i / (WASTE_N - 1)), phase: i * 0.17 };
});

// The full blood loop: artery out → pump → through the dialyzer → looping back to the vein.
const bloodPath = new THREE.CatmullRomCurve3(
  [
    [-3.4, 0.3, 0], // artery (blood out)
    [-2.2, 0.3, 0], // pump
    [-1.2, 0.3, 0], // dialyzer entrance
    [0.2, 0.3, 0], // mid-dialyzer
    [1.6, 0.3, 0], // dialyzer exit
    [2.6, 0.0, 0],
    [2.6, -1.7, 0],
    [-3.4, -1.7, 0],
    [-3.4, -0.4, 0], // vein (blood in)
  ].map(v3),
  false
);
const DIALYZER_ENTER = 2 / 8;
const DIALYZER_EXIT = 4 / 8;

const arteryLabel = createLabel("Artery", { fontSize: 26 });
arteryLabel.position.set(-3.4, 1.55, 0);
group.add(arteryLabel);
const veinLabel = createLabel("Vein", { fontSize: 26 });
veinLabel.position.set(-3.4, -1.0, 0);
group.add(veinLabel);

const BLOOD_N = 10;
const bloodParticles = Array.from({ length: BLOOD_N }, (_, i) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), new THREE.MeshBasicMaterial({ color: WASTE_RED }));
  group.add(m);
  return { mesh: m, u: i / BLOOD_N };
});

const state = { speed: 1, running: true, t: 0 };
const els = {};
const tmpColorA = new THREE.Color();
const tmpColorB = new THREE.Color();

export default {
  id: "dialysis",
  name: "Dialysis machine",
  tag: "Biology · Excretion",
  subject: "Biology",
  grades: [9, 12],
  blurb: "An artificial kidney — how a dialyzer filters wastes straight out of blood.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="10" width="18" height="20" rx="2" stroke="currentColor" stroke-width="2"/><path d="M14 16H6M14 24H6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="6" cy="16" r="2" fill="currentColor"/><circle cx="6" cy="24" r="2" fill="currentColor"/><path d="M19 15v10M27 15v10" stroke="currentColor" stroke-width="1.6" opacity="0.6"/></svg>',
  scene,
  view: { target: [-0.3, -0.5, 0], radius: 11.5, theta: 0.25, phi: 1.3, minRadius: 6, maxRadius: 19 },

  lesson: `
    <p>When both kidneys fail, poisonous nitrogenous wastes build up in the blood — a dangerous
    condition called <em>uremia</em>. A <strong>dialysis machine</strong> acts as an artificial
    kidney, filtering that blood in a process called <strong>haemodialysis</strong>.</p>
    <p>Blood is drawn from an artery, mixed with an anticoagulant (<strong>heparin</strong>) so it
    doesn't clot, and pumped into the <strong>dialyzer</strong>. Inside, it flows through narrow
    tubes made of <strong>cellophane</strong>, a thin membrane that separates the blood from a
    surrounding <strong>dialyzing fluid</strong>. That fluid matches blood plasma — except it has
    no nitrogenous wastes — so the wastes move freely out of the blood and into the fluid. The
    cleaned blood is then pumped back into the body through a vein. A single session takes
    3 to 6 hours.</p>
  `,

  quiz: [
    { q: "What is the process of filtering blood in a dialysis machine called?", choices: ["Osmosis", "Haemodialysis", "Photosynthesis", "Peristalsis"], answer: 1, explain: "The process of filtering blood outside the body is called haemodialysis." },
    { q: "What is added to the blood before it enters the dialyzer, and why?", choices: ["Glucose, for energy", "Heparin, an anticoagulant, to stop it clotting", "Salt, to preserve it", "Insulin, to control sugar"], answer: 1, explain: "Heparin is mixed in so the blood doesn't clot as it's pumped through the machine." },
    { q: "What are the tubes inside the dialyzer, which carry the blood, made of?", choices: ["Glass", "Cellophane", "Rubber", "Steel"], answer: 1, explain: "The blood flows through narrow tubes made of cellophane, a thin selectively permeable membrane." },
    { q: "Why do nitrogenous wastes move out of the blood inside the dialyzer?", choices: ["The pump forces them out", "The dialyzing fluid has none of them, so wastes move from high to low concentration", "The membrane is heated", "Gravity pulls them down"], answer: 1, explain: "With no nitrogenous wastes in the dialyzing fluid, they diffuse freely out of the blood and into it." },
    { q: "About how long does a single dialysis session last?", choices: ["5 minutes", "3 to 6 hours", "2 to 3 days", "a full week"], answer: 1, explain: "Each haemodialysis session typically lasts 3 to 6 hours." },
  ],

  presets: [
    { label: "Normal flow", note: "A steady pace through the whole loop.", values: { "dl-speed": 1 } },
    { label: "Slow motion", note: "Watch each stage — pump, dialyzer, return — one at a time.", values: { "dl-speed": 0.3 } },
    { label: "Fast forward", note: "The same journey, sped way up.", values: { "dl-speed": 2.5 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="dl-speed">Blood flow speed</label><output id="dl-speedval" for="dl-speed"></output></div>
        <input type="range" id="dl-speed" min="0.2" max="2.5" step="0.1" value="${state.speed}"></div>
      <div class="btn-row"><button class="btn primary" id="dl-toggle" type="button">Pause</button></div>
      <p class="fact">Dark red = waste-laden blood. Bright red = cleaned blood. Gold dots = wastes
        diffusing from the membrane into the dialyzing fluid.</p>
    `;
  },

  wire(root) {
    els.speed = root.querySelector("#dl-speed");
    els.speedval = root.querySelector("#dl-speedval");
    els.toggle = root.querySelector("#dl-toggle");

    const sync = () => {
      els.speedval.textContent = `${state.speed.toFixed(1)}×`;
    };
    els.speed.addEventListener("input", () => ((state.speed = parseFloat(els.speed.value)), sync()));
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    sync();
  },

  update(dt) {
    if (!state.running) return;
    state.t += dt * state.speed;

    bloodParticles.forEach((p) => {
      p.u = (p.u + dt * state.speed * 0.05) % 1;
      const pos = bloodPath.getPointAt(p.u);
      p.mesh.position.copy(pos);
      const cleanedFrac = THREE.MathUtils.clamp(
        (p.u - DIALYZER_ENTER) / (DIALYZER_EXIT - DIALYZER_ENTER),
        0,
        1
      );
      tmpColorA.setHex(WASTE_RED);
      tmpColorB.setHex(CLEAN_RED);
      tmpColorA.lerp(tmpColorB, cleanedFrac);
      p.mesh.material.color.copy(tmpColorA);
    });

    wasteParticles.forEach((w) => {
      const cycle = ((state.t * 0.4 + w.phase) % 1 + 1) % 1;
      const r = THREE.MathUtils.lerp(0.3, 0.66, cycle);
      w.mesh.position.set(w.axial, r * Math.cos(w.angle), r * Math.sin(w.angle));
      w.mesh.material.opacity = 1 - cycle * 0.7;
      w.mesh.material.transparent = true;
    });
  },

  onEnter() {},
  onExit() {},
};
