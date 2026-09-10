import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";
import { harmonic } from "../lib/physics.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.75 });

const L = 6;
const COUNT = 160;
const AMP = 0.7;
const F1 = 110; // Hz, the fundamental (roughly an A2 string)

const posArr = new Float32Array(COUNT * 3);
for (let i = 0; i < COUNT; i++) posArr[i * 3] = -L / 2 + (L * i) / (COUNT - 1);
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
const stringLine = new THREE.Line(
  geo,
  new THREE.LineBasicMaterial({ color: 0x2c6e6b })
);
scene.add(stringLine);

// Envelope (the fixed shape the string oscillates within).
const envUp = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xd9a54a, transparent: true, opacity: 0.4 }));
const envDown = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xd9a54a, transparent: true, opacity: 0.4 }));
scene.add(envUp, envDown);

// End posts.
const postMat = new THREE.MeshStandardMaterial({ color: 0xa9762e, metalness: 0.5, roughness: 0.3 });
[-L / 2, L / 2].forEach((x) => {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 12), postMat);
  p.position.set(x, 0, 0);
  scene.add(p);
});
scene.add(contactShadow({ radius: 4, y: -0.72, opacity: 0.16 }));

const nodeMat = new THREE.MeshBasicMaterial({ color: 0x8a5f22 });
const nodeGeo = new THREE.SphereGeometry(0.09, 12, 10);
let nodeMeshes = [];

const state = { n: 2, running: true, t: 0 };

function rebuildEnvelope() {
  const up = [];
  const down = [];
  for (let i = 0; i < COUNT; i++) {
    const x = posArr[i * 3];
    const s = AMP * Math.sin((state.n * Math.PI * (x + L / 2)) / L);
    up.push(new THREE.Vector3(x, s, 0));
    down.push(new THREE.Vector3(x, -s, 0));
  }
  envUp.geometry.setFromPoints(up);
  envDown.geometry.setFromPoints(down);

  nodeMeshes.forEach((m) => scene.remove(m));
  nodeMeshes = [];
  for (let k = 0; k <= state.n; k++) {
    const m = new THREE.Mesh(nodeGeo, nodeMat);
    m.position.set(-L / 2 + (L * k) / state.n, 0, 0);
    scene.add(m);
    nodeMeshes.push(m);
  }
}
rebuildEnvelope();

const els = {};

export default {
  id: "standing",
  name: "Standing waves",
  tag: "Physics · Waves & music",
  subject: "Physics",
  grades: [9, 12],
  blurb: "Pluck a string into its harmonics.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 20c5-12 10-12 15 0s10 12 15 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="5" cy="20" r="2.4" fill="currentColor"/><circle cx="35" cy="20" r="2.4" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 9, theta: 0.1, phi: 1.5, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>A string clamped at both ends can only vibrate in shapes that fit whole loops between the ends.
    One loop is the <strong>fundamental</strong>; two loops, three loops and so on are the
    <strong>harmonics</strong>.</p>
    <p>The nth harmonic has n times the frequency of the fundamental: <span class="mono">fₙ = n · f₁</span>.
    That is exactly the musical harmonic series — the 2nd harmonic is an octave up, the 3rd a further
    perfect fifth. The still points are <em>nodes</em>; the points of biggest swing are
    <em>antinodes</em>.</p>
  `,

  quiz: [
    {
      q: "The 3rd harmonic of a 100 Hz string vibrates at…",
      choices: ["33 Hz", "103 Hz", "300 Hz", "900 Hz"],
      answer: 2,
      explain: "fₙ = n·f₁ = 3 × 100 = 300 Hz.",
    },
    {
      q: "A node on a standing wave is a point that…",
      choices: ["moves the most", "never moves", "moves only at the start", "is always at the centre"],
      answer: 1,
      explain: "Nodes stay still; antinodes have the largest amplitude.",
    },
    {
      q: "Going from the fundamental to the 2nd harmonic raises the pitch by…",
      choices: ["a semitone", "an octave", "two octaves", "nothing — same pitch"],
      answer: 1,
      explain: "Doubling the frequency is exactly one octave.",
    },
  ],

  presets: [
    { label: "Fundamental", note: "One loop, no interior nodes — the lowest note the string can play (110 Hz).", values: { "sw-n": 1 } },
    { label: "Octave (2nd)", note: "Two loops, one node in the middle. 220 Hz — exactly an octave up.", values: { "sw-n": 2 } },
    { label: "Perfect fifth (3rd)", note: "Three loops, 330 Hz — an octave and a fifth above the fundamental.", values: { "sw-n": 3 } },
    { label: "Highest here (6th)", note: "Six loops, five nodes, 660 Hz.", values: { "sw-n": 6 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>fₙ = n · f₁</span><b class="mono" id="sw-f">—</b></div>
      <div class="control"><div class="row"><label for="sw-n">Harmonic n</label><output id="sw-nval" for="sw-n"></output></div>
        <input type="range" id="sw-n" min="1" max="6" step="1" value="${state.n}"></div>
      <dl class="stat-grid">
        <div><dt>Nodes</dt><dd class="mono" id="sw-nodes">—</dd></div>
        <div><dt>Musical interval</dt><dd class="mono" id="sw-int">—</dd></div>
      </dl>
      <div class="btn-row"><button class="btn primary" id="sw-toggle" type="button">Pause</button></div>
      <p class="fact">f₁ here is 110 Hz — roughly a bass guitar's open A string.</p>
    `;
  },

  wire(root) {
    els.n = root.querySelector("#sw-n");
    els.nval = root.querySelector("#sw-nval");
    els.f = root.querySelector("#sw-f");
    els.nodes = root.querySelector("#sw-nodes");
    els.int = root.querySelector("#sw-int");
    els.toggle = root.querySelector("#sw-toggle");

    const INTERVALS = ["fundamental", "octave", "octave + fifth", "two octaves", "+ major third", "+ fifth"];
    const sync = () => {
      els.nval.textContent = `${state.n}`;
      els.f.textContent = `${harmonic(F1, state.n)} Hz`;
      els.nodes.textContent = `${state.n + 1}`;
      els.int.textContent = INTERVALS[state.n - 1];
      rebuildEnvelope();
    };
    els.n.addEventListener("input", () => {
      state.n = parseInt(els.n.value, 10);
      sync();
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    sync();
  },

  update(dt) {
    if (state.running) state.t += Math.min(dt, 0.05);
    const phase = Math.cos(state.t * 6);
    for (let i = 0; i < COUNT; i++) {
      const x = posArr[i * 3];
      posArr[i * 3 + 1] =
        AMP * Math.sin((state.n * Math.PI * (x + L / 2)) / L) * phase;
    }
    geo.attributes.position.needsUpdate = true;
  },

  onEnter() {
    state.t = 0;
  },
  onExit() {},
};
