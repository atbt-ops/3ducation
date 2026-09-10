import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const R = 2.4;

// unit circle
group.add(
  new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 129 }, (_, j) => {
        const t = (j / 128) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R, 0);
      })
    ),
    new THREE.LineBasicMaterial({ color: 0x63665a })
  )
);
// axes
group.add(
  new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-R * 1.3, 0, 0), new THREE.Vector3(R * 1.3, 0, 0),
      new THREE.Vector3(0, -R * 1.3, 0), new THREE.Vector3(0, R * 1.3, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0xc9c9c4 })
  )
);

const radius = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x8a5f22 }));
const sinLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x0f6b63 }));
const cosLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb1520b }));
group.add(radius, sinLine, cosLine);

const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0x8a5f22 }));
group.add(dot);

const arcPts = [];
const arc = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x6d4bb1 }));
group.add(arc);

const state = { deg: 30, running: false };

function layout() {
  const a = (state.deg * Math.PI) / 180;
  const x = Math.cos(a) * R;
  const y = Math.sin(a) * R;
  dot.position.set(x, y, 0);
  radius.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, 0)]);
  sinLine.geometry.setFromPoints([new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, y, 0)]);
  cosLine.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, 0)]);
  arcPts.length = 0;
  const steps = Math.max(2, Math.round(Math.abs(state.deg)));
  for (let j = 0; j <= steps; j++) {
    const t = (state.deg * Math.PI) / 180 * (j / steps);
    arcPts.push(new THREE.Vector3(Math.cos(t) * 0.6, Math.sin(t) * 0.6, 0));
  }
  arc.geometry.setFromPoints(arcPts);
}
layout();

const els = {};

export default {
  id: "unitcircle",
  name: "Unit circle",
  tag: "Math · Trigonometry",
  subject: "Math",
  grades: [10, 12],
  flat: true,
  blurb: "Spin the radius — read sin, cos, tan.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="2"/><path d="M20 20l11-6M6 20h28M20 6v28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0, phi: 1.5708, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>Put a circle of radius 1 at the origin and mark a point at angle <span class="mono">θ</span> from
    the positive x-axis. That point's coordinates <em>are</em> the trig functions:
    <span class="mono">x = cos θ</span>, <span class="mono">y = sin θ</span>.</p>
    <p>So sine and cosine just slide between −1 and 1 as the radius sweeps round. Their ratio
    <span class="mono">tan θ = sin θ / cos θ</span> is the slope of the radius, which blows up to
    infinity at 90° where cos θ = 0.</p>
  `,

  quiz: [
    { q: "On the unit circle, the y-coordinate of the point at angle θ equals…", choices: ["cos θ", "sin θ", "tan θ", "θ itself"], answer: 1, explain: "x = cos θ and y = sin θ by definition." },
    { q: "What is cos 90°?", choices: ["1", "0", "−1", "undefined"], answer: 1, explain: "At 90° the point is straight up at (0, 1), so cos = 0." },
    { q: "Why is tan 90° undefined?", choices: ["sin 90° is 0", "cos 90° is 0, and you can't divide by 0", "the angle is too big", "tan only works below 45°"], answer: 1, explain: "tan θ = sin θ / cos θ, and cos 90° = 0." },
  ],

  presets: [
    { label: "30°", note: "cos 30° = √3/2 ≈ 0.87, sin 30° = 0.5.", values: { "uc-deg": 30 } },
    { label: "45°", note: "sin and cos are equal here: √2/2 ≈ 0.71. tan 45° = 1.", values: { "uc-deg": 45 } },
    { label: "90°", note: "Point at the top: cos = 0, sin = 1, tan undefined.", values: { "uc-deg": 90 } },
    { label: "180°", note: "Point on the far left: cos = −1, sin = 0.", values: { "uc-deg": 180 } },
    { label: "225°", note: "Third quadrant — both sin and cos are negative.", values: { "uc-deg": 225 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="uc-deg">Angle θ</label><output id="uc-degval" for="uc-deg"></output></div>
        <input type="range" id="uc-deg" min="0" max="360" step="1" value="${state.deg}"></div>
      <dl class="stat-grid">
        <div><dt style="color:#b1520b">cos θ</dt><dd class="mono" id="uc-cos">—</dd></div>
        <div><dt style="color:#0f6b63">sin θ</dt><dd class="mono" id="uc-sin">—</dd></div>
        <div><dt>tan θ</dt><dd class="mono" id="uc-tan">—</dd></div>
        <div><dt>radians</dt><dd class="mono" id="uc-rad">—</dd></div>
      </dl>
      <div class="btn-row"><button class="btn" id="uc-toggle" type="button" aria-pressed="false">Sweep: off</button></div>
    `;
  },

  wire(root) {
    els.deg = root.querySelector("#uc-deg");
    els.degval = root.querySelector("#uc-degval");
    els.cos = root.querySelector("#uc-cos");
    els.sin = root.querySelector("#uc-sin");
    els.tan = root.querySelector("#uc-tan");
    els.rad = root.querySelector("#uc-rad");
    els.toggle = root.querySelector("#uc-toggle");

    const sync = () => {
      const a = (state.deg * Math.PI) / 180;
      els.deg.value = String(Math.round(state.deg));
      els.degval.textContent = `${Math.round(state.deg)}°`;
      els.cos.textContent = Math.cos(a).toFixed(3);
      els.sin.textContent = Math.sin(a).toFixed(3);
      const c = Math.cos(a);
      els.tan.textContent = Math.abs(c) < 1e-3 ? "undefined" : (Math.sin(a) / c).toFixed(3);
      els.rad.textContent = a.toFixed(3);
      layout();
    };
    els._sync = sync;
    els.deg.addEventListener("input", () => {
      state.deg = parseFloat(els.deg.value);
      sync();
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = `Sweep: ${state.running ? "on" : "off"}`;
      els.toggle.setAttribute("aria-pressed", String(state.running));
    });
    sync();
  },

  update(dt) {
    if (!state.running) return;
    state.deg = (state.deg + dt * 40) % 360;
    els._sync?.();
  },

  onEnter() {},
  onExit() {},
};
