import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);

// a stylised leaf
const leafShape = new THREE.Shape();
leafShape.moveTo(0, -1.6);
leafShape.bezierCurveTo(1.4, -0.8, 1.2, 1.2, 0, 1.8);
leafShape.bezierCurveTo(-1.2, 1.2, -1.4, -0.8, 0, -1.6);
const leaf = new THREE.Mesh(
  new THREE.ExtrudeGeometry(leafShape, { depth: 0.12, bevelEnabled: false }),
  new THREE.MeshStandardMaterial({ color: 0x3f8f34, roughness: 0.5, side: THREE.DoubleSide })
);
leaf.rotation.y = -0.3;
group.add(leaf);

const sun = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
sun.position.set(-3.2, 2.4, 1);
group.add(sun);
const sunLight = new THREE.PointLight(0xfff2d0, 1, 20);
sunLight.position.copy(sun.position);
group.add(sunLight);

// O2 bubbles rising out of the leaf
const bubbleMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.8 });
const bubbles = [];
for (let i = 0; i < 30; i++) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), bubbleMat);
  b.userData = { active: false, y: 0, x: 0, speed: 0 };
  b.visible = false;
  group.add(b);
  bubbles.push(b);
}

const state = { light: 0.7, co2: 0.7, t: 0, spawn: 0 };

function rate() {
  return Math.min(state.light, state.co2);
}

const els = {};

export default {
  id: "photosynthesis",
  name: "Photosynthesis",
  tag: "Biology · Plants",
  subject: "Biology",
  grades: [6, 11],
  blurb: "Light + CO₂ + water → sugar + oxygen.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 34c0-10 3-18 12-22-2 12-6 18-12 22ZM20 34c0-8-3-14-10-17 1 10 4 14 10 17Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 0.2, 0], radius: 8, theta: 0.5, phi: 1.15, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>A leaf runs the most important chemical reaction on Earth. Using energy from
    <strong>light</strong>, it combines <strong>carbon dioxide</strong> from the air with
    <strong>water</strong> from the roots to build <strong>glucose</strong> (food) and release
    <strong>oxygen</strong>:</p>
    <p><span class="mono">6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂</span></p>
    <p>The rate is capped by whichever ingredient is in shortest supply — the
    <strong>limiting factor</strong>. Turn the light down and adding more CO₂ won't help, and vice
    versa.</p>
  `,

  quiz: [
    { q: "The two raw materials a plant takes in for photosynthesis are…", choices: ["oxygen and glucose", "carbon dioxide and water", "nitrogen and sunlight", "soil and air"], answer: 1, explain: "CO₂ from the air and H₂O from the roots; light provides the energy." },
    { q: "Photosynthesis releases which gas?", choices: ["carbon dioxide", "nitrogen", "oxygen", "hydrogen"], answer: 2, explain: "Oxygen is the by-product — the air we breathe." },
    { q: "In bright light with very little CO₂, adding more light will…", choices: ["speed it up a lot", "barely change the rate", "stop it", "release nitrogen"], answer: 1, explain: "CO₂ is now the limiting factor, so light isn't the bottleneck." },
  ],

  presets: [
    { label: "Bright noon", note: "Plenty of light and CO₂ — oxygen streams out.", values: { "ps-light": 1, "ps-co2": 1 } },
    { label: "Dim light", note: "Light is now the limiting factor; extra CO₂ won't help.", values: { "ps-light": 0.15, "ps-co2": 1 } },
    { label: "Stuffy room", note: "Bright, but starved of CO₂ — the rate stays low.", values: { "ps-light": 1, "ps-co2": 0.15 } },
    { label: "Night", note: "No light, no photosynthesis.", values: { "ps-light": 0 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>rate</span><b class="mono" id="ps-rate">—</b></div>
      <div class="control"><div class="row"><label for="ps-light">Light intensity</label><output id="ps-lightval" for="ps-light"></output></div>
        <input type="range" id="ps-light" min="0" max="1" step="0.01" value="${state.light}"></div>
      <div class="control"><div class="row"><label for="ps-co2">CO₂ level</label><output id="ps-co2val" for="ps-co2"></output></div>
        <input type="range" id="ps-co2" min="0.05" max="1" step="0.01" value="${state.co2}"></div>
      <p class="fact" id="ps-limit">—</p>
    `;
  },

  wire(root) {
    els.light = root.querySelector("#ps-light");
    els.co2 = root.querySelector("#ps-co2");
    els.lightval = root.querySelector("#ps-lightval");
    els.co2val = root.querySelector("#ps-co2val");
    els.rate = root.querySelector("#ps-rate");
    els.limit = root.querySelector("#ps-limit");

    const sync = () => {
      els.lightval.textContent = `${Math.round(state.light * 100)}%`;
      els.co2val.textContent = `${Math.round(state.co2 * 100)}%`;
      els.rate.textContent = `${Math.round(rate() * 100)}%`;
      els.limit.textContent =
        state.light <= state.co2 ? "Light is the limiting factor." : "CO₂ is the limiting factor.";
      sunLight.intensity = 0.2 + state.light * 1.4;
      sun.scale.setScalar(0.6 + state.light * 0.6);
    };
    els.light.addEventListener("input", () => ((state.light = +els.light.value), sync()));
    els.co2.addEventListener("input", () => ((state.co2 = +els.co2.value), sync()));
    sync();
  },

  update(dt) {
    state.t += dt;
    state.spawn -= dt;
    const r = rate();
    if (state.spawn <= 0 && r > 0.02) {
      state.spawn = 0.5 / (r + 0.05);
      const b = bubbles.find((x) => !x.userData.active);
      if (b) {
        b.userData = { active: true, x: (Math.random() - 0.5) * 1.2, y: -1, speed: 1 + r };
        b.visible = true;
      }
    }
    bubbles.forEach((b) => {
      if (!b.userData.active) return;
      b.userData.y += b.userData.speed * dt;
      b.position.set(b.userData.x + Math.sin(b.userData.y * 3) * 0.1, b.userData.y, 0.3);
      if (b.userData.y > 3.5) {
        b.userData.active = false;
        b.visible = false;
      }
    });
    leaf.rotation.z = Math.sin(state.t * 0.6) * 0.05;
  },

  onEnter() {
    bubbles.forEach((b) => {
      b.userData.active = false;
      b.visible = false;
    });
  },
  onExit() {},
};
