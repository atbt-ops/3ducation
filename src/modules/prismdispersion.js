import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.7 });
const group = new THREE.Group();
scene.add(group);

// A triangular glass prism, apex up, extruded for thickness.
const triShape = new THREE.Shape();
triShape.moveTo(0, 1);
triShape.lineTo(-0.9, -0.6);
triShape.lineTo(0.9, -0.6);
triShape.closePath();
const prism = new THREE.Mesh(
  new THREE.ExtrudeGeometry(triShape, { depth: 0.6, bevelEnabled: false }),
  new THREE.MeshPhysicalMaterial({ color: 0xdfefe8, transmission: 0.7, transparent: true, opacity: 0.4, roughness: 0.05 })
);
prism.position.z = -0.3;
group.add(prism);
const prismLabel = createLabel("Glass prism", { fontSize: 24 });
prismLabel.position.set(0, 1.5, 0);
group.add(prismLabel);

// Screen where the emerging light lands.
const SCREEN_X = 3.6;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 2.4), new THREE.MeshStandardMaterial({ color: 0xf1efe6, roughness: 0.8 }));
screen.position.set(SCREEN_X, -0.6, 0);
group.add(screen);
const screenLabel = createLabel("Screen", { fontSize: 22 });
screenLabel.position.set(SCREEN_X, 0.75, 0);
group.add(screenLabel);

const ENTRY = new THREE.Vector3(-0.48, 0.15, 0);
const EXIT = new THREE.Vector3(0.48, 0.15, 0);
const incoming = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4, 0.15, 0), ENTRY]),
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
group.add(incoming);
const incomingLabel = createLabel("White light", { fontSize: 22 });
incomingLabel.position.set(-3, 0.75, 0);
group.add(incomingLabel);

// VIBGYOR, in order of increasing deviation (red bends least, violet bends most).
const SPECTRUM = [
  { name: "Red", color: 0xd1332a, deg: -14 },
  { name: "Orange", color: 0xe2792a, deg: -16.3 },
  { name: "Yellow", color: 0xd8c22a, deg: -18.6 },
  { name: "Green", color: 0x3f9e4d, deg: -20.9 },
  { name: "Blue", color: 0x2f6fd6, deg: -23.2 },
  { name: "Indigo", color: 0x3f2f9e, deg: -25.5 },
  { name: "Violet", color: 0x7a2fbf, deg: -27.8 },
];

const rayLines = SPECTRUM.map((c) => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: c.color })));
rayLines.forEach((l) => group.add(l));
const dots = SPECTRUM.map((c) => new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: c.color })));
dots.forEach((d) => {
  d.position.z = 0.04;
  group.add(d);
});

function landingPoint(deg) {
  const rad = THREE.MathUtils.degToRad(deg);
  const dir = new THREE.Vector3(Math.cos(rad), Math.sin(rad), 0);
  const t = (SCREEN_X - EXIT.x) / dir.x;
  return new THREE.Vector3().copy(EXIT).addScaledVector(dir, t);
}

const state = { mode: "white" };
const els = {};

function refresh() {
  const showAll = state.mode === "white";
  rayLines.forEach((line, i) => {
    const c = SPECTRUM[i];
    const show = showAll || state.mode === c.name.toLowerCase();
    line.visible = show;
    dots[i].visible = show;
    if (show) {
      const land = landingPoint(c.deg);
      line.geometry.setFromPoints([ENTRY, EXIT, land]);
      dots[i].position.set(land.x, land.y, 0.04);
    }
  });
  if (els.status) {
    els.status.textContent =
      state.mode === "white"
        ? "White light splits into the full VIBGYOR spectrum — violet bends most, red bends least."
        : `A single colour (${SPECTRUM.find((c) => c.name.toLowerCase() === state.mode).name.toLowerCase()}) bends once and stays that colour — it doesn't split any further.`;
  }
}
refresh();

