import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

function blob(color, x, y, sx, sy = sx) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, 0);
  m.scale.set(sx, sy, 1);
  return m;
}

// A tube drawn as a chain of overlapping circular "beads" along a polyline —
// gives the small/large intestine visible thickness without a curved-tube
// geometry, reusing the same simple building block as every part here.
function beadedTube(points, color, r) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const segLen = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.round(segLen / (r * 0.85)));
    for (let s = 0; s <= steps; s++) {
      if (i > 0 && s === 0) continue; // shared with the previous segment's last bead
      const t = s / steps;
      g.add(blob(color, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r));
    }
  }
  return g;
}

// Mouth and esophagus.
group.add(blob(0xe8b89a, 0, 3.4, 0.3));
group.add(blob(0xd8c8b0, 0, 2.4, 0.14, 0.75));

// Stomach — a stretched, slightly rotated pouch.
const stomach = blob(0xd97a7a, 0.35, 1.05, 0.55, 0.4);
stomach.rotation.z = -0.5;
group.add(stomach);

// Small intestine — a tight zigzag coil.
const smallIntestinePts = [
  [0, 0.35], [-0.6, 0.05], [0.6, -0.2], [-0.6, -0.45], [0.6, -0.7], [-0.4, -0.95], [0.15, -1.15],
];
group.add(beadedTube(smallIntestinePts, 0xf0a0aa, 0.17));

// Large intestine — a frame around the small intestine (ascending, transverse, descending colon).
const largeIntestinePts = [
  [0.15, -1.15], [1.1, -1.25], [1.1, 0.55], [0, 0.9], [-1.1, 0.55], [-1.1, -1.25], [-0.4, -1.6],
];
group.add(beadedTube(largeIntestinePts, 0xb98a55, 0.23));

const LABELS = [
  { text: "Mouth", pos: [0, 3.85, 0] },
  { text: "Esophagus", pos: [0.6, 2.4, 0] },
  { text: "Stomach", pos: [1.15, 1.05, 0] },
  { text: "Small intestine", pos: [-1.35, -0.5, 0] },
  { text: "Large intestine", pos: [0, 1.25, 0] },
];
LABELS.forEach(({ text, pos }) => {
  const label = createLabel(text, { fontSize: 24, scale: 0.55 });
  label.position.set(...pos);
  group.add(label);
});

// One continuous path a bite of food travels along, start to finish.
const FOOD_PATH = new THREE.CatmullRomCurve3(
  [
    [0, 3.4], [0, 3.1], [0, 1.9], [0.35, 1.35], [0.45, 0.75], [0.15, 0.4],
    ...smallIntestinePts,
    ...largeIntestinePts,
  ].map(([x, y]) => new THREE.Vector3(x, y, 0.02)),
  false,
  "catmullrom",
  0
);

const FOOD_COUNT = 3;
const foodMat = () => new THREE.MeshBasicMaterial({ color: 0xc9a05a });
const foodBits = Array.from({ length: FOOD_COUNT }, (_, i) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), foodMat());
  m.userData.u = i / FOOD_COUNT;
  group.add(m);
  return m;
});

const state = { speed: 1, running: true, t: 0 };
const els = {};

export default {
  id: "digestive",
  name: "The digestive system",
  tag: "Biology · Digestion",
  subject: "Biology",
  grades: [6, 10],
  flat: true,
  blurb: "Follow a bite of food from mouth to large intestine.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="7" r="3" fill="currentColor"/><path d="M20 10v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 16c6 2 4 8-1 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 24c4-2 4 3 8 3s4-5 8-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11 24v9M29 24v9M11 33h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 1.0, 0], radius: 8, theta: 0, phi: 1.5708, minRadius: 3, maxRadius: 13 },

  lesson: `
    <p>Digestion is a single long tube, one mouth-to-end journey. The <strong>mouth</strong> chews and
    wets food; the <strong>esophagus</strong> squeezes it down to the <strong>stomach</strong>, which
    churns it with acid into a thick soup.</p>
    <p>Most nutrients actually get absorbed into the blood in the long, coiled <strong>small
    intestine</strong>. What's left — mostly water and fibre — passes into the wider
    <strong>large intestine</strong>, which absorbs the water back out before the leftover waste
    exits the body.</p>
  `,

  quiz: [
    { q: "Where does most nutrient absorption into the blood happen?", choices: ["Mouth", "Stomach", "Small intestine", "Large intestine"], answer: 2, explain: "The long, coiled small intestine is where nutrients pass into the bloodstream." },
    { q: "The stomach's main job is to…", choices: ["absorb water", "churn food with acid into a soup", "chew food", "store waste"], answer: 1, explain: "Stomach acid and muscular churning break food down into a semi-liquid mix." },
    { q: "The large intestine mainly absorbs…", choices: ["protein", "water", "sugar", "vitamins only"], answer: 1, explain: "It reclaims water from the leftover material before waste is removed from the body." },
  ],

  presets: [
    { label: "Normal speed", note: "A bite of food makes its way through the whole tract.", values: { "dg-speed": 1 } },
    { label: "Slow motion", note: "Watch each organ do its job, one at a time.", values: { "dg-speed": 0.3 } },
    { label: "Fast forward", note: "The same journey, sped way up.", values: { "dg-speed": 3 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="dg-speed">Speed</label><output id="dg-speedval" for="dg-speed"></output></div>
        <input type="range" id="dg-speed" min="0.2" max="3" step="0.1" value="${state.speed}"></div>
      <div class="btn-row"><button class="btn primary" id="dg-toggle" type="button">Pause</button></div>
      <p class="fact">Watch the food (tan dots) travel: mouth → esophagus → stomach → small intestine → large intestine.</p>
    `;
  },

  wire(root) {
    els.speed = root.querySelector("#dg-speed");
    els.speedval = root.querySelector("#dg-speedval");
    els.toggle = root.querySelector("#dg-toggle");

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
    state.t += dt;
    foodBits.forEach((bit) => {
      bit.userData.u = Math.min(1, bit.userData.u + dt * state.speed * 0.05);
      if (bit.userData.u >= 1) bit.userData.u = 0;
      const p = FOOD_PATH.getPointAt(bit.userData.u);
      bit.position.set(p.x, p.y, 0.03);
    });
  },

  onEnter() {},
  onExit() {},
};
