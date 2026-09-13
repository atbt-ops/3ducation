import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.7 });
const group = new THREE.Group();
scene.add(group);

const RETINA_X = 2.2;

// Optical axis.
const axis = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5.2, 0, 0), new THREE.Vector3(4, 0, 0)]),
  new THREE.LineDashedMaterial({ color: 0x63665a, dashSize: 0.2, gapSize: 0.12 })
);
axis.computeLineDistances();
group.add(axis);

// Object — a fixed arrow standing in for whatever is being looked at.
function arrow(color, height) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, height, 8), new THREE.MeshStandardMaterial({ color }));
  shaft.position.y = height / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), new THREE.MeshStandardMaterial({ color }));
  head.position.y = height + 0.14;
  g.add(shaft, head);
  return g;
}
const object = arrow(0x2c6e6b, 0.8);
object.position.x = -4.6;
group.add(object);

// Eyeball outline: an arc from the eye lens back to the retina.
const eyeArcPts = [];
for (let i = 0; i <= 24; i++) {
  const t = (i / 24) * Math.PI - Math.PI / 2;
  eyeArcPts.push(new THREE.Vector3(0.9 + Math.cos(t) * 1.3, Math.sin(t) * 1.0, 0));
}
const eyeOutline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(eyeArcPts), new THREE.LineBasicMaterial({ color: 0xb0aa98 }));
group.add(eyeOutline);

// The eye's own lens — always a converging (biconvex) lens.
const eyeLens = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 28, 18),
  new THREE.MeshPhysicalMaterial({ color: 0x8fd8cb, transmission: 0.6, transparent: true, opacity: 0.55, roughness: 0.1 })
);
eyeLens.scale.set(0.22, 1, 1);
eyeLens.position.x = 0.5;
group.add(eyeLens);
const eyeLensLabel = createLabel("Eye lens", { fontSize: 22 });
eyeLensLabel.position.set(0.5, 1.3, 0);
group.add(eyeLensLabel);

// Retina — the screen at the back of the eye.
const retina = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.9), new THREE.MeshBasicMaterial({ color: 0xc23b2b }));
retina.position.x = RETINA_X;
group.add(retina);
const retinaLabel = createLabel("Retina", { fontSize: 22 });
retinaLabel.position.set(RETINA_X, 1.35, 0);
group.add(retinaLabel);

// The blur spot — a translucent disc showing how far off-focus the image lands.
const blur = new THREE.Mesh(
  new THREE.CircleGeometry(1, 24),
  new THREE.MeshBasicMaterial({ color: 0xc23b2b, transparent: true, opacity: 0.28 })
);
blur.position.set(RETINA_X, 0, 0.02);
group.add(blur);

// An optional corrective lens, worn in front of the eye.
const correctiveLens = new THREE.Mesh(
  new THREE.CylinderGeometry(0.9, 0.9, 0.08, 32),
  new THREE.MeshStandardMaterial({ color: 0x3a5fa8, transparent: true, opacity: 0.35, roughness: 0.2 })
);
correctiveLens.rotation.z = Math.PI / 2;
correctiveLens.position.x = -1.6;
correctiveLens.visible = false;
group.add(correctiveLens);
const correctiveLabel = createLabel("Corrective lens", { fontSize: 22 });
correctiveLabel.position.set(-1.6, 1.15, 0);
correctiveLabel.visible = false;
group.add(correctiveLabel);

const rayMat = new THREE.LineBasicMaterial({ color: 0xd9a54a });
const ray1 = new THREE.Line(new THREE.BufferGeometry(), rayMat);
const ray2 = new THREE.Line(new THREE.BufferGeometry(), rayMat);
group.add(ray1, ray2);

const MODES = {
  normal: { focusX: RETINA_X, corrective: null, label: "Normal vision" },
  myopia: { focusX: 1.55, corrective: null, label: "Myopia (near-sightedness), uncorrected" },
  "myopia-corrected": { focusX: RETINA_X, corrective: "concave", label: "Myopia, corrected with a concave lens" },
  hyper: { focusX: 3.15, corrective: null, label: "Hypermetropia (far-sightedness), uncorrected" },
  "hyper-corrected": { focusX: RETINA_X, corrective: "convex", label: "Hypermetropia, corrected with a convex lens" },
};

const state = { mode: "normal" };
const els = {};

const EXTEND_X = 3.9;

function rayThrough(tip, lensPoint, focus) {
  const dir = new THREE.Vector3().subVectors(focus, lensPoint);
  const t = (EXTEND_X - lensPoint.x) / dir.x;
  const end = new THREE.Vector3().copy(lensPoint).addScaledVector(dir, t);
  return [tip, lensPoint, focus, end];
}

