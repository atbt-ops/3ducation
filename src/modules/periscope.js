import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

// The periscope tube — an open rectangle with a window near the top-left and bottom-left.
const tubeMat = new THREE.LineBasicMaterial({ color: 0x63665a });
const TUBE_L = -0.7;
const TUBE_R = 0.7;
const TUBE_TOP = 2.6;
const TUBE_BOTTOM = -2.6;
function seg(a, b) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), tubeMat);
}
group.add(seg([TUBE_L, TUBE_TOP], [TUBE_R, TUBE_TOP]));
group.add(seg([TUBE_L, TUBE_BOTTOM], [TUBE_R, TUBE_BOTTOM]));
group.add(seg([TUBE_L, TUBE_TOP], [TUBE_L, TUBE_BOTTOM]));
group.add(seg([TUBE_R, TUBE_TOP], [TUBE_R, TUBE_BOTTOM]));

function mirror(y, tiltDeg, color) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.08), new THREE.MeshBasicMaterial({ color }));
  m.position.set(0, y, 0);
  m.rotation.z = THREE.MathUtils.degToRad(tiltDeg);
  return m;
}
const topMirror = mirror(TUBE_TOP - 0.35, 45, 0xb9bfc6);
group.add(topMirror);
const bottomMirrorAligned = mirror(TUBE_BOTTOM + 0.35, 45, 0xb9bfc6);
const bottomMirrorMisaligned = mirror(TUBE_BOTTOM + 0.35, 20, 0xc23b2b);
group.add(bottomMirrorAligned, bottomMirrorMisaligned);

const topLabel = createLabel("Top mirror (45°)", { fontSize: 20, scale: 0.45 });
topLabel.position.set(1.6, TUBE_TOP - 0.35, 0);
group.add(topLabel);
const bottomLabel = createLabel("Bottom mirror", { fontSize: 20, scale: 0.45 });
bottomLabel.position.set(1.6, TUBE_BOTTOM + 0.35, 0);
group.add(bottomLabel);

// Object above, eye below — both on the left, where the light enters and exits.
const object = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshBasicMaterial({ color: 0x2c6e6b }));
object.position.set(-2.6, TUBE_TOP - 0.35, 0);
group.add(object);
const objectLabel = createLabel("Object", { fontSize: 20, scale: 0.45 });
objectLabel.position.set(-2.6, TUBE_TOP - 0.35 + 0.5, 0);
group.add(objectLabel);

const eye = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), new THREE.MeshBasicMaterial({ color: 0x8a6a3a }));
eye.position.set(-2.6, TUBE_BOTTOM + 0.35, 0);
group.add(eye);
const eyeLabel = createLabel("Eye", { fontSize: 20, scale: 0.45 });
eyeLabel.position.set(-2.6, TUBE_BOTTOM + 0.35 - 0.5, 0);
group.add(eyeLabel);

const rayMat = new THREE.LineBasicMaterial({ color: 0xffb020 });
const ray = new THREE.Line(new THREE.BufferGeometry(), rayMat);
group.add(ray);

const PATH_ALIGNED = [
  [-2.6, TUBE_TOP - 0.35],
  [0, TUBE_TOP - 0.35],
  [0, TUBE_BOTTOM + 0.35],
  [-2.6, TUBE_BOTTOM + 0.35],
];
const PATH_MISALIGNED = [
  [-2.6, TUBE_TOP - 0.35],
  [0, TUBE_TOP - 0.35],
  [0, TUBE_BOTTOM + 0.35],
  [1.3, TUBE_BOTTOM - 0.5],
];

const state = { aligned: true };
const els = {};

function refresh() {
  const pts = (state.aligned ? PATH_ALIGNED : PATH_MISALIGNED).map(([x, y]) => new THREE.Vector3(x, y, 0.01));
  ray.geometry.setFromPoints(pts);
  bottomMirrorAligned.visible = state.aligned;
  bottomMirrorMisaligned.visible = !state.aligned;
  if (els.status) {
    els.status.textContent = state.aligned
      ? "Both mirrors sit at 45°, parallel to each other — the ray bounces cleanly out to the eye. You can see the object."
      : "The bottom mirror isn't parallel to the top one anymore — the reflected ray misses the eye window entirely. No image gets through.";
  }
}
refresh();

export default {
  id: "periscope",
  name: "Periscope",
  tag: "Physics · Optics",
  subject: "Physics",
  grades: [5, 9],
  flat: true,
  blurb: "Two mirrors, kept parallel, let you see over an obstacle — misalign one and the image vanishes.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="4" width="12" height="32" stroke="currentColor" stroke-width="2"/><path d="M14 10l12 4M14 30l12-4" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [-0.6, 0, 0], radius: 8.5, theta: 0, phi: 1.5708, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>A <strong>periscope</strong> lets you see over or around an obstacle using nothing but two
    flat mirrors, tilted at <strong>45°</strong> inside a tube. Light from the object travels
    horizontally, strikes the top mirror, and reflects straight down the tube; at the bottom, a
    second mirror reflects it horizontally again, straight into your eye. Submarine crews and
    soldiers in trenches have used exactly this trick to see safely without exposing themselves.</p>
    <p>The two mirrors only work if they are <strong>parallel to each other</strong> — both at the
    same 45° angle. The incident ray, the reflected ray, and the normal to each mirror always lie
    in one flat plane; if the mirrors aren't parallel, the ray that leaves the first mirror simply
    doesn't line up with the second one anymore, and it misses the eye window completely — no
    image gets through at all.</p>
  `,

  quiz: [
    { q: "At what angle are a periscope's two mirrors tilted?", choices: ["30°", "45°", "60°", "90°"], answer: 1, explain: "Both mirrors sit at 45° to reflect a horizontal ray into a vertical path, and back to horizontal again." },
    { q: "Why must both mirrors be parallel to each other?", choices: ["So the tube looks symmetrical", "So the ray reflected from the first mirror lines up correctly with the second, and then the eye", "To make the periscope lighter", "Parallel mirrors aren't actually required"], answer: 1, explain: "Non-parallel mirrors send the reflected ray off at the wrong angle, missing the second mirror or the eye window." },
    { q: "What happens if the second mirror is tilted at a different angle than the first?", choices: ["The image gets bigger", "The image gets smaller", "The image disappears — the ray misses the eye window", "Nothing changes"], answer: 2, explain: "Misaligned mirrors send the ray somewhere other than out through the eye window." },
    { q: "Which of these has historically used periscopes to see safely without being exposed?", choices: ["Musicians", "Submarine crews and soldiers in trenches", "Farmers", "Librarians"], answer: 1, explain: "Periscopes let people observe from a protected or hidden position." },
  ],

  presets: [
    { label: "Aligned (works)", note: "Both mirrors at 45°, parallel — the object is clearly visible.", values: { "ps-align": "aligned" } },
    { label: "Misaligned (fails)", note: "The bottom mirror is tilted wrong — no image reaches the eye.", values: { "ps-align": "misaligned" } },
  ],

  panelHTML() {
    return `
      <select id="ps-align" class="text-input" aria-label="Mirror alignment">
        <option value="aligned">Mirrors aligned (both 45°, parallel)</option>
        <option value="misaligned">Bottom mirror misaligned</option>
      </select>
      <p class="fact" id="ps-status">—</p>
    `;
  },

  wire(root) {
    els.align = root.querySelector("#ps-align");
    els.status = root.querySelector("#ps-status");
    els.align.addEventListener("input", () => {
      state.aligned = els.align.value === "aligned";
      refresh();
    });
  },

  update() {},
  onEnter() {},
  onExit() {},
};
