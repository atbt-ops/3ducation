import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { ohms } from "../lib/physics.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.62, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

// Rounded-rectangle loop of wire.
const W = 3.2;
const H = 2.0;
const pts = [];
const seg = 24;
const corners = [
  [-W, H], [W, H], [W, -H], [-W, -H],
];
for (let c = 0; c < 4; c++) {
  const [x0, y0] = corners[c];
  const [x1, y1] = corners[(c + 1) % 4];
  for (let i = 0; i < seg; i++) {
    const t = i / seg;
    pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0));
  }
}
const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.02);
const wire = new THREE.Mesh(
  new THREE.TubeGeometry(curve, 240, 0.06, 10, true),
  new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.7, roughness: 0.35 })
);
group.add(wire);

// Battery on the bottom edge.
const battery = new THREE.Mesh(
  new THREE.BoxGeometry(1.1, 0.5, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x23271f, metalness: 0.3, roughness: 0.6 })
);
battery.position.set(0, -H, 0);
group.add(battery);
const nub = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12),
  new THREE.MeshStandardMaterial({ color: 0xd9a54a, metalness: 0.6, roughness: 0.3 })
);
nub.rotation.z = Math.PI / 2;
nub.position.set(0.65, -H, 0);
group.add(nub);

// Bulb on the top edge.
const bulbMat = new THREE.MeshStandardMaterial({
  color: 0xfff0c8,
  emissive: 0xffcf6b,
  emissiveIntensity: 0,
  roughness: 0.2,
});
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), bulbMat);
bulb.position.set(0, H, 0);
group.add(bulb);
const glow = new THREE.PointLight(0xffce7a, 0, 6);
glow.position.copy(bulb.position);
group.add(glow);

// Electron markers.
const N = 40;
const electronGeo = new THREE.SphereGeometry(0.07, 10, 8);
const electronMat = new THREE.MeshBasicMaterial({ color: 0x6fc3b4 });
const electrons = [];
for (let i = 0; i < N; i++) {
  const m = new THREE.Mesh(electronGeo, electronMat);
  m.userData.t = i / N;
  group.add(m);
  electrons.push(m);
}

const state = { volts: 6, ohms: 8, flow: 0 };

function place() {
  electrons.forEach((m) => {
    const p = curve.getPointAt(m.userData.t % 1);
    m.position.copy(p);
  });
}
place();

const els = {};

export default {
  id: "circuit",
  name: "Ohm's law loop",
  tag: "Physics · Electricity",
  subject: "Physics",
  blurb: "Turn the dials, watch the current and the glow.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="9" width="26" height="22" rx="3" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="9" r="3.4" fill="currentColor"/><path d="M13 31v3M27 31v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0.2, phi: 1.35, minRadius: 4, maxRadius: 16 },

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
      els.vval.textContent = `${state.volts.toFixed(1)} V`;
      els.rval.textContent = `${state.ohms.toFixed(1)} Ω`;
      els.i.textContent = `${current.toFixed(2)} A`;
      els.i2.textContent = `${current.toFixed(2)} A`;
      els.p.textContent = `${power.toFixed(1)} W`;
      const lit = Math.min(1, power / 18);
      bulbMat.emissiveIntensity = lit * 2.2;
      glow.intensity = lit * 3;
      state.flow = current;
    };
    els.v.addEventListener("input", () => ((state.volts = parseFloat(els.v.value)), sync()));
    els.r.addEventListener("input", () => ((state.ohms = parseFloat(els.r.value)), sync()));
    sync();
  },

  update(dt) {
    const v = state.flow * 0.06 * dt;
    electrons.forEach((m) => {
      m.userData.t = (m.userData.t + v) % 1;
      m.position.copy(curve.getPointAt(m.userData.t));
    });
  },

  onEnter() {},
  onExit() {},
};
