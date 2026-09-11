import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.78, dir: 0.9, rim: 0.35 });

// Same wedge-cutaway trick as earthlayers.js — a slice is missing from every
// shell so you can see straight into the layers stacked inside.
const GAP = Math.PI / 2;
const PHI_START = Math.PI / 2 + GAP / 2;
const PHI_LEN = Math.PI * 2 - GAP;

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 24),
  new THREE.MeshStandardMaterial({ color: 0x3f7fd9, roughness: 0.8 })
);
scene.add(earth);

const LAYERS = [
  {
    name: "Troposphere",
    r: 0.75,
    color: 0x9fd8ff,
    alt: "0–12 km up",
    desc: "Where nearly all weather happens — clouds, rain, wind, and the air you breathe. It gets colder the higher you go.",
  },
  {
    name: "Stratosphere",
    r: 1.05,
    color: 0xc9b8f0,
    alt: "12–50 km up",
    desc: "Calm and dry, and home to the ozone layer, which absorbs most of the Sun's harmful UV rays. Cruising aircraft fly near its base.",
  },
  {
    name: "Mesosphere",
    r: 1.3,
    color: 0x5a6fa8,
    alt: "50–85 km up",
    desc: "The coldest layer of all. Most meteors — 'shooting stars' — burn up here from friction with the thin air.",
  },
  {
    name: "Thermosphere",
    r: 1.6,
    color: 0x7fe08a,
    alt: "85–600 km up",
    desc: "Air this thin heats up dramatically from directly absorbing solar radiation. The aurora (Northern/Southern Lights) glows here, and the ISS orbits within it.",
  },
];

const group = new THREE.Group();
scene.add(group);

const meshes = LAYERS.map((layer) => {
  const mat = new THREE.MeshStandardMaterial({
    color: layer.color,
    transparent: true,
    opacity: 0.55,
    roughness: 0.6,
    emissive: layer.color,
    emissiveIntensity: 0.1,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(layer.r, 40, 30, PHI_START, PHI_LEN), mat);
  group.add(mesh);
  return mesh;
});

const state = { layer: 0, t: 0 };
const els = {};

export default {
  id: "atmosphere",
  name: "Layers of the atmosphere",
  tag: "Earth Science · Air",
  subject: "Earth Science",
  grades: [6, 10],
  blurb: "From the weather you feel to the edge of space, layer by layer.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="26" r="6" fill="currentColor"/><circle cx="20" cy="26" r="10" stroke="currentColor" stroke-width="1.6"/><circle cx="20" cy="26" r="14" stroke="currentColor" stroke-width="1.6"/><circle cx="20" cy="26" r="18" stroke="currentColor" stroke-width="1.6"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 5.5, theta: 0, phi: 1.25, minRadius: 3, maxRadius: 11 },

  lesson: `
    <p>Earth is wrapped in a thin blanket of air, and that blanket has layers — each with its own
    temperature pattern and its own job. Almost everything you think of as "weather" happens in the
    thinnest, lowest layer; go up further and you pass through the ozone layer, the zone where
    meteors burn up, and finally a layer so thin it blends into space itself.</p>
    <p>A slice has been cut out of this model so you can see all four layers at once. Drag to look
    inside, and use the slider to step through each one.</p>
  `,

  quiz: [
    { q: "Nearly all weather — clouds, rain, storms — happens in the…", choices: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"], answer: 0, explain: "The troposphere is the lowest layer, right where we live and breathe." },
    { q: "The ozone layer, which blocks most harmful UV rays, is found in the…", choices: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"], answer: 1, explain: "The stratosphere holds the ozone layer, high above the weather." },
    { q: "Most meteors ('shooting stars') burn up in the…", choices: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"], answer: 2, explain: "Friction with the thin air of the mesosphere burns most meteors up before they reach the ground." },
  ],

  presets: [
    { label: "Troposphere", note: "Weather lives here — 0 to 12 km up.", values: { "at-layer": 0 } },
    { label: "Stratosphere", note: "The ozone layer, 12 to 50 km up.", values: { "at-layer": 1 } },
    { label: "Mesosphere", note: "Where meteors burn up, 50 to 85 km up.", values: { "at-layer": 2 } },
    { label: "Thermosphere", note: "Auroras and the ISS, 85 to 600 km up.", values: { "at-layer": 3 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="at-name">Troposphere</span><b class="mono" id="at-alt"></b></div>
      <p class="fact" id="at-desc"></p>
      <div class="control"><div class="row"><label for="at-layer">Layer</label><output id="at-layerval" for="at-layer"></output></div>
        <input type="range" id="at-layer" min="0" max="3" step="1" value="${state.layer}"></div>
    `;
  },

  wire(root) {
    els.layer = root.querySelector("#at-layer");
    els.layerval = root.querySelector("#at-layerval");
    els.name = root.querySelector("#at-name");
    els.alt = root.querySelector("#at-alt");
    els.desc = root.querySelector("#at-desc");

    const sync = () => {
      const i = Math.max(0, Math.min(3, Math.round(+els.layer.value)));
      state.layer = i;
      const layer = LAYERS[i];
      els.layerval.textContent = layer.name;
      els.name.textContent = layer.name;
      els.alt.textContent = layer.alt;
      els.desc.textContent = layer.desc;
    };
    els.layer.addEventListener("input", sync);
    sync();
  },

  update(dt) {
    state.t += dt;
    meshes.forEach((mesh, i) => {
      const mat = mesh.material;
      if (i === state.layer) {
        mat.emissiveIntensity = 0.4 + Math.sin(state.t * 3) * 0.2;
        mat.opacity = 0.8;
      } else {
        mat.emissiveIntensity = 0.1;
        mat.opacity = 0.4;
      }
    });
  },

  onEnter() {},
  onExit() {},
};
