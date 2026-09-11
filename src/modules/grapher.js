import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { compile, isValidExpr } from "../lib/expr.js";
import { createSurfaceMesh } from "../lib/surfaceMesh.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.9 });

const { mesh: surface, rebuild: rebuildSurface, axes } = createSurfaceMesh({ range: 3, seg: 84 });
scene.add(surface, axes());

const DEFAULT = "k*(x^2 - y^2)";
const state = { expr: DEFAULT, k: 0.6, fn: compile(DEFAULT, ["x", "y", "k"]), spin: false };

function rebuild() {
  rebuildSurface(state.fn, { k: state.k });
}
rebuild();

const els = {};

export default {
  id: "grapher",
  name: "Surface studio",
  tag: "Math · Functions",
  subject: "Math",
  grades: [10, 12],
  blurb: "Type any z = f(x, y) and walk around it.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 28c6 0 6-14 14-14s8 12 14 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 34h28M8 34V12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 11.5, theta: 0.8, phi: 0.92, minRadius: 4, maxRadius: 20 },

  lesson: `
    <p>A function of two variables assigns a height <span class="mono">z</span> to every point
    <span class="mono">(x, y)</span> on the floor. Plot every height and you get a
    <strong>surface</strong>.</p>
    <p>Type your own formula below — it may use <span class="mono">x</span>, <span class="mono">y</span>,
    the slider <span class="mono">k</span>, the constants <span class="mono">pi</span> and
    <span class="mono">e</span>, and functions like <span class="mono">sin</span>,
    <span class="mono">cos</span>, <span class="mono">exp</span>, <span class="mono">sqrt</span>,
    <span class="mono">abs</span>, <span class="mono">atan2</span>. Colour runs low → high.</p>
    <p class="fact">Found a formula you like? You can submit it as its own instrument for
      everyone — no coding required — from <a href="#/submit">Submit an instrument</a>.</p>
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
      q: "Increasing k in z = k·(x² + y²) makes the bowl…",
      choices: ["wider and flatter", "steeper", "upside down", "unchanged"],
      answer: 1,
      explain: "k scales every height, so the walls rise faster — a steeper bowl.",
    },
  ],

  presets: [
    { label: "Bowl", note: "z = k·(x² + y²) — one minimum at the origin.", values: { "gr-expr": "k*(x^2 + y^2)" } },
    { label: "Saddle", note: "z = k·(x² − y²) — up along x, down along y.", values: { "gr-expr": "k*(x^2 - y^2)" } },
    { label: "Bell", note: "A Gaussian bump: z = 3k·e^−(x² + y²).", values: { "gr-expr": "3*k*exp(-(x^2 + y^2))" } },
    { label: "Ripple", note: "Concentric rings: z = 1.6k·sin(x² + y²).", values: { "gr-expr": "1.6*k*sin(x^2 + y^2)" } },
    { label: "Egg carton", note: "z = 1.6k·sin(2x)·cos(2y).", values: { "gr-expr": "1.6*k*sin(2*x)*cos(2*y)" } },
    { label: "Monkey saddle", note: "Three ways down: z = 0.4k·(x³ − 3xy²).", values: { "gr-expr": "0.4*k*(x^3 - 3*x*y^2)" } },
    { label: "Cone", note: "z = 1.4k·√(x² + y²) — a sharp point at the origin.", values: { "gr-expr": "1.4*k*sqrt(x^2 + y^2)" } },
    { label: "Rose", note: "A polar flower: z = 2k·sin(3·atan2(y, x)).", values: { "gr-expr": "2*k*sin(3*atan2(y, x))" } },
  ],

  panelHTML() {
    return `
      <div class="control">
        <label for="gr-expr">z = f(x, y)</label>
        <input type="text" id="gr-expr" class="text-input mono" spellcheck="false"
          autocapitalize="off" autocomplete="off" value="${state.expr}">
        <p class="fact" id="gr-err" role="status" hidden></p>
      </div>
      <div class="control"><div class="row"><label for="gr-k">Coefficient k</label><output id="gr-kval" for="gr-k"></output></div>
        <input type="range" id="gr-k" min="0.1" max="1.4" step="0.05" value="${state.k}"></div>
      <div class="btn-row"><button class="btn" id="gr-spin" type="button" aria-pressed="${state.spin}">Spin: ${state.spin ? "on" : "off"}</button></div>
    `;
  },

  wire(root) {
    els.expr = root.querySelector("#gr-expr");
    els.err = root.querySelector("#gr-err");
    els.k = root.querySelector("#gr-k");
    els.kval = root.querySelector("#gr-kval");
    els.spin = root.querySelector("#gr-spin");

    const apply = () => {
      const src = els.expr.value.trim();
      if (isValidExpr(src, ["x", "y", "k"])) {
        state.expr = src;
        state.fn = compile(src, ["x", "y", "k"]);
        els.err.hidden = true;
        els.expr.removeAttribute("aria-invalid");
        rebuild();
      } else {
        els.err.textContent = "Can't read that formula — check the syntax.";
        els.err.hidden = false;
        els.expr.setAttribute("aria-invalid", "true");
      }
    };
    els.expr.addEventListener("input", apply);
    els.k.addEventListener("input", () => {
      state.k = parseFloat(els.k.value);
      els.kval.textContent = state.k.toFixed(2);
      rebuild();
    });
    els.spin.addEventListener("click", () => {
      state.spin = !state.spin;
      els.spin.textContent = `Spin: ${state.spin ? "on" : "off"}`;
      els.spin.setAttribute("aria-pressed", String(state.spin));
    });
    els.kval.textContent = state.k.toFixed(2);
  },

  update(dt, viewer) {
    if (state.spin && !viewer.dragging) surface.rotation.y += dt * 0.3;
    else surface.rotation.y *= 0.92;
  },

  onEnter() {
    surface.rotation.y = 0;
    rebuild();
  },
  onExit() {},
};
