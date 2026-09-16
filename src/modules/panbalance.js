import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);
scene.add(contactShadow({ radius: 1.1, y: -0.08 }));

const metalMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.3, metalness: 0.7 });
const beamMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.5 });
const leftMat = new THREE.MeshStandardMaterial({ color: 0x2c6e6b, roughness: 0.6 });
const rightMat = new THREE.MeshStandardMaterial({ color: 0xc23b2b, roughness: 0.6 });

const BEAM_HALF = 2.2;
const ROPE = 1.1;

// Stand and fulcrum — fixed, never rotates.
const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.6, 16), metalMat);
post.position.y = 1.3;
group.add(post);
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 24), metalMat);
group.add(base);
const fulcrum = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 4), metalMat);
fulcrum.position.y = 2.6;
group.add(fulcrum);

// Beam — pivots about the origin (at the top of the post).
const beamPivot = new THREE.Group();
beamPivot.position.y = 2.6;
group.add(beamPivot);
const beam = new THREE.Mesh(new THREE.BoxGeometry(BEAM_HALF * 2, 0.1, 0.12), beamMat);
beamPivot.add(beam);

// Pans hang from ropes at each end, staying level as the beam tilts.
function pan(mat) {
  const g = new THREE.Group();
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.15, 20, 1, true), mat);
  g.add(dish);
  const load = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), mat);
  load.position.y = 0.5;
  g.add(load);
  return { group: g, load };
}
const leftPan = pan(leftMat);
const rightPan = pan(rightMat);
group.add(leftPan.group, rightPan.group);

const leftLabel = createLabel("Left pan", { fontSize: 22 });
group.add(leftLabel);
const rightLabel = createLabel("Right pan", { fontSize: 22 });
group.add(rightLabel);

const MAX_ANGLE = THREE.MathUtils.degToRad(20);
const state = { left: 5, right: 5 };
const els = {};

function refresh() {
  const diff = state.right - state.left;
  // Positive rotation.z is counter-clockwise, which would lift the heavier
  // (positive-x) side — negate so the heavier pan's end actually dips down.
  const angle = THREE.MathUtils.clamp(-diff * 0.06, -MAX_ANGLE, MAX_ANGLE);
  beamPivot.rotation.z = angle;

  [
    { end: -BEAM_HALF, pan: leftPan, w: state.left, label: leftLabel },
    { end: BEAM_HALF, pan: rightPan, w: state.right, label: rightLabel },
  ].forEach(({ end, pan: p, w, label }) => {
    const ex = Math.cos(angle) * end;
    const ey = 2.6 + Math.sin(angle) * end;
    p.group.position.set(ex, ey - ROPE, 0);
    const h = Math.max(0.15, Math.min(2.4, w * 0.16));
    p.load.scale.y = h;
    p.load.position.y = h / 2;
    label.position.set(ex, ey - ROPE + 1.6, 0);
  });

  if (els.status) {
    if (Math.abs(diff) < 0.6) els.status.textContent = "Balanced! Both pans weigh the same.";
    else els.status.textContent = diff > 0 ? "The right pan is heavier — it dips down." : "The left pan is heavier — it dips down.";
  }
}
refresh();

export default {
  id: "panbalance",
  name: "Pan balance",
  tag: "Math · Measurement",
  subject: "Math",
  grades: [3, 6],
  blurb: "Load both pans and see which is heavier — or find the weight that balances them.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6v8M8 14h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 14l-4 10h8l-4-10ZM32 14l-4 10h8l-4-10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="17" y="30" width="6" height="4" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 1.6, 0], radius: 8, theta: 0.3, phi: 1.35, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>A <strong>pan balance</strong> compares two weights directly. Put more weight on one pan
    and it dips down; the other side rises. When both pans hold exactly the same weight, the beam
    settles level — <strong>balanced</strong>.</p>
    <p>This is how you can find the weight of something you don't know: put the object on one
    pan, then add standard weights (like 1 kg, 2 kg, 5 kg pieces) to the other pan one at a time
    until the beam balances. Whatever total you added is the object's weight — the balance has
    let you measure it indirectly, just by comparing.</p>
  `,

  quiz: [
    { q: "When a pan balance is exactly level, what does that tell you?", choices: ["The left pan is heavier", "The right pan is heavier", "Both pans weigh the same", "The balance is broken"], answer: 2, explain: "A level beam means the weight on both pans is equal." },
    { q: "If the right pan dips down, that side is…", choices: ["lighter", "heavier", "empty", "exactly equal to the left"], answer: 1, explain: "The heavier side is pulled down by its greater weight." },
    { q: "To find an unknown object's weight using a pan balance, you should…", choices: ["Guess and never check", "Add known weights to the other pan until it balances, then add them up", "Only use the balance for objects you already know the weight of", "Weigh the balance itself"], answer: 1, explain: "The total of the known weights needed to balance equals the object's weight." },
    { q: "An object is on the left pan. It takes 3 kg + 2 kg on the right pan to balance it. How much does the object weigh?", choices: ["1 kg", "3 kg", "5 kg", "6 kg"], answer: 2, explain: "3 kg + 2 kg = 5 kg exactly balances the object, so it weighs 5 kg." },
  ],

  presets: [
    { label: "Balanced (5 = 5)", note: "Equal weights on both pans — the beam is level.", values: { "pb-left": 5, "pb-right": 5 } },
    { label: "Right is heavier", note: "8 kg vs 3 kg — the heavier right pan dips down.", values: { "pb-left": 3, "pb-right": 8 } },
    { label: "Find the mystery weight", note: "Left pan holds a fixed object (7 kg). Move the right slider until it balances.", values: { "pb-left": 7, "pb-right": 0 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="pb-left">Left pan (kg)</label><output id="pb-leftval" for="pb-left"></output></div>
        <input type="range" id="pb-left" min="0" max="15" step="1" value="${state.left}"></div>
      <div class="control"><div class="row"><label for="pb-right">Right pan (kg)</label><output id="pb-rightval" for="pb-right"></output></div>
        <input type="range" id="pb-right" min="0" max="15" step="1" value="${state.right}"></div>
      <p class="fact" id="pb-status">—</p>
    `;
  },

  wire(root) {
    els.left = root.querySelector("#pb-left");
    els.leftval = root.querySelector("#pb-leftval");
    els.right = root.querySelector("#pb-right");
    els.rightval = root.querySelector("#pb-rightval");
    els.status = root.querySelector("#pb-status");
    const sync = () => {
      els.leftval.textContent = `${state.left} kg`;
      els.rightval.textContent = `${state.right} kg`;
      refresh();
    };
    els.left.addEventListener("input", () => ((state.left = +els.left.value), sync()));
    els.right.addEventListener("input", () => ((state.right = +els.right.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
