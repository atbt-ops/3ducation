import * as THREE from "three";
import { circlePoints } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
scene.add(new THREE.PointLight(0xfff2d0, 1.6, 80));

const PLANETS = [
  { name: "Mercury", color: 0xb7ab98, orbit: 2.4, size: 0.14, period: 0.24, fact: "The fastest planet — one year is just 88 Earth days." },
  { name: "Venus", color: 0xd9b98a, orbit: 3.3, size: 0.22, period: 0.62, fact: "The hottest planet, wrapped in a thick, heat-trapping atmosphere." },
  { name: "Earth", color: 0x3f7fd9, orbit: 4.3, size: 0.24, period: 1.0, fact: "The only known planet with liquid water oceans and life." },
  { name: "Mars", color: 0xc1512f, orbit: 5.4, size: 0.18, period: 1.88, fact: "Home to Olympus Mons, the tallest volcano in the solar system." },
  { name: "Jupiter", color: 0xd3a26a, orbit: 7.2, size: 0.62, period: 11.86, fact: "So massive that about 1,300 Earths could fit inside it." },
  { name: "Saturn", color: 0xe0c98f, orbit: 9.2, size: 0.54, period: 29.46, fact: "Its icy rings span 282,000 km but are only about 10 m thick.", ring: true },
];

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.7, 32, 24),
  new THREE.MeshBasicMaterial({ color: 0xffd27a })
);
scene.add(sun);

const planetMeshes = [];
const pathsGroup = new THREE.Group();
scene.add(pathsGroup);

PLANETS.forEach((p) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.size, 24, 18),
    new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.55, metalness: 0.05 })
  );
  mesh.userData.planet = p;
  p.angle = Math.random() * Math.PI * 2;
  scene.add(mesh);
  planetMeshes.push(mesh);

  const label = createLabel(p.name);
  label.position.set(0, p.size + 0.3, 0);
  mesh.add(label);

  if (p.ring) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(p.size * 1.4, p.size * 2.1, 40),
      new THREE.MeshBasicMaterial({ color: 0xd9c9a0, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    ring.rotation.x = Math.PI / 2.5;
    mesh.add(ring);
  }

  pathsGroup.add(
    new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(circlePoints(p.orbit, 96)),
      new THREE.LineBasicMaterial({ color: 0x6a6250, transparent: true, opacity: 0.35 })
    )
  );
});

let speed = 1;
let running = true;
let showPaths = true;
let selected = null;
const els = {};

function selectPlanet(p) {
  selected = p;
  if (!els.name) return;
  els.name.textContent = p.name;
  els.fact.textContent = p.fact;
  els.period.textContent = `${p.period} Earth yr`;
  els.legend.querySelectorAll(".legend-item").forEach((li) =>
    li.setAttribute("aria-pressed", li.dataset.planet === p.name ? "true" : "false")
  );
}

