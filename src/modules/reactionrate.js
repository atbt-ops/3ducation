import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

const BOX = 4;
group.add(
  new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(BOX, BOX, BOX * 0.6)),
    new THREE.LineBasicMaterial({ color: 0x9a9a94 })
  )
);

const N_MAX = 70;
const redMat = new THREE.MeshStandardMaterial({ color: 0xc23b2b, roughness: 0.4 });
const blueMat = new THREE.MeshStandardMaterial({ color: 0x3a5fa8, roughness: 0.4 });
const geo = new THREE.SphereGeometry(0.13, 10, 8);

const particles = [];
for (let i = 0; i < N_MAX; i++) {
  const m = new THREE.Mesh(geo, i % 2 ? redMat : blueMat);
  m.userData = {
    type: i % 2,
    pos: new THREE.Vector3((Math.random() - 0.5) * BOX * 0.85, (Math.random() - 0.5) * BOX * 0.85, (Math.random() - 0.5) * BOX * 0.4),
    vel: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5),
    active: false,
    flashT: 0,
  };
  group.add(m);
  particles.push(m);
}

const state = { temp: 0.5, conc: 0.5, catalyst: false, t: 0, hits: 0, rateWindow: [], rate: 0 };

function activeCount() {
  return Math.round(6 + state.conc * (N_MAX - 6));
}

function collisionChance() {
  // more speed (temp) and a catalyst both raise the fraction of collisions that "succeed"
  const base = 0.15 + state.temp * 0.75;
  return Math.min(0.98, state.catalyst ? base + 0.25 : base);
}

const els = {};

export default {
  id: "reactionrate",
  name: "Reaction rate",
  tag: "Chemistry · Kinetics",
  subject: "Chemistry",
  grades: [9, 12],
  blurb: "Heat it, crowd it, add a catalyst — speed it up.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="14" r="4" fill="currentColor"/><circle cx="26" cy="17" r="4" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="27" r="4" stroke="currentColor" stroke-width="2"/><path d="M17 16l7 0M15 18l0 6" stroke="currentColor" stroke-width="1.6"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8, theta: 0.5, phi: 1.15, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>For two particles to react, they must <strong>collide</strong> — and collide hard enough, and
    at the right angle, to break bonds. Not every collision succeeds.</p>
    <p>Three things speed up the rate: more <strong>heat</strong> (faster particles, harder hits),
    more <strong>concentration</strong> (more particles, more collisions), and a
    <strong>catalyst</strong>, which offers an easier route so a bigger fraction of collisions succeed
    without needing extra heat at all.</p>
  `,

  quiz: [
    { q: "Raising the temperature speeds up a reaction mainly because particles…", choices: ["get bigger", "move faster and collide harder/more often", "turn a different colour", "become heavier"], answer: 1, explain: "Faster particles collide more often and with more energy." },
    { q: "A catalyst speeds up a reaction by…", choices: ["heating the mixture", "being used up", "lowering the energy needed for a collision to succeed", "adding more particles"], answer: 2, explain: "It offers an easier pathway without being consumed." },
    { q: "Increasing concentration increases the rate because…", choices: ["particles move faster", "there are more collisions per second", "the catalyst works better", "temperature rises"], answer: 1, explain: "More particles packed in means more frequent collisions." },
  ],

  presets: [
    { label: "Cold & dilute", note: "Slow — few, weak collisions.", values: { "rr-temp": 0.15, "rr-conc": 0.2, "rr-cat": "off" } },
    { label: "Hot & concentrated", note: "Fast — frequent, forceful collisions.", values: { "rr-temp": 0.9, "rr-conc": 0.9, "rr-cat": "off" } },
    { label: "Add a catalyst", note: "Same conditions, but now more collisions succeed.", values: { "rr-cat": "on" } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>reaction rate</span><b class="mono" id="rr-rate">—</b></div>
      <div class="control"><div class="row"><label for="rr-temp">Temperature</label><output id="rr-tempval" for="rr-temp"></output></div>
        <input type="range" id="rr-temp" min="0.05" max="1" step="0.01" value="${state.temp}"></div>
      <div class="control"><div class="row"><label for="rr-conc">Concentration</label><output id="rr-concval" for="rr-conc"></output></div>
        <input type="range" id="rr-conc" min="0.1" max="1" step="0.01" value="${state.conc}"></div>
      <select id="rr-cat" class="text-input" aria-label="Catalyst">
        <option value="off">No catalyst</option>
        <option value="on">Catalyst added</option>
      </select>
      <p class="fact">Flashes mark successful collisions.</p>
    `;
  },

  wire(root) {
    els.temp = root.querySelector("#rr-temp");
    els.conc = root.querySelector("#rr-conc");
    els.cat = root.querySelector("#rr-cat");
    els.tempval = root.querySelector("#rr-tempval");
    els.concval = root.querySelector("#rr-concval");
    els.rate = root.querySelector("#rr-rate");

    const sync = () => {
      els.tempval.textContent = `${Math.round(state.temp * 100)}%`;
      els.concval.textContent = `${Math.round(state.conc * 100)}%`;
    };
    els.temp.addEventListener("input", () => ((state.temp = +els.temp.value), sync()));
    els.conc.addEventListener("input", () => ((state.conc = +els.conc.value), sync()));
    els.cat.addEventListener("input", () => (state.catalyst = els.cat.value === "on"));
    sync();
  },

  update(dt) {
    state.t += dt;
    const h = Math.min(dt, 0.04);
    const active = activeCount();
    const speed = 1.2 + state.temp * 5;
    const half = BOX / 2 - 0.15;
    const halfZ = (BOX * 0.6) / 2 - 0.15;

    for (let i = 0; i < N_MAX; i++) {
      const m = particles[i];
      const u = m.userData;
      const on = i < active;
      m.visible = on;
      if (!on) continue;
      u.pos.addScaledVector(u.vel, speed * h);
      ["x", "y"].forEach((ax) => {
        if (Math.abs(u.pos[ax]) > half) {
          u.pos[ax] = Math.sign(u.pos[ax]) * half;
          u.vel[ax] *= -1;
        }
      });
      if (Math.abs(u.pos.z) > halfZ) {
        u.pos.z = Math.sign(u.pos.z) * halfZ;
        u.vel.z *= -1;
      }
      m.position.copy(u.pos);
      if (u.flashT > 0) {
        u.flashT -= h;
        m.scale.setScalar(1 + u.flashT * 3);
      } else {
        m.scale.setScalar(1);
      }
    }
    // crude collision check: red near blue → chance of "success" flash
    for (let i = 0; i < active; i++) {
      const a = particles[i];
      if (a.userData.type !== 0 || !a.visible) continue;
      for (let j = 0; j < active; j++) {
        const b = particles[j];
        if (b.userData.type !== 1 || !b.visible) continue;
        if (a.userData.pos.distanceTo(b.userData.pos) < 0.3 && Math.random() < collisionChance() * 0.3) {
          a.userData.flashT = 0.3;
          b.userData.flashT = 0.3;
          state.hits++;
        }
      }
    }
    state.rateWindow.push(state.hits);
    if (state.rateWindow.length > 30) state.rateWindow.shift();
    if (els.rate && state.rateWindow.length > 1) {
      const per = (state.rateWindow[state.rateWindow.length - 1] - state.rateWindow[0]) / (state.rateWindow.length / 60);
      els.rate.textContent = `${Math.max(0, per).toFixed(1)} /s`;
    }
  },

  onEnter() {
    state.hits = 0;
    state.rateWindow = [];
  },
  onExit() {},
};
