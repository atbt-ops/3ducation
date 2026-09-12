import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.75, dir: 0.9, rim: 0.35 });
const group = new THREE.Group();
scene.add(group);

const HORIZONS = [
  {
    name: "Topsoil",
    h: 0.6,
    color: 0x3f2e1c,
    depth: "0–20 cm",
    desc: "Dark and crumbly, packed with humus (decayed leaves and organisms) and living roots. Most nutrients and almost all farming happens here.",
  },
  {
    name: "Subsoil",
    h: 0.9,
    color: 0x7a4e2a,
    depth: "20–60 cm",
    desc: "Lighter in colour with far less humus. Clay and minerals washed down from the topsoil collect here, along with deeper roots.",
  },
  {
    name: "Weathered rock",
    h: 1.0,
    color: 0xa9895f,
    depth: "60–150 cm",
    desc: "Partly broken-up parent rock (also called regolith) — cracked and crumbling, but not yet turned into true soil.",
  },
  {
    name: "Bedrock",
    h: 1.4,
    color: 0x716d68,
    depth: "below 150 cm",
    desc: "Solid, unbroken rock. Every horizon above it formed, over centuries, from bedrock like this being weathered and enriched with life.",
  },
];

const WIDTH = 3.4;
const DEPTH = 2.0;

// Stacked from the surface down, each horizon a slab the full width — a
// cross-section, the same idea as a road cutting or a dug pit wall.
let topY = 1.1;
const meshes = HORIZONS.map((horizon) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH, horizon.h, DEPTH),
    new THREE.MeshStandardMaterial({ color: horizon.color, roughness: 0.9, emissive: horizon.color, emissiveIntensity: 0.08 })
  );
  mesh.position.y = topY - horizon.h / 2;
  topY -= horizon.h;
  group.add(mesh);
  return mesh;
});

// One floating label following whichever horizon is selected — they're
// stacked edge to edge, so a label per layer would collide with its neighbours.
let horizonLabel = null;
function showHorizonLabel(i) {
  if (horizonLabel) {
    horizonLabel.parent?.remove(horizonLabel);
    horizonLabel.material.map.dispose();
    horizonLabel.material.dispose();
  }
  horizonLabel = createLabel(HORIZONS[i].name, { fontSize: 28, scale: 0.6 });
  horizonLabel.position.set(-WIDTH / 2 - 0.3, 0, 0);
  meshes[i].add(horizonLabel);
}

const state = { layer: 0 };
const els = {};

export default {
  id: "soilprofile",
  name: "Soil profile",
  tag: "Earth Science · Soil",
  subject: "Earth Science",
  grades: [3, 8],
  blurb: "Dig a cross-section from crumbly topsoil down to solid bedrock.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="8" width="28" height="6" fill="currentColor"/><rect x="6" y="14" width="28" height="6" stroke="currentColor" stroke-width="2"/><rect x="6" y="20" width="28" height="6" stroke="currentColor" stroke-width="2" opacity="0.7"/><rect x="6" y="26" width="28" height="6" stroke="currentColor" stroke-width="2" opacity="0.4"/></svg>',
  scene,
  view: { target: [0, -0.3, 0], radius: 6.5, theta: 0.5, phi: 1.05, minRadius: 3.5, maxRadius: 12 },

  lesson: `
    <p>Dig straight down almost anywhere on land and you'll cut through distinct <strong>horizons</strong>
    — horizontal layers that differ in colour, texture and what lives in them. They form slowly, as
    solid rock weathers at the bottom while organic matter builds up at the top.</p>
    <p>This cutaway shows all four at once, from crumbly, life-filled topsoil down to the unbroken
    bedrock every layer above it ultimately came from. Step through the slider to see each one.</p>
  `,

  quiz: [
    { q: "Which horizon has the most humus and living roots?", choices: ["Bedrock", "Weathered rock", "Subsoil", "Topsoil"], answer: 3, explain: "Topsoil sits at the surface, where dead leaves and organisms decay into nutrient-rich humus." },
    { q: "Clay and minerals washed down from above tend to collect in the…", choices: ["Topsoil", "Subsoil", "Bedrock", "Atmosphere"], answer: 1, explain: "Water carries fine particles down out of the topsoil; they build up in the subsoil beneath it." },
    { q: "Every soil horizon ultimately forms from the weathering of…", choices: ["Ocean water", "Bedrock", "Fallen leaves alone", "Sand blown from elsewhere"], answer: 1, explain: "Bedrock breaks down over centuries into weathered rock, then subsoil, then topsoil." },
  ],

  presets: [
    { label: "Topsoil", note: "What you'd dig up first with a garden trowel.", values: { "sp-layer": 0 } },
    { label: "Subsoil", note: "Paler, denser, with washed-down minerals.", values: { "sp-layer": 1 } },
    { label: "Weathered rock", note: "Cracked parent rock, not yet true soil.", values: { "sp-layer": 2 } },
    { label: "Bedrock", note: "The solid rock everything above formed from.", values: { "sp-layer": 3 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="sp-name">Topsoil</span><b class="mono" id="sp-depth"></b></div>
      <p class="fact" id="sp-desc"></p>
      <div class="control"><div class="row"><label for="sp-layer">Horizon</label><output id="sp-layerval" for="sp-layer"></output></div>
        <input type="range" id="sp-layer" min="0" max="3" step="1" value="${state.layer}"></div>
    `;
  },

  wire(root) {
    els.layer = root.querySelector("#sp-layer");
    els.layerval = root.querySelector("#sp-layerval");
    els.name = root.querySelector("#sp-name");
    els.depth = root.querySelector("#sp-depth");
    els.desc = root.querySelector("#sp-desc");

    const sync = () => {
      const i = Math.max(0, Math.min(3, Math.round(+els.layer.value)));
      state.layer = i;
      const horizon = HORIZONS[i];
      els.layerval.textContent = horizon.name;
      els.name.textContent = horizon.name;
      els.depth.textContent = horizon.depth;
      els.desc.textContent = horizon.desc;
      showHorizonLabel(i);
    };
    els.layer.addEventListener("input", sync);
    sync();
  },

  update() {
    meshes.forEach((mesh, i) => {
      mesh.material.emissiveIntensity = i === state.layer ? 0.3 : 0.08;
    });
  },

  onEnter() {},
  onExit() {},
};
