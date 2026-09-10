import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.8 });

const BOX = 4;
const half = BOX / 2;
const box = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(BOX, BOX, BOX)),
  new THREE.LineBasicMaterial({ color: 0x9a9a94 })
);
scene.add(box);

const N = 125; // 5x5x5 lattice
const geo = new THREE.SphereGeometry(0.16, 12, 10);
const mat = new THREE.MeshStandardMaterial({ color: 0x0f6b63, roughness: 0.35, metalness: 0.1 });
const mesh = new THREE.InstancedMesh(geo, mat, N);
scene.add(mesh);

const home = [];
const pos = [];
const vel = [];
for (let a = 0; a < 5; a++)
  for (let b = 0; b < 5; b++)
    for (let c = 0; c < 5; c++) {
      const p = new THREE.Vector3((a - 2) * 0.8, (b - 2) * 0.8, (c - 2) * 0.8);
      home.push(p.clone());
      pos.push(p.clone());
      vel.push(new THREE.Vector3());
    }

const state = { temp: 0.15, running: true };
const dummy = new THREE.Object3D();

function stateName(T) {
  if (T < 0.34) return { name: "Solid", note: "Particles are locked in a lattice, only vibrating in place." };
  if (T < 0.7) return { name: "Liquid", note: "Particles slip past each other but stay loosely together." };
  return { name: "Gas", note: "Particles fly freely and fill the whole container." };
}

const els = {};

export default {
  id: "states",
  name: "States of matter",
  tag: "Chemistry · Particles",
  subject: "Chemistry",
  grades: [5, 9],
  blurb: "Heat the box — solid, liquid, gas.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="7" width="26" height="26" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="14" r="2" fill="currentColor"/><circle cx="21" cy="15" r="2" fill="currentColor"/><circle cx="27" cy="13" r="2" fill="currentColor"/><circle cx="15" cy="24" r="2" fill="currentColor"/><circle cx="24" cy="26" r="2" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0.7, phi: 1.1, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>The same particles make up a solid, a liquid and a gas — what changes is how much
    <strong>energy</strong> they have. Heat adds energy; the particles move faster and push apart.</p>
    <p>In a <em>solid</em> they only jiggle in a fixed lattice. In a <em>liquid</em> they have enough
    energy to slide past each other but still stick together. In a <em>gas</em> they have so much
    energy they break free entirely and spread out to fill the space.</p>
  `,

  quiz: [
    { q: "Adding heat to a substance mainly increases the particles'…", choices: ["number", "energy of motion", "colour", "electric charge"], answer: 1, explain: "Temperature is a measure of average particle kinetic energy." },
    { q: "In which state do particles keep a fixed shape and a fixed volume?", choices: ["solid", "liquid", "gas", "none"], answer: 0, explain: "A solid's particles are locked in place." },
    { q: "A gas expands to fill its container because its particles…", choices: ["are larger", "have almost no forces holding them together", "are electrically charged", "are heavier"], answer: 1, explain: "With enough energy the particles overcome the forces between them and move freely." },
  ],

  presets: [
    { label: "Ice (solid)", note: "Cold: the lattice holds, particles only vibrate.", values: { "st-temp": 0.12 } },
    { label: "Water (liquid)", note: "Warmer: the lattice breaks but particles stay clustered.", values: { "st-temp": 0.5 } },
    { label: "Steam (gas)", note: "Hot: particles fly apart and fill the box.", values: { "st-temp": 0.95 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="st-name">Solid</span></div>
      <div class="control"><div class="row"><label for="st-temp">Temperature</label><output id="st-tempval" for="st-temp"></output></div>
        <input type="range" id="st-temp" min="0.05" max="1" step="0.01" value="${state.temp}"></div>
      <p class="fact" id="st-note">Particles are locked in a lattice, only vibrating in place.</p>
      <div class="btn-row"><button class="btn primary" id="st-toggle" type="button">Pause</button></div>
    `;
  },

  wire(root) {
    els.temp = root.querySelector("#st-temp");
    els.tempval = root.querySelector("#st-tempval");
    els.name = root.querySelector("#st-name");
    els.note = root.querySelector("#st-note");
    els.toggle = root.querySelector("#st-toggle");

    const sync = () => {
      const s = stateName(state.temp);
      els.tempval.textContent = `${Math.round(state.temp * 100)}%`;
      els.name.textContent = s.name;
      els.note.textContent = s.note;
    };
    els.temp.addEventListener("input", () => {
      state.temp = parseFloat(els.temp.value);
      sync();
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    sync();
  },

  update(dt) {
    if (!state.running) return;
    const h = Math.min(dt, 0.04);
    const T = state.temp;
    const bound = half - 0.2;
    for (let k = 0; k < N; k++) {
      const p = pos[k];
      const v = vel[k];
      if (T < 0.34) {
        // solid: spring back to lattice site + jitter
        const spring = home[k].clone().sub(p).multiplyScalar(18);
        v.add(spring.multiplyScalar(h));
        v.multiplyScalar(0.86);
        v.x += (Math.random() - 0.5) * T * 3 * h;
        v.y += (Math.random() - 0.5) * T * 3 * h;
        v.z += (Math.random() - 0.5) * T * 3 * h;
      } else {
        const pull = T < 0.7 ? p.clone().multiplyScalar(-0.6) : new THREE.Vector3();
        v.add(pull.multiplyScalar(h));
        v.x += (Math.random() - 0.5) * T * 9 * h;
        v.y += (Math.random() - 0.5) * T * 9 * h;
        v.z += (Math.random() - 0.5) * T * 9 * h;
        v.multiplyScalar(0.985);
      }
      p.addScaledVector(v, h);
      ["x", "y", "z"].forEach((ax) => {
        if (p[ax] > bound) { p[ax] = bound; v[ax] *= -0.8; }
        if (p[ax] < -bound) { p[ax] = -bound; v[ax] *= -0.8; }
      });
      dummy.position.copy(p);
      dummy.updateMatrix();
      mesh.setMatrixAt(k, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  },

  onEnter() {
    pos.forEach((p, k) => {
      p.copy(home[k]);
      vel[k].set(0, 0, 0);
    });
  },
  onExit() {},
};
