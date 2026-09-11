import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.8, dir: 0.9, rim: 0.35 });

const SHAPES = [
  { name: "Cube", faces: 6, edges: 12, vertices: 8, example: "A dice, or a gift box.", color: 0x4a8fc0, make: () => new THREE.BoxGeometry(1.5, 1.5, 1.5) },
  { name: "Cuboid", faces: 6, edges: 12, vertices: 8, example: "A book, or a brick.", color: 0xb1520b, make: () => new THREE.BoxGeometry(1.9, 1.1, 1.1) },
  { name: "Sphere", faces: 1, edges: 0, vertices: 0, example: "A ball, or an orange.", color: 0xe0562a, make: () => new THREE.SphereGeometry(0.95, 32, 24) },
  { name: "Cylinder", faces: 3, edges: 2, vertices: 0, example: "A can of food.", color: 0x0f6b63, make: () => new THREE.CylinderGeometry(0.8, 0.8, 1.7, 32) },
  { name: "Cone", faces: 2, edges: 1, vertices: 1, example: "An ice-cream cone, or a party hat.", color: 0x5b3fb1, make: () => new THREE.ConeGeometry(0.9, 1.7, 32) },
  { name: "Square pyramid", faces: 5, edges: 8, vertices: 5, example: "The Great Pyramid of Giza.", color: 0x8a6a3a, make: () => new THREE.ConeGeometry(1.05, 1.6, 4) },
];

const material = new THREE.MeshStandardMaterial({ color: SHAPES[0].color, roughness: 0.5, metalness: 0.05 });
const mesh = new THREE.Mesh(SHAPES[0].make(), material);
if (SHAPES[0].name === "Square pyramid") mesh.rotation.y = Math.PI / 4;
scene.add(mesh);

const state = { index: 0 };
const els = {};

function applyShape(i) {
  const s = SHAPES[i];
  mesh.geometry.dispose();
  mesh.geometry = s.make();
  mesh.rotation.set(0, s.name === "Square pyramid" ? Math.PI / 4 : 0, 0);
  material.color.setHex(s.color);
}

export default {
  id: "shapes3d",
  name: "3D shapes explorer",
  tag: "Math · Shapes",
  subject: "Math",
  grades: [1, 4],
  blurb: "Cubes, spheres, cones and more — count their faces, edges and corners.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 14l12-6 12 6-12 6-12-6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 14v12l12 6 12-6V14" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M20 20v12" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 5.5, theta: 0.6, phi: 1.1, minRadius: 3, maxRadius: 10 },

  lesson: `
    <p>Solid shapes are all around you. Some have flat sides called <strong>faces</strong>, some
    have <strong>edges</strong> where two faces meet, and some have sharp points called
    <strong>vertices</strong> (corners). A few shapes, like a ball, have none of those — just one
    smooth curved surface.</p>
    <p>Step through the shapes and see how many faces, edges and corners each one has.</p>
  `,

  quiz: [
    { q: "How many faces does a cube have?", choices: ["4", "6", "8", "12"], answer: 1, explain: "A cube has 6 flat square faces." },
    { q: "Which shape has no flat faces at all?", choices: ["Cube", "Sphere", "Cone", "Pyramid"], answer: 1, explain: "A sphere is one smooth curved surface, with no flat faces, edges or corners." },
    { q: "A can of soup is closest to which 3D shape?", choices: ["Cone", "Cylinder", "Pyramid", "Sphere"], answer: 1, explain: "A cylinder has two flat circle ends and a curved side — just like a can." },
  ],

  presets: [
    { label: "Cube", note: "6 equal square faces.", values: { "sh-index": 0 } },
    { label: "Sphere", note: "No flat faces, edges or corners.", values: { "sh-index": 2 } },
    { label: "Cone", note: "One flat face, one curved face, one point.", values: { "sh-index": 4 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="sh-name"></span></div>
      <dl class="stat-grid" id="sh-stats"></dl>
      <p class="fact" id="sh-example"></p>
      <div class="control"><div class="row"><label for="sh-index">Shape</label><output id="sh-indexval" for="sh-index"></output></div>
        <input type="range" id="sh-index" min="0" max="${SHAPES.length - 1}" step="1" value="${state.index}"></div>
    `;
  },

  wire(root) {
    els.index = root.querySelector("#sh-index");
    els.indexval = root.querySelector("#sh-indexval");
    els.name = root.querySelector("#sh-name");
    els.stats = root.querySelector("#sh-stats");
    els.example = root.querySelector("#sh-example");

    const sync = () => {
      const i = Math.max(0, Math.min(SHAPES.length - 1, Math.round(+els.index.value)));
      state.index = i;
      const s = SHAPES[i];
      els.indexval.textContent = s.name;
      els.name.textContent = s.name;
      els.stats.innerHTML = `
        <div><dt>Faces</dt><dd class="mono">${s.faces}</dd></div>
        <div><dt>Edges</dt><dd class="mono">${s.edges}</dd></div>
        <div><dt>Corners</dt><dd class="mono">${s.vertices}</dd></div>`;
      els.example.textContent = `Real-world example: ${s.example}`;
      applyShape(i);
    };
    els.index.addEventListener("input", sync);
    sync();
  },

  update(dt) {
    mesh.rotation.y += dt * 0.35;
  },

  onEnter() {},
  onExit() {},
};
