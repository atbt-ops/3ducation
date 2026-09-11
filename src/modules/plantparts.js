import * as THREE from "three";

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

const GROUND_Y = 0;
const ground = new THREE.Mesh(
  new THREE.BoxGeometry(3.4, 0.05, 0.05),
  new THREE.MeshBasicMaterial({ color: 0x9a8a6a })
);
ground.position.y = GROUND_Y;
group.add(ground);

// Roots — a fan of simple lines below the ground line.
const rootsGroup = new THREE.Group();
const ROOT_TIPS = [
  [-0.9, -1.5],
  [-0.4, -1.8],
  [0.1, -1.9],
  [0.5, -1.7],
  [0.9, -1.4],
];
ROOT_TIPS.forEach(([tx, ty]) => {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, GROUND_Y, 0), new THREE.Vector3(tx, ty, 0)]),
    new THREE.LineBasicMaterial({ color: 0x8a6a3a, linewidth: 2 })
  );
  rootsGroup.add(line);
});
group.add(rootsGroup);

// Stem — a thin vertical bar rising from the ground.
const STEM_TOP = 1.7;
const stemGroup = new THREE.Group();
stemGroup.add(blob(0x4a8a3a, 0, STEM_TOP / 2, 0.07, STEM_TOP / 2));
group.add(stemGroup);

// Leaves — a few ellipse blobs along the stem.
const leavesGroup = new THREE.Group();
leavesGroup.add(blob(0x5fa84a, -0.55, 0.9, 0.55, 0.28));
leavesGroup.add(blob(0x5fa84a, 0.55, 1.2, 0.55, 0.28));
leavesGroup.add(blob(0x6fbf58, -0.5, 0.5, 0.4, 0.2));
group.add(leavesGroup);

// Flower — a ring of petals around a bright centre, at the top of the stem.
const flowerGroup = new THREE.Group();
const petalColors = [0xe8608a, 0xef7aa0, 0xe8608a, 0xef7aa0, 0xe8608a];
for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2;
  const petal = blob(petalColors[i], Math.cos(a) * 0.32, STEM_TOP + 0.3 + Math.sin(a) * 0.32, 0.24, 0.24);
  flowerGroup.add(petal);
}
flowerGroup.add(blob(0xffcf4a, 0, STEM_TOP + 0.3, 0.17, 0.17));
group.add(flowerGroup);

const PARTS = [
  { name: "Roots", group: rootsGroup, desc: "Anchor the plant in the soil, and absorb the water and minerals it needs — usually hidden underground." },
  { name: "Stem", group: stemGroup, desc: "Supports the plant and holds it upright, and carries water and nutrients between the roots and the leaves." },
  { name: "Leaves", group: leavesGroup, desc: "Capture sunlight and use it to make the plant's food, through photosynthesis." },
  { name: "Flower", group: flowerGroup, desc: "Makes seeds, so the plant can reproduce and grow new plants." },
];

const state = { part: 0, t: 0 };
const els = {};

export default {
  id: "plantparts",
  name: "Parts of a plant",
  tag: "Biology · Plants",
  subject: "Biology",
  grades: [2, 6],
  flat: true,
  blurb: "Roots, stem, leaves, flower — what each part does for the plant.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 34V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 20c-5 0-8-3-8-8 5 0 8 3 8 8ZM20 24c5 0 8-3 8-8-5 0-8 3-8 8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="10" r="4" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0.4, 0], radius: 5, theta: 0, phi: 1.5708, minRadius: 3, maxRadius: 9 },

  lesson: `
    <p>A plant is a team of parts working together. <strong>Roots</strong> pull water and minerals
    from the soil. The <strong>stem</strong> carries that water up to the <strong>leaves</strong>,
    which use sunlight to make food. And the <strong>flower</strong> makes seeds, so the plant can
    make more plants.</p>
    <p>Step through each part to see where it is and what job it does.</p>
  `,

  quiz: [
    { q: "Which part absorbs water and minerals from the soil?", choices: ["Flower", "Leaves", "Roots", "Stem"], answer: 2, explain: "Roots grow into the soil and soak up water and nutrients." },
    { q: "Leaves make food for the plant using sunlight — this process is called…", choices: ["Respiration", "Photosynthesis", "Germination", "Pollination"], answer: 1, explain: "Photosynthesis turns sunlight, water and carbon dioxide into food (and oxygen)." },
    { q: "What does the flower's job lead to?", choices: ["Deeper roots", "A taller stem", "Making seeds for new plants", "Bigger leaves"], answer: 2, explain: "Flowers produce seeds, which is how plants reproduce." },
  ],

  presets: [
    { label: "Roots", note: "Underground — absorbing water and minerals.", values: { "pp-part": 0 } },
    { label: "Stem", note: "Carries water up to the leaves.", values: { "pp-part": 1 } },
    { label: "Leaves", note: "Make food using sunlight.", values: { "pp-part": 2 } },
    { label: "Flower", note: "Makes seeds for new plants.", values: { "pp-part": 3 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="pp-name">Roots</span></div>
      <p class="fact" id="pp-desc"></p>
      <div class="control"><div class="row"><label for="pp-part">Part</label><output id="pp-partval" for="pp-part"></output></div>
        <input type="range" id="pp-part" min="0" max="3" step="1" value="${state.part}"></div>
    `;
  },

  wire(root) {
    els.part = root.querySelector("#pp-part");
    els.partval = root.querySelector("#pp-partval");
    els.name = root.querySelector("#pp-name");
    els.desc = root.querySelector("#pp-desc");

    const sync = () => {
      const i = Math.max(0, Math.min(3, Math.round(+els.part.value)));
      state.part = i;
      const p = PARTS[i];
      els.partval.textContent = p.name;
      els.name.textContent = p.name;
      els.desc.textContent = p.desc;
    };
    els.part.addEventListener("input", sync);
    sync();
  },

  update(dt) {
    state.t += dt;
    PARTS.forEach((p, i) => {
      const scale = i === state.part ? 1.08 + Math.sin(state.t * 4) * 0.04 : 1;
      p.group.scale.set(scale, scale, 1);
    });
  },

  onEnter() {},
  onExit() {},
};
