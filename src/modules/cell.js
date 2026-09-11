import * as THREE from "three";
import { sceneLights, prefersReducedMotion } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);
let spin = !prefersReducedMotion;
let plant = false;

const PARTS = {
  membrane: { label: "Cell membrane", fn: "The gatekeeper — a flexible double layer that controls what enters and leaves." },
  wall: { label: "Cell wall", fn: "A stiff outer jacket of cellulose. Plant cells only; it gives them their box shape." },
  nucleus: { label: "Nucleus", fn: "The control centre. Holds the DNA and directs everything the cell does." },
  mito: { label: "Mitochondrion", fn: "The powerhouse. Breaks down sugar with oxygen to release usable energy (ATP)." },
  chloro: { label: "Chloroplast", fn: "Where photosynthesis happens — traps sunlight to build sugar. Plant cells only." },
  er: { label: "Endoplasmic reticulum", fn: "A folded factory floor that builds and ships proteins and fats." },
  golgi: { label: "Golgi body", fn: "The packaging depot — modifies, sorts and parcels proteins for delivery." },
  vac: { label: "Vacuole", fn: "A storage bag for water and nutrients. Huge in plant cells, keeping them firm." },
  ribo: { label: "Ribosomes", fn: "Tiny machines that read the genetic code and assemble proteins." },
};

const meshes = {};
const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, ...opts });

function build() {
  while (group.children.length) group.remove(group.children[0]);

  const membrane = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 40, 30),
    mat(0x9ad0c8, { transparent: true, opacity: 0.16, side: THREE.DoubleSide })
  );
  membrane.userData.part = "membrane";
  group.add(membrane);
  meshes.membrane = membrane;
  const membraneLabel = createLabel("Membrane", { fontSize: 32 });
  membraneLabel.position.set(0, 2.65, 0);
  membrane.add(membraneLabel);

  if (plant) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(5.3, 5.3, 5.3), mat(0x8a6a3a, { wireframe: true }));
    wall.userData.part = "wall";
    group.add(wall);
    meshes.wall = wall;
    const wallLabel = createLabel("Cell wall", { fontSize: 32 });
    wallLabel.position.set(0, 2.95, 0);
    wall.add(wallLabel);
  }

  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.85, 28, 22), mat(0x6d4bb1));
  nucleus.position.set(0.3, 0.2, 0);
  nucleus.userData.part = "nucleus";
  group.add(nucleus);
  meshes.nucleus = nucleus;
  const nucleusLabel = createLabel("Nucleus", { fontSize: 32 });
  nucleusLabel.position.set(0, 1.15, 0);
  nucleus.add(nucleusLabel);

  const mitoPositions = [
    [-1.3, 0.6, 0.5], [1.1, -1.1, -0.6], [-0.6, -1.2, 0.9], [1.4, 0.9, 0.4],
  ];
  mitoPositions.forEach((p, i) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 8, 14), mat(0xd9503f));
    m.position.set(...p);
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    m.userData.part = "mito";
    group.add(m);
    // Label only one — four identical labels on four identical organelles would just clutter the view.
    if (i === 0) {
      const label = createLabel("Mitochondrion", { fontSize: 28 });
      label.position.set(0, 0.55, 0);
      m.add(label);
    }
  });

  if (plant) {
    [[-1.5, -0.4, -0.8], [1.3, 0.2, 1.1], [0.2, 1.5, -0.9]].forEach((p, i) => {
      const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.4, 8, 14), mat(0x4fa032));
      c.position.set(...p);
      c.userData.part = "chloro";
      group.add(c);
      if (i === 0) {
        const label = createLabel("Chloroplast", { fontSize: 28 });
        label.position.set(0, 0.55, 0);
        c.add(label);
      }
    });
    const vac = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 18), mat(0x7f9cc9, { transparent: true, opacity: 0.4 }));
    vac.position.set(-0.6, -0.3, -0.3);
    vac.userData.part = "vac";
    group.add(vac);
    const vacLabel = createLabel("Vacuole", { fontSize: 30 });
    vacLabel.position.set(0, 1.35, 0);
    vac.add(vacLabel);
  } else {
    const vac = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), mat(0x7f9cc9, { transparent: true, opacity: 0.4 }));
    vac.position.set(-1.2, 0.7, -0.6);
    vac.userData.part = "vac";
    group.add(vac);
    const vacLabel = createLabel("Vacuole", { fontSize: 30 });
    vacLabel.position.set(0, 0.7, 0);
    vac.add(vacLabel);
  }

  const golgi = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const disc = new THREE.Mesh(new THREE.TorusGeometry(0.3 - i * 0.03, 0.05, 8, 20), mat(0xe3b23c));
    disc.position.y = i * 0.12;
    disc.rotation.x = Math.PI / 2;
    golgi.add(disc);
  }
  golgi.position.set(1.2, -0.4, 0.6);
  golgi.userData.part = "golgi";
  golgi.traverse((o) => (o.userData.part = "golgi"));
  group.add(golgi);
  const golgiLabel = createLabel("Golgi body", { fontSize: 28 });
  golgiLabel.position.set(0, 0.55, 0);
  golgi.add(golgiLabel);

  const er = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.7, 0.06, 80, 8, 2, 3),
    mat(0x69bf4a)
  );
  er.position.set(-0.6, -0.1, 0.3);
  er.userData.part = "er";
  group.add(er);
  const erLabel = createLabel("Endoplasmic reticulum", { fontSize: 26 });
  erLabel.position.set(0, 0.95, 0);
  er.add(erLabel);

  for (let i = 0; i < 40; i++) {
    const r = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(0x23271f));
    const rad = 1.6 + Math.random() * 0.6;
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    r.position.set(rad * Math.sin(b) * Math.cos(a), rad * Math.sin(b) * Math.sin(a), rad * Math.cos(b));
    r.userData.part = "ribo";
    group.add(r);
    // One label stands in for all 40 — they're scattered dots, not individually distinct.
    if (i === 0) {
      const label = createLabel("Ribosomes", { fontSize: 28 });
      label.position.set(0, 0.28, 0);
      r.add(label);
    }
  }
}
build();

