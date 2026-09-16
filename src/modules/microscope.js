import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.68, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);
scene.add(contactShadow({ radius: 1.3, y: -0.12 }));

const metalMat = new THREE.MeshStandardMaterial({ color: 0x555a63, roughness: 0.35, metalness: 0.6 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.5, metalness: 0.4 });
const lensMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.2, metalness: 0.7 });

// Base and upright post.
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.22, 24), metalMat);
group.add(base);
const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 2.6, 16), metalMat);
post.position.y = 1.4;
group.add(post);
const baseLabel = createLabel("Base", { fontSize: 22 });
baseLabel.position.set(0, -0.4, 0);
group.add(baseLabel);
const armLabel = createLabel("Arm", { fontSize: 22 });
armLabel.position.set(0.9, 1.4, 0);
group.add(armLabel);

// Stage, with a slide and a light beneath it.
const stage = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 24), darkMat);
stage.position.y = 1.55;
group.add(stage);
const slide = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.35), new THREE.MeshStandardMaterial({ color: 0xdfe8e6, transparent: true, opacity: 0.7 }));
slide.position.y = 1.62;
group.add(slide);
const light = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xfff3c0, emissive: 0xffd76a, emissiveIntensity: 0.6 }));
light.position.y = 1.2;
group.add(light);
const stageLabel = createLabel("Stage", { fontSize: 22 });
stageLabel.position.set(-1.1, 1.7, 0);
group.add(stageLabel);
const lightLabel = createLabel("Light source", { fontSize: 20 });
lightLabel.position.set(-1.1, 1.05, 0);
group.add(lightLabel);

// Body tube, arm-top, eyepiece and nosepiece with objective lenses.
const armTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.16), metalMat);
armTop.position.set(0.35, 2.7, 0);
group.add(armTop);
const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.3, 16), metalMat);
tube.rotation.z = THREE.MathUtils.degToRad(20);
tube.position.set(0.55, 3.15, 0);
group.add(tube);
const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.4, 16), darkMat);
eyepiece.rotation.z = THREE.MathUtils.degToRad(20);
eyepiece.position.set(0.2, 3.78, 0);
group.add(eyepiece);
const eyepieceLabel = createLabel("Eyepiece", { fontSize: 22 });
eyepieceLabel.position.set(0.1, 4.3, 0);
group.add(eyepieceLabel);

const nosepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16), darkMat);
nosepiece.position.set(0.85, 2.45, 0);
group.add(nosepiece);
const objLow = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.4, 12), lensMat);
objLow.position.set(0.68, 2.2, 0);
group.add(objLow);
const objHigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.55, 12), lensMat);
objHigh.position.set(1.02, 2.15, 0);
group.add(objHigh);
const objLabel = createLabel("Objective lenses", { fontSize: 20 });
objLabel.position.set(1.5, 2.35, 0);
group.add(objLabel);

// Coarse and fine focus knobs.
const coarseKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 20), metalMat);
coarseKnob.rotation.x = Math.PI / 2;
coarseKnob.position.set(-0.32, 2.2, 0);
group.add(coarseKnob);
const fineKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 20), metalMat);
fineKnob.rotation.x = Math.PI / 2;
fineKnob.position.set(-0.32, 1.85, 0);
group.add(fineKnob);
const knobLabel = createLabel("Coarse & fine focus", { fontSize: 20 });
knobLabel.position.set(-1.15, 2.0, 0);
group.add(knobLabel);

// The eyepiece view — what a viewer would actually see, shown as an inset disc.
const VIEW_CENTER = [3.2, 2.6, 0];
const viewRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.3, 32), metalMat);
viewRing.position.set(...VIEW_CENTER);
group.add(viewRing);
const viewBg = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32), new THREE.MeshBasicMaterial({ color: 0xdff3ea }));
viewBg.position.set(VIEW_CENTER[0], VIEW_CENTER[1], -0.01);
group.add(viewBg);
const viewLabel = createLabel("What you see", { fontSize: 22 });
viewLabel.position.set(VIEW_CENTER[0], VIEW_CENTER[1] + 1.6, 0);
group.add(viewLabel);

const SAMPLE_SPOTS = [
  { x: -0.3, y: 0.25, r: 0.22 },
  { x: 0.35, y: -0.1, r: 0.28 },
  { x: -0.1, y: -0.45, r: 0.18 },
  { x: 0.5, y: 0.4, r: 0.15 },
  { x: -0.55, y: -0.15, r: 0.2 },
];
const sampleDots = SAMPLE_SPOTS.map((s, i) => {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(s.r, 20),
    new THREE.MeshBasicMaterial({ color: [0x3a6fd6, 0x3f9e4d, 0x7a2fbf, 0xc9931f, 0xc23b2b][i % 5], transparent: true })
  );
  m.position.set(VIEW_CENTER[0] + s.x, VIEW_CENTER[1] + s.y, 0.01);
  group.add(m);
  return { mesh: m, base: s };
});

