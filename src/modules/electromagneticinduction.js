import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.65, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);

const metalMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.3, metalness: 0.75 });
const tubeMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.85 });
const needleMat = new THREE.MeshBasicMaterial({ color: 0xc23b2b });

// The coil — a helical loop of wire, the magnet slides through its bore.
const COIL_PTS = 300;
const COIL_SPAN = 2.6;
const COIL_TURNS = 12;
const coilGeo = new THREE.BufferGeometry();
{
  const arr = new Float32Array(COIL_PTS * 3);
  for (let i = 0; i < COIL_PTS; i++) {
    const f = i / (COIL_PTS - 1);
    const ang = f * COIL_TURNS * Math.PI * 2;
    arr[i * 3] = -COIL_SPAN / 2 + f * COIL_SPAN;
    arr[i * 3 + 1] = Math.cos(ang) * 0.55;
    arr[i * 3 + 2] = Math.sin(ang) * 0.55;
  }
  coilGeo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
}
const coil = new THREE.Line(coilGeo, new THREE.LineBasicMaterial({ color: 0xb0803f }));
group.add(coil);
const coilLabel = createLabel("Coil", { fontSize: 26 });
coilLabel.position.set(0, 1.0, 0);
group.add(coilLabel);

// The bar magnet: a red N half and a blue S half, sliding along the coil's axis.
const OUT_X = -3.4;
const IN_X = 0;
const magnet = new THREE.Group();
group.add(magnet);
const nHalf = new THREE.Mesh(
  new THREE.CylinderGeometry(0.32, 0.32, 0.9, 20),
  new THREE.MeshStandardMaterial({ color: 0xc23b2b, roughness: 0.4 })
);
nHalf.rotation.z = Math.PI / 2;
nHalf.position.x = -0.45;
magnet.add(nHalf);
const sHalf = new THREE.Mesh(
  new THREE.CylinderGeometry(0.32, 0.32, 0.9, 20),
  new THREE.MeshStandardMaterial({ color: 0x3a5fa8, roughness: 0.4 })
);
sHalf.rotation.z = Math.PI / 2;
sHalf.position.x = 0.45;
magnet.add(sHalf);
const nLabel = createLabel("N", { fontSize: 28, scale: 0.5 });
nLabel.position.set(-0.45, 0.5, 0);
magnet.add(nLabel);
const sLabel = createLabel("S", { fontSize: 28, scale: 0.5 });
sLabel.position.set(0.45, 0.5, 0);
magnet.add(sLabel);
magnet.position.x = OUT_X;

// Wires from the coil to the galvanometer.
function tubeBetween(a, b, radius) {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 10, radius, 8, false), tubeMat);
}
const gaugeCenter = [2.6, 1.6, 0];
group.add(tubeBetween([COIL_SPAN / 2, 0.55, 0], [gaugeCenter[0] - 0.3, gaugeCenter[1] - 0.55, 0], 0.045));
group.add(tubeBetween([COIL_SPAN / 2, -0.55, 0], [gaugeCenter[0] + 0.3, gaugeCenter[1] - 0.55, 0], 0.045));

// Galvanometer: a dial with a needle centered at zero, deflecting either way.
const gaugeRim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 32), metalMat);
gaugeRim.rotation.x = Math.PI / 2;
gaugeRim.position.set(...gaugeCenter);
group.add(gaugeRim);
const gaugeFace = new THREE.Mesh(
  new THREE.CylinderGeometry(0.63, 0.63, 0.05, 32),
  new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.5 })
);
gaugeFace.rotation.x = Math.PI / 2;
gaugeFace.position.set(gaugeCenter[0], gaugeCenter[1], gaugeCenter[2] + 0.08);
group.add(gaugeFace);
const gaugeLabel = createLabel("Galvanometer", { fontSize: 24 });
gaugeLabel.position.set(gaugeCenter[0], gaugeCenter[1] + 0.95, 0);
group.add(gaugeLabel);
// Centre tick (zero) plus end ticks either side.
[-1, 0, 1].forEach((s) => {
  const a = Math.PI / 2 + s * 0.9;
  const tick = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, s === 0 ? 0.18 : 0.12, 0.02),
    new THREE.MeshBasicMaterial({ color: s === 0 ? 0x2b2b2e : 0x8a8a86 })
  );
  tick.position.set(gaugeCenter[0] + Math.cos(a) * 0.5, gaugeCenter[1] + Math.sin(a) * 0.5, gaugeCenter[2] + 0.11);
  tick.rotation.z = a - Math.PI / 2;
  group.add(tick);
});
const needlePivot = new THREE.Group();
needlePivot.position.set(gaugeCenter[0], gaugeCenter[1], gaugeCenter[2] + 0.12);
group.add(needlePivot);
const needle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.02), needleMat);
needle.position.x = 0.25;
needlePivot.add(needle);
needlePivot.rotation.z = Math.PI / 2;

const state = { x: OUT_X, phase: "idle", t: 0, duration: 1.2, speed: 1, needleAngle: 0 };
const els = {};
const BASE_DURATION = 1.2;

