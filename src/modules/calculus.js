import * as THREE from "three";
import { compile, isValidExpr } from "../lib/expr.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const SPAN = 5;
const SCALE = 0.8;

group.add(
  new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-SPAN * SCALE, 0, 0), new THREE.Vector3(SPAN * SCALE, 0, 0),
      new THREE.Vector3(0, -SPAN * SCALE, 0), new THREE.Vector3(0, SPAN * SCALE, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0xc9c9c4 })
  )
);

const curve = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x0f6b63 }));
const secant = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb1520b }));
group.add(curve, secant);
const dotA = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshBasicMaterial({ color: 0x8a5f22 }));
const dotB = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0xb1520b }));
group.add(dotA, dotB);

const state = { expr: "0.5*x^2", a: 1, h: 1.5, fn: compile("0.5*x^2", ["x"]) };

function draw() {
  const f = state.fn;
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const x = -SPAN + (i / 200) * SPAN * 2;
    let y = f({ x });
    if (!Number.isFinite(y)) y = 0;
    y = Math.max(-SPAN, Math.min(SPAN, y));
    pts.push(new THREE.Vector3(x * SCALE, y * SCALE, 0));
  }
  curve.geometry.setFromPoints(pts);

  const ax = state.a;
  const bx = state.a + state.h;
  const ay = f({ x: ax });
  const by = f({ x: bx });
  dotA.position.set(ax * SCALE, ay * SCALE, 0.01);
  dotB.position.set(bx * SCALE, by * SCALE, 0.01);

  const slope = Math.abs(state.h) < 1e-6 ? 0 : (by - ay) / (bx - ax);
  // draw the secant/tangent line extended across the view
  const x1 = -SPAN;
  const x2 = SPAN;
  secant.geometry.setFromPoints([
    new THREE.Vector3(x1 * SCALE, (ay + slope * (x1 - ax)) * SCALE, 0),
    new THREE.Vector3(x2 * SCALE, (ay + slope * (x2 - ax)) * SCALE, 0),
  ]);
  return slope;
}
draw();

const els = {};

function numericDeriv() {
  const e = 1e-4;
  return (state.fn({ x: state.a + e }) - state.fn({ x: state.a - e })) / (2 * e);
}

export default {
  id: "calculus",
  name: "Slope of a curve",
  tag: "Math · Calculus",
  subject: "Math",
  grades: [11, 12],
  flat: true,
  blurb: "Shrink h and the secant becomes the tangent.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 32C10 12 22 10 34 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 30l20-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="18" r="2" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0.5, 0], radius: 9, theta: 0, phi: 1.5708, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>The line through two points on a curve — a <strong>secant</strong> — has slope
    <span class="mono">(f(a+h) − f(a)) / h</span>, the average rate of change over that gap.</p>
    <p>Now slide the second point in by shrinking <span class="mono">h</span>. The secant pivots, and
    in the limit <span class="mono">h → 0</span> it becomes the <strong>tangent</strong> — the
    instantaneous slope, the <em>derivative</em> <span class="mono">f′(a)</span>. For
    <span class="mono">½x²</span> the derivative is <span class="mono">x</span>, so at
    <span class="mono">a</span> the tangent slope is just <span class="mono">a</span>.</p>
  `,

  quiz: [
    { q: "The slope of the line through (a, f(a)) and (a+h, f(a+h)) is called the…", choices: ["tangent", "secant slope", "derivative", "integral"], answer: 1, explain: "It's the average rate of change — the secant slope." },
    { q: "As h → 0, the secant line approaches the…", choices: ["x-axis", "y-axis", "tangent line", "a vertical line"], answer: 2, explain: "That limit is the definition of the derivative." },
    { q: "For f(x) = x², the derivative f′(x) is…", choices: ["x", "2x", "x²", "2"], answer: 1, explain: "d/dx (x²) = 2x." },
  ],

  presets: [
    { label: "½x² at a = 1", note: "Derivative is x, so the tangent slope here is 1.", values: { "cl-expr": "0.5*x^2", "cl-a": 1, "cl-h": 1.5 } },
    { label: "Shrink h", note: "Same point, tiny gap — the secant is now basically the tangent.", values: { "cl-h": 0.05 } },
    { label: "sin(x) at a = 0", note: "Slope of sin at 0 is cos(0) = 1.", values: { "cl-expr": "sin(x)", "cl-a": 0, "cl-h": 0.05 } },
    { label: "Cubic turning point", note: "x³ − 3x at a = 1: slope is 3·1 − 3 = 0, a flat tangent.", values: { "cl-expr": "x^3 - 3*x", "cl-a": 1, "cl-h": 0.05 } },
  ],

  panelHTML() {
    return `
      <div class="control">
        <label for="cl-expr">f(x) =</label>
        <input type="text" id="cl-expr" class="text-input mono" spellcheck="false" value="${state.expr}">
        <p class="fact" id="cl-err" role="status" hidden></p>
      </div>
      <div class="control"><div class="row"><label for="cl-a">Point a</label><output id="cl-aval" for="cl-a"></output></div>
        <input type="range" id="cl-a" min="-3" max="3" step="0.1" value="${state.a}"></div>
      <div class="control"><div class="row"><label for="cl-h">Gap h</label><output id="cl-hval" for="cl-h"></output></div>
        <input type="range" id="cl-h" min="0.02" max="3" step="0.02" value="${state.h}"></div>
      <dl class="stat-grid">
        <div><dt style="color:#b1520b">Secant slope</dt><dd class="mono" id="cl-sec">—</dd></div>
        <div><dt>Tangent slope f′(a)</dt><dd class="mono" id="cl-tan">—</dd></div>
      </dl>
    `;
  },

  wire(root) {
    els.expr = root.querySelector("#cl-expr");
    els.err = root.querySelector("#cl-err");
    els.a = root.querySelector("#cl-a");
    els.h = root.querySelector("#cl-h");
    els.aval = root.querySelector("#cl-aval");
    els.hval = root.querySelector("#cl-hval");
    els.sec = root.querySelector("#cl-sec");
    els.tan = root.querySelector("#cl-tan");

    const sync = () => {
      els.aval.textContent = state.a.toFixed(1);
      els.hval.textContent = state.h.toFixed(2);
      const slope = draw();
      els.sec.textContent = slope.toFixed(3);
      els.tan.textContent = numericDeriv().toFixed(3);
    };
    els.expr.addEventListener("input", () => {
      const src = els.expr.value.trim();
      if (isValidExpr(src, ["x"])) {
        state.expr = src;
        state.fn = compile(src, ["x"]);
        els.err.hidden = true;
        els.expr.removeAttribute("aria-invalid");
        sync();
      } else {
        els.err.textContent = "Can't read that formula.";
        els.err.hidden = false;
        els.expr.setAttribute("aria-invalid", "true");
      }
    });
    els.a.addEventListener("input", () => ((state.a = +els.a.value), sync()));
    els.h.addEventListener("input", () => ((state.h = +els.h.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
