import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.6, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);
let spin = true;

const SHAPES = {
  cube: { label: "Cube", vef: [8, 12, 6], fact: "Volume = a³", geo: () => new THREE.BoxGeometry(1.6, 1.6, 1.6) },
  tetra: { label: "Tetrahedron", vef: [4, 6, 4], fact: "Volume = a³ / (6√2)", geo: () => new THREE.TetrahedronGeometry(1.3) },
  octa: { label: "Octahedron", vef: [6, 12, 8], fact: "Volume = (√2⁄3)·a³", geo: () => new THREE.OctahedronGeometry(1.3) },
  dodeca: { label: "Dodecahedron", vef: [20, 30, 12], fact: "12 pentagon faces", geo: () => new THREE.DodecahedronGeometry(1.2) },
  icosa: { label: "Icosahedron", vef: [12, 30, 20], fact: "20 triangle faces", geo: () => new THREE.IcosahedronGeometry(1.2) },
  sphere: { label: "Sphere", vef: null, fact: "Volume = (4⁄3)πr³", geo: () => new THREE.SphereGeometry(1.2, 28, 20) },
  cone: { label: "Cone", vef: null, fact: "Volume = (1⁄3)πr²h", geo: () => new THREE.ConeGeometry(1.1, 1.9, 28) },
  cylinder: { label: "Cylinder", vef: null, fact: "Volume = πr²h", geo: () => new THREE.CylinderGeometry(1, 1, 1.8, 28) },
  torus: { label: "Torus", vef: null, fact: "Volume = 2π²·R·r²", geo: () => new THREE.TorusGeometry(1, 0.4, 20, 36) },
};
const order = ["cube", "tetra", "octa", "dodeca", "icosa", "sphere", "cone", "cylinder", "torus"];
let current = "cube";
let showWire = true;

function build(key) {
  while (group.children.length) group.remove(group.children[0]);
  const geo = SHAPES[key].geo();
  group.add(
    new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: 0x2c6e6b,
        transparent: true,
        opacity: 0.82,
        roughness: 0.4,
        metalness: 0.05,
      })
    )
  );
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: 0xd9a54a })
  );
  edges.visible = showWire;
  group.add(edges);
  group.userData.edges = edges;
}
build(current);

const els = {};
function eulerLine(vef) {
  if (!vef) return "This shape is curved, so Euler's polyhedron formula doesn't apply.";
  return `V − E + F = ${vef[0]} − ${vef[1]} + ${vef[2]} = ${vef[0] - vef[1] + vef[2]}`;
}

export default {
  id: "solids",
  name: "Geometry set",
  tag: "Math · Solids",
  subject: "Math",
  blurb: "Count faces, edges and corners on real 3D solids.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L33 14V28L20 36L7 28V14L20 6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M20 6V20M20 20L33 14M20 20L7 14M20 20V36" stroke="currentColor" stroke-width="1.4" opacity="0.6"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 5, theta: 0.7, phi: 1.1, minRadius: 2.4, maxRadius: 12 },

  lesson: `
    <p>Every convex polyhedron obeys one surprising rule, found by Euler:
    <span class="mono">V − E + F = 2</span>, where V, E and F count vertices (corners), edges and faces.</p>
    <p>A cube: 8 − 12 + 6 = 2. A tetrahedron: 4 − 6 + 4 = 2. It holds for all five Platonic solids and
    every convex polyhedron besides. Curved shapes — spheres, cones — have no flat faces or straight
    edges, so the count doesn't apply.</p>
  `,

  quiz: [
    {
      q: "An octahedron has 6 vertices and 8 faces. How many edges must it have?",
      choices: ["10", "12", "14", "16"],
      answer: 1,
      explain: "Euler: V − E + F = 2 → 6 − E + 8 = 2 → E = 12.",
    },
    {
      q: "For which shape does V − E + F = 2 NOT apply?",
      choices: ["Cube", "Dodecahedron", "Sphere", "Tetrahedron"],
      answer: 2,
      explain: "A sphere has no vertices, edges or faces in the polyhedron sense.",
    },
    {
      q: "Doubling every edge length of a cube multiplies its volume by…",
      choices: ["2", "4", "6", "8"],
      answer: 3,
      explain: "Volume scales with the cube of length: 2³ = 8.",
    },
  ],

  panelHTML() {
    const chips = order
      .map(
        (k) =>
          `<button class="chip" data-shape="${k}" aria-pressed="${k === current}">${SHAPES[k].label}</button>`
      )
      .join("");
    const s = SHAPES[current];
    return `
      <div class="chip-row" id="sh-chips" role="group" aria-label="Choose a solid">${chips}</div>
      <div class="formula"><span id="sh-name">${s.label}</span><b class="mono" id="sh-fact">${s.fact}</b></div>
      <p class="fact" id="sh-euler">${eulerLine(s.vef)}</p>
      <div class="btn-row">
        <button class="btn" id="sh-wire" type="button" aria-pressed="${showWire}">Edges: on</button>
        <button class="btn" id="sh-spin" type="button" aria-pressed="${spin}">Spin: on</button>
      </div>
    `;
  },

  wire(root) {
    els.chips = root.querySelector("#sh-chips");
    els.name = root.querySelector("#sh-name");
    els.fact = root.querySelector("#sh-fact");
    els.euler = root.querySelector("#sh-euler");
    els.wireBtn = root.querySelector("#sh-wire");
    els.spinBtn = root.querySelector("#sh-spin");

    els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-shape]");
      if (!btn) return;
      current = btn.getAttribute("data-shape");
      build(current);
      els.chips.querySelectorAll(".chip").forEach((c) =>
        c.setAttribute("aria-pressed", c === btn ? "true" : "false")
      );
      const s = SHAPES[current];
      els.name.textContent = s.label;
      els.fact.textContent = s.fact;
      els.euler.textContent = eulerLine(s.vef);
    });
    els.wireBtn.addEventListener("click", () => {
      showWire = !showWire;
      group.userData.edges.visible = showWire;
      els.wireBtn.textContent = `Edges: ${showWire ? "on" : "off"}`;
      els.wireBtn.setAttribute("aria-pressed", String(showWire));
    });
    els.spinBtn.addEventListener("click", () => {
      spin = !spin;
      els.spinBtn.textContent = `Spin: ${spin ? "on" : "off"}`;
      els.spinBtn.setAttribute("aria-pressed", String(spin));
    });
  },

  update(dt, viewer) {
    if (spin && !viewer.dragging) {
      group.rotation.y += dt * 0.45;
      group.rotation.x += dt * 0.12;
    }
  },

  onEnter() {},
  onExit() {},
};
