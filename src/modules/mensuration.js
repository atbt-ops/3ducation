import * as THREE from "three";
import { sceneLights, prefersReducedMotion, contactShadow } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.62, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);
scene.add(contactShadow({ radius: 2.6, y: -1.8, opacity: 0.2 }));
let spin = !prefersReducedMotion;
let showWire = true;

const state = { shape: "cube", a: 1.5, l: 2, w: 1.2, h: 1.8, r: 1 };

const SHAPES = {
  cube: { label: "Cube", dims: [{ key: "a", label: "Side a", min: 0.5, max: 3 }] },
  cuboid: {
    label: "Cuboid",
    dims: [
      { key: "l", label: "Length l", min: 0.5, max: 3 },
      { key: "w", label: "Width w", min: 0.5, max: 3 },
      { key: "h", label: "Height h", min: 0.5, max: 3 },
    ],
  },
  cylinder: {
    label: "Cylinder",
    dims: [
      { key: "r", label: "Radius r", min: 0.4, max: 2 },
      { key: "h", label: "Height h", min: 0.5, max: 3 },
    ],
  },
  cone: {
    label: "Cone",
    dims: [
      { key: "r", label: "Radius r", min: 0.4, max: 2 },
      { key: "h", label: "Height h", min: 0.5, max: 3 },
    ],
  },
  sphere: { label: "Sphere", dims: [{ key: "r", label: "Radius r", min: 0.4, max: 2 }] },
};
const order = ["cube", "cuboid", "cylinder", "cone", "sphere"];

function calc() {
  const { shape, a, l, w, h, r } = state;
  switch (shape) {
    case "cube":
      return { V: a ** 3, S: 6 * a * a, Vf: "V = a³", Sf: "S = 6a²" };
    case "cuboid":
      return { V: l * w * h, S: 2 * (l * w + w * h + h * l), Vf: "V = l·w·h", Sf: "S = 2(lw + wh + hl)" };
    case "cylinder":
      return { V: Math.PI * r * r * h, S: 2 * Math.PI * r * (r + h), Vf: "V = πr²h", Sf: "S = 2πr(r + h)" };
    case "cone": {
      const slant = Math.sqrt(r * r + h * h);
      return { V: (Math.PI * r * r * h) / 3, S: Math.PI * r * (r + slant), Vf: "V = ⅓πr²h", Sf: "S = πr(r + slant)" };
    }
    case "sphere":
      return { V: (4 / 3) * Math.PI * r ** 3, S: 4 * Math.PI * r * r, Vf: "V = (4/3)πr³", Sf: "S = 4πr²" };
    default:
      return { V: 0, S: 0, Vf: "", Sf: "" };
  }
}

function geometryFor() {
  const { shape, a, l, w, h, r } = state;
  switch (shape) {
    case "cube":
      return new THREE.BoxGeometry(a, a, a);
    case "cuboid":
      return new THREE.BoxGeometry(l, h, w);
    case "cylinder":
      return new THREE.CylinderGeometry(r, r, h, 32);
    case "cone":
      return new THREE.ConeGeometry(r, h, 32);
    case "sphere":
      return new THREE.SphereGeometry(r, 28, 20);
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function build() {
  while (group.children.length) group.remove(group.children[0]);
  const geo = geometryFor();
  group.add(
    new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x4a6fa5, transparent: true, opacity: 0.82, roughness: 0.4, metalness: 0.05 })
    )
  );
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xd9a54a }));
  edges.visible = showWire;
  group.add(edges);
  group.userData.edges = edges;
}
build();

const els = {};

function controlsHTML() {
  return SHAPES[state.shape].dims
    .map(
      (d) => `
      <div class="control"><div class="row"><label for="mn-${d.key}">${d.label}</label><output id="mn-${d.key}val" for="mn-${d.key}"></output></div>
        <input type="range" id="mn-${d.key}" min="${d.min}" max="${d.max}" step="0.1" value="${state[d.key]}"></div>`
    )
    .join("");
}

