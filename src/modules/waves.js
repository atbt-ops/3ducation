import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.8 });

const SIZE = 8;
const SEG = 90;
const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
geo.rotateX(-Math.PI / 2);
const mat = new THREE.MeshStandardMaterial({
  color: 0x2c6e6b,
  roughness: 0.35,
  metalness: 0.1,
  flatShading: false,
});
const surface = new THREE.Mesh(geo, mat);
scene.add(surface);

const base = geo.attributes.position.array.slice();
const pos = geo.attributes.position;

const sourceMat = new THREE.MeshBasicMaterial({ color: 0xd9a54a });
const sourceA = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), sourceMat);
const sourceB = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), sourceMat);
scene.add(sourceA, sourceB);

const state = { wavelength: 1.2, separation: 2.4, twoSources: true, amp: 0.32, t: 0, running: true };

function sourcePositions() {
  const d = state.separation / 2;
  return [
    new THREE.Vector3(-d, 0, 0),
    new THREE.Vector3(d, 0, 0),
  ];
}

function placeSources() {
  const [a, b] = sourcePositions();
  sourceA.position.copy(a).setY(0.05);
  sourceB.position.copy(b).setY(0.05);
  sourceB.visible = state.twoSources;
}
placeSources();

const els = {};

export default {
  id: "waves",
  name: "Wave interference",
  tag: "Physics · Waves",
  subject: "Physics",
  blurb: "Two ripple sources, one interference pattern.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20c4-8 8-8 12 0s8 8 12 0 8-8 8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 28c4-8 8-8 12 0s8 8 12 0 8-8 8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 9, theta: 0.7, phi: 0.9, minRadius: 4, maxRadius: 18 },

  lesson: `
    <p>Where two waves meet, their heights simply add. Crest on crest builds a bigger crest —
    <strong>constructive</strong> interference. Crest on trough cancels to flat water —
    <strong>destructive</strong> interference.</p>
    <p>Which happens at a given point depends on the <em>path difference</em>: how much further one
    source is than the other. A whole number of wavelengths → constructive. A half-odd number
    (½, 1½, 2½ …) → destructive. Widening the sources or shortening the wavelength packs the bright
    and dark bands closer together.</p>
  `,

  quiz: [
    {
      q: "Two sources are in step. At a point exactly the same distance from both, you get…",
      choices: ["destructive interference", "constructive interference", "no wave at all", "a standing wave"],
      answer: 1,
      explain: "Zero path difference means the waves arrive in phase and reinforce.",
    },
    {
      q: "A point is 3.0 λ from one source and 3.5 λ from the other. There you expect…",
      choices: ["a bright/constructive spot", "a dark/destructive spot", "double the wavelength", "nothing measurable"],
      answer: 1,
      explain: "Path difference of half a wavelength puts the waves exactly out of phase.",
    },
    {
      q: "Shortening the wavelength makes the interference bands…",
      choices: ["wider apart", "closer together", "disappear", "brighter"],
      answer: 1,
      explain: "Band spacing scales with λ, so smaller λ = tighter fringes.",
    },
  ],

  presets: [
    { label: "Wide fringes", note: "Long wavelength, close sources — only a few broad bands.", values: { "wv-l": 2.4, "wv-s": 1.0 } },
    { label: "Tight fringes", note: "Short wavelength, wide sources — many closely-spaced bands.", values: { "wv-l": 0.6, "wv-s": 4.0 } },
    { label: "Two-slit classic", note: "The double-slit pattern Young used to show light is a wave.", values: { "wv-l": 1.1, "wv-s": 2.6 } },
    { label: "Point source", note: "Turn the second source off — plain circular ripples, no interference.", values: { "wv-l": 1.2, "wv-s": 2.4 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="wv-l">Wavelength</label><output id="wv-lval" for="wv-l"></output></div>
        <input type="range" id="wv-l" min="0.5" max="2.5" step="0.05" value="${state.wavelength}"></div>
      <div class="control"><div class="row"><label for="wv-s">Source separation</label><output id="wv-sval" for="wv-s"></output></div>
        <input type="range" id="wv-s" min="0.6" max="4.5" step="0.1" value="${state.separation}"></div>
      <div class="btn-row">
        <button class="btn primary" id="wv-toggle" type="button">Pause</button>
        <button class="btn" id="wv-two" type="button" aria-pressed="true">Second source: on</button>
      </div>
      <p class="fact">Bright bands = path difference of a whole number of wavelengths.
        Dark bands = a half-odd number.</p>
    `;
  },

  wire(root) {
    els.l = root.querySelector("#wv-l");
    els.lval = root.querySelector("#wv-lval");
    els.s = root.querySelector("#wv-s");
    els.sval = root.querySelector("#wv-sval");
    els.toggle = root.querySelector("#wv-toggle");
    els.two = root.querySelector("#wv-two");

    const sync = () => {
      els.lval.textContent = `${state.wavelength.toFixed(2)} m`;
      els.sval.textContent = `${state.separation.toFixed(1)} m`;
      placeSources();
    };
    els.l.addEventListener("input", () => ((state.wavelength = parseFloat(els.l.value)), sync()));
    els.s.addEventListener("input", () => ((state.separation = parseFloat(els.s.value)), sync()));
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    els.two.addEventListener("click", () => {
      state.twoSources = !state.twoSources;
      els.two.textContent = `Second source: ${state.twoSources ? "on" : "off"}`;
      els.two.setAttribute("aria-pressed", String(state.twoSources));
      placeSources();
    });
    sync();
  },

  update(dt) {
    if (state.running) state.t += Math.min(dt, 0.05);
    const k = (2 * Math.PI) / state.wavelength;
    const omega = k * 2.2;
    const [a, b] = sourcePositions();
    const arr = pos.array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      const dA = Math.hypot(x - a.x, z - a.z);
      let h = Math.sin(k * dA - omega * state.t) / (0.6 + dA * 0.5);
      if (state.twoSources) {
        const dB = Math.hypot(x - b.x, z - b.z);
        h += Math.sin(k * dB - omega * state.t) / (0.6 + dB * 0.5);
      }
      arr[i + 1] = h * state.amp;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  },

  onEnter() {
    state.t = 0;
  },
  onExit() {},
};
