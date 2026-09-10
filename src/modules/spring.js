import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.62, dir: 0.9 });

const anchorY = 2.6;
const anchor = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.14, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.4, roughness: 0.4 })
);
anchor.position.set(0, anchorY + 0.07, 0);
scene.add(anchor);

// Spring as a stretchable helix line.
const COILS = 9;
const PTS = 220;
const springGeo = new THREE.BufferGeometry();
springGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PTS * 3), 3));
const spring = new THREE.Line(
  springGeo,
  new THREE.LineBasicMaterial({ color: 0x8a5f22 })
);
scene.add(spring);

const bob = new THREE.Mesh(
  new THREE.BoxGeometry(0.9, 0.7, 0.9),
  new THREE.MeshStandardMaterial({ color: 0x0f6b63, roughness: 0.35, metalness: 0.1 })
);
scene.add(bob);
scene.add(contactShadow({ radius: 2.6, y: -1.9, opacity: 0.2 }));

const state = { k: 14, m: 1.2, amp: 0.6, g: 9.8, t: 0, running: true };

function springLength() {
  const eq = (state.m * state.g) / state.k; // equilibrium extension
  return 1.1 + eq + state.amp * Math.cos(Math.sqrt(state.k / state.m) * state.t);
}

function layout() {
  const L = Math.max(0.4, springLength());
  const arr = springGeo.attributes.position.array;
  for (let i = 0; i < PTS; i++) {
    const f = i / (PTS - 1);
    const ang = f * COILS * Math.PI * 2;
    const r = f < 0.04 || f > 0.96 ? 0 : 0.32;
    arr[i * 3] = Math.cos(ang) * r;
    arr[i * 3 + 1] = anchorY - f * L;
    arr[i * 3 + 2] = Math.sin(ang) * r;
  }
  springGeo.attributes.position.needsUpdate = true;
  bob.position.set(0, anchorY - L - 0.35, 0);
}
layout();

const els = {};

export default {
  id: "spring",
  name: "Mass on a spring",
  tag: "Physics · Oscillation",
  subject: "Physics",
  grades: [9, 11],
  blurb: "Hooke's law and simple harmonic motion.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4v4M20 8c-6 0-6 4 0 4s6 4 0 4-6 4 0 4-6 4 0 4v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="15" y="30" width="10" height="7" rx="1.5" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0.6, 0], radius: 7.5, theta: 0.7, phi: 1.2, minRadius: 3.5, maxRadius: 14 },

  lesson: `
    <p>A spring pushes or pulls back in proportion to how far you stretch it:
    <span class="mono">F = −k·x</span>. That restoring force produces <strong>simple harmonic
    motion</strong> — a smooth back-and-forth, exactly like the pendulum's small swing.</p>
    <p>The period is <span class="mono">T = 2π·√(m/k)</span>: heavier mass swings slower, stiffer
    spring swings faster. Hang the mass and it settles where gravity balances the spring, at a
    stretch of <span class="mono">m·g / k</span> — then oscillates around that point.</p>
  `,

  quiz: [
    {
      q: "You hang twice the mass on the same spring. The period…",
      choices: ["doubles", "is multiplied by √2", "halves", "is unchanged"],
      answer: 1,
      explain: "T ∝ √m, so doubling m multiplies T by √2.",
    },
    {
      q: "A stiffer spring (larger k) makes the oscillation…",
      choices: ["slower", "faster", "stop", "the same"],
      answer: 1,
      explain: "T = 2π√(m/k): larger k means a shorter period.",
    },
    {
      q: "Where is the mass moving fastest?",
      choices: ["at the top of its bounce", "at the bottom", "as it passes the equilibrium point", "it moves at constant speed"],
      answer: 2,
      explain: "All the energy is kinetic at equilibrium; it's momentarily still at the turning points.",
    },
  ],

  presets: [
    { label: "Stiff & light", note: "High k, low mass → the fastest bounce here.", values: { "sp-k": 38, "sp-m": 0.3 } },
    { label: "Soft & heavy", note: "Low k, high mass → a slow, lumbering oscillation.", values: { "sp-k": 3, "sp-m": 3 } },
    { label: "Quadruple the mass", note: "From k=16/m=0.75, ×4 mass only doubles the period (T ∝ √m).", values: { "sp-k": 16, "sp-m": 3 } },
    { label: "Big stretch", note: "A large starting amplitude — same period, wider swing.", values: { "sp-a": 1.1 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>T = 2π√(m/k)</span><b class="mono" id="sp-T">—</b></div>
      <div class="control"><div class="row"><label for="sp-k">Spring constant k</label><output id="sp-kval" for="sp-k"></output></div>
        <input type="range" id="sp-k" min="2" max="40" step="1" value="${state.k}"></div>
      <div class="control"><div class="row"><label for="sp-m">Mass m</label><output id="sp-mval" for="sp-m"></output></div>
        <input type="range" id="sp-m" min="0.2" max="3" step="0.1" value="${state.m}"></div>
      <div class="control"><div class="row"><label for="sp-a">Start amplitude</label><output id="sp-aval" for="sp-a"></output></div>
        <input type="range" id="sp-a" min="0.1" max="1.2" step="0.05" value="${state.amp}"></div>
      <dl class="stat-grid">
        <div><dt>Rest stretch</dt><dd class="mono" id="sp-eq">—</dd></div>
        <div><dt>Frequency</dt><dd class="mono" id="sp-f">—</dd></div>
      </dl>
      <div class="btn-row">
        <button class="btn primary" id="sp-toggle" type="button">Pause</button>
        <button class="btn" id="sp-reset" type="button">Reset</button>
      </div>
    `;
  },

  wire(root) {
    els.k = root.querySelector("#sp-k");
    els.kval = root.querySelector("#sp-kval");
    els.m = root.querySelector("#sp-m");
    els.mval = root.querySelector("#sp-mval");
    els.a = root.querySelector("#sp-a");
    els.aval = root.querySelector("#sp-aval");
    els.T = root.querySelector("#sp-T");
    els.eq = root.querySelector("#sp-eq");
    els.f = root.querySelector("#sp-f");
    els.toggle = root.querySelector("#sp-toggle");
    els.reset = root.querySelector("#sp-reset");

    const sync = () => {
      const T = 2 * Math.PI * Math.sqrt(state.m / state.k);
      els.kval.textContent = `${state.k.toFixed(0)} N/m`;
      els.mval.textContent = `${state.m.toFixed(1)} kg`;
      els.aval.textContent = `${state.amp.toFixed(2)} m`;
      els.T.textContent = `${T.toFixed(2)} s`;
      els.eq.textContent = `${((state.m * state.g) / state.k).toFixed(2)} m`;
      els.f.textContent = `${(1 / T).toFixed(2)} Hz`;
    };
    els.k.addEventListener("input", () => ((state.k = parseFloat(els.k.value)), sync()));
    els.m.addEventListener("input", () => ((state.m = parseFloat(els.m.value)), sync()));
    els.a.addEventListener("input", () => {
      state.amp = parseFloat(els.a.value);
      state.t = 0;
      sync();
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    els.reset.addEventListener("click", () => {
      state.t = 0;
      layout();
    });
    sync();
  },

  update(dt) {
    if (state.running) state.t += Math.min(dt, 0.05);
    layout();
  },

  onEnter() {
    state.t = 0;
  },
  onExit() {},
};
