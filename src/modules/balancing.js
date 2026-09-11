import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const ELEMENT_COLOR = { H: 0xf2ede0, O: 0xd9503f, N: 0x3f66d9, C: 0x33383a, Fe: 0xb8865a };

const REACTIONS = [
  {
    label: "Hydrogen + Oxygen → Water",
    left: [{ formula: "H₂", atoms: { H: 2 } }, { formula: "O₂", atoms: { O: 2 } }],
    right: [{ formula: "H₂O", atoms: { H: 2, O: 1 } }],
    answer: [2, 1, 2],
  },
  {
    label: "Nitrogen + Hydrogen → Ammonia",
    left: [{ formula: "N₂", atoms: { N: 2 } }, { formula: "H₂", atoms: { H: 2 } }],
    right: [{ formula: "NH₃", atoms: { N: 1, H: 3 } }],
    answer: [1, 3, 2],
  },
  {
    label: "Methane + Oxygen → Carbon dioxide + Water",
    left: [{ formula: "CH₄", atoms: { C: 1, H: 4 } }, { formula: "O₂", atoms: { O: 2 } }],
    right: [{ formula: "CO₂", atoms: { C: 1, O: 2 } }, { formula: "H₂O", atoms: { H: 2, O: 1 } }],
    answer: [1, 2, 1, 2],
  },
  {
    label: "Iron + Oxygen → Iron oxide",
    left: [{ formula: "Fe", atoms: { Fe: 1 } }, { formula: "O₂", atoms: { O: 2 } }],
    right: [{ formula: "Fe₂O₃", atoms: { Fe: 2, O: 3 } }],
    answer: [4, 3, 2],
  },
];

let current = 0;
let coeffs = [];

function molCluster(atoms) {
  const g = new THREE.Group();
  const keys = Object.entries(atoms).flatMap(([el, n]) => Array(n).fill(el));
  const n = keys.length;
  keys.forEach((el, i) => {
    const a = (i / n) * Math.PI * 2;
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 12),
      new THREE.MeshStandardMaterial({ color: ELEMENT_COLOR[el] || 0x999999, roughness: 0.4 })
    );
    s.position.set(Math.cos(a) * 0.28 * Math.min(n - 1, 2), Math.sin(a) * 0.28 * Math.min(n - 1, 2), 0);
    g.add(s);
  });
  return g;
}

function build() {
  while (group.children.length) group.remove(group.children[0]);
  const r = REACTIONS[current];
  const species = [...r.left, ...r.right];
  let x = -((species.length - 1) * 1.7) / 2;
  species.forEach((sp, i) => {
    const count = coeffs[i];
    const stack = new THREE.Group();
    for (let k = 0; k < Math.min(count, 4); k++) {
      const m = molCluster(sp.atoms);
      m.position.x = (k - (Math.min(count, 4) - 1) / 2) * 0.75;
      stack.add(m);
    }
    stack.position.x = x;
    stack.userData.label = `${count > 1 ? count : ""}${sp.formula}`;
    group.add(stack);
    x += 1.7;
    if (i === r.left.length - 1) x += 0.4; // gap before arrow, roughly
  });
}

function checkBalance() {
  const r = REACTIONS[current];
  const totals = { left: {}, right: {} };
  r.left.forEach((sp, i) => {
    for (const [el, n] of Object.entries(sp.atoms)) totals.left[el] = (totals.left[el] || 0) + n * coeffs[i];
  });
  r.right.forEach((sp, i) => {
    const ci = r.left.length + i;
    for (const [el, n] of Object.entries(sp.atoms)) totals.right[el] = (totals.right[el] || 0) + n * coeffs[ci];
  });
  const elements = [...new Set([...Object.keys(totals.left), ...Object.keys(totals.right)])];
  const rows = elements.map((el) => ({ el, l: totals.left[el] || 0, r: totals.right[el] || 0 }));
  return { balanced: rows.every((x) => x.l === x.r), rows };
}

const els = {};

function equationText() {
  const r = REACTIONS[current];
  const left = r.left.map((sp, i) => `${coeffs[i] > 1 ? coeffs[i] : ""}${sp.formula}`).join(" + ");
  const right = r.right.map((sp, i) => `${coeffs[r.left.length + i] > 1 ? coeffs[r.left.length + i] : ""}${sp.formula}`).join(" + ");
  return `${left}  →  ${right}`;
}

