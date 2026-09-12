import * as THREE from "three";
import { sceneLights, prefersReducedMotion } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.68, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);
let spin = !prefersReducedMotion;

const NA_COLOR = 0x8f5fd0;
const CL_COLOR = 0x4fa068;

// Background lattice — a small rock-salt-structure grid of alternating ions,
// dimmed and translucent so it reads as context, not the main subject. No
// labels here: nine-plus identical spheres would just be visual noise.
const lattice = new THREE.Group();
group.add(lattice);
const SPACING = 0.85;
for (let i = -1; i <= 1; i++) {
  for (let j = -1; j <= 1; j++) {
    for (let k = -1; k <= 1; k++) {
      const isNa = (i + j + k + 3) % 2 === 0;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(isNa ? 0.22 : 0.3, 16, 12),
        new THREE.MeshStandardMaterial({
          color: isNa ? NA_COLOR : CL_COLOR,
          transparent: true,
          opacity: 0.4,
          roughness: 0.5,
        })
      );
      mesh.position.set(i * SPACING, j * SPACING - 2.1, k * SPACING);
      lattice.add(mesh);
    }
  }
}
const latticeLabel = createLabel("Ionic lattice", { fontSize: 26, scale: 0.55 });
latticeLabel.position.set(0, -2.1 + SPACING + 0.6, 0);
lattice.add(latticeLabel);

// Foreground pair — the single electron-transfer event, shown large and clear.
const naAtom = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 24, 18),
  new THREE.MeshStandardMaterial({ color: NA_COLOR, roughness: 0.4 })
);
naAtom.position.set(-1.1, 1.1, 0);
group.add(naAtom);
const naLabel = createLabel("Na", { fontSize: 30, scale: 0.6 });
naLabel.position.set(0, 0.75, 0);
naAtom.add(naLabel);

const clAtom = new THREE.Mesh(
  new THREE.SphereGeometry(0.62, 24, 18),
  new THREE.MeshStandardMaterial({ color: CL_COLOR, roughness: 0.4 })
);
clAtom.position.set(1.1, 1.1, 0);
group.add(clAtom);
const clLabel = createLabel("Cl", { fontSize: 30, scale: 0.6 });
clLabel.position.set(0, 0.87, 0);
clAtom.add(clLabel);

const electron = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 14, 10),
  new THREE.MeshBasicMaterial({ color: 0xf2c94c })
);
group.add(electron);

const bondLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineDashedMaterial({ color: 0x8a8a86, dashSize: 0.1, gapSize: 0.08, transparent: true, opacity: 0 })
);
group.add(bondLine);

const state = { transferred: false, anim: 0 };

function refreshGeometry() {
  const t = state.anim;
  const naX = THREE.MathUtils.lerp(-1.1, -0.85, t);
  const clX = THREE.MathUtils.lerp(1.1, 0.85, t);
  naAtom.position.x = naX;
  clAtom.position.x = clX;

  // Docked just outside each atom's surface (radius + a small gap), on the
  // side facing the other atom — not merely offset toward it, which for a
  // large sphere like Cl could land the point back inside the solid mesh.
  const ANGLE = Math.PI * 0.32;
  const naR = naAtom.geometry.parameters.radius + 0.05;
  const clR = clAtom.geometry.parameters.radius + 0.05;
  const startPt = new THREE.Vector3(naX + Math.cos(ANGLE) * naR, 1.1 + Math.sin(ANGLE) * naR, 0);
  const endPt = new THREE.Vector3(clX - Math.cos(ANGLE) * clR, 1.1 + Math.sin(ANGLE) * clR, 0);
  electron.position.lerpVectors(startPt, endPt, t);
  electron.position.y += Math.sin(t * Math.PI) * 0.35;

  bondLine.geometry.setFromPoints([
    new THREE.Vector3(naX + 0.5, 1.1, 0),
    new THREE.Vector3(clX - 0.62, 1.1, 0),
  ]);
  bondLine.computeLineDistances();
  bondLine.material.opacity = t;
}
refreshGeometry();

const els = {};

