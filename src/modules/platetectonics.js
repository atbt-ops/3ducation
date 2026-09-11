import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.75, dir: 0.95, rim: 0.4 });

const mantle = new THREE.Mesh(
  new THREE.BoxGeometry(8, 0.6, 4),
  new THREE.MeshStandardMaterial({ color: 0xb14a1e, roughness: 0.7, emissive: 0x5a1c08, emissiveIntensity: 0.3 })
);
mantle.position.y = -0.5;
scene.add(mantle);

const leftPlate = new THREE.Mesh(
  new THREE.BoxGeometry(3, 0.5, 3),
  new THREE.MeshStandardMaterial({ color: 0x6b8f52, roughness: 0.85 })
);
scene.add(leftPlate);

const rightPlate = new THREE.Mesh(
  new THREE.BoxGeometry(3, 0.5, 3),
  new THREE.MeshStandardMaterial({ color: 0x4a6f8a, roughness: 0.85 })
);
scene.add(rightPlate);

const mountainGeo = new THREE.ConeGeometry(0.45, 1.1, 4);
mountainGeo.translate(0, 0.55, 0); // base sits at local y=0, so scaling grows it upward from the plates
const mountain = new THREE.Mesh(mountainGeo, new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.9 }));
mountain.rotation.y = Math.PI / 4;
scene.add(mountain);

const riftGlow = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.12, 3),
  new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff8a1f, emissiveIntensity: 0.7, roughness: 0.4 })
);
riftGlow.position.y = -0.15;
scene.add(riftGlow);

const MODES = [
  {
    name: "Divergent",
    desc: "Plates pull apart. Magma rises to fill the gap and cools into new crust — this is how ocean floors widen, at mid-ocean ridges.",
  },
  {
    name: "Convergent",
    desc: "Plates push together. The denser plate slides down beneath the other (subduction) while rock crumples upward into a mountain range.",
  },
  {
    name: "Transform",
    desc: "Plates grind sideways past each other in opposite directions. Stress builds up along the fault and releases suddenly — causing earthquakes.",
  },
];

const state = { mode: 0, t: 0 };
const els = {};
const PERIOD = 4.5; // seconds per loop — this is a simplified, continuously-repeating demonstration

export default {
  id: "platetectonics",
  name: "Plate tectonics",
  tag: "Earth Science · Structure",
  subject: "Earth Science",
  grades: [6, 10],
  blurb: "Plates pulling apart, crashing together, or sliding past.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="16" width="14" height="8" stroke="currentColor" stroke-width="2"/><rect x="22" y="16" width="14" height="8" stroke="currentColor" stroke-width="2"/><path d="M18 16l2 4-2 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0.45, phi: 0.75, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>Earth's crust isn't one solid shell — it's broken into huge slabs called <strong>tectonic
    plates</strong>, floating on the slow-flowing mantle below. Where two plates meet, three things
    can happen: they can pull apart, crash together, or grind past each other sideways. Each kind
    of boundary shapes the landscape differently.</p>
    <p>These motions really happen over millions of years — the animation loops continuously here so
    you can watch each process clearly, not because it reverses in real life.</p>
  `,

  quiz: [
    { q: "At a divergent boundary, plates…", choices: ["move apart", "collide head-on", "slide past each other", "stop moving entirely"], answer: 0, explain: "Magma rises to fill the widening gap, forming new crust — this is how ocean floors spread." },
    { q: "Subduction — one plate sliding beneath another — happens at…", choices: ["divergent boundaries", "convergent boundaries", "transform boundaries", "the equator only"], answer: 1, explain: "At convergent boundaries the denser plate is forced down beneath the other." },
    { q: "Earthquakes along a fault like California's San Andreas are typical of which boundary type?", choices: ["Divergent", "Convergent", "Transform", "None of these"], answer: 2, explain: "Transform boundaries grind sideways, building up and suddenly releasing stress." },
  ],

  presets: [
    { label: "Divergent", note: "Watch new crust form as plates pull apart.", values: { "pt-mode": 0 } },
    { label: "Convergent", note: "Watch a mountain rise as plates collide.", values: { "pt-mode": 1 } },
    { label: "Transform", note: "Watch plates grind past each other.", values: { "pt-mode": 2 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="pt-name">Divergent</span></div>
      <p class="fact" id="pt-desc"></p>
      <div class="control"><div class="row"><label for="pt-mode">Boundary type</label><output id="pt-modeval" for="pt-mode"></output></div>
        <input type="range" id="pt-mode" min="0" max="2" step="1" value="${state.mode}"></div>
    `;
  },

  wire(root) {
    els.mode = root.querySelector("#pt-mode");
    els.modeval = root.querySelector("#pt-modeval");
    els.name = root.querySelector("#pt-name");
    els.desc = root.querySelector("#pt-desc");

    const sync = () => {
      const i = Math.max(0, Math.min(2, Math.round(+els.mode.value)));
      state.mode = i;
      state.t = 0;
      const m = MODES[i];
      els.modeval.textContent = m.name;
      els.name.textContent = m.name;
      els.desc.textContent = m.desc;
    };
    els.mode.addEventListener("input", sync);
    sync();
  },

  update(dt) {
    state.t += dt;
    const phase = (state.t % PERIOD) / PERIOD;

    leftPlate.position.set(-1.6, 0, 0);
    rightPlate.position.set(1.6, 0, 0);
    rightPlate.rotation.z = 0;
    mountain.visible = false;
    riftGlow.visible = false;

    if (state.mode === 0) {
      // Divergent: plates spread; magma glows in the widening rift.
      leftPlate.position.x = -1.6 - phase * 0.9;
      rightPlate.position.x = 1.6 + phase * 0.9;
      riftGlow.visible = true;
      riftGlow.scale.x = 0.3 + phase * 3.4;
      riftGlow.material.emissiveIntensity = 0.6 + Math.sin(state.t * 6) * 0.2;
    } else if (state.mode === 1) {
      // Convergent: right (oceanic) plate subducts under the left; a mountain rises.
      leftPlate.position.x = -1.6 + phase * 0.85;
      rightPlate.position.x = 1.6 - phase * 1.15;
      rightPlate.position.y = -phase * 0.4;
      rightPlate.rotation.z = -phase * 0.32;
      mountain.visible = true;
      mountain.scale.y = Math.max(0.04, phase);
      mountain.position.set(-0.3, 0.25, 0);
    } else {
      // Transform: plates shear sideways in opposite directions.
      leftPlate.position.x = -1.55;
      rightPlate.position.x = 1.55;
      leftPlate.position.z = -phase * 1.3;
      rightPlate.position.z = phase * 1.3;
    }
  },

  onEnter() {},
  onExit() {},
};
