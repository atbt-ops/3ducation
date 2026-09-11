import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { ohms } from "../lib/physics.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.62, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

// Rectangular loop of wire. Corners, clockwise from top-left.
const W = 2.7;
const H = 1.8;
const CORNERS = [
  new THREE.Vector3(-W, H, 0),
  new THREE.Vector3(W, H, 0),
  new THREE.Vector3(W, -H, 0),
  new THREE.Vector3(-W, -H, 0),
];

// Edge list with cumulative length, for analytic travel around the loop.
const EDGES = [];
let perimeter = 0;
for (let i = 0; i < 4; i++) {
  const a = CORNERS[i];
  const b = CORNERS[(i + 1) % 4];
  const len = a.distanceTo(b);
  EDGES.push({ a, b, len, start: perimeter });
  perimeter += len;
}

/** Point at fraction f (0..1) around the loop. */
function loopPoint(f, out = new THREE.Vector3()) {
  let d = (((f % 1) + 1) % 1) * perimeter;
  for (const e of EDGES) {
    if (d <= e.len || e === EDGES[3]) {
      return out.lerpVectors(e.a, e.b, e.len ? d / e.len : 0);
    }
    d -= e.len;
  }
  return out.copy(EDGES[0].a);
}

const wireMat = new THREE.MeshStandardMaterial({
  color: 0xb0803f,
  metalness: 0.7,
  roughness: 0.35,
});
EDGES.forEach((e) => {
  const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, e.len, 12), wireMat);
  seg.position.copy(e.a).add(e.b).multiplyScalar(0.5);
  seg.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3().subVectors(e.b, e.a).normalize()
  );
  group.add(seg);
});
CORNERS.forEach((c) => {
  const j = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), wireMat);
  j.position.copy(c);
  group.add(j);
});

// Battery straddling the bottom edge.
const battery = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.55, 0.55),
  new THREE.MeshStandardMaterial({ color: 0x23271f, metalness: 0.3, roughness: 0.6 })
);
battery.position.set(0, -H, 0);
group.add(battery);
["+0.72", "-0.72"].forEach((x) => {
  const term = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xd9a54a, metalness: 0.6, roughness: 0.3 })
  );
  term.rotation.z = Math.PI / 2;
  term.position.set(parseFloat(x), -H, 0);
  group.add(term);
});

// Bulb straddling the top edge.
const bulbMat = new THREE.MeshStandardMaterial({
  color: 0xfff2d2,
  emissive: 0xffc860,
  emissiveIntensity: 0,
  roughness: 0.18,
});
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 18), bulbMat);
bulb.position.set(0, H, 0);
group.add(bulb);
const glow = new THREE.PointLight(0xffce7a, 0, 7);
glow.position.copy(bulb.position);
group.add(glow);

// Electron markers spread evenly around the loop.
const N = 44;
const electronMat = new THREE.MeshBasicMaterial({ color: 0x54c7b4 });
const electronGeo = new THREE.SphereGeometry(0.07, 10, 8);
const electrons = [];
for (let i = 0; i < N; i++) {
  const m = new THREE.Mesh(electronGeo, electronMat);
  m.userData.f = i / N;
  loopPoint(m.userData.f, m.position);
  group.add(m);
  electrons.push(m);
}

const state = { volts: 6, ohms: 8, current: 0 };
const els = {};

