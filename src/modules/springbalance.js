import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

const TOP_Y = 2.8;
const REST_LEN = 1.6;
const K = 0.045; // metres of visible stretch per newton

// Fixed support and casing.
const support = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.3), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.6 }));
support.position.y = TOP_Y + 0.1;
group.add(support);
const topHook = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), new THREE.MeshStandardMaterial({ color: 0xb9bfc6, metalness: 0.6, roughness: 0.3 }));
topHook.position.y = TOP_Y - 0.05;
group.add(topHook);

// Scale, printed alongside the spring.
const tickGroup = new THREE.Group();
group.add(tickGroup);
const MAX_N = 60;
const ZERO_Y = TOP_Y - REST_LEN; // where the pointer sits when unloaded (force = 0)
for (let n = 0; n <= MAX_N; n += 10) {
  const y = ZERO_Y - K * n;
  const tick = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: n % 20 === 0 ? 0x2c6e6b : 0x8a8a86 }));
  tick.position.set(0.55, y, 0);
  tickGroup.add(tick);
  if (n % 20 === 0) {
    const label = createLabel(`${n} N`, { fontSize: 22 });
    label.position.set(1.05, y, 0);
    tickGroup.add(label);
  }
}

// Spring, drawn as a zig-zag line that lengthens with the load.
const SPRING_SEGS = 14;
const springGeo = new THREE.BufferGeometry();
springGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((SPRING_SEGS + 1) * 3), 3));
const spring = new THREE.Line(springGeo, new THREE.LineBasicMaterial({ color: 0x555a63 }));
group.add(spring);

// Pointer, hook and hanging load.
const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 3), new THREE.MeshBasicMaterial({ color: 0xc23b2b }));
pointer.rotation.z = -Math.PI / 2;
group.add(pointer);
const hook = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), new THREE.MeshStandardMaterial({ color: 0xb9bfc6, metalness: 0.6, roughness: 0.3 }));
group.add(hook);
const load = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.6 }));
group.add(load);

const G = 9.8;
const state = { mass: 1 };
const els = {};

function refresh() {
  const force = state.mass * G;
  const stretch = Math.min(force * K, MAX_N * K * 1.02);
  const bottomY = TOP_Y - REST_LEN - stretch;

  const arr = springGeo.attributes.position.array;
  for (let i = 0; i <= SPRING_SEGS; i++) {
    const t = i / SPRING_SEGS;
    const y = TOP_Y - t * (TOP_Y - bottomY);
    const x = i === 0 || i === SPRING_SEGS ? 0 : (i % 2 === 0 ? -0.18 : 0.18);
    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = 0;
  }
  springGeo.attributes.position.needsUpdate = true;

  pointer.position.set(0.4, bottomY, 0);
  hook.position.set(0, bottomY - 0.1, 0);
  load.position.set(0, bottomY - 0.45, 0);
  load.scale.setScalar(0.6 + Math.min(1, state.mass / 5) * 0.7);

  if (els.reading) els.reading.textContent = `${force.toFixed(1)} N`;
}
refresh();

export default {
  id: "springbalance",
  name: "Spring balance",
  tag: "Physics · Measurement",
  subject: "Physics",
  grades: [6, 10],
  blurb: "Hang a load and read its weight straight off the scale, in newtons.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="4" width="16" height="5" rx="1" fill="currentColor"/><path d="M20 9v6l-4 2 4 2-4 2 4 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="15" y="28" width="10" height="9" rx="1" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0.3, 1.0, 0], radius: 8.5, theta: 0.25, phi: 1.35, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>A <strong>spring balance</strong> measures force directly. Hang a load from its hook and
    the spring inside stretches — the greater the pull, the more it stretches, and the change in
    length is <strong>proportional to the applied force</strong>. That means the scale can be
    marked directly in <strong>newtons</strong> (some also show kilogram-weight), and reading off
    the force is as simple as reading where the pointer sits.</p>
    <p>Besides weighing things, a spring balance is the standard tool for measuring
    <strong>friction</strong> in the lab: tie a string to a brick, pull it horizontally with the
    balance, and note the reading the instant the brick just starts to slide — that's the maximum
    force the surface's friction could resist.</p>
  `,

  quiz: [
    { q: "What does a spring balance measure?", choices: ["Volume", "Force (weight), in newtons", "Temperature", "Time"], answer: 1, explain: "A spring balance reads force directly, most often used to weigh objects." },
    { q: "What happens to the spring's extension when you double the hanging weight?", choices: ["It halves", "It stays the same", "It also roughly doubles", "It becomes negative"], answer: 2, explain: "Extension is proportional to the applied force, so doubling the force roughly doubles the stretch." },
    { q: "How is a spring balance used to measure friction?", choices: ["It cannot measure friction", "By reading the pulling force needed to just start an object sliding", "By weighing the object before and after", "By timing how long the object takes to stop"], answer: 1, explain: "The reading at the instant motion begins gives the maximum force friction was resisting." },
    { q: "A spring balance's scale can be marked directly in newtons because…", choices: ["Newtons and centimetres are the same unit", "The spring's extension is proportional to the applied force", "All springs stretch the same amount", "The scale is calibrated randomly"], answer: 1, explain: "Since extension scales with force, each position on the scale corresponds to one specific force value." },
  ],

  presets: [
    { label: "No load", note: "An unstretched spring reads zero.", values: { "sb-mass": 0 } },
    { label: "1 kg load", note: "About 9.8 N — Earth's gravity on 1 kg.", values: { "sb-mass": 1 } },
    { label: "5 kg load", note: "A much bigger pull, a much longer stretch.", values: { "sb-mass": 5 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>Force = mass × g</span><b class="mono" id="sb-reading">—</b></div>
      <div class="control"><div class="row"><label for="sb-mass">Load (kg)</label><output id="sb-massval" for="sb-mass"></output></div>
        <input type="range" id="sb-mass" min="0" max="5" step="0.25" value="${state.mass}"></div>
      <p class="fact">g ≈ 9.8 m/s², so a 1 kg load weighs about 9.8 N.</p>
    `;
  },

  wire(root) {
    els.mass = root.querySelector("#sb-mass");
    els.massval = root.querySelector("#sb-massval");
    els.reading = root.querySelector("#sb-reading");
    const sync = () => {
      els.massval.textContent = `${state.mass} kg`;
      refresh();
    };
    els.mass.addEventListener("input", () => ((state.mass = +els.mass.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
