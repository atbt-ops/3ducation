import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.75 });
const group = new THREE.Group();
scene.add(group);

// The jar.
const jar = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1, 1.0, 2.6, 32, 1, true),
  new THREE.MeshPhysicalMaterial({ color: 0xdfefe8, transmission: 0.55, transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide })
);
jar.position.y = -0.3;
group.add(jar);
const jarBase = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0xb0895a, roughness: 0.7 }));
jarBase.position.y = -1.6;
group.add(jarBase);

// The lid, rod, and touch-ball on top.
const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0xb0895a, roughness: 0.7 }));
lid.position.y = 1.0;
group.add(lid);
const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 12), new THREE.MeshStandardMaterial({ color: 0xb9bfc6, metalness: 0.7, roughness: 0.3 }));
rod.position.y = 1.55;
group.add(rod);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: 0xb9bfc6, metalness: 0.7, roughness: 0.2 }));
ball.position.y = 2.15;
group.add(ball);
const ballLabel = createLabel("Touch here", { fontSize: 22 });
ballLabel.position.set(0, 2.7, 0);
group.add(ballLabel);

// Two foil leaves, hanging from the bottom of the rod, pivoting apart when charged.
const leafMat = new THREE.MeshBasicMaterial({ color: 0xd9b23c, side: THREE.DoubleSide });
function leaf(sign) {
  const pivot = new THREE.Group();
  pivot.position.set(0, 0.95, 0);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.9), leafMat);
  plane.position.y = -0.45;
  pivot.add(plane);
  pivot.rotation.z = 0;
  pivot.userData.sign = sign;
  return pivot;
}
const leafL = leaf(-1);
const leafR = leaf(1);
group.add(leafL, leafR);
const leafLabel = createLabel("Foil leaves", { fontSize: 22 });
leafLabel.position.set(1.6, 0.4, 0);
group.add(leafLabel);

const state = { charge: 0 };
const els = {};
const MAX_ANGLE = THREE.MathUtils.degToRad(38);

function refresh() {
  const angle = state.charge * MAX_ANGLE;
  leafL.rotation.z = angle;
  leafR.rotation.z = -angle;
  if (els.status) {
    if (state.charge < 0.05) els.status.textContent = "Neutral — the leaves hang straight down, touching each other.";
    else els.status.textContent = `Charged (${Math.round(state.charge * 100)}%) — both leaves carry the same charge and repel, spreading apart.`;
  }
}
refresh();

export default {
  id: "electroscope",
  name: "Electroscope",
  tag: "Physics · Electrostatics",
  subject: "Physics",
  grades: [6, 10],
  blurb: "Touch it with a charged rod and watch two foil leaves push apart.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 8h12M20 8v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="6" r="2.2" fill="currentColor"/><path d="M12 18h16v14a8 8 0 0 1-16 0z" stroke="currentColor" stroke-width="2"/><path d="M20 18l-5 12M20 18l5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0.3, 0], radius: 8, theta: 0.3, phi: 1.35, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>An <strong>electroscope</strong> is a simple device for detecting electric charge. Two
    thin, light leaves (traditionally gold foil, here aluminium foil) hang side by side from a
    metal rod. Touch the top of the rod with a charged object, and charge flows down onto both
    leaves equally — since they now carry the <strong>same</strong> charge, they
    <strong>repel</strong> each other and spring apart.</p>
    <p>Touch the rod with your hand instead, and the charge flows away through you to the ground
    — this is called <strong>earthing</strong> (or discharging) — and the leaves fall back
    together. Simple attraction isn't a reliable way to tell if something is charged (even neutral
    objects can sometimes be pulled toward a charge), but this spreading-apart test is: only like
    charges repel, so if the leaves diverge, you know for certain the electroscope is charged.</p>
  `,

  quiz: [
    { q: "Why do the two foil leaves move apart when the electroscope is charged?", choices: ["They lose weight", "They receive the same charge, and like charges repel", "Air pressure pushes them", "One leaf becomes magnetic"], answer: 1, explain: "Both leaves receive the same charge from the rod, and like charges repel each other." },
    { q: "What happens when you touch the charged rod with your hand?", choices: ["Nothing changes", "The charge is destroyed", "The charge flows to the ground through you, and the leaves fall back together", "The leaves spread even further apart"], answer: 2, explain: "This is called earthing (or discharging) — your body conducts the charge away to the ground." },
    { q: "What material was traditionally used for the leaves in an electroscope?", choices: ["Copper wire", "Gold foil", "Plastic film", "Cotton thread"], answer: 1, explain: "Older electroscopes used thin gold foil, giving the classic 'gold-leaf electroscope' its name." },
    { q: "Is an object being attracted toward a charged rod a sure sign that the object is charged?", choices: ["Yes, always", "No — attraction alone isn't a reliable test; repulsion is the sure test", "Only on Tuesdays", "Only if the object is metal"], answer: 1, explain: "Even some uncharged objects can be attracted, so attraction alone doesn't prove charge — but repulsion (as in the electroscope) does." },
  ],

  presets: [
    { label: "Neutral", note: "No charge — the leaves hang together.", values: { "es-charge": 0 } },
    { label: "Lightly charged", note: "A gentle touch with a charged rod.", values: { "es-charge": 40 } },
    { label: "Fully charged", note: "Repeated touches build up more charge — the leaves spread wide.", values: { "es-charge": 100 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="es-charge">Charge</label><output id="es-chargeval" for="es-charge"></output></div>
        <input type="range" id="es-charge" min="0" max="100" step="5" value="0"></div>
      <div class="btn-row"><button class="btn primary" id="es-discharge" type="button">Discharge (touch with hand)</button></div>
      <p class="fact" id="es-status">—</p>
    `;
  },

  wire(root) {
    els.charge = root.querySelector("#es-charge");
    els.chargeval = root.querySelector("#es-chargeval");
    els.discharge = root.querySelector("#es-discharge");
    els.status = root.querySelector("#es-status");
    const sync = () => {
      els.chargeval.textContent = `${Math.round(state.charge * 100)}%`;
      refresh();
    };
    els.charge.addEventListener("input", () => ((state.charge = +els.charge.value / 100), sync()));
    els.discharge.addEventListener("click", () => {
      state.charge = 0;
      els.charge.value = 0;
      sync();
    });
    state.charge = 0;
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
