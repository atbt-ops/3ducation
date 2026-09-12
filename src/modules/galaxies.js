import * as THREE from "three";
import { sceneLights, prefersReducedMotion } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.55, dir: 0.5 });
let spin = !prefersReducedMotion;

function pointsFrom(positions, color, size) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: 0.9 });
  return new THREE.Points(geo, mat);
}

const N = 1400;

function spiralPositions() {
  const pos = new Float32Array(N * 3);
  const arms = 3;
  for (let i = 0; i < N; i++) {
    const t = Math.random();
    const arm = i % arms;
    const theta = t * 6.2 + arm * ((Math.PI * 2) / arms) + (Math.random() - 0.5) * 0.35;
    const r = 0.3 + t * 2.3;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const y = (Math.random() - 0.5) * 0.18 * (1 - t * 0.6);
    pos.set([x, y, z], i * 3);
  }
  return pos;
}

function ellipticalPositions() {
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = Math.acos(2 * v - 1);
    const phi = 2 * Math.PI * u;
    const r = 1.9 * Math.cbrt(Math.random());
    const sx = r * Math.sin(theta) * Math.cos(phi) * 1.25;
    const sy = r * Math.sin(theta) * Math.sin(phi) * 0.85;
    const sz = r * Math.cos(theta) * 1.25;
    pos.set([sx, sy, sz], i * 3);
  }
  return pos;
}

function irregularPositions() {
  const pos = new Float32Array(N * 3);
  const clumpCount = 5;
  const centers = Array.from(
    { length: clumpCount },
    () => new THREE.Vector3((Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 2.8)
  );
  for (let i = 0; i < N; i++) {
    const c = centers[i % clumpCount];
    pos.set(
      [c.x + (Math.random() - 0.5) * 1.2, c.y + (Math.random() - 0.5) * 0.7, c.z + (Math.random() - 0.5) * 1.2],
      i * 3
    );
  }
  return pos;
}

const GALAXIES = {
  spiral: {
    label: "Spiral",
    points: pointsFrom(spiralPositions(), 0x2f5fd0, 0.08),
    fact: "Flat rotating disk with defined arms — young, blue, hot stars form along the arms where gas is densest.",
  },
  elliptical: {
    label: "Elliptical",
    points: pointsFrom(ellipticalPositions(), 0xc9791f, 0.08),
    fact: "A smooth, football-shaped glow of mostly old, red-yellow stars — little gas or dust left to form new ones.",
  },
  irregular: {
    label: "Irregular",
    points: pointsFrom(irregularPositions(), 0x2f9e8a, 0.08),
    fact: "No defined shape at all — often the result of a smaller galaxy being disrupted by a close pass or collision.",
  },
};
const order = ["spiral", "elliptical", "irregular"];
Object.values(GALAXIES).forEach((g) => scene.add(g.points));

const core = new THREE.Mesh(
  new THREE.SphereGeometry(0.32, 20, 16),
  new THREE.MeshBasicMaterial({ color: 0xf2b23a })
);
scene.add(core);

let current = "spiral";
function showType(key) {
  current = key;
  order.forEach((k) => (GALAXIES[k].points.visible = k === key));
}
showType(current);

const els = {};

export default {
  id: "galaxies",
  name: "Galaxy types",
  tag: "Astronomy · Galaxies",
  subject: "Astronomy",
  grades: [9, 12],
  blurb: "Spiral, elliptical, irregular — the three shapes galaxies come in.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="3" fill="currentColor"/><path d="M20 20C24 14 32 14 34 18C28 16 23 18 20 20Z" fill="currentColor" opacity="0.7"/><path d="M20 20C16 26 8 26 6 22C12 24 17 22 20 20Z" fill="currentColor" opacity="0.7"/><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1 3"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 6, theta: 0.5, phi: 1.1, minRadius: 2.5, maxRadius: 14 },

  lesson: `
    <p>Galaxies — islands of billions of stars — come in a few recognisable shapes, first sorted into
    this scheme by Edwin Hubble. A <strong>spiral</strong> galaxy (like our own Milky Way) is a flat,
    rotating disk with arms where new stars are actively forming. An <strong>elliptical</strong> galaxy
    is a smooth, egg-shaped swarm of mostly old stars, with little gas left to make new ones.</p>
    <p>An <strong>irregular</strong> galaxy has no defined shape at all — usually because gravity from a
    close encounter with another galaxy has pulled it out of shape.</p>
  `,

  quiz: [
    { q: "Our own Milky Way is classified as a…", choices: ["Spiral galaxy", "Elliptical galaxy", "Irregular galaxy", "None of these"], answer: 0, explain: "The Milky Way is a barred spiral galaxy with a flat, rotating disk of arms." },
    { q: "New, hot, blue stars are actively forming mainly in…", choices: ["Elliptical galaxies", "Spiral arms", "The empty space between galaxies", "Only irregular galaxies"], answer: 1, explain: "Spiral arms are where gas and dust are densest, so that's where most new star formation happens." },
    { q: "An irregular galaxy's shapeless form is usually caused by…", choices: ["It being too young to form a shape", "Gravitational disruption from another galaxy", "A lack of a central black hole", "It spinning too fast"], answer: 1, explain: "A close pass or collision with another galaxy's gravity can pull a galaxy out of any regular shape." },
  ],

  presets: [
    { label: "Spiral", note: "A flat disk with arms — active star formation, like the Milky Way.", values: { "gx-type": "spiral" } },
    { label: "Elliptical", note: "A smooth, old, gas-poor swarm of stars.", values: { "gx-type": "elliptical" } },
    { label: "Irregular", note: "No defined shape — likely disrupted by another galaxy's gravity.", values: { "gx-type": "irregular" } },
  ],

  panelHTML() {
    const opts = order.map((k) => `<option value="${k}" ${k === current ? "selected" : ""}>${GALAXIES[k].label}</option>`).join("");
    return `
      <select id="gx-type" class="text-input" aria-label="Galaxy type">${opts}</select>
      <div class="formula"><span id="gx-name">${GALAXIES[current].label}</span></div>
      <p class="fact" id="gx-fact">${GALAXIES[current].fact}</p>
      <div class="btn-row"><button class="btn" id="gx-spin" type="button" aria-pressed="${spin}">Spin: ${spin ? "on" : "off"}</button></div>
    `;
  },

  wire(root) {
    els.type = root.querySelector("#gx-type");
    els.name = root.querySelector("#gx-name");
    els.fact = root.querySelector("#gx-fact");
    els.spin = root.querySelector("#gx-spin");

    els.type.addEventListener("input", () => {
      showType(els.type.value);
      els.name.textContent = GALAXIES[current].label;
      els.fact.textContent = GALAXIES[current].fact;
    });
    els.spin.addEventListener("click", () => {
      spin = !spin;
      els.spin.textContent = `Spin: ${spin ? "on" : "off"}`;
      els.spin.setAttribute("aria-pressed", String(spin));
    });
  },

  update(dt, viewer) {
    if (spin && !viewer.dragging) GALAXIES[current].points.rotation.y += dt * 0.15;
  },

  onEnter() {},
  onExit() {},
};