export default {
  id: "mensuration",
  name: "Volume & surface area",
  tag: "Math · Mensuration",
  subject: "Math",
  grades: [8, 10],
  blurb: "Drag a solid's dimensions and watch both formulas update live.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="14" width="18" height="18" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M7 14L14 8H32L25 14" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M32 8V26L25 32" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 6.5, theta: 0.6, phi: 1.05, minRadius: 3, maxRadius: 14 },

  lesson: `
    <p>Every solid has two separate measurements worth knowing: how much space it fills
    (<strong>volume</strong>) and how much surface wraps around it (<strong>surface area</strong>). They
    grow at different rates — volume scales with the <em>cube</em> of size, surface area with the
    <em>square</em>, so a bigger version of the same shape gets relatively less surface for its volume.</p>
    <p>Drag any dimension and watch both numbers update instantly, using the exact formula shown above them.</p>
  `,

  quiz: [
    { q: "A cube has side 2. Its volume is…", choices: ["4", "6", "8", "12"], answer: 2, explain: "V = a³ = 2³ = 8." },
    { q: "Doubling a sphere's radius multiplies its volume by…", choices: ["2", "4", "6", "8"], answer: 3, explain: "Volume scales with r³, so doubling r multiplies volume by 2³ = 8." },
    { q: "A cylinder and a cone share the same radius and height. The cone's volume is…", choices: ["the same as the cylinder's", "half the cylinder's", "a third of the cylinder's", "twice the cylinder's"], answer: 2, explain: "Cone volume is ⅓πr²h — exactly a third of the cylinder's πr²h." },
  ],

  presets: [
    { label: "Unit cube", note: "Side 1 — volume and surface area both equal simple whole numbers.", values: { "mn-shape": "cube", "mn-a": 1 } },
    { label: "Tall cylinder", note: "A narrow, tall cylinder — small radius, most of the surface is the curved side.", values: { "mn-shape": "cylinder", "mn-r": 0.6, "mn-h": 2.8 } },
    { label: "Wide cone", note: "A short, wide cone — most of its surface is the slanted side, not the base.", values: { "mn-shape": "cone", "mn-r": 1.8, "mn-h": 0.8 } },
    { label: "Unit sphere", note: "Radius 1 — compare its volume to the unit cube's.", values: { "mn-shape": "sphere", "mn-r": 1 } },
  ],

  panelHTML() {
    const opts = order.map((k) => `<option value="${k}" ${k === state.shape ? "selected" : ""}>${SHAPES[k].label}</option>`).join("");
    const c = calc();
    return `
      <select id="mn-shape" class="text-input" aria-label="Solid">${opts}</select>
      <div id="mn-controls">${controlsHTML()}</div>
      <div class="formula"><span id="mn-vf">${c.Vf}</span><b class="mono" id="mn-v">—</b></div>
      <div class="formula"><span id="mn-sf">${c.Sf}</span><b class="mono" id="mn-s">—</b></div>
      <div class="btn-row">
        <button class="btn" id="mn-wire" type="button" aria-pressed="${showWire}">Edges: on</button>
        <button class="btn" id="mn-spin" type="button" aria-pressed="${spin}">Spin: ${spin ? "on" : "off"}</button>
      </div>
    `;
  },

  wire(root) {
    els.shape = root.querySelector("#mn-shape");
    els.controls = root.querySelector("#mn-controls");
    els.vf = root.querySelector("#mn-vf");
    els.sf = root.querySelector("#mn-sf");
    els.v = root.querySelector("#mn-v");
    els.s = root.querySelector("#mn-s");
    els.wireBtn = root.querySelector("#mn-wire");
    els.spinBtn = root.querySelector("#mn-spin");

    const sync = () => {
      const c = calc();
      els.vf.textContent = c.Vf;
      els.sf.textContent = c.Sf;
      els.v.textContent = c.V.toFixed(2);
      els.s.textContent = c.S.toFixed(2);
      build();
      group.userData.edges.visible = showWire;
    };

    const wireDimInputs = () => {
      SHAPES[state.shape].dims.forEach((d) => {
        const input = els.controls.querySelector(`#mn-${d.key}`);
        const out = els.controls.querySelector(`#mn-${d.key}val`);
        out.textContent = state[d.key].toFixed(1);
        input.addEventListener("input", () => {
          state[d.key] = parseFloat(input.value);
          out.textContent = state[d.key].toFixed(1);
          sync();
        });
      });
    };

    els.shape.addEventListener("input", () => {
      state.shape = els.shape.value;
      els.controls.innerHTML = controlsHTML();
      wireDimInputs();
      sync();
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

    wireDimInputs();
    sync();
  },

  update(dt, viewer) {
    if (spin && !viewer.dragging) group.rotation.y += dt * 0.35;
  },

  onEnter() {},
  onExit() {},
};
