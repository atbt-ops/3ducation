import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.85 });

const RANGE = 3;
const SEG = 80;
const geo = new THREE.PlaneGeometry(RANGE * 2, RANGE * 2, SEG, SEG);
geo.rotateX(-Math.PI / 2);
const base = geo.attributes.position.array.slice();
const pos = geo.attributes.position;
const colors = new Float32Array((pos.count) * 3);
geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const surface = new THREE.Mesh(
  geo,
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide })
);
scene.add(surface);

const axesMat = new THREE.LineBasicMaterial({ color: 0x63665a });
const axes = new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-RANGE, 0, 0), new THREE.Vector3(RANGE, 0, 0),
    new THREE.Vector3(0, 0, -RANGE), new THREE.Vector3(0, 0, RANGE),
    new THREE.Vector3(0, -RANGE, 0), new THREE.Vector3(0, RANGE, 0),
  ]),
  axesMat
);
scene.add(axes);

const FUNCS = {
  saddle: { label: "Saddle", expr: "z = k·(x² − y²)", f: (x, y, k) => k * (x * x - y * y) },
  paraboloid: { label: "Bowl", expr: "z = k·(x² + y²)", f: (x, y, k) => k * (x * x + y * y) },
  ripple: { label: "Ripple", expr: "z = k·sin(x² + y²)", f: (x, y, k) => k * Math.sin(x * x + y * y) * 1.6 },
  gaussian: { label: "Bell", expr: "z = k·e^−(x² + y²)", f: (x, y, k) => k * Math.exp(-(x * x + y * y)) * 2.4 },
  monkey: { label: "Monkey saddle", expr: "z = k·(x³ − 3xy²)", f: (x, y, k) => k * (x * x * x - 3 * x * y * y) * 0.4 },
  waves: { label: "Egg carton", expr: "z = k·sin(2x)·cos(2y)", f: (x, y, k) => k * Math.sin(2 * x) * Math.cos(2 * y) * 1.6 },
};
const order = ["saddle", "paraboloid", "ripple", "gaussian", "monkey", "waves"];
let current = "saddle";
let k = 0.6;
let spin = false;

const lo = new THREE.Color(0x2c6e6b);
const mid = new THREE.Color(0xf3eedf);
const hi = new THREE.Color(0xa9762e);
const tmp = new THREE.Color();

function rebuild() {
  const fn = FUNCS[current].f;
  const arr = pos.array;
  let minH = Infinity;
  let maxH = -Infinity;
  for (let i = 0; i < arr.length; i += 3) {
    const x = base[i];
    const y = base[i + 2];
    const h = fn(x, y, k);
    arr[i + 1] = h;
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }
  const span = maxH - minH || 1;
  for (let i = 0, c = 0; i < arr.length; i += 3, c += 3) {
    const t = (arr[i + 1] - minH) / span;
    if (t < 0.5) tmp.copy(lo).lerp(mid, t * 2);
    else tmp.copy(mid).lerp(hi, (t - 0.5) * 2);
    colors[c] = tmp.r;
    colors[c + 1] = tmp.g;
    colors[c + 2] = tmp.b;
  }
  pos.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
  geo.computeVertexNormals();
}
rebuild();

const els = {};

export default {
  id: "grapher",
  name: "Surface grapher",
  tag: "Math · Functions",
  subject: "Math",
  blurb: "Plot z = f(x, y) and walk around the result.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 28c6 0 6-14 14-14s8 12 14 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 34h28M8 34V12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/></svg>',
  scene,
  view: { target: [0, 0.3, 0], radius: 8, theta: 0.8, phi: 1.0, minRadius: 3.5, maxRadius: 16 },

  lesson: `
    <p>A function of two variables assigns a height <span class="mono">z</span> to every point
    <span class="mono">(x, y)</span> on the floor. Plot all those heights and you get a
    <strong>surface</strong>.</p>
    <p>The shapes tell a story. A bowl <span class="mono">x² + y²</span> has one lowest point. A saddle
    <span class="mono">x² − y²</span> curves up one way and down the other — it has a critical point
    that is neither a peak nor a valley. Colour here runs low → high, so you can read the terrain at a
    glance.</p>
  `,

  quiz: [
    {
      q: "The surface z = x² + y² has, at the origin, a…",
      choices: ["maximum", "minimum", "saddle point", "vertical wall"],
      answer: 1,
      explain: "Every direction curves upward from (0,0), so it's the lowest point — a minimum.",
    },
    {
      q: "What makes z = x² − y² a 'saddle'?",
      choices: [
        "It is flat everywhere",
        "It curves up along x but down along y",
        "It has no critical point",
        "It is the same as a bowl",
      ],
      answer: 1,
      explain: "Opposite curvature in the two axes gives the saddle (or Pringle) shape.",
    },
    {
      q: "Increasing the coefficient k in z = k·(x² + y²) makes the bowl…",
      choices: ["wider and flatter", "steeper", "upside down", "unchanged"],
      answer: 1,
      explain: "k scales every height, so the walls rise faster — a steeper bowl.",
    },
  ],

  panelHTML() {
    const chips = order
      .map(
        (key) =>
          `<button class="chip" data-fn="${key}" aria-pressed="${key === current}">${FUNCS[key].label}</button>`
      )
      .join("");
    return `
      <div class="chip-row" id="gr-chips" role="group" aria-label="Choose a function">${chips}</div>
      <div class="formula"><span>Plot</span><b class="mono" id="gr-expr">${FUNCS[current].expr}</b></div>
      <div class="control"><div class="row"><label for="gr-k">Coefficient k</label><output id="gr-kval" for="gr-k"></output></div>
        <input type="range" id="gr-k" min="0.1" max="1.4" step="0.05" value="${k}"></div>
      <div class="btn-row"><button class="btn" id="gr-spin" type="button" aria-pressed="false">Spin: off</button></div>
    `;
  },

  wire(root) {
    els.chips = root.querySelector("#gr-chips");
    els.expr = root.querySelector("#gr-expr");
    els.k = root.querySelector("#gr-k");
    els.kval = root.querySelector("#gr-kval");
    els.spin = root.querySelector("#gr-spin");

    const sync = () => (els.kval.textContent = k.toFixed(2));
    els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-fn]");
      if (!btn) return;
      current = btn.dataset.fn;
      els.chips.querySelectorAll(".chip").forEach((c) =>
        c.setAttribute("aria-pressed", c === btn ? "true" : "false")
      );
      els.expr.textContent = FUNCS[current].expr;
      rebuild();
    });
    els.k.addEventListener("input", () => {
      k = parseFloat(els.k.value);
      sync();
      rebuild();
    });
    els.spin.addEventListener("click", () => {
      spin = !spin;
      els.spin.textContent = `Spin: ${spin ? "on" : "off"}`;
      els.spin.setAttribute("aria-pressed", String(spin));
    });
    sync();
  },

  update(dt, viewer) {
    if (spin && !viewer.dragging) surface.rotation.y += dt * 0.3;
    else surface.rotation.y *= 0.92;
  },

  onEnter() {
    surface.rotation.y = 0;
    rebuild();
  },
  onExit() {},
};
