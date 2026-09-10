import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.8 });

const TANK = 4;
const tank = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(TANK, TANK, TANK)),
  new THREE.LineBasicMaterial({ color: 0x9a9a94 })
);
scene.add(tank);

const water = new THREE.Mesh(
  new THREE.BoxGeometry(TANK - 0.05, TANK * 0.78, TANK - 0.05),
  new THREE.MeshStandardMaterial({ color: 0x3f7fd9, transparent: true, opacity: 0.28, roughness: 0.2 })
);
water.position.y = -TANK / 2 + (TANK * 0.78) / 2;
const waterTopY = water.position.y + (TANK * 0.78) / 2;
scene.add(water);

const state = { density: 0.6, size: 1.2 };
let cube = null;

function build() {
  if (cube) scene.remove(cube);
  const s = state.size;
  cube = new THREE.Mesh(
    new THREE.BoxGeometry(s, s, s),
    new THREE.MeshStandardMaterial({ color: 0xb1520b, roughness: 0.45 })
  );
  scene.add(cube);
  place();
}

function place() {
  const s = state.size;
  const d = state.density; // relative to water (1.0)
  let topY;
  if (d >= 1) {
    // sinks — rests on the bottom
    topY = -TANK / 2 + s;
  } else {
    // floats: submerged fraction = d, so the cube's bottom is d·s below the surface
    const submerged = d * s;
    topY = waterTopY + (s - submerged);
  }
  cube.position.set(0, topY - s / 2, 0);
}

build();

const els = {};

export default {
  id: "buoyancy",
  name: "Float or sink",
  tag: "Physics · Fluids",
  subject: "Physics",
  grades: [6, 10],
  blurb: "Density decides — dial it up and down.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 22c4 3 6 3 10 0s6-3 10 0 6 3 10 0" stroke="currentColor" stroke-width="2"/><rect x="15" y="12" width="10" height="10" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0.6, phi: 1.15, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>Push an object into water and the water pushes back with an upward <strong>buoyant force</strong>
    equal to the weight of the water it shoves aside (Archimedes' principle).</p>
    <p>If the object is <em>less dense</em> than water it only needs to submerge part of itself to
    displace its own weight — so it floats, with the submerged fraction equal to its relative density.
    Denser than water and even fully submerged it can't displace enough: it sinks. Ice (0.92) floats
    low; cork (0.24) rides high; a steel cube (7.8) drops.</p>
  `,

  quiz: [
    { q: "An object floats when its density is…", choices: ["greater than the fluid's", "less than the fluid's", "exactly zero", "equal to its volume"], answer: 1, explain: "Lower density means it can displace its own weight while partly above the surface." },
    { q: "A block of relative density 0.7 floats with roughly what fraction submerged?", choices: ["30%", "50%", "70%", "100%"], answer: 2, explain: "The submerged fraction equals the relative density: 0.7." },
    { q: "The buoyant force on a submerged object equals the weight of…", choices: ["the object", "the fluid it displaces", "the container", "the air above it"], answer: 1, explain: "That's Archimedes' principle." },
  ],

  presets: [
    { label: "Cork", note: "Relative density ≈ 0.24 — rides high, barely wet.", values: { "bu-density": 0.24 } },
    { label: "Ice", note: "≈ 0.92 — floats with about 90% hidden below the surface.", values: { "bu-density": 0.92 } },
    { label: "Neutral", note: "Exactly 1.0 — hovers, fully submerged, neither rising nor sinking.", values: { "bu-density": 1 } },
    { label: "Steel", note: "≈ 7.8 — no contest, straight to the bottom.", values: { "bu-density": 3 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>submerged fraction = density</span><b class="mono" id="bu-state">—</b></div>
      <div class="control"><div class="row"><label for="bu-density">Object density (water = 1)</label><output id="bu-densityval" for="bu-density"></output></div>
        <input type="range" id="bu-density" min="0.1" max="3" step="0.02" value="${state.density}"></div>
      <div class="control"><div class="row"><label for="bu-size">Cube size</label><output id="bu-sizeval" for="bu-size"></output></div>
        <input type="range" id="bu-size" min="0.6" max="1.8" step="0.05" value="${state.size}"></div>
      <p class="fact" id="bu-note">Size changes the buoyant force and the weight together — it doesn't change whether it floats.</p>
    `;
  },

  wire(root) {
    els.density = root.querySelector("#bu-density");
    els.size = root.querySelector("#bu-size");
    els.densityval = root.querySelector("#bu-densityval");
    els.sizeval = root.querySelector("#bu-sizeval");
    els.state = root.querySelector("#bu-state");

    const sync = () => {
      els.densityval.textContent = state.density.toFixed(2);
      els.sizeval.textContent = state.size.toFixed(2);
      els.state.textContent = state.density < 1 ? "floats" : state.density > 1 ? "sinks" : "neutral";
      place();
    };
    els.density.addEventListener("input", () => {
      state.density = +els.density.value;
      sync();
    });
    els.size.addEventListener("input", () => {
      state.size = +els.size.value;
      build();
      sync();
    });
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