function renderControls(root) {
  const r = REACTIONS[current];
  const species = [...r.left, ...r.right];
  root.querySelector("#bl-coeffs").innerHTML = species
    .map(
      (sp, i) => `
      <div class="control"><div class="row"><label for="bl-c${i}">${sp.formula}</label><output id="bl-c${i}val" for="bl-c${i}"></output></div>
        <input type="range" id="bl-c${i}" min="1" max="6" step="1" value="${coeffs[i]}"></div>`
    )
    .join("");
  species.forEach((_, i) => {
    const input = root.querySelector(`#bl-c${i}`);
    const out = root.querySelector(`#bl-c${i}val`);
    out.textContent = String(coeffs[i]);
    input.addEventListener("input", () => {
      coeffs[i] = +input.value;
      out.textContent = String(coeffs[i]);
      sync(root);
    });
  });
}

function sync(root) {
  const { balanced, rows } = checkBalance();
  root.querySelector("#bl-eq").textContent = equationText();
  root.querySelector("#bl-status").textContent = balanced ? "Balanced ✓" : "Not balanced yet";
  root.querySelector("#bl-table").innerHTML = rows
    .map((x) => `<div><dt>${x.el}</dt><dd class="mono">${x.l} / ${x.r}</dd></div>`)
    .join("");
  build();
}

export default {
  id: "balancing",
  name: "Balancing equations",
  tag: "Chemistry · Reactions",
  subject: "Chemistry",
  grades: [8, 10],
  flat: true,
  blurb: "Same atoms in as out — find the coefficients.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="14" r="4" fill="currentColor"/><circle cx="10" cy="26" r="4" fill="currentColor"/><path d="M18 20h14M28 20l-4-4M28 20l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8, theta: 0, phi: 1.5708, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>Atoms aren't created or destroyed in a chemical reaction — they're just rearranged. So the
    number of each type of atom on the left must exactly match the number on the right.</p>
    <p>Balancing an equation means finding whole-number <strong>coefficients</strong> — how many of
    each molecule — that make every element's count match on both sides. Change one coefficient and
    it can throw others out, so it's a bit of a puzzle.</p>
  `,

  quiz: [
    { q: "Balancing a chemical equation reflects which law?", choices: ["conservation of energy", "conservation of mass", "conservation of momentum", "Newton's third law"], answer: 1, explain: "Atoms are neither created nor destroyed — matter is conserved." },
    { q: "In 2H₂ + O₂ → 2H₂O, how many oxygen atoms are on each side?", choices: ["1 and 2", "2 and 2", "2 and 1", "4 and 4"], answer: 1, explain: "O₂ gives 2 on the left; 2H₂O gives 2×1 = 2 on the right." },
    { q: "What are you allowed to change to balance an equation?", choices: ["the subscripts inside a formula", "only the coefficients in front", "the elements involved", "nothing at all"], answer: 1, explain: "Changing a subscript would make it a different substance — only coefficients." },
  ],

  presets: [
    { label: "Water", note: "Balance it to 2H₂ + O₂ → 2H₂O.", values: { "bl-reaction": "0" } },
    { label: "Ammonia", note: "The Haber process: N₂ + 3H₂ → 2NH₃.", values: { "bl-reaction": "1" } },
    { label: "Combustion", note: "Methane burning: CH₄ + 2O₂ → CO₂ + 2H₂O.", values: { "bl-reaction": "2" } },
    { label: "Rusting", note: "4Fe + 3O₂ → 2Fe₂O₃.", values: { "bl-reaction": "3" } },
  ],

  panelHTML() {
    return `
      <select id="bl-reaction" class="text-input">
        ${REACTIONS.map((r, i) => `<option value="${i}">${r.label}</option>`).join("")}
      </select>
      <div class="formula"><span id="bl-eq" class="mono">—</span></div>
      <p class="fact" id="bl-status">—</p>
      <div id="bl-coeffs"></div>
      <div class="section-label">Atom count (left / right)</div>
      <dl class="stat-grid" id="bl-table"></dl>
    `;
  },

  wire(root) {
    els.reaction = root.querySelector("#bl-reaction");
    els.reaction.value = String(current);
    els.reaction.addEventListener("input", () => {
      current = +els.reaction.value;
      coeffs = REACTIONS[current].left.map(() => 1).concat(REACTIONS[current].right.map(() => 1));
      renderControls(root);
      sync(root);
    });
    coeffs = REACTIONS[current].left.map(() => 1).concat(REACTIONS[current].right.map(() => 1));
    renderControls(root);
    sync(root);
  },

  update() {},
  onEnter() {},
  onExit() {},
};