function startMove(target) {
  if (state.phase === "moving") return;
  state.from = magnet.position.x;
  state.to = target;
  state.t = 0;
  state.duration = BASE_DURATION / state.speed;
  state.phase = "moving";
  if (els.msg) {
    els.msg.textContent = target === IN_X ? "Pushing the magnet in…" : "Pulling the magnet out…";
  }
}

export default {
  id: "electromagneticinduction",
  name: "Electromagnetic induction",
  tag: "Physics · Electromagnetism",
  subject: "Physics",
  grades: [9, 12],
  blurb: "Move a magnet through a coil and watch a galvanometer catch the current.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="16" cy="20" rx="7" ry="11" stroke="currentColor" stroke-width="2"/><path d="M23 20h6M27 20l-3-3M27 20l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="33" cy="20" r="4" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0.3, 0.5, 0], radius: 10.5, theta: 0.3, phi: 1.35, minRadius: 5, maxRadius: 18 },

  lesson: `
    <p>Connect a coil to a sensitive galvanometer and nothing happens — no battery, no current,
    the needle sits at zero. Now push a bar magnet toward the coil: while it's <strong>moving</strong>,
    the needle deflects, showing a current has appeared from nowhere. Hold the magnet still inside
    the coil and the needle drops straight back to zero, even though the magnet hasn't left.</p>
    <p>Pull the magnet back out and the needle deflects again — but this time in the <strong>opposite</strong>
    direction, meaning the current now flows the other way. This is <strong>electromagnetic induction</strong>:
    a current is induced only while the magnetic flux through the coil is <em>changing</em>, not
    simply because a magnet is nearby. Move the magnet faster and the deflection is bigger too —
    a faster change induces a bigger EMF.</p>
  `,

  quiz: [
    { q: "What does the galvanometer read when the magnet sits still, motionless inside the coil?", choices: ["Maximum deflection", "Zero — no deflection", "It depends on the magnet's colour", "It deflects slowly forever"], answer: 1, explain: "With no change in magnetic flux, no current is induced — the needle stays at zero." },
    { q: "What happens to the needle while the magnet is being pushed toward the coil?", choices: ["Nothing", "It deflects, showing an induced current", "It breaks", "It only moves if the coil is red"], answer: 1, explain: "The changing flux while the magnet moves induces a current, deflecting the needle." },
    { q: "If the magnet is pulled away instead of pushed in, the needle deflects…", choices: ["the same way, same size", "in the opposite direction", "not at all", "twice as far, same direction"], answer: 1, explain: "Reversing the direction of flux change reverses the direction of the induced current." },
    { q: "Moving the magnet faster through the coil makes the induced current…", choices: ["smaller", "bigger", "unchanged", "reversed"], answer: 1, explain: "A faster-changing flux induces a larger EMF, so the deflection grows with speed." },
  ],

  presets: [
    { label: "Slow push", note: "A gentle move — watch for a small deflection.", values: { "ei-speed": 0.5 } },
    { label: "Fast push", note: "The same distance, much faster — a bigger deflection.", values: { "ei-speed": 2.5 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="ei-speed">Magnet speed</label><output id="ei-speedval" for="ei-speed"></output></div>
        <input type="range" id="ei-speed" min="0.3" max="3" step="0.1" value="${state.speed}"></div>
      <div class="btn-row">
        <button class="btn primary" id="ei-in" type="button">Push magnet in</button>
        <button class="btn" id="ei-out" type="button">Pull magnet out</button>
      </div>
      <p class="fact" id="ei-msg">The magnet is outside the coil. Nothing is moving — no current.</p>
    `;
  },

  wire(root) {
    els.speed = root.querySelector("#ei-speed");
    els.speedval = root.querySelector("#ei-speedval");
    els.in = root.querySelector("#ei-in");
    els.out = root.querySelector("#ei-out");
    els.msg = root.querySelector("#ei-msg");
    const syncSpeed = () => (els.speedval.textContent = `${(+els.speed.value).toFixed(1)}×`);
    els.speed.addEventListener("input", () => {
      state.speed = +els.speed.value;
      syncSpeed();
    });
    els.in.addEventListener("click", () => startMove(IN_X));
    els.out.addEventListener("click", () => startMove(OUT_X));
    syncSpeed();
  },

  update(dt) {
    let velocity = 0;
    if (state.phase === "moving") {
      state.t += dt;
      const p = Math.min(1, state.t / state.duration);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const prevX = magnet.position.x;
      magnet.position.x = THREE.MathUtils.lerp(state.from, state.to, eased);
      velocity = (magnet.position.x - prevX) / Math.max(dt, 1e-4);
      if (p >= 1) {
        state.phase = "idle";
        if (els.msg) {
          els.msg.textContent =
            state.to === IN_X
              ? "The magnet is at rest inside the coil — flux has stopped changing, current is zero."
              : "The magnet is at rest outside the coil — no change, no current.";
        }
      }
    }
    const targetAngle = THREE.MathUtils.clamp(velocity * 0.55, -0.9, 0.9);
    state.needleAngle = THREE.MathUtils.lerp(state.needleAngle, targetAngle, Math.min(1, dt * 10));
    needlePivot.rotation.z = Math.PI / 2 - state.needleAngle;
  },

  onEnter() {},
  onExit() {},
};
