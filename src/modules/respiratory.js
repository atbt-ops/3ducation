import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

function blob(color, x, y, sx, sy) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, 0);
  m.scale.set(sx, sy, 1);
  return m;
}

// Nose/mouth, trachea, bronchi (fixed — the airway itself doesn't move).
group.add(blob(0xe8b89a, 0, 3.0, 0.22, 0.22));
group.add(blob(0xd8c8b0, 0, 2.0, 0.1, 0.9)); // trachea
group.add(
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(-0.7, 0.3, 0)]),
    new THREE.LineBasicMaterial({ color: 0xd8c8b0 })
  ),
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0.7, 0.3, 0)]),
    new THREE.LineBasicMaterial({ color: 0xd8c8b0 })
  )
);

// Lungs and diaphragm — these are the parts that move as the model "breathes".
const lungL = blob(0xf0a8b8, -0.75, -0.1, 0.55, 0.95);
const lungR = blob(0xf0a8b8, 0.75, -0.1, 0.55, 0.95);
group.add(lungL, lungR);

const diaphragm = blob(0xc98a5a, 0, -1.15, 1.5, 0.18);
group.add(diaphragm);
const DIAPHRAGM_BASE_Y = -1.15;

// Added to the outer group at fixed positions, not as children of lungL/
// lungR/diaphragm — those get resized/repositioned every frame to animate
// breathing, non-uniformly, which would otherwise distort a child label.
const lungLLabel = createLabel("Left lung", { fontSize: 24 });
lungLLabel.position.set(-0.75, 1.0, 0);
group.add(lungLLabel);
const lungRLabel = createLabel("Right lung", { fontSize: 24 });
lungRLabel.position.set(0.75, 1.0, 0);
group.add(lungRLabel);
const diaphragmLabel = createLabel("Diaphragm", { fontSize: 24 });
// -1.75 sat past the diaphragm's own bottom edge (-1.33) and got clipped by
// the canvas edge at this view's framing — keep it just below the mesh instead.
diaphragmLabel.position.set(0, -1.45, 0);
group.add(diaphragmLabel);

const state = { bpm: 15, running: true, t: 0 };
const els = {};

export default {
  id: "respiratory",
  name: "The respiratory system",
  tag: "Biology · Breathing",
  subject: "Biology",
  grades: [5, 9],
  flat: true,
  blurb: "Watch the lungs and diaphragm move as the model breathes.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="8" r="3" fill="currentColor"/><path d="M20 11v9" stroke="currentColor" stroke-width="2"/><path d="M20 20c-8 0-11 5-11 12a4 4 0 0 0 8 0M20 20c8 0 11 5 11 12a4 4 0 0 1-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0.5, 0], radius: 6, theta: 0, phi: 1.5708, minRadius: 3, maxRadius: 11 },

  lesson: `
    <p>Breathing is powered by the <strong>diaphragm</strong>, a dome-shaped muscle beneath your
    lungs. When it contracts and flattens, it pulls downward — that makes more room in your chest,
    so air rushes in and your <strong>lungs</strong> expand. When it relaxes back into a dome, your
    lungs spring back and push air back out.</p>
    <p>Air travels in through your nose or mouth, down the <strong>trachea</strong> (windpipe),
    splits at the <strong>bronchi</strong>, and fills both lungs.</p>
  `,

  quiz: [
    { q: "What happens to the diaphragm when you breathe in?", choices: ["It relaxes and domes upward", "It contracts and flattens downward", "It stops moving", "It disappears"], answer: 1, explain: "The diaphragm flattening downward makes room for the lungs to expand." },
    { q: "Air travels from your throat to your lungs through the…", choices: ["Trachea", "Oesophagus", "Stomach", "Aorta"], answer: 0, explain: "The trachea (windpipe) carries air down to the bronchi and lungs." },
    { q: "When the diaphragm relaxes back into a dome shape, you are…", choices: ["Breathing in", "Breathing out", "Holding your breath", "Coughing"], answer: 1, explain: "As the diaphragm domes upward, it squeezes air back out of the lungs." },
  ],

  presets: [
    { label: "Resting (15/min)", note: "A calm, steady breathing rate.", values: { "rs-bpm": 15 } },
    { label: "After exercise (28/min)", note: "Muscles need more oxygen, so breathing speeds up.", values: { "rs-bpm": 28 } },
    { label: "Slow & deep (6/min)", note: "Deliberately slow breathing.", values: { "rs-bpm": 6 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>Breaths per minute</span><b class="mono" id="rs-bpmval">${state.bpm}</b></div>
      <p class="fact" id="rs-phase"></p>
      <div class="control"><label for="rs-bpm">Breathing rate</label>
        <input type="range" id="rs-bpm" min="4" max="35" step="1" value="${state.bpm}"></div>
      <div class="btn-row"><button class="btn primary" id="rs-toggle" type="button">Pause</button></div>
    `;
  },

  wire(root) {
    els.bpm = root.querySelector("#rs-bpm");
    els.bpmval = root.querySelector("#rs-bpmval");
    els.phase = root.querySelector("#rs-phase");
    els.toggle = root.querySelector("#rs-toggle");

    els.bpm.addEventListener("input", () => {
      state.bpm = +els.bpm.value;
      els.bpmval.textContent = String(state.bpm);
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
  },

  update(dt) {
    if (state.running) state.t += dt;
    const inhale = (Math.sin(state.t * (state.bpm / 60) * Math.PI * 2) + 1) / 2; // 0 = fully exhaled, 1 = fully inhaled
    const scale = 1 + inhale * 0.22;
    lungL.scale.set(0.55 * scale, 0.95 * scale, 1);
    lungR.scale.set(0.55 * scale, 0.95 * scale, 1);
    diaphragm.position.y = DIAPHRAGM_BASE_Y - inhale * 0.3;
    if (els.phase) els.phase.textContent = inhale > 0.5 ? "Breathing in — lungs expanding." : "Breathing out — lungs relaxing.";
  },

  onEnter() {},
  onExit() {},
};
