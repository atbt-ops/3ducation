import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.75, dir: 0.95, rim: 0.4 });

// A wedge is cut out of every shell (same angle on each) so the interior
// layers show through, like a cake with a slice removed.
const GAP = Math.PI / 2;
const PHI_START = Math.PI / 2 + GAP / 2;
const PHI_LEN = Math.PI * 2 - GAP;

const LAYERS = [
  {
    name: "Crust",
    r: 2.0,
    color: 0x8a7a52,
    temp: "0–500°C near its base",
    desc: "The thin, solid, rocky shell we live on — thinner under oceans (~5–10 km) than under continents (~30–50 km). Shown thicker here than true scale so it's visible.",
  },
  {
    name: "Mantle",
    r: 1.85,
    color: 0xb14a1e,
    temp: "500–3,700°C",
    desc: "Hot rock, mostly solid but flowing extremely slowly — like thick tar over millions of years. That slow churning drags the crust above it, driving plate tectonics.",
  },
  {
    name: "Outer core",
    r: 1.15,
    color: 0xe8871f,
    temp: "4,000–5,000°C",
    desc: "Molten iron and nickel. Its churning, electrically-conductive flow generates Earth's magnetic field — the same field a compass needle follows.",
  },
  {
    name: "Inner core",
    r: 0.55,
    color: 0xfff0b0,
    temp: "5,000–6,000°C",
    desc: "Solid iron and nickel, and hotter than the outer core — but the crushing pressure this deep keeps it solid rather than liquid.",
  },
];

const group = new THREE.Group();
scene.add(group);

const meshes = LAYERS.map((layer) => {
  const mat = new THREE.MeshStandardMaterial({
    color: layer.color,
    roughness: 0.7,
    metalness: 0.1,
    emissive: layer.color,
    emissiveIntensity: 0.08,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(layer.r, 40, 30, PHI_START, PHI_LEN), mat);
  group.add(mesh);
  return mesh;
});

const state = { layer: 0, t: 0 };
const els = {};

export default {
  id: "earthlayers",
  name: "Layers of the Earth",
  tag: "Earth Science · Structure",
  subject: "Earth Science",
  grades: [3, 8],
  blurb: "A cutaway from crust to inner core — click through what's underfoot.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="9" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="currentColor"/><path d="M20 20L32 12" stroke="currentColor" stroke-width="2"/><path d="M20 20L32 28" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 6.5, theta: 0, phi: 1.25, minRadius: 3, maxRadius: 12 },

  lesson: `
    <p>Earth isn't solid rock all the way through. Below your feet are four layers, each very
    different from the one above it — a thin rocky shell, then hot slow-flowing rock, then two
    layers of iron and nickel, the outer one molten and the inner one solid despite being hotter
    still.</p>
    <p>A slice has been cut out of this model so you can see all four at once. Drag to look inside,
    and use the slider to step through each layer.</p>
  `,

  quiz: [
    { q: "Which layer is Earth's thin, solid, rocky surface?", choices: ["Inner core", "Outer core", "Mantle", "Crust"], answer: 3, explain: "The crust is thin compared to the other layers — only a few tens of kilometres thick." },
    { q: "What generates Earth's magnetic field?", choices: ["The solid crust", "The flowing molten outer core", "Sunlight hitting the mantle", "The solid inner core alone"], answer: 1, explain: "Churning, electrically-conductive molten iron in the outer core acts like a giant dynamo." },
    { q: "Why is the inner core solid even though it's hotter than the outer core?", choices: ["It's made of a different metal", "Immense pressure keeps it from melting", "It's actually cooler than measured", "It isn't solid — that's a myth"], answer: 1, explain: "Pressure this deep is so extreme that it raises iron's melting point above the local temperature." },
  ],

  presets: [
    { label: "Crust", note: "What you're standing on.", values: { "el-layer": 0 } },
    { label: "Mantle", note: "Slow-flowing hot rock — most of Earth's volume.", values: { "el-layer": 1 } },
    { label: "Outer core", note: "Molten metal that makes the magnetic field.", values: { "el-layer": 2 } },
    { label: "Inner core", note: "Solid metal at the very centre.", values: { "el-layer": 3 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="el-name">Crust</span><b class="mono" id="el-temp"></b></div>
      <p class="fact" id="el-desc"></p>
      <div class="control"><div class="row"><label for="el-layer">Layer</label><output id="el-layerval" for="el-layer"></output></div>
        <input type="range" id="el-layer" min="0" max="3" step="1" value="${state.layer}"></div>
    `;
  },

  wire(root) {
    els.layer = root.querySelector("#el-layer");
    els.layerval = root.querySelector("#el-layerval");
    els.name = root.querySelector("#el-name");
    els.temp = root.querySelector("#el-temp");
    els.desc = root.querySelector("#el-desc");

    const sync = () => {
      const i = Math.max(0, Math.min(3, Math.round(+els.layer.value)));
      state.layer = i;
      const layer = LAYERS[i];
      els.layerval.textContent = layer.name;
      els.name.textContent = layer.name;
      els.temp.textContent = layer.temp;
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
        mat.emissiveIntensity = 0.35 + Math.sin(state.t * 3) * 0.22;
      } else {
        mat.emissiveIntensity = 0.08;
      }
    });
  },

  onEnter() {},
  onExit() {},
};
