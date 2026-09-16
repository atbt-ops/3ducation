import * as THREE from "three";
import { sceneLights, glowSprite } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.65, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);

const wireMat = new THREE.MeshStandardMaterial({ color: 0xb0803f, metalness: 0.7, roughness: 0.35 });
const shaftMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.3, metalness: 0.75 });
const metalMat = shaftMat;
const tubeMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.85 });
const needleMat = new THREE.MeshBasicMaterial({ color: 0xc23b2b });

// Curve-shaped permanent magnet, coil cranked between the poles.
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

// The coil, cranked by hand between the poles.
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

// Shaft, ring, and a hand-crank — all spin together with the coil.
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12), shaftMat);
shaft.position.y = HH + 0.35;
coilGroup.add(shaft);
const ringGroup = new THREE.Group();
ringGroup.position.y = HH + 0.75;
ringGroup.rotation.x = Math.PI / 2;
coilGroup.add(ringGroup);
function buildRing(isAC) {
  ringGroup.clear();
  if (isAC) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.06, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xb9bfc6, metalness: 0.6, roughness: 0.35 })
    );
    ringGroup.add(ring);
  } else {
    [0, Math.PI].forEach((start, i) => {
      const half = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.06, 8, 16, Math.PI - 0.15),
        new THREE.MeshStandardMaterial({ color: i === 0 ? 0xc23b2b : 0x3a5fa8, metalness: 0.5, roughness: 0.4 })
      );
      half.rotation.z = start;
      ringGroup.add(half);
    });
  }
}
let ringLabel = createLabel("Slip rings", { fontSize: 22 });
ringLabel.position.set(0, HH + 1.25, 0);
group.add(ringLabel);
function updateRingLabel(isAC) {
  group.remove(ringLabel);
  ringLabel = createLabel(isAC ? "Slip rings" : "Split-ring commutator", { fontSize: 22 });
  ringLabel.position.set(0, HH + 1.25, 0);
  group.add(ringLabel);
}

const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), shaftMat);
crank.rotation.z = Math.PI / 2;
crank.position.set(0, 0, 1.4);
coilGroup.add(crank);
const handle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), shaftMat);
handle.position.set(0.45, 0, 1.4);
coilGroup.add(handle);
const crankLabel = createLabel("Hand crank", { fontSize: 22 });
crankLabel.position.set(0.9, 0.5, 1.4);
group.add(crankLabel);

// Wires to a meter and a bulb — the "external device" the generator powers.
function tubeBetween(a, b, radius) {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 10, radius, 8, false), tubeMat);
}
const gaugeCenter = [3.0, 1.1, 0];
group.add(tubeBetween([1.9, HH + 0.75, -0.3], [gaugeCenter[0] - 0.3, gaugeCenter[1] - 0.5, 0], 0.045));
const bulbPos = [3.0, -1.1, 0];
group.add(tubeBetween([1.9, HH + 0.4, 0.3], [bulbPos[0] - 0.2, bulbPos[1] + 0.5, 0], 0.045));

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
const gaugeLabel = createLabel("Output current", { fontSize: 22 });
gaugeLabel.position.set(gaugeCenter[0], gaugeCenter[1] + 0.95, 0);
group.add(gaugeLabel);
const needlePivot = new THREE.Group();
needlePivot.position.set(gaugeCenter[0], gaugeCenter[1], gaugeCenter[2] + 0.12);
group.add(needlePivot);
const needle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.02), needleMat);
needle.position.x = 0.25;
needlePivot.add(needle);

const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff3c0, emissive: 0xffc860, emissiveIntensity: 0 });
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), bulbMat);
bulb.position.set(...bulbPos);
group.add(bulb);
const bulbGlowSprite = glowSprite({ color: 0xffce7a, size: 1.4 });
bulbGlowSprite.material.opacity = 0;
bulb.add(bulbGlowSprite);
const bulbLabel = createLabel("Bulb", { fontSize: 22 });
bulbLabel.position.set(bulbPos[0], bulbPos[1] - 0.6, 0);
group.add(bulbLabel);

const state = { crankSpeed: 0, isAC: true, theta: 0 };
const els = {};