export default {
  id: "ionicbond",
  name: "Ionic bonding",
  tag: "Chemistry · Bonding",
  subject: "Chemistry",
  grades: [9, 10],
  blurb: "Watch an electron jump from sodium to chlorine — and a crystal form.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="18" r="7" stroke="currentColor" stroke-width="2"/><circle cx="27" cy="18" r="9" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="10" r="2.4" fill="currentColor"/><path d="M15 12L25 10" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1 2"/></svg>',
  scene,
  view: { target: [0, 0.2, 0], radius: 6.5, theta: 0.4, phi: 1.15, minRadius: 3, maxRadius: 12 },

  lesson: `
    <p>A sodium atom holds a single, loosely-bound outer electron; a chlorine atom is one electron
    short of a full outer shell. Sodium gives that electron away — becoming a positively-charged
    <strong>Na⁺</strong> ion — and chlorine accepts it, becoming a negatively-charged
    <strong>Cl⁻</strong> ion. Opposite charges then attract: that attraction <em>is</em> the ionic
    bond.</p>
    <p>That pull acts equally in every direction, not just between one pair — so ions don't stop at
    single Na–Cl pairs. They pack into a repeating, alternating <strong>lattice</strong>, each ion
    surrounded by ions of the opposite charge, which is why table salt forms hard, regular
    crystals.</p>
  `,

  quiz: [
    { q: "In forming an ionic bond, sodium…", choices: ["gains an electron", "loses an electron", "shares an electron", "loses a proton"], answer: 1, explain: "Sodium gives up its one loosely-held outer electron, becoming a positive Na⁺ ion." },
    { q: "After the transfer, chlorine becomes…", choices: ["Cl⁺", "Cl⁻", "still neutral Cl", "Cl²⁻"], answer: 1, explain: "Gaining one extra electron gives chlorine a single negative charge: Cl⁻." },
    { q: "Why does an ionic compound form a repeating lattice rather than isolated pairs?", choices: ["Ions repel each other", "Electrostatic attraction pulls equally in every direction", "It's easier to store that way", "Only lattices are electrically neutral"], answer: 1, explain: "Each ion attracts oppositely-charged ions all around it, not just its original partner, so the pattern extends in every direction." },
  ],

  presets: [
    { label: "Before transfer", note: "Neutral Na and Cl atoms, side by side.", values: { "ib-transferred": "0" } },
    { label: "After transfer", note: "Na⁺ and Cl⁻ — opposite charges now attract.", values: { "ib-transferred": "1" } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="ib-status">Na and Cl — neutral atoms</span></div>
      <div class="btn-row">
        <button class="btn primary" id="ib-transfer" type="button">Transfer electron</button>
        <button class="btn" id="ib-reset" type="button">Reset</button>
      </div>
      <input type="hidden" id="ib-transferred" value="0">
      <p class="fact">The dimmed grid behind shows how thousands of these pairs pack into a real salt crystal.</p>
      <div class="btn-row"><button class="btn" id="ib-spin" type="button" aria-pressed="${spin}">Spin: ${spin ? "on" : "off"}</button></div>
    `;
  },

  wire(root) {
    els.status = root.querySelector("#ib-status");
    els.transferBtn = root.querySelector("#ib-transfer");
    els.resetBtn = root.querySelector("#ib-reset");
    els.hidden = root.querySelector("#ib-transferred");
    els.spin = root.querySelector("#ib-spin");

    // Only the target flag flips here — update() eases state.anim toward it
    // every frame, so the electron and ions glide rather than jump.
    const applyState = () => {
      state.transferred = els.hidden.value === "1";
      els.status.textContent = state.transferred ? "Na⁺ and Cl⁻ — opposite charges attract" : "Na and Cl — neutral atoms";
    };

    els.transferBtn.addEventListener("click", () => {
      els.hidden.value = "1";
      applyState();
    });
    els.resetBtn.addEventListener("click", () => {
      els.hidden.value = "0";
      applyState();
    });
    els.hidden.addEventListener("input", applyState);
    els.spin.addEventListener("click", () => {
      spin = !spin;
      els.spin.textContent = `Spin: ${spin ? "on" : "off"}`;
      els.spin.setAttribute("aria-pressed", String(spin));
    });

    applyState();
  },

  update(dt, viewer) {
    const target = state.transferred ? 1 : 0;
    if (state.anim !== target) {
      state.anim += Math.sign(target - state.anim) * dt * 2;
      state.anim = Math.max(0, Math.min(1, state.anim));
      refreshGeometry();
    }
    if (spin && !viewer.dragging) group.rotation.y += dt * 0.15;
  },

  onEnter() {},
  onExit() {},
};