// Labels are Sprites parented onto organelle meshes/groups (see build()) purely for display —
// excluded here so they're never raycast targets or emissive-highlighted like a real organelle.
const pickables = () =>
  group.children.flatMap((c) => (c.type === "Group" ? c.children : [c])).filter((m) => m.type !== "Sprite");
const els = {};

function select(part) {
  pickables().forEach((m) => {
    if (!m.material) return;
    m.material.emissive?.setHex(m.userData.part === part ? 0x333300 : 0x000000);
  });
  if (!els.name) return;
  els.name.textContent = PARTS[part].label;
  els.fn.textContent = PARTS[part].fn;
}

export default {
  id: "cell",
  name: "Cell explorer",
  tag: "Biology · The cell",
  subject: "Biology",
  grades: [6, 10],
  blurb: "Fly inside a cell and tap its parts.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="2"/><circle cx="22" cy="18" r="5" fill="currentColor"/><ellipse cx="13" cy="25" rx="4" ry="2.4" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0.7, phi: 1.1, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>Every living thing is built from <strong>cells</strong> — tiny bags of chemistry that each do a
    job. Inside, specialised parts called <strong>organelles</strong> divide the work: the nucleus
    stores instructions, mitochondria release energy, ribosomes build proteins.</p>
    <p>Plant cells add three things animal cells don't have: a stiff <em>cell wall</em>, green
    <em>chloroplasts</em> for photosynthesis, and one big central <em>vacuole</em>. Toggle between
    the two and tap any part to read what it does.</p>
  `,

  quiz: [
    { q: "Which organelle releases usable energy from sugar?", choices: ["nucleus", "mitochondrion", "ribosome", "vacuole"], answer: 1, explain: "Mitochondria carry out respiration, producing ATP." },
    { q: "Three parts a plant cell has but an animal cell doesn't:", choices: ["nucleus, ribosomes, membrane", "cell wall, chloroplasts, large vacuole", "mitochondria, Golgi, ER", "DNA, cytoplasm, proteins"], answer: 1, explain: "Cell wall, chloroplasts and a big central vacuole are plant-only." },
    { q: "The nucleus is best described as the cell's…", choices: ["power plant", "control centre", "waste bin", "outer skin"], answer: 1, explain: "It holds the DNA and directs the cell's activities." },
  ],

  presets: [
    { label: "Animal cell", note: "No wall, no chloroplasts, small scattered vacuoles.", values: { "cell-type": "animal" } },
    { label: "Plant cell", note: "Note the boxy wall, green chloroplasts and one large vacuole.", values: { "cell-type": "plant" } },
  ],

  panelHTML() {
    const btns = Object.entries(PARTS)
      .map(([k, v]) => `<button class="chip" data-part="${k}">${v.label}</button>`)
      .join("");
    return `
      <select id="cell-type" class="text-input" aria-label="Cell type">
        <option value="animal">Animal cell</option>
        <option value="plant">Plant cell</option>
      </select>
      <div class="chip-row" id="cell-parts" role="group" aria-label="Organelles">${btns}</div>
      <div class="formula"><span id="cell-name">Tap an organelle</span></div>
      <p class="fact" id="cell-fn">Or use the buttons above.</p>
      <div class="btn-row"><button class="btn" id="cell-spin" type="button" aria-pressed="${spin}">Spin: ${spin ? "on" : "off"}</button></div>
    `;
  },

  wire(root) {
    els.type = root.querySelector("#cell-type");
    els.parts = root.querySelector("#cell-parts");
    els.name = root.querySelector("#cell-name");
    els.fn = root.querySelector("#cell-fn");
    els.spin = root.querySelector("#cell-spin");

    els.type.addEventListener("input", () => {
      plant = els.type.value === "plant";
      build();
      els.name.textContent = "Tap an organelle";
      els.fn.textContent = "Or use the buttons above.";
    });
    els.parts.addEventListener("click", (e) => {
      const b = e.target.closest("[data-part]");
      if (b) select(b.dataset.part);
    });
    els.spin.addEventListener("click", () => {
      spin = !spin;
      els.spin.textContent = `Spin: ${spin ? "on" : "off"}`;
      els.spin.setAttribute("aria-pressed", String(spin));
    });
  },

  update(dt, viewer) {
    if (spin && !viewer.dragging) group.rotation.y += dt * 0.2;
  },

  onEnter(viewer) {
    viewer.onPick = (x, y) => {
      const hits = viewer.pick(x, y, pickables());
      if (hits.length && hits[0].object.userData.part) select(hits[0].object.userData.part);
    };
  },
  onExit(viewer) {
    if (viewer) viewer.onPick = null;
  },
};
