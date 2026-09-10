import * as THREE from "three";
import { sceneLights, bondMesh, prefersReducedMotion } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.6, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);
let autorotate = !prefersReducedMotion;

const ELEMENTS = {
  O: { color: 0xd9503f, r: 0.34 },
  H: { color: 0xf2ede0, r: 0.19 },
  C: { color: 0x33383a, r: 0.4 },
  N: { color: 0x3f66d9, r: 0.32 },
};
const UNIT = 1.35;

const DATA = {
  water: {
    label: "Water",
    formula: "H₂O",
    angle: "104.5°",
    geom: "Bent",
    note: "Two lone pairs on the oxygen push the hydrogens together, bending a molecule that would otherwise be a straight line.",
    atoms: [["O", [0, 0, 0]], ["H", [0.76, 0.59, 0]], ["H", [-0.76, 0.59, 0]]],
    bonds: [[0, 1], [0, 2]],
  },
  methane: {
    label: "Methane",
    formula: "CH₄",
    angle: "109.5°",
    geom: "Tetrahedral",
    note: "Four identical bonds spread out as far from each other as possible, landing on the corners of a tetrahedron.",
    atoms: [
      ["C", [0, 0, 0]],
      ["H", [0.9, 0.9, 0.9]],
      ["H", [0.9, -0.9, -0.9]],
      ["H", [-0.9, 0.9, -0.9]],
      ["H", [-0.9, -0.9, 0.9]],
    ],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
  },
  co2: {
    label: "Carbon dioxide",
    formula: "CO₂",
    angle: "180°",
    geom: "Linear",
    note: "With no lone pairs on the carbon to crowd the bonds, the two oxygens sit on exact opposite sides — a straight line.",
    atoms: [["C", [0, 0, 0]], ["O", [1.16, 0, 0]], ["O", [-1.16, 0, 0]]],
    bonds: [[0, 1], [0, 2]],
  },
  ammonia: {
    label: "Ammonia",
    formula: "NH₃",
    angle: "≈107°",
    geom: "Trigonal pyramidal",
    note: "One lone pair on the nitrogen takes up a fourth tetrahedral slot, compressing the H–N–H angle from 109.5° to about 107°.",
    atoms: [
      ["N", [0, 0, 0]],
      ["H", [0.9, 0.9, 0.9]],
      ["H", [0.9, -0.9, -0.9]],
      ["H", [-0.9, 0.9, -0.9]],
    ],
    bonds: [[0, 1], [0, 2], [0, 3]],
  },
};
const order = ["water", "methane", "co2", "ammonia"];
let current = "water";

function build(key) {
  while (group.children.length) group.remove(group.children[0]);
  const d = DATA[key];
  const positions = [];
  d.atoms.forEach((a) => {
    const el = ELEMENTS[a[0]];
    const pos = new THREE.Vector3(a[1][0] * UNIT, a[1][1] * UNIT, a[1][2] * UNIT);
    positions.push(pos);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(el.r, 26, 20),
      new THREE.MeshStandardMaterial({ color: el.color, roughness: 0.4, metalness: 0.08 })
    );
    mesh.position.copy(pos);
    group.add(mesh);
  });
  d.bonds.forEach((b) => group.add(bondMesh(positions[b[0]], positions[b[1]], 0.09, 0xcabf9e)));
}
build(current);

const els = {};