export default {
  id: "prismdispersion",
  name: "Prism & dispersion",
  tag: "Physics · Optics",
  subject: "Physics",
  grades: [8, 12],
  blurb: "White light in, a rainbow out — why a prism splits colours by how much they bend.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6l12 22H8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 20h10M26 20c2 3 4 5 10 6" stroke="currentColor" stroke-width="1.6"/><circle cx="30" cy="27" r="1.6" fill="currentColor"/><circle cx="33" cy="30" r="1.6" fill="currentColor"/><circle cx="27" cy="30" r="1.6" fill="currentColor"/></svg>',
  scene,
  view: { target: [0.3, 0, 0], radius: 9.5, theta: 0, phi: 1.5, minRadius: 5, maxRadius: 16 },

  lesson: `
    <p>Shine white light into a glass prism and a rainbow comes out the other side — red, orange,
    yellow, green, blue, indigo, violet (VIBGYOR). This splitting is called
    <strong>dispersion</strong>. White light is really a mix of all these colours travelling
    together; a prism bends each one by a slightly different amount, so they leave the prism
    heading in slightly different directions and land apart on a screen.</p>
    <p>The reason lies in wavelength: violet light has the <em>shortest</em> wavelength and bends
    the <strong>most</strong>; red has the <em>longest</em> wavelength and bends the
    <strong>least</strong>. A prism's refractive index is slightly different for each wavelength,
    so each colour takes a slightly different path. Send in a single, pure colour instead of white
    light, and it bends by its own fixed amount but does <strong>not split further</strong> —
    frequency (and so colour) doesn't change on refraction. This same splitting, by countless tiny
    water droplets, is exactly what paints a rainbow across the sky.</p>
  `,

  quiz: [
    { q: "The splitting of white light into its constituent colours is called…", choices: ["Reflection", "Dispersion", "Diffraction", "Polarisation"], answer: 1, explain: "Dispersion is the separation of white light into VIBGYOR by a prism (or water droplets, as in a rainbow)." },
    { q: "Which colour of light bends the LEAST passing through a prism?", choices: ["Violet", "Blue", "Red", "Green"], answer: 2, explain: "Red has the longest wavelength and the lowest refractive index, so it deviates the least." },
    { q: "Which colour bends the MOST?", choices: ["Red", "Orange", "Yellow", "Violet"], answer: 3, explain: "Violet has the shortest wavelength and the highest refractive index, so it deviates the most." },
    { q: "If you shine a single, pure colour of light through a prism, it…", choices: ["splits into two colours", "splits into the full spectrum", "bends but does not split into further colours", "passes straight through with no bending at all"], answer: 2, explain: "A prism still bends a single colour, but since its frequency can't change, it can't split into other colours." },
    { q: "A rainbow in the sky is an example of…", choices: ["reflection only", "dispersion of sunlight by water droplets", "a chemical reaction in clouds", "scattering by dust only"], answer: 1, explain: "Millions of tiny water droplets each act like a small prism, dispersing sunlight into its spectrum." },
  ],

  presets: [
    { label: "White light", note: "The full VIBGYOR fan — violet bends most, red least.", values: { "pd-mode": "white" } },
    { label: "Red light only", note: "One colour in, the same colour out — no further splitting.", values: { "pd-mode": "red" } },
    { label: "Violet light only", note: "Bends more than red, but still stays a single colour.", values: { "pd-mode": "violet" } },
  ],

  panelHTML() {
    return `
      <select id="pd-mode" class="text-input" aria-label="Light source">
        <option value="white">White light (full spectrum)</option>
        <option value="red">Red light only</option>
        <option value="violet">Violet light only</option>
      </select>
      <p class="fact" id="pd-status">White light splits into the full VIBGYOR spectrum — violet bends most, red bends least.</p>
    `;
  },

  wire(root) {
    els.mode = root.querySelector("#pd-mode");
    els.status = root.querySelector("#pd-status");
    els.mode.addEventListener("input", () => {
      state.mode = els.mode.value;
      refresh();
    });
  },

  update() {},
  onEnter() {},
  onExit() {},
};
