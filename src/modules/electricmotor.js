import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.65, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);

const wireMat = new THREE.MeshStandardMaterial({ color: 0xb0803f, metalness: 0.7, roughness: 0.35 });
const shaftMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.3, metalness: 0.75 });

// Curve-shaped permanent magnet: an N pole and an S pole facing each other, coil spins between them.
function poleBlock(color) {
  return new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 1.0), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
}
const nPole = poleBlock(0xc23b2b);
nPole.position.set(-1.9, 0, 0);
group.add(nPole);
const sPole = poleBlock(0x3a5fa8);
sPole.position.set(1.9, 0, 0);
group.add(sPole);
const nLabel = createLabel("N", { fontSize: 28 });
nLabel.position.set(-1.9, 1.5, 0);
group.add(nLabel);
const sLabel = createLabel("S", { fontSize: 28 });
sLabel.position.set(1.9, 1.5, 0);
group.add(sLabel);

// The rectangular coil (A-B-C-D), spinning about the shaft between the poles.
const coilGroup = new THREE.Group();
group.add(coilGroup);
function bar(from, to) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, dir.length(), 10), wireMat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return m;
}
const HW = 0.65;
const HH = 1.0;
coilGroup.add(
  bar([-HW, HH, 0], [HW, HH, 0]),
  bar([-HW, -HH, 0], [HW, -HH, 0]),
  bar([-HW, -HH, 0], [-HW, HH, 0]),
  bar([HW, -HH, 0], [HW, HH, 0])
);
const coilLabel = createLabel("Coil", { fontSize: 24 });
coilLabel.position.set(0, 0, 1.1);
group.add(coilLabel);

// Shaft and commutator/slip-ring — mounted on top of the coil, spinning with it
// (both are children of coilGroup, which is what rotation.y actually animates).
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12), shaftMat);
shaft.position.y = HH + 0.35;
coilGroup.add(shaft);
const ringGroup = new THREE.Group();
ringGroup.position.y = HH + 0.75;
ringGroup.rotation.x = Math.PI / 2;
coilGroup.add(ringGroup);
function buildRing(splitCommutator) {
  ringGroup.clear();
  if (splitCommutator) {
    [0, Math.PI].forEach((start, i) => {
      const half = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.06, 8, 16, Math.PI - 0.15),
        new THREE.MeshStandardMaterial({ color: i === 0 ? 0xc23b2b : 0x3a5fa8, metalness: 0.5, roughness: 0.4 })
      );
      half.rotation.z = start;
      ringGroup.add(half);
    });
  } else {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.06, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xb9bfc6, metalness: 0.6, roughness: 0.35 })
    );
    ringGroup.add(ring);
  }
}
const ringLabel = createLabel("Commutator", { fontSize: 22 });
ringLabel.position.set(0, HH + 1.25, 0);
group.add(ringLabel);

const state = { on: false, splitCommutator: true, theta: 0, omega: 0 };
const els = {};

