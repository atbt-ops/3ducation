import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.68, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);

const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0b08c, roughness: 0.7 });
const rubberMat = new THREE.MeshStandardMaterial({ color: 0xc23b2b, roughness: 0.6 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.3, metalness: 0.75 });
const nerveMat = new THREE.MeshBasicMaterial({ color: 0xd8d4c8 });

// Thigh — fixed, resting on the other (crossed) leg.
const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.8, 20), skinMat);
thigh.rotation.z = Math.PI / 2 - 0.15;
thigh.position.set(-1.0, 0.15, 0);
group.add(thigh);

// Shin — hangs from the knee joint and swings forward on the reflex.
const kneePos = new THREE.Vector3(0, 0, 0);
const shinGroup = new THREE.Group();
shinGroup.position.copy(kneePos);
group.add(shinGroup);
const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 1.9, 20), skinMat);
shin.position.y = -1.0;
shinGroup.add(shin);
const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.55), skinMat);
foot.position.set(0, -1.95, 0.15);
shinGroup.add(foot);
const shinLabel = createLabel("Lower leg (shin)", { fontSize: 24 });
shinLabel.position.set(0, -1.35, 0.5);
shinGroup.add(shinLabel);

// Kneecap — the tap target.
const patella = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), skinMat);
patella.position.set(0, -0.05, 0.32);
group.add(patella);
const kneeLabel = createLabel("Patellar tendon", { fontSize: 22 });
kneeLabel.position.set(0.9, -0.05, 0.32);
group.add(kneeLabel);

// Reflex hammer — a handle and a triangular rubber head, pivoting to tap the knee.
const hammerPivot = new THREE.Group();
hammerPivot.position.set(1.0, 1.35, 0.5);
group.add(hammerPivot);
const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 12), metalMat);
handle.position.y = -0.65;
hammerPivot.add(handle);
const head = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.32, 3), rubberMat);
head.rotation.z = Math.PI;
head.position.y = -1.35;
hammerPivot.add(head);
const hammerLabel = createLabel("Reflex hammer", { fontSize: 24 });
hammerLabel.position.set(0, 0.35, 0);
hammerPivot.add(hammerLabel);
const READY_ANGLE = -1.15;
const STRIKE_ANGLE = -0.05;
hammerPivot.rotation.z = READY_ANGLE;

// The reflex arc: knee → spinal cord → back to the thigh muscle. A signal pulse
// travels this short loop instead of going all the way up to the brain.
const spinalNode = new THREE.Vector3(2.4, 1.9, 0);
const armPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.15, 0.1, 0.32),
  new THREE.Vector3(1.4, 0.9, 0.2),
  spinalNode,
  new THREE.Vector3(1.2, 1.2, -0.2),
  new THREE.Vector3(-0.6, 0.4, -0.15),
]);
const armLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(armPath.getPoints(60)),
  new THREE.LineBasicMaterial({ color: 0xc9c9c4 })
);
group.add(armLine);
const spinalCordLabel = createLabel("Spinal cord", { fontSize: 22 });
spinalCordLabel.position.set(spinalNode.x, spinalNode.y + 0.5, spinalNode.z);
group.add(spinalCordLabel);

const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), nerveMat);
pulse.visible = false;
group.add(pulse);

const state = { nerveIntact: true, phase: "idle", t: 0 };
const els = {};

const PHASE_SWING = 0.28; // hammer swings down to the knee
const PHASE_KICK = 0.55; // shin kicks forward, then eases back
const PHASE_PULSE = 0.6; // how long the nerve pulse takes to complete its loop

function trigger() {
  if (state.phase !== "idle") return;
  state.phase = "swing";
  state.t = 0;
  if (els.msg) els.msg.textContent = "Tapping the tendon…";
}