export default {
  id: "circuit",
  name: "Ohm's law loop",
  tag: "Physics · Electricity",
  subject: "Physics",
  grades: [7, 10],
  video: { id: "F_vLWkkOETI", title: "Introduction to circuits and Ohm's law (Khan Academy)" },
  blurb: "Turn the dials, watch the current and the glow.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="9" width="26" height="22" rx="3" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="9" r="3.4" fill="currentColor"/><path d="M13 31v3M27 31v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 10.5, theta: 0.08, phi: 1.47, minRadius: 5, maxRadius: 18 },

  lesson: `
    <p>Push (voltage, volts) drives flow (current, amps) against opposition (resistance, ohms). Ohm
    found they lock together: <span class="mono">V = I · R</span>, so <span class="mono">I = V / R</span>.</p>
    <p>Double the voltage and twice as much current flows. Double the resistance and the current
    halves. The energy delivered each second — the <strong>power</strong> — is
    <span class="mono">P = V · I</span>, and that is what heats the filament until it glows.</p>
  `,

  quiz: [
    {
      q: "A 12 V battery drives a 4 Ω resistor. The current is…",
      choices: ["0.33 A", "3 A", "8 A", "48 A"],
      answer: 1,
      explain: "I = V / R = 12 / 4 = 3 A.",
    },
    {
      q: "Keeping voltage fixed, you double the resistance. The current…",
      choices: ["doubles", "halves", "stays the same", "goes to zero"],
      answer: 1,
      explain: "I = V / R, so doubling R halves I.",
    },
    {
      q: "Which raises the bulb's power (brightness) the most, from 6 V / 6 Ω?",
      choices: ["Raise to 12 V", "Raise resistance to 12 Ω", "Halve the voltage", "Nothing changes power"],
      answer: 0,
      explain: "P = V²/R. Doubling V quadruples power; raising R lowers it.",
    },
  ],

  presets: [
    { label: "Ohm's example", note: "12 V across 4 Ω → exactly 3 A.", values: { "ci-v": 12, "ci-r": 4 } },
    { label: "Double the volts", note: "From 6 V/6 Ω, doubling V doubles the current and quadruples the power — watch the glow jump.", values: { "ci-v": 12, "ci-r": 6 } },
    { label: "Double the ohms", note: "From 6 V/6 Ω, doubling R halves the current.", values: { "ci-v": 6, "ci-r": 12 } },
    { label: "Dim trickle", note: "Low voltage into high resistance: barely any current, no glow.", values: { "ci-v": 2, "ci-r": 20 } },
    { label: "Bright & hot", note: "Max voltage, low resistance: highest power here.", values: { "ci-v": 12, "ci-r": 1.5 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>I = V / R</span><b class="mono" id="ci-i">—</b></div>
      <div class="control"><div class="row"><label for="ci-v">Voltage</label><output id="ci-vval" for="ci-v"></output></div>
        <input type="range" id="ci-v" min="1" max="12" step="0.5" value="${state.volts}"></div>
      <div class="control"><div class="row"><label for="ci-r">Resistance</label><output id="ci-rval" for="ci-r"></output></div>
        <input type="range" id="ci-r" min="1" max="20" step="0.5" value="${state.ohms}"></div>
      <dl class="stat-grid">
        <div><dt>Current</dt><dd class="mono" id="ci-i2">—</dd></div>
        <div><dt>Power</dt><dd class="mono" id="ci-p">—</dd></div>
      </dl>
      <p class="fact">The filament glows on <strong>power</strong> (P = V·I), not voltage alone.</p>
    `;
  },

  wire(root) {
    els.v = root.querySelector("#ci-v");
    els.vval = root.querySelector("#ci-vval");
    els.r = root.querySelector("#ci-r");
    els.rval = root.querySelector("#ci-rval");
    els.i = root.querySelector("#ci-i");
    els.i2 = root.querySelector("#ci-i2");
    els.p = root.querySelector("#ci-p");

    const sync = () => {
      const { current, power } = ohms({ volts: state.volts, ohms: state.ohms });
      state.current = current;
      els.vval.textContent = `${state.volts.toFixed(1)} V`;
      els.rval.textContent = `${state.ohms.toFixed(1)} Ω`;
      els.i.textContent = `${current.toFixed(2)} A`;
      els.i2.textContent = `${current.toFixed(2)} A`;
      els.p.textContent = `${power.toFixed(1)} W`;
      const lit = Math.min(1, power / 18);
      bulbMat.emissiveIntensity = lit * 2.4;
      glow.intensity = lit * 3.2;
    };
    els.v.addEventListener("input", () => ((state.volts = parseFloat(els.v.value)), sync()));
    els.r.addEventListener("input", () => ((state.ohms = parseFloat(els.r.value)), sync()));
    sync();
  },

  update(dt) {
    const step = state.current * 0.03 * dt;
    for (const m of electrons) {
      m.userData.f = (m.userData.f + step) % 1;
      loopPoint(m.userData.f, m.position);
    }
  },

  onEnter() {},
  onExit() {},
};