export default {
  id: "electricmotor",
  name: "Electric motor",
  tag: "Physics · Electromagnetism",
  subject: "Physics",
  grades: [9, 12],
  blurb: "Send current through a coil in a magnetic field and it spins — if the wiring is right.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="12" width="6" height="16" rx="1" fill="currentColor"/><rect x="30" y="12" width="6" height="16" rx="1" fill="currentColor"/><rect x="16" y="10" width="8" height="20" rx="1.5" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0.1, 0], radius: 9.5, theta: 0.35, phi: 1.3, minRadius: 5, maxRadius: 17 },

  lesson: `
    <p>Place a current-carrying rectangular coil between a magnet's N and S poles and each side
    feels a force at right angles to the field. The forces on opposite sides point opposite ways,
    so although the net push on the coil is zero, it still <strong>rotates</strong> — the same idea
    as two hands twisting a bottle cap in opposite directions (Fleming's left-hand rule gives the
    direction of each force).</p>
    <p>There's a catch: after a half-turn, those same forces would try to spin the coil back the
    other way, and it would just rock to a halt. The fix is a <strong>split-ring commutator</strong> —
    it reverses the current in the coil every half rotation, so the force keeps pushing the same
    way and the coil spins continuously in one direction. Swap the split-ring for a plain,
    unbroken slip ring and the current never reverses — the coil only oscillates back and forth.</p>
    <p>In an electric motor, electrical energy is converted into mechanical energy — the opposite
    conversion to a generator.</p>
  `,

  quiz: [
    { q: "An electric motor converts…", choices: ["mechanical energy into electrical energy", "electrical energy into mechanical energy", "heat into light", "sound into electricity"], answer: 1, explain: "A motor takes electrical energy in and delivers mechanical rotation out." },
    { q: "What does the split-ring commutator do?", choices: ["Increases the magnet's strength", "Reverses the current in the coil every half rotation", "Stops the coil from overheating", "Measures the current"], answer: 1, explain: "Reversing the current each half-turn keeps the force pushing the coil the same way, so it spins continuously." },
    { q: "If a plain, unbroken slip ring is used instead of a split-ring commutator, the coil…", choices: ["spins even faster", "oscillates back and forth instead of turning continuously", "runs in reverse", "behaves exactly the same"], answer: 1, explain: "Without the current reversing, the force reverses direction every half-turn and the coil just rocks back and forth." },
    { q: "Which rule gives the direction of the force on the current-carrying coil in the motor?", choices: ["Fleming's left-hand rule", "The law of conservation of mass", "Ohm's law", "Newton's third law only"], answer: 0, explain: "Fleming's left-hand rule (thumb, first finger, second finger) gives force, field, and current directions." },
  ],

  presets: [
    { label: "Commutator, powered on", note: "The realistic wiring — the coil spins continuously.", values: { "em-power": "on", "em-commutator": "split" } },
    { label: "Plain rings, powered on", note: "No commutator — watch it oscillate instead of spinning.", values: { "em-power": "on", "em-commutator": "plain" } },
    { label: "Power off", note: "No current, no force — the coil coasts to a stop.", values: { "em-power": "off" } },
  ],

  panelHTML() {
    return `
      <select id="em-power" class="text-input" aria-label="Power">
        <option value="off">Power: off</option>
        <option value="on">Power: on</option>
      </select>
      <select id="em-commutator" class="text-input" aria-label="Commutator type">
        <option value="split">Split-ring commutator</option>
        <option value="plain">Plain slip ring (no commutator)</option>
      </select>
      <p class="fact" id="em-status">Switch the power on to see the coil respond.</p>
    `;
  },

  wire(root) {
    els.power = root.querySelector("#em-power");
    els.commutator = root.querySelector("#em-commutator");
    els.status = root.querySelector("#em-status");
    els.power.addEventListener("input", () => (state.on = els.power.value === "on"));
    els.commutator.addEventListener("input", () => {
      state.splitCommutator = els.commutator.value === "split";
      buildRing(state.splitCommutator);
    });
    buildRing(state.splitCommutator);
  },

  update(dt) {
    if (state.on) {
      if (state.splitCommutator) {
        state.omega = THREE.MathUtils.lerp(state.omega, 9, dt * 1.5);
        if (els.status) els.status.textContent = "The commutator keeps reversing the current — the coil spins continuously.";
      } else {
        const accel = 6 * Math.cos(state.theta) - 1.1 * state.omega;
        state.omega += accel * dt;
        if (els.status) els.status.textContent = "No commutator — the force reverses each half-turn, so the coil just oscillates.";
      }
    } else {
      state.omega *= Math.max(0, 1 - dt * 3);
      if (els.status) els.status.textContent = "Switch the power on to see the coil respond.";
    }
    state.theta += state.omega * dt;
    coilGroup.rotation.y = state.theta;
  },

  onEnter() {},
  onExit() {},
};