export default {
  id: "molecule",
  name: "Molecule kit",
  tag: "Chemistry · Bonding",
  subject: "Chemistry",
  grades: [9, 12],
  blurb: "Rotate real molecules and read their bond angles.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="14" r="4.4" fill="currentColor"/><circle cx="12" cy="28" r="3.4" stroke="currentColor" stroke-width="2"/><circle cx="28" cy="28" r="3.4" stroke="currentColor" stroke-width="2"/><path d="M17.4 17.4L14 25M22.6 17.4L26 25" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 4.2, theta: 0.6, phi: 1.15, minRadius: 2, maxRadius: 10 },

  lesson: `
    <p>Electrons around a central atom come in two kinds: <strong>bonding pairs</strong> shared with
    another atom, and <strong>lone pairs</strong> that belong to the central atom alone. Both are
    clouds of negative charge, and both push each other as far apart as they can.</p>
    <p>That single idea — <em>electron pairs repel</em> — predicts the shape. Four pairs point at a
    tetrahedron (109.5°). Swap a bonding pair for a lone pair and the remaining bonds get squeezed a
    little closer: 107° in ammonia, 104.5° in water.</p>
  `,

  quiz: [
    {
      q: "Why is water bent rather than a straight line like CO₂?",
      choices: [
        "Hydrogen is lighter than oxygen",
        "Two lone pairs on the oxygen push the O–H bonds together",
        "Water molecules are frozen",
        "The bonds are different lengths",
      ],
      answer: 1,
      explain: "CO₂'s carbon has no lone pairs, so it stays linear. Oxygen in water has two.",
    },
    {
      q: "Methane's H–C–H angle is 109.5°. That angle is the geometry of a…",
      choices: ["square", "tetrahedron", "hexagon", "straight line"],
      answer: 1,
      explain: "Four equivalent bonding pairs spread to the corners of a tetrahedron.",
    },
    {
      q: "Ammonia (107°) has a smaller bond angle than methane (109.5°) because…",
      choices: [
        "nitrogen is bigger than carbon",
        "it has one lone pair that pushes the bonds closer",
        "it has an extra hydrogen",
        "it is a gas",
      ],
      answer: 1,
      explain: "A lone pair takes a tetrahedral slot and compresses the remaining bond angles.",
    },
  ],

  panelHTML() {
    const chips = order
      .map(
        (k) =>
          `<button class="chip" data-mol="${k}" aria-pressed="${k === current}">${DATA[k].formula}</button>`
      )
      .join("");
    const d = DATA[current];
    return `
      <div class="chip-row" id="mol-chips" role="group" aria-label="Choose a molecule">${chips}</div>
      <div class="formula"><span id="mol-name">${d.label}</span><b class="mono" id="mol-formula">${d.formula}</b></div>
      <p class="fact" id="mol-note">${d.note}</p>
      <div class="section-label">Geometry</div>
      <div class="formula"><span id="mol-geom">${d.geom}</span><b class="mono" id="mol-angle">${d.angle}</b></div>
      <div class="btn-row"><button class="btn" id="mol-spin" type="button" aria-pressed="${autorotate}">Auto-rotate: ${autorotate ? "on" : "off"}</button></div>
    `;
  },

  wire(root) {
    els.chips = root.querySelector("#mol-chips");
    els.name = root.querySelector("#mol-name");
    els.formula = root.querySelector("#mol-formula");
    els.note = root.querySelector("#mol-note");
    els.geom = root.querySelector("#mol-geom");
    els.angle = root.querySelector("#mol-angle");
    els.spin = root.querySelector("#mol-spin");

    els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mol]");
      if (!btn) return;
      current = btn.getAttribute("data-mol");
      build(current);
      els.chips.querySelectorAll(".chip").forEach((c) =>
        c.setAttribute("aria-pressed", c === btn ? "true" : "false")
      );
      const d = DATA[current];
      els.name.textContent = d.label;
      els.formula.textContent = d.formula;
      els.note.textContent = d.note;
      els.geom.textContent = d.geom;
      els.angle.textContent = d.angle;
    });
    els.spin.addEventListener("click", () => {
      autorotate = !autorotate;
      els.spin.textContent = `Auto-rotate: ${autorotate ? "on" : "off"}`;
      els.spin.setAttribute("aria-pressed", String(autorotate));
    });
  },

  update(dt, viewer) {
    if (autorotate && !viewer.dragging) group.rotation.y += dt * 0.35;
  },

  onEnter() {},
  onExit() {},
};
