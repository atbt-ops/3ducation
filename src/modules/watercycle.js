import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);

// ground + ocean
const ground = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, 3), new THREE.MeshStandardMaterial({ color: 0x8fae6e, roughness: 0.8 }));
ground.position.y = -1.9;
group.add(ground);
const ocean = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 3), new THREE.MeshStandardMaterial({ color: 0x3a7fae, roughness: 0.3 }));
ocean.position.set(-2.5, -1.65, 0);
group.add(ocean);
// mountain
const mountain = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.4, 5), new THREE.MeshStandardMaterial({ color: 0x9a8f7a, roughness: 0.85 }));
mountain.position.set(3, -0.5, 0);
group.add(mountain);
// sun
const sun = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
sun.position.set(-3.4, 2.8, 0);
group.add(sun);
// clouds
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf3f0e6, roughness: 0.9 });
const clouds = [];
for (let i = 0; i < 3; i++) {
  const c = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.35 + Math.random() * 0.15, 12, 10), cloudMat);
    puff.position.set(k * 0.4 - 0.4, Math.random() * 0.1, 0);
    c.add(puff);
  }
  c.position.set(-1 + i * 1.4, 2.2, 0);
  c.userData = { grow: 0 };
  group.add(c);
  clouds.push(c);
}

const N = 40;
const dropMat = new THREE.MeshBasicMaterial({ color: 0x5aaee0 });
const drops = [];
for (let i = 0; i < N; i++) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), dropMat);
  d.userData = { phase: "evaporate", t: Math.random() * 6, x: -2.5 + (Math.random() - 0.5) * 3.5 };
  group.add(d);
  drops.push(d);
}

const state = { speed: 1, t: 0 };

function stepDrop(d, dt) {
  const u = d.userData;
  u.t += dt * state.speed;
  if (u.phase === "evaporate") {
    const f = Math.min(1, u.t / 3);
    d.position.set(u.x, -1.6 + f * 3.8, 0);
    d.material = dropMat;
    d.scale.setScalar(1 - f * 0.3);
    if (f >= 1) {
      u.phase = "condense";
      u.t = 0;
      u.targetX = 3 + (Math.random() - 0.5) * 2;
    }
  } else if (u.phase === "condense") {
    const f = Math.min(1, u.t / 1.5);
    d.position.x = u.x + (u.targetX - u.x) * f;
    d.position.y = 2.2;
    if (f >= 1) {
      u.phase = "precipitate";
      u.t = 0;
    }
  } else if (u.phase === "precipitate") {
    const f = Math.min(1, u.t / 1.2);
    d.position.y = 2.2 - f * 3.6;
    if (f >= 1) {
      u.phase = "collect";
      u.t = 0;
    }
  } else {
    const f = Math.min(1, u.t / 2);
    d.position.x = u.targetX + (-2.5 - u.targetX) * f * 0.6;
    if (f >= 1) {
      u.phase = "evaporate";
      u.t = 0;
      u.x = -2.5 + (Math.random() - 0.5) * 3.5;
    }
  }
}

const els = {};

export default {
  id: "watercycle",
  name: "The water cycle",
  tag: "Earth Science · Water",
  subject: "Earth Science",
  grades: [4, 8],
  blurb: "Evaporate, condense, rain, collect — round and round.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 18a6 6 0 1 1 1 12h13a5 5 0 0 0 0-10 7 7 0 0 0-13-3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 32l-1 3M20 32l-1 3M26 32l-1 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 10, theta: 0.1, phi: 1.25, minRadius: 5, maxRadius: 18 },

  lesson: `
    <p>Water never runs out — it just changes form and moves in a loop. The Sun's heat
    <strong>evaporates</strong> water from oceans and lakes into invisible vapour, which rises and
    cools in the sky, <strong>condensing</strong> into the tiny droplets that make up clouds.</p>
    <p>When those droplets grow heavy enough, they fall as <strong>precipitation</strong> — rain,
    snow, hail. The water is then <strong>collected</strong> in rivers, lakes and oceans, or seeps
    into the ground, ready to evaporate all over again.</p>
  `,

  quiz: [
    { q: "What powers evaporation in the water cycle?", choices: ["the Moon's gravity", "heat from the Sun", "wind alone", "ocean currents"], answer: 1, explain: "Solar heat turns liquid water into vapour." },
    { q: "Water vapour turning into cloud droplets is called…", choices: ["evaporation", "precipitation", "condensation", "collection"], answer: 2, explain: "Condensation: gas cooling back into liquid droplets." },
    { q: "Put these in cycle order: precipitation, evaporation, condensation.", choices: ["evaporation → condensation → precipitation", "precipitation → evaporation → condensation", "condensation → precipitation → evaporation", "they happen all at once, no order"], answer: 0, explain: "Water rises (evaporates), cools into clouds (condenses), then falls (precipitates)." },
  ],

  presets: [
    { label: "Slow motion", note: "Watch one stage at a time.", values: { "wc-speed": 0.3 } },
    { label: "Normal", note: "The full cycle at a readable pace.", values: { "wc-speed": 1 } },
    { label: "Fast forward", note: "Many drops cycling at once.", values: { "wc-speed": 2.5 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="wc-speed">Cycle speed</label><output id="wc-speedval" for="wc-speed"></output></div>
        <input type="range" id="wc-speed" min="0.2" max="3" step="0.1" value="${state.speed}"></div>
      <p class="fact">Watch a droplet: rise from the ocean (evaporate), drift into a cloud
        (condense), fall on the mountain (precipitate), then flow back down (collect).</p>
    `;
  },

  wire(root) {
    els.speed = root.querySelector("#wc-speed");
    els.speedval = root.querySelector("#wc-speedval");
    const sync = () => (els.speedval.textContent = `${state.speed.toFixed(1)}×`);
    els.speed.addEventListener("input", () => ((state.speed = +els.speed.value), sync()));
    sync();
  },

  update(dt) {
    state.t += dt;
    drops.forEach((d) => stepDrop(d, dt));
    clouds.forEach((c, i) => {
      c.scale.setScalar(1 + Math.sin(state.t * 0.5 + i) * 0.05);
    });
    sun.rotation.y += dt * 0.2;
  },

  onEnter() {},
  onExit() {},
};