export default {
  id: "orrery",
  name: "Orrery",
  tag: "Astronomy · Orbits",
  subject: "Astronomy",
  grades: [6, 10],
  video: { id: "zPHnZFoiO0E", title: "Orbital motion (Khan Academy)" },
  blurb: "Watch six planets keep real relative time.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="3.4" fill="currentColor"/><ellipse cx="20" cy="20" rx="15" ry="6.2" stroke="currentColor" stroke-width="1.8"/><circle cx="33" cy="20" r="2" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 15, theta: 0.6, phi: 1.05, minRadius: 4, maxRadius: 28 },

  lesson: `
    <p>The further a planet is from the Sun, the longer its year — and not just a little. Kepler's
    third law says the <em>square</em> of the orbital period grows with the <em>cube</em> of the
    distance: <span class="mono">T² ∝ a³</span>.</p>
    <p>Earth sits at 1 astronomical unit and takes 1 year. Jupiter is about 5 AU out and takes almost
    12. Saturn, near 9.5 AU, takes close to 30. The orbit rings here are drawn to real relative sizes.</p>
  `,

  quiz: [
    {
      q: "Kepler's third law relates a planet's orbital period T and distance a as…",
      choices: ["T ∝ a", "T² ∝ a³", "T³ ∝ a²", "T is the same for all planets"],
      answer: 1,
      explain: "The square of the period grows with the cube of the orbital radius.",
    },
    {
      q: "Mercury's year is only 88 days because it…",
      choices: [
        "spins very fast",
        "is closest to the Sun, on the shortest orbit",
        "is the smallest planet",
        "has no moons",
      ],
      answer: 1,
      explain: "Closest orbit = shortest path and fastest orbital speed.",
    },
    {
      q: "Saturn's rings are about 282,000 km across. Their thickness is roughly…",
      choices: ["10 metres", "10 kilometres", "1,000 kilometres", "the same as their width"],
      answer: 0,
      explain: "Astonishingly thin — on the order of tens of metres.",
    },
  ],

  panelHTML() {
    const rows = PLANETS.map(
      (p) => `
      <button class="legend-item" type="button" data-planet="${p.name}" aria-pressed="false">
        <span class="legend-dot" style="background:#${p.color.toString(16).padStart(6, "0")}"></span>
        <span class="lname">${p.name}</span>
        <span class="lperiod mono">${p.period} yr</span>
      </button>`
    ).join("");
    return `
      <div class="control"><div class="row"><label for="or-speed">Time speed</label><output id="or-speedval" for="or-speed"></output></div>
        <input type="range" id="or-speed" min="0" max="4" step="0.1" value="${speed}"></div>
      <div class="btn-row">
        <button class="btn primary" id="or-toggle" type="button">Pause</button>
        <button class="btn" id="or-paths" type="button" aria-pressed="true">Orbit paths: on</button>
      </div>
      <div class="section-label">Planets</div>
      <div class="legend" id="or-legend" role="group" aria-label="Planets">${rows}</div>
      <div class="formula"><span id="or-name">Select a planet</span><b class="mono" id="or-period">—</b></div>
      <p class="fact" id="or-fact">Click any planet in the view, or a name above, to read its stats.</p>
    `;
  },

  wire(root) {
    els.speed = root.querySelector("#or-speed");
    els.speedval = root.querySelector("#or-speedval");
    els.toggle = root.querySelector("#or-toggle");
    els.paths = root.querySelector("#or-paths");
    els.legend = root.querySelector("#or-legend");
    els.name = root.querySelector("#or-name");
    els.period = root.querySelector("#or-period");
    els.fact = root.querySelector("#or-fact");

    const syncSpeed = () => (els.speedval.textContent = `${parseFloat(els.speed.value).toFixed(1)}×`);
    els.speed.addEventListener("input", () => {
      speed = parseFloat(els.speed.value);
      syncSpeed();
    });
    syncSpeed();

    els.toggle.addEventListener("click", () => {
      running = !running;
      els.toggle.textContent = running ? "Pause" : "Play";
    });
    els.paths.addEventListener("click", () => {
      showPaths = !showPaths;
      pathsGroup.visible = showPaths;
      els.paths.textContent = `Orbit paths: ${showPaths ? "on" : "off"}`;
      els.paths.setAttribute("aria-pressed", String(showPaths));
    });
    els.legend.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-planet]");
      if (!btn) return;
      const p = PLANETS.find((pl) => pl.name === btn.dataset.planet);
      if (p) selectPlanet(p);
    });
  },

  update(dt) {
    if (running) {
      planetMeshes.forEach((mesh) => {
        const p = mesh.userData.planet;
        p.angle += dt * speed * (0.4 / p.period);
        mesh.position.set(p.orbit * Math.cos(p.angle), 0, p.orbit * Math.sin(p.angle));
        mesh.rotation.y += dt * 1.2;
      });
    }
    if (selected) {
      const m = planetMeshes.find((mm) => mm.userData.planet === selected);
      if (m) this._viewer?.wantTarget.copy(m.position);
    }
    sun.rotation.y += dt * 0.1;
  },

  onEnter(viewer) {
    this._viewer = viewer;
    selected = null;
    viewer.onPick = (x, y) => {
      const hits = viewer.pick(x, y, planetMeshes);
      if (hits.length) selectPlanet(hits[0].object.userData.planet);
    };
  },
  onExit(viewer) {
    selected = null;
    if (viewer) viewer.onPick = null;
  },
};