export default {
  id: "electricgenerator",
  name: "Electric generator",
  tag: "Physics · Electromagnetism",
  subject: "Physics",
  grades: [9, 12],
  blurb: "Crank a coil through a magnetic field and watch it generate current.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="12" width="6" height="16" rx="1" fill="currentColor"/><rect x="30" y="12" width="6" height="16" rx="1" fill="currentColor"/><rect x="16" y="10" width="8" height="20" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M20 4v4M20 32v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0.6, 0, 0], radius: 11.5, theta: 0.3, phi: 1.3, minRadius: 6, maxRadius: 19 },

  lesson: `
    <p>Turn a rectangular coil between a magnet's poles and the magnetic flux passing through it
    keeps changing — by Faraday's law, that induces an EMF in the coil. When the coil is vertical,
    no flux lines cross it and the output is zero; a quarter-turn later, in the horizontal
    position, the output peaks.</p>
    <p>The coil's ends connect to two <strong>slip rings</strong> that rotate with it, pressed by
    fixed carbon brushes. Because the coil's orientation to the field reverses every half turn, the
    current direction reverses too — this is <strong>alternating current (AC)</strong>. Replace the
    slip rings with a <strong>split-ring commutator</strong> (two half-rings) instead, and the
    external circuit's connections swap at exactly the same moment the current reverses inside the
    coil — so the output current always flows the same way through the bulb, giving
    <strong>direct current (DC)</strong> that still rises and falls, but never goes negative.</p>
    <p>Either way, a generator converts mechanical energy (the crank) into electrical energy.</p>
  `,

  quiz: [
    { q: "A generator converts…", choices: ["electrical energy into mechanical energy", "mechanical energy into electrical energy", "light into sound", "heat into mass"], answer: 1, explain: "Turning the coil (mechanical energy) induces a current (electrical energy) — the opposite of a motor." },
    { q: "When is the induced EMF zero as the coil turns?", choices: ["When the coil is horizontal", "When the coil is vertical, with no flux crossing it", "It is never zero", "Only when the crank stops"], answer: 1, explain: "In the vertical position no magnetic flux lines pass through the coil, so the induced EMF is momentarily zero." },
    { q: "What makes the output alternating current (AC) instead of direct current (DC)?", choices: ["Slip rings, which keep the same external connection as the coil's current reverses", "A stronger magnet", "Turning the crank faster", "Using a thicker wire"], answer: 0, explain: "With plain slip rings, the reversing current inside the coil passes straight through to the external circuit, alternating its direction." },
    { q: "How does a split-ring commutator turn this into DC?", choices: ["It blocks the current entirely", "It swaps the external connections every half turn, in step with the current reversing inside the coil", "It doubles the voltage", "It stops the coil from turning"], answer: 1, explain: "The swap happens at the same moment the coil's current reverses, so the external current always flows the same direction." },
  ],

  presets: [
    { label: "AC generator, cranking", note: "Slip rings — the output alternates back and forth.", values: { "eg-ac": "ac", "eg-speed": 3 } },
    { label: "DC generator, cranking", note: "Split-ring commutator — the output always flows the same way.", values: { "eg-ac": "dc", "eg-speed": 3 } },
    { label: "Stopped", note: "No turning, no changing flux, no output.", values: { "eg-speed": 0 } },
  ],

  panelHTML() {
    return `
      <select id="eg-ac" class="text-input" aria-label="Ring type">
        <option value="ac">Slip rings (AC output)</option>
        <option value="dc">Split-ring commutator (DC output)</option>
      </select>
      <div class="control"><div class="row"><label for="eg-speed">Crank speed</label><output id="eg-speedval" for="eg-speed"></output></div>
        <input type="range" id="eg-speed" min="0" max="6" step="0.1" value="${state.crankSpeed}"></div>
      <p class="fact">Watch the needle and the bulb as you crank faster or switch ring types.</p>
    `;
  },

  wire(root) {
    els.ac = root.querySelector("#eg-ac");
    els.speed = root.querySelector("#eg-speed");
    els.speedval = root.querySelector("#eg-speedval");
    const syncSpeed = () => (els.speedval.textContent = `${(+els.speed.value).toFixed(1)} rad/s`);
    els.ac.addEventListener("input", () => {
      state.isAC = els.ac.value === "ac";
      buildRing(state.isAC);
      updateRingLabel(state.isAC);
    });
    els.speed.addEventListener("input", () => {
      state.crankSpeed = +els.speed.value;
      syncSpeed();
    });
    buildRing(state.isAC);
    syncSpeed();
  },

  update(dt) {
    state.theta += state.crankSpeed * dt;
    coilGroup.rotation.y = state.theta;
    const raw = Math.sin(state.theta);
    const value = state.isAC ? raw : Math.abs(raw);
    needlePivot.rotation.z = Math.PI / 2 - value * 0.9;
    bulbMat.emissiveIntensity = Math.abs(value) * 2.2;
    bulbGlowSprite.material.opacity = Math.abs(value) * 0.8;
  },

  onEnter() {},
  onExit() {},
};
