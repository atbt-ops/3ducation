import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const GAP = Math.PI / 2;
const PHI_START = Math.PI / 2 + GAP / 2;
const PHI_LEN = Math.PI * 2 - GAP;

const corona = new THREE.Mesh(
  new THREE.SphereGeometry(2.15, 24, 18),
  new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.12 })
);
scene.add(corona);

const LAYERS = [
  {
    name: "Core",
    r: 0.55,
    color: 0xfff6d0,
    temp: "~15,000,000°C",
    desc: "Where nuclear fusion happens — immense pressure fuses hydrogen into helium, releasing the energy that powers everything the Sun does.",
  },
  {
    name: "Radiative zone",
    r: 1.05,
    color: 0xffb347,
    temp: "~2,000,000–7,000,000°C",
    desc: "Energy slowly radiates outward through this dense layer. It's so packed that a photon can take hundreds of thousands of years to cross it.",
  },
  {
    name: "Convective zone",
    r: 1.45,
    color: 0xff8a1f,
    temp: "~2,000,000°C at its base",
    desc: "Hot plasma physically rises and falls here, like boiling water, carrying energy the rest of the way toward the surface.",
  },
  {
    name: "Photosphere",
    r: 1.7,
    color: 0xffe066,
    temp: "~5,500°C",
    desc: "The visible 'surface' of the Sun — the layer that actually emits the sunlight reaching Earth. This is what you see (never directly!) as the Sun's disc.",
  },
];

const group = new THREE.Group();
scene.add(group);

const meshes = LAYERS.map((layer) => {
  const mat = new THREE.MeshStandardMaterial({
    color: layer.color,
    roughness: 0.5,
    emissive: layer.color,
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(layer.r, 40, 30, PHI_START, PHI_LEN), mat);
  group.add(mesh);
  return mesh;
});

// One floating name label, following whichever layer is currently selected —
// not one per layer, since they're nested inside each other and would overlap.
let layerLabel = null;
function showLayerLabel(i) {
  if (layerLabel) {
    layerLabel.parent?.remove(layerLabel);
    layerLabel.material.map.dispose();
    layerLabel.material.dispose();
  }
  const layer = LAYERS[i];
  layerLabel = createLabel(layer.name, { fontSize: 26 });
  layerLabel.position.set(0, layer.r + 0.2, 0);
  meshes[i].add(layerLabel);
}

const state = { layer: 0, t: 0 };
const els = {};

export default {
  id: "sunlayers",
  name: "Structure of the Sun",
  tag: "Astronomy · The Sun",
  subject: "Astronomy",
  grades: [6, 10],
  blurb: "From the fusion core to the surface we see, layer by layer.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="7" fill="currentColor"/><circle cx="20" cy="20" r="12" stroke="currentColor" stroke-width="1.6"/><path d="M20 4v4M20 32v4M4 20h4M32 20h4M9 9l3 3M28 28l3 3M31 9l-3 3M12 28l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 6.5, theta: 0, phi: 1.25, minRadius: 3, maxRadius: 12 },

  lesson: `
    <p>The Sun isn't a solid ball — it's a giant sphere of plasma with distinct layers, each
    behaving differently. Energy is born deep in the <strong>core</strong>, then takes an
    extraordinarily long journey outward — first radiating, then physically churning upward like
    boiling water — before finally reaching the <strong>photosphere</strong>, the "surface" that
    actually shines the light we see.</p>
    <p>A slice has been cut out of this model so you can see all four layers at once, with a faint
    outer glow representing the corona, the Sun's much larger, wispy outer atmosphere.</p>
  `,

  quiz: [
    { q: "Nuclear fusion — hydrogen turning into helium — happens in the Sun's…", choices: ["Core", "Radiative zone", "Convective zone", "Photosphere"], answer: 0, explain: "The core's immense pressure and heat make fusion possible." },
    { q: "The layer we actually see as the Sun's bright disc is the…", choices: ["Core", "Radiative zone", "Convective zone", "Photosphere"], answer: 3, explain: "The photosphere is the visible 'surface' that emits the sunlight reaching Earth." },
    { q: "In the convective zone, energy moves outward mainly by…", choices: ["Photons radiating directly", "Hot plasma physically rising and falling", "Sound waves", "It doesn't move — it stays put"], answer: 1, explain: "Like boiling water, hot plasma rises, cools, and sinks again, carrying energy upward." },
  ],

  presets: [
    { label: "Core", note: "Where fusion happens — 15 million °C.", values: { "sn-layer": 0 } },
    { label: "Radiative zone", note: "Energy slowly radiates outward.", values: { "sn-layer": 1 } },
    { label: "Convective zone", note: "Plasma churns like boiling water.", values: { "sn-layer": 2 } },
    { label: "Photosphere", note: "The visible surface we see from Earth.", values: { "sn-layer": 3 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="sn-name">Core</span><b class="mono" id="sn-temp"></b></div>
      <p class="fact" id="sn-desc"></p>
      <div class="control"><div class="row"><label for="sn-layer">Layer</label><output id="sn-layerval" for="sn-layer"></output></div>
        <input type="range" id="sn-layer" min="0" max="3" step="1" value="${state.layer}"></div>
    `;
  },

  wire(root) {
    els.layer = root.querySelector("#sn-layer");
    els.layerval = root.querySelector("#sn-layerval");
    els.name = root.querySelector("#sn-name");
    els.temp = root.querySelector("#sn-temp");
    els.desc = root.querySelector("#sn-desc");

    const sync = () => {
      const i = Math.max(0, Math.min(3, Math.round(+els.layer.value)));
      state.layer = i;
      const layer = LAYERS[i];
      els.layerval.textContent = layer.name;
      els.name.textContent = layer.name;
      els.temp.textContent = layer.temp;
      els.desc.textContent = layer.desc;
      showLayerLabel(i);
    };
    els.layer.addEventListener("input", sync);
    sync();
  },

  update(dt) {
    state.t += dt;
    meshes.forEach((mesh, i) => {
      mesh.material.emissiveIntensity = i === state.layer ? 0.55 + Math.sin(state.t * 3) * 0.2 : 0.15;
    });
    corona.scale.setScalar(1 + Math.sin(state.t * 0.6) * 0.03);
    corona.rotation.y += dt * 0.05;
  },

  onEnter() {},
  onExit() {},
};
