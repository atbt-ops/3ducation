import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.68, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);

const tubeMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.85, metalness: 0.05 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.3, metalness: 0.75 });
const diaphragmMat = new THREE.MeshStandardMaterial({ color: 0xe4e1d6, roughness: 0.45, metalness: 0.2 });

// Main tube: chest piece up to the Y-split. Ear tubes: split out to each ear tip.
const mainPts = [[0, -2.8, 0], [0.3, -1.5, 0.25], [-0.2, -0.2, 0.15], [0, 0.6, 0]];
const rightPts = [[0, 0.6, 0], [0.5, 1.6, -0.25], [1.3, 2.5, -0.35], [1.6, 3.0, -0.35]];
const leftPts = rightPts.map(([x, y, z]) => [-x, y, z]);
const v3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const mainCurve = new THREE.CatmullRomCurve3(mainPts.map(v3));
const rightCurve = new THREE.CatmullRomCurve3(rightPts.map(v3));
const leftCurve = new THREE.CatmullRomCurve3(leftPts.map(v3));

group.add(new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 40, 0.13, 10, false), tubeMat));
group.add(new THREE.Mesh(new THREE.TubeGeometry(rightCurve, 30, 0.09, 8, false), tubeMat));
group.add(new THREE.Mesh(new THREE.TubeGeometry(leftCurve, 30, 0.09, 8, false), tubeMat));

// Split junction.
const junction = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), metalMat);
junction.position.set(0, 0.6, 0);
group.add(junction);

// Ear tips.
[rightPts[rightPts.length - 1], leftPts[leftPts.length - 1]].forEach((p) => {
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), metalMat);
  tip.position.set(...p);
  group.add(tip);
});
const earLabel = createLabel("Ear tips", { fontSize: 26 });
earLabel.position.set(0, 3.55, 0);
group.add(earLabel);

// Chest piece head — swaps shape between diaphragm (wide flat disc) and bell (narrow cup).
const head = new THREE.Group();
head.position.set(0, -3, 0);
group.add(head);
const headLabel = createLabel("Chest piece", { fontSize: 26 });
headLabel.position.set(0, 0.65, 0);
head.add(headLabel);

function buildHead(mode) {
  head.clear();
  head.add(headLabel);
  if (mode === "bell") {
    // A hollow, narrow cup — open bottom for picking up low, rumbly sounds.
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.78, 0.42, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.35, metalness: 0.7, side: THREE.DoubleSide })
    );
    head.add(bell);
  } else {
    // A wide flat disc — the everyday side, tuned for higher-pitched sounds.
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.22, 32), metalMat);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.05, 32), diaphragmMat);
    face.position.y = 0.135;
    head.add(rim, face);
  }
}

// Traveling sound pulses: a little train of dots flowing from the chest piece up to each ear.
const rightPath = new THREE.CatmullRomCurve3([...mainPts.slice(0, -1), ...rightPts].map(v3));
const leftPath = new THREE.CatmullRomCurve3([...mainPts.slice(0, -1), ...leftPts].map(v3));
const PULSE_N = 6;
const pulseMat = () => new THREE.MeshBasicMaterial({ color: 0xf2b705 });
const pulses = Array.from({ length: PULSE_N }, (_, i) => {
  const right = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), pulseMat());
  const left = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), pulseMat());
  group.add(right, left);
  return { u: i / PULSE_N, right, left };
});

const state = { bpm: 72, mode: "diaphragm", t: 0 };
const els = {};

function freqMultiplier() {
  return state.mode === "diaphragm" ? 3.2 : 1.15;
}
function pulseSize() {
  return state.mode === "diaphragm" ? 0.055 : 0.095;
}

buildHead(state.mode);