function refresh() {
  const m = MODES[state.mode];
  const tip = new THREE.Vector3(-4.6, 0.8, 0);
  const focus = new THREE.Vector3(m.focusX, 0, 0);
  ray1.geometry.setFromPoints(rayThrough(tip, new THREE.Vector3(0.5, 0.32, 0), focus));
  ray2.geometry.setFromPoints(rayThrough(tip, new THREE.Vector3(0.5, -0.32, 0), focus));

  const blurAmount = Math.abs(m.focusX - RETINA_X);
  blur.scale.setScalar(Math.max(0.03, Math.min(0.55, blurAmount * 0.9)));

  correctiveLens.visible = !!m.corrective;
  correctiveLabel.visible = !!m.corrective;
  if (m.corrective === "concave") {
    correctiveLens.scale.set(1, 1, 1);
    correctiveLens.material.color.setHex(0x3a5fa8);
  } else if (m.corrective === "convex") {
    correctiveLens.scale.set(1.4, 1, 1);
    correctiveLens.material.color.setHex(0xc9931f);
  }

  if (els.status) {
    const where = m.focusX < RETINA_X - 0.05 ? "in front of the retina — blurred" : m.focusX > RETINA_X + 0.05 ? "beyond the retina — blurred" : "exactly on the retina — sharp";
    els.status.textContent = `${m.label}. The image forms ${where}.`;
  }
}
refresh();

export default {
  id: "humaneye",
  name: "The human eye",
  tag: "Physics · Optics",
  subject: "Physics",
  grades: [9, 12],
  blurb: "Myopia, hypermetropia, and the lenses that bring the picture back into focus.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20c6-9 26-9 32 0-6 9-26 9-32 0Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="20" r="5" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0.2, 0], radius: 10.5, theta: 0.05, phi: 1.5, minRadius: 5, maxRadius: 18 },

  lesson: `
    <p>A healthy eye bends light with its lens so a sharp image lands exactly on the
    <strong>retina</strong>. Two common defects throw that off. In <strong>myopia</strong>
    (near-sightedness), the eyeball focuses light too strongly, forming the image
    <em>in front of</em> the retina — distant objects blur, though nearby ones are still clear.
    A <strong>concave (diverging) lens</strong> spreads the light out a little before it enters
    the eye, pushing the focus back onto the retina.</p>
    <p>In <strong>hypermetropia</strong> (far-sightedness), the eye focuses too weakly, and the
    image forms <em>behind</em> the retina — nearby objects blur. A
    <strong>convex (converging) lens</strong> adds extra bending before the light enters the eye,
    pulling the focus forward onto the retina. A third defect, <strong>presbyopia</strong>, is an
    age-related stiffening of the lens that usually needs both corrections at once — bifocal
    glasses, concave on top and convex below.</p>
  `,

  quiz: [
    { q: "In myopia, where does the image of a distant object form?", choices: ["Exactly on the retina", "In front of the retina", "Behind the retina", "Outside the eye entirely"], answer: 1, explain: "The eye focuses too strongly, so the image forms before it reaches the retina." },
    { q: "Which type of lens corrects myopia?", choices: ["Convex (converging)", "Concave (diverging)", "A flat pane of glass", "No lens can correct it"], answer: 1, explain: "A concave lens spreads the light slightly before it enters the eye, moving the focus back onto the retina." },
    { q: "In hypermetropia, the image of a nearby object forms…", choices: ["In front of the retina", "Behind the retina", "Exactly on the retina", "Nowhere — no image forms"], answer: 1, explain: "The eye focuses too weakly for near objects, forming the image beyond the retina." },
    { q: "Which type of lens corrects hypermetropia?", choices: ["Concave (diverging)", "Convex (converging)", "A mirror", "A prism"], answer: 1, explain: "A convex lens adds extra converging power, pulling the focus forward onto the retina." },
    { q: "Presbyopia, common with ageing, is usually corrected with…", choices: ["Concave lenses only", "Convex lenses only", "Bifocal lenses — concave on top, convex below", "No correction is possible"], answer: 2, explain: "Presbyopia often combines both defects, so bifocals combine both corrections in one lens." },
  ],

  presets: [
    { label: "Normal vision", note: "The lens focuses light exactly onto the retina.", values: { "he-mode": "normal" } },
    { label: "Myopia, uncorrected", note: "Too strong a focus — the image forms short of the retina.", values: { "he-mode": "myopia" } },
    { label: "Myopia, corrected", note: "A concave lens pushes the focus back onto the retina.", values: { "he-mode": "myopia-corrected" } },
    { label: "Hypermetropia, corrected", note: "A convex lens pulls the focus forward onto the retina.", values: { "he-mode": "hyper-corrected" } },
  ],

  panelHTML() {
    return `
      <select id="he-mode" class="text-input" aria-label="Vision type">
        <option value="normal">Normal vision</option>
        <option value="myopia">Myopia, uncorrected</option>
        <option value="myopia-corrected">Myopia, corrected (concave lens)</option>
        <option value="hyper">Hypermetropia, uncorrected</option>
        <option value="hyper-corrected">Hypermetropia, corrected (convex lens)</option>
      </select>
      <p class="fact" id="he-status">Normal vision. The image forms exactly on the retina — sharp.</p>
    `;
  },

  wire(root) {
    els.mode = root.querySelector("#he-mode");
    els.status = root.querySelector("#he-status");
    els.mode.addEventListener("input", () => {
      state.mode = els.mode.value;
      refresh();
    });
  },

  update() {},
  onEnter() {},
  onExit() {},
};