export default {
  id: "reflexhammer",
  name: "Reflex hammer",
  tag: "Biology · Coordination",
  subject: "Biology",
  grades: [8, 12],
  blurb: "Tap the knee and watch an involuntary reflex arc fire — no brain required.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 30c6 2 12-2 12-9V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="9" r="2.4" fill="currentColor"/><path d="M24 6l8 8-3 3-8-8z" fill="currentColor"/></svg>',
  scene,
  view: { target: [0.3, -0.2, 0], radius: 10, theta: 0.35, phi: 1.25, minRadius: 5, maxRadius: 17 },

  lesson: `
    <p>Tap the tendon just below the kneecap and the lower leg kicks forward on its own — the
    <strong>knee-jerk reflex</strong>. You can feel it happen and you're fully conscious, but you
    can't stop it: it's an <strong>involuntary</strong> response, unlike voluntarily kicking a
    football with the same muscle.</p>
    <p>Reflexes like this are fast because the signal takes a short cut: it travels only from the
    knee to the <strong>spinal cord</strong> and straight back to the thigh muscle — a
    <em>reflex arc</em> — without ever going up to the brain. A voluntary movement takes a longer
    pathway through the brain instead.</p>
    <p>The knee-jerk was first described in 1875. Researchers later confirmed the pathway by
    cutting the spinal nerves supplying an anaesthetized monkey's limb — the reflex stopped
    happening completely, proving a nerve pathway, not the muscle alone, was responsible.</p>
  `,

  quiz: [
    { q: "The knee-jerk reflex is an example of a response that is…", choices: ["voluntary", "involuntary", "not a nervous response at all", "only found in monkeys"], answer: 1, explain: "You can't prevent it even though you're conscious — that makes it an involuntary reflex." },
    { q: "Why is the knee-jerk reflex so fast?", choices: ["The signal travels all the way to the brain and back", "The signal only travels to the spinal cord and back — a short reflex arc", "There is no nerve signal involved", "The muscle reacts to the sound of the tap"], answer: 1, explain: "A reflex arc is a short pathway to the spinal cord, skipping the longer route through the brain." },
    { q: "In the historical experiment, what happened when a monkey's spinal nerves to the limb were cut?", choices: ["The knee-jerk got stronger", "Nothing changed", "The knee-jerk reflex stopped happening", "The monkey lost all muscle movement"], answer: 2, explain: "Cutting the nerve pathway stopped the reflex, proving a nerve pathway was involved." },
    { q: "Which muscle actually contracts to produce the knee-jerk kick?", choices: ["A muscle in the foot", "The thigh (quadriceps) muscle", "A muscle in the neck", "No muscle — only the tendon moves"], answer: 1, explain: "The tap stretches the tendon, which triggers the thigh muscle to contract and kick the shin forward." },
  ],

  presets: [
    { label: "Normal reflex", note: "An intact nerve pathway — tap it and the leg kicks.", values: { "rh-nerve": "intact" } },
    { label: "Cut nerve (the 1875 test)", note: "Sever the pathway and the same tap produces nothing.", values: { "rh-nerve": "cut" } },
  ],

  panelHTML() {
    return `
      <select id="rh-nerve" class="text-input" aria-label="Nerve pathway">
        <option value="intact">Nerve pathway: intact</option>
        <option value="cut">Nerve pathway: cut</option>
      </select>
      <div class="btn-row"><button class="btn primary" id="rh-tap" type="button">Tap the knee</button></div>
      <p class="fact" id="rh-msg">A rubber hammer strikes the tendon just below the kneecap.</p>
    `;
  },

  wire(root) {
    els.nerve = root.querySelector("#rh-nerve");
    els.tap = root.querySelector("#rh-tap");
    els.msg = root.querySelector("#rh-msg");
    els.nerve.addEventListener("input", () => {
      state.nerveIntact = els.nerve.value === "intact";
    });
    els.tap.addEventListener("click", trigger);
  },

  update(dt) {
    if (state.phase === "idle") return;
    state.t += dt;

    if (state.phase === "swing") {
      const p = Math.min(1, state.t / PHASE_SWING);
      hammerPivot.rotation.z = THREE.MathUtils.lerp(READY_ANGLE, STRIKE_ANGLE, p);
      if (p >= 1) {
        state.phase = state.nerveIntact ? "kick" : "nokick";
        state.t = 0;
        if (state.nerveIntact) {
          pulse.visible = true;
          if (els.msg) els.msg.textContent = "Signal races to the spinal cord and straight back — the leg kicks.";
        } else if (els.msg) {
          els.msg.textContent = "The pathway is cut — the tendon stretches, but no signal returns. Nothing happens.";
        }
      }
    } else if (state.phase === "kick") {
      const p = state.t / PHASE_KICK;
      const kick = p < 0.25 ? p / 0.25 : Math.max(0, 1 - (p - 0.25) / 0.75);
      shinGroup.rotation.z = -0.55 * kick;
      pulse.position.copy(armPath.getPointAt(Math.min(0.999, state.t / PHASE_PULSE)));
      const swingBack = Math.min(1, state.t / PHASE_SWING);
      hammerPivot.rotation.z = THREE.MathUtils.lerp(STRIKE_ANGLE, READY_ANGLE, swingBack);
      if (p >= 1) {
        state.phase = "idle";
        state.t = 0;
        shinGroup.rotation.z = 0;
        pulse.visible = false;
        if (els.msg) els.msg.textContent = "A rubber hammer strikes the tendon just below the kneecap.";
      }
    } else if (state.phase === "nokick") {
      const swingBack = Math.min(1, state.t / PHASE_SWING);
      hammerPivot.rotation.z = THREE.MathUtils.lerp(STRIKE_ANGLE, READY_ANGLE, swingBack);
      if (state.t >= PHASE_KICK) {
        state.phase = "idle";
        state.t = 0;
      }
    }
  },

  onEnter() {},
  onExit() {},
};
