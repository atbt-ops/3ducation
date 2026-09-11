import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const RANGE = 5;
const SCALE = 0.7;

// grid
const gridMat = new THREE.LineBasicMaterial({ color: 0xe3e3e1 });
for (let i = -RANGE; i <= RANGE; i++) {
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(i * SCALE, -RANGE * SCALE, 0), new THREE.Vector3(i * SCALE, RANGE * SCALE, 0),
  ]), gridMat));
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-RANGE * SCALE, i * SCALE, 0), new THREE.Vector3(RANGE * SCALE, i * SCALE, 0),
  ]), gridMat));
}
group.add(
  new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-RANGE * SCALE, 0, 0), new THREE.Vector3(RANGE * SCALE, 0, 0),
      new THREE.Vector3(0, -RANGE * SCALE, 0), new THREE.Vector3(0, RANGE * SCALE, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0x63665a })
  )
);

const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x0f6b63 }));
group.add(line);
const dot0 = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0xb1520b }));
const rise = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb1520b, transparent: true, opacity: 0.6 }));
const run = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb1520b, transparent: true, opacity: 0.6 }));
group.add(dot0, rise, run);

const state = { m: 1, c: 0 };

function draw() {
  const pts = [];
  for (let i = -RANGE; i <= RANGE; i += 0.2) {
    const y = state.m * i + state.c;
    pts.push(new THREE.Vector3(i * SCALE, Math.max(-RANGE, Math.min(RANGE, y)) * SCALE, 0));
  }
  line.geometry.setFromPoints(pts);
  dot0.position.set(0, state.c * SCALE, 0.01);

  // rise/run triangle from x=1 to x=2
  const x1 = 1;
  const x2 = 2;
  const y1 = state.m * x1 + state.c;
  const y2 = state.m * x2 + state.c;
  run.geometry.setFromPoints([new THREE.Vector3(x1 * SCALE, y1 * SCALE, 0.01), new THREE.Vector3(x2 * SCALE, y1 * SCALE, 0.01)]);
  rise.geometry.setFromPoints([new THREE.Vector3(x2 * SCALE, y1 * SCALE, 0.01), new THREE.Vector3(x2 * SCALE, y2 * SCALE, 0.01)]);
}
draw();

const els = {};

export default {
  id: "linegraph",
  name: "Line grapher",
  tag: "Math · Coordinate geometry",
  subject: "Math",
  grades: [8, 11],
  flat: true,
  blurb: "y = mx + c — slope and intercept, live.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 36h32M4 4v32" stroke="currentColor" stroke-width="1.6"/><path d="M8 30L32 8" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8, theta: 0, phi: 1.5708, minRadius: 3.5, maxRadius: 16 },

  lesson: `
    <p>Every straight line can be written <span class="mono">y = mx + c</span>. The
    <strong>intercept</strong> <span class="mono">c</span> is where it crosses the y-axis (at
    x = 0). The <strong>slope</strong> <span class="mono">m</span> is how steeply it climbs: for
    every 1 step right, the line moves <span class="mono">m</span> steps up (or down, if negative).</p>
    <p>The little orange triangle shows "rise over run" — pick any two points and
    <span class="mono">m = rise / run</span> is always the same number for a straight line.</p>
  `,

  quiz: [
    { q: "In y = 3x − 2, the y-intercept is…", choices: ["3", "−2", "2", "0"], answer: 1, explain: "c = −2: the line crosses the y-axis at (0, −2)." },
    { q: "A line with slope m = −2 goes…", choices: ["up steeply left to right", "down steeply left to right", "flat, horizontal", "straight up (vertical)"], answer: 1, explain: "Negative slope means it falls as x increases." },
    { q: "Two lines with the same slope m but different intercepts c are…", choices: ["the same line", "parallel", "perpendicular", "not related"], answer: 1, explain: "Equal slope, different intercept: parallel lines that never meet." },
  ],

  presets: [
    { label: "y = x", note: "Slope 1, through the origin — the diagonal.", values: { "lg-m": 1, "lg-c": 0 } },
    { label: "Steep positive", note: "A slope of 3 climbs fast.", values: { "lg-m": 3, "lg-c": -1 } },
    { label: "Negative slope", note: "Falls from left to right.", values: { "lg-m": -1.5, "lg-c": 2 } },
    { label: "Flat", note: "Slope 0 — a horizontal line at y = c.", values: { "lg-m": 0, "lg-c": 2 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>y = mx + c</span><b class="mono" id="lg-eq">y = x</b></div>
      <div class="control"><div class="row"><label for="lg-m">Slope m</label><output id="lg-mval" for="lg-m"></output></div>
        <input type="range" id="lg-m" min="-4" max="4" step="0.1" value="${state.m}"></div>
      <div class="control"><div class="row"><label for="lg-c">Intercept c</label><output id="lg-cval" for="lg-c"></output></div>
        <input type="range" id="lg-c" min="-4" max="4" step="0.1" value="${state.c}"></div>
      <p class="fact">The orange triangle shows rise/run between x = 1 and x = 2.</p>
    `;
  },

  wire(root) {
    els.m = root.querySelector("#lg-m");
    els.c = root.querySelector("#lg-c");
    els.mval = root.querySelector("#lg-mval");
    els.cval = root.querySelector("#lg-cval");
    els.eq = root.querySelector("#lg-eq");

    const sync = () => {
      els.mval.textContent = state.m.toFixed(1);
      els.cval.textContent = state.c.toFixed(1);
      els.eq.textContent = `y = ${state.m.toFixed(1)}x ${state.c >= 0 ? "+" : "−"} ${Math.abs(state.c).toFixed(1)}`;
      draw();
    };
    els.m.addEventListener("input", () => ((state.m = +els.m.value), sync()));
    els.c.addEventListener("input", () => ((state.c = +els.c.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