const state = { focus: 50, power: "low" };
const els = {};

function refresh() {
  const tolerance = state.power === "high" ? 16 : 38;
  const off = Math.abs(state.focus - 50);
  const blur = THREE.MathUtils.clamp(off / tolerance, 0, 1);
  const zoom = state.power === "high" ? 1.7 : 1;
  sampleDots.forEach(({ mesh, base: s }) => {
    mesh.position.set(VIEW_CENTER[0] + s.x * zoom, VIEW_CENTER[1] + s.y * zoom, 0.01);
    mesh.scale.setScalar((1 + blur * 1.8) * zoom);
    mesh.material.opacity = 1 - blur * 0.75;
  });
  if (els.status) {
    if (blur < 0.15) els.status.textContent = "Sharp focus — you can clearly make out each micro-organism.";
    else if (blur < 0.6) els.status.textContent = "Getting there — turn the focus knob a little more.";
    else els.status.textContent = "Out of focus — a blur of colour, no detail visible.";
  }
}
refresh();

export default {
  id: "microscope",
  name: "Compound microscope",
  tag: "Biology · Tools",
  subject: "Biology",
  grades: [5, 8],
  blurb: "Turn the focus knob and switch lenses to bring micro-organisms into view.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 34h10M19 34V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 22c4 0 6-3 6-7V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="25" cy="7" r="3" stroke="currentColor" stroke-width="2"/><rect x="9" y="24" width="14" height="3" rx="1" fill="currentColor"/></svg>',
  scene,
  view: { target: [1.2, 1.9, 0], radius: 9, theta: 0.15, phi: 1.3, minRadius: 5, maxRadius: 15 },

  lesson: `
    <p>A <strong>microscope</strong> lets us see things far too small for the naked eye — the
    antenna of an ant, the grains in flower pollen, or micro-organisms like bacteria and moulds.
    A compound microscope has structural parts (the <strong>base</strong>, <strong>arm</strong>
    and body tube) and visual parts: the <strong>eyepiece</strong> you look through, the
    <strong>objective lenses</strong> that sit just above the sample, the <strong>stage</strong>
    that holds the glass slide, a <strong>light source</strong> shining up through it, and the
    <strong>coarse and fine focus knobs</strong> that move the tube up and down.</p>
    <p>Bring a sample into view coarsely first, then fine-tune with the smaller knob — real
    microscopes have a very shallow zone of sharpness, especially at high power, so focusing gets
    noticeably harder as you zoom in.</p>
  `,

  quiz: [
    { q: "What are living things too small to see with the naked eye, viewed only under a microscope, called?", choices: ["Nutrients", "Micro-organisms", "Molecules", "Cells only"], answer: 1, explain: "Micro-organisms — like bacteria and moulds — are only visible under a microscope." },
    { q: "Which part of the microscope holds the glass slide?", choices: ["The eyepiece", "The base", "The stage", "The arm"], answer: 2, explain: "The stage is the flat platform the slide rests on." },
    { q: "What do the coarse and fine focus knobs do?", choices: ["Change the light colour", "Move the tube to bring the sample into sharp focus", "Clean the lenses", "Rotate the stage"], answer: 1, explain: "They raise and lower the body tube until the image is sharp." },
    { q: "Compared to a low-power objective lens, a high-power lens is generally…", choices: ["easier to focus", "harder to focus, since sharp focus works over a much narrower range", "not affected by focus at all", "used only for the base"], answer: 1, explain: "Higher magnification has a much shallower zone of sharp focus, so it's more sensitive to the knob position." },
  ],

  presets: [
    { label: "In focus, low power", note: "A wide, forgiving zone of sharpness.", values: { "mc-focus": 50, "mc-power": "low" } },
    { label: "In focus, high power", note: "Same focus value, but the margin for error is much smaller.", values: { "mc-focus": 50, "mc-power": "high" } },
    { label: "Out of focus", note: "Turn the knob too far and detail disappears into a blur.", values: { "mc-focus": 15, "mc-power": "low" } },
  ],

  panelHTML() {
    return `
      <select id="mc-power" class="text-input" aria-label="Objective lens">
        <option value="low">Low-power objective</option>
        <option value="high">High-power objective</option>
      </select>
      <div class="control"><div class="row"><label for="mc-focus">Focus knob</label><output id="mc-focusval" for="mc-focus"></output></div>
        <input type="range" id="mc-focus" min="0" max="100" step="1" value="${state.focus}"></div>
      <p class="fact" id="mc-status">—</p>
    `;
  },

  wire(root) {
    els.power = root.querySelector("#mc-power");
    els.focus = root.querySelector("#mc-focus");
    els.focusval = root.querySelector("#mc-focusval");
    els.status = root.querySelector("#mc-status");
    const sync = () => {
      els.focusval.textContent = `${state.focus}`;
      refresh();
    };
    els.power.addEventListener("input", () => {
      state.power = els.power.value;
      sync();
    });
    els.focus.addEventListener("input", () => ((state.focus = +els.focus.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