export default {
  id: "stethoscope",
  name: "Stethoscope",
  tag: "Biology · Circulation",
  subject: "Biology",
  grades: [6, 11],
  blurb: "How a tube and a disc turn a heartbeat into a sound you can hear.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6v10a8 8 0 0 0 16 0V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="28" cy="5" r="2" fill="currentColor"/><path d="M20 24v3a6 6 0 0 0 12 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="27" r="3" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0.2, 0], radius: 9.5, theta: 0.35, phi: 1.3, minRadius: 5, maxRadius: 16 },

  lesson: `
    <p>Before 1816, doctors listened to a patient's heart by pressing an ear straight onto the chest.
    The French physician <strong>René Laennec</strong> found that a rolled-up paper tube carried the
    sound just as well — and was a lot less awkward. He switched to a hollow wooden tube and called
    his invention the <em>stethoscope</em>, from Greek words meaning "chest" and "to look at".</p>
    <p>A modern stethoscope's chest piece often has two sides. The wide, flat
    <strong>diaphragm</strong> stretches a thin plastic disc that vibrates well with higher-pitched
    sounds, like normal heart and lung sounds. The small, open <strong>bell</strong> picks up
    low, rumbly sounds instead. Either way, the sealed tube does the real work: it funnels the
    vibrations straight to the ear, keeping outside noise from drowning them out.</p>
  `,

  quiz: [
    { q: "Who invented the stethoscope, and in what year?", choices: ["Robert Koch, 1876", "René Laennec, 1816", "Marcello Malpighi, 1661", "William Harvey, 1628"], answer: 1, explain: "René Laennec invented it in 1816, after finding a rolled paper tube carried heart sounds well." },
    { q: "What did Laennec use for his tube before settling on wood?", choices: ["Glass", "Rubber", "Rolled paper", "Bamboo only"], answer: 2, explain: "He first found a rolled paper tube worked, then moved to a wooden tube." },
    { q: "Why did doctors need a tube at all, instead of just listening directly?", choices: ["It was more polite and comfortable than pressing an ear to the chest", "It made the heartbeat louder than any other method ever could", "It was required by law", "It let the doctor see inside the chest"], answer: 0, explain: "Direct ear-to-chest listening worked but was awkward and impractical — a tube was a more practical, comfortable stand-in that also happened to carry the sound well." },
    { q: "The stethoscope's narrow, open 'bell' side is best for hearing…", choices: ["high-pitched sounds only", "low-pitched, rumbly sounds", "nothing — it's just decorative", "only lung sounds, never the heart"], answer: 1, explain: "The bell is tuned to pick up low-frequency sounds that the flatter diaphragm side is less sensitive to." },
  ],

  presets: [
    { label: "Resting heart (diaphragm)", note: "A calm 72 bpm through the everyday flat side.", values: { "st-bpm": 72, "st-mode": "diaphragm" } },
    { label: "After exercise (diaphragm)", note: "A faster heart pushes sound pulses through quicker.", values: { "st-bpm": 140, "st-mode": "diaphragm" } },
    { label: "Listening for a low rumble (bell)", note: "Switch to the bell for slow, low-pitched sounds.", values: { "st-bpm": 60, "st-mode": "bell" } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>heart rate</span><b class="mono" id="st-out">${state.bpm} bpm</b></div>
      <div class="control"><div class="row"><label for="st-bpm">Beats per minute</label><output id="st-bpmval" for="st-bpm"></output></div>
        <input type="range" id="st-bpm" min="40" max="180" step="1" value="${state.bpm}"></div>
      <select id="st-mode" class="text-input" aria-label="Chest piece side">
        <option value="diaphragm">Diaphragm (higher pitch)</option>
        <option value="bell">Bell (lower pitch)</option>
      </select>
      <p class="fact">Watch the sound (gold dots) travel from the chest piece up the tube to both ears.</p>
    `;
  },

  wire(root) {
    els.bpm = root.querySelector("#st-bpm");
    els.bpmval = root.querySelector("#st-bpmval");
    els.out = root.querySelector("#st-out");
    els.mode = root.querySelector("#st-mode");

    const sync = () => {
      els.bpmval.textContent = `${state.bpm}`;
      els.out.textContent = `${state.bpm} bpm`;
    };
    els.bpm.addEventListener("input", () => ((state.bpm = +els.bpm.value), sync()));
    els.mode.addEventListener("input", () => {
      state.mode = els.mode.value;
      buildHead(state.mode);
    });
    sync();
  },

  update(dt) {
    state.t += dt * freqMultiplier() * (state.bpm / 72);
    const size = pulseSize();
    pulses.forEach((p, i) => {
      const u = (((i / PULSE_N + state.t * 0.5) % 1) + 1) % 1;
      const rp = rightPath.getPointAt(u);
      const lp = leftPath.getPointAt(u);
      p.right.position.copy(rp);
      p.left.position.copy(lp);
      p.right.scale.setScalar(size);
      p.left.scale.setScalar(size);
    });
  },

  onEnter() {},
  onExit() {},
};
