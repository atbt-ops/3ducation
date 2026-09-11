import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const glow = new THREE.PointLight(0xfff2d0, 2.6, 60);
scene.add(glow);

const A = 3.4; // semi-major axis — fixed; only eccentricity is adjustable

function orbitRadius(e, theta) {
  return (A * (1 - e * e)) / (1 + e * Math.cos(theta));
}

const star = new THREE.Mesh(new THREE.SphereGeometry(0.42, 26, 20), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
scene.add(star); // sits at the focus — the origin — not the ellipse's centre

const planet = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 22, 16),
  new THREE.MeshStandardMaterial({ color: 0x3f7fd9, roughness: 0.7 })
);
scene.add(planet);

let orbitLine = null;
let wedgeA = null; // near perihelion — small angle, but same swept area as wedgeB
let wedgeB = null; // near aphelion — larger angle, same swept area

function buildOrbitLine(e) {
  const pts = Array.from({ length: 129 }, (_, j) => {
    const t = (j / 128) * Math.PI * 2;
    const r = orbitRadius(e, t);
    return new THREE.Vector3(r * Math.cos(t), 0, r * Math.sin(t));
  });
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x8a8a80, transparent: true, opacity: 0.45 })
  );
}

function buildWedge(e, thetaCenter, dTheta, color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const th = thetaCenter - dTheta / 2 + (dTheta * i) / N;
    const r = orbitRadius(e, th);
    shape.lineTo(r * Math.cos(th), r * Math.sin(th));
  }
  shape.closePath();
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  return mesh;
}

/** Kepler's 2nd law: the two shaded wedges below sweep equal areas — a fixed small angle
 * at aphelion (far side), and whatever angle at perihelion (near side) makes the area match. */
function rebuildOrbit(e) {
  if (orbitLine) scene.remove(orbitLine);
  if (wedgeA) scene.remove(wedgeA);
  if (wedgeB) scene.remove(wedgeB);

  orbitLine = buildOrbitLine(e);
  scene.add(orbitLine);

  const dThetaAphelion = 0.5; // fixed reference wedge, at theta = PI (farthest point)
  const rAph = orbitRadius(e, Math.PI);
  const rPeri = orbitRadius(e, 0);
  const area = 0.5 * rAph * rAph * dThetaAphelion;
  const dThetaPerihelion = Math.min(Math.PI * 0.9, (2 * area) / (rPeri * rPeri));

  wedgeB = buildWedge(e, Math.PI, dThetaAphelion, 0x0f6b63); // aphelion — teal
  wedgeA = buildWedge(e, 0, dThetaPerihelion, 0xb1520b); // perihelion — brass
  scene.add(wedgeA, wedgeB);
}

const state = { e: 0.5, speed: 1, theta: 0.6 };
rebuildOrbit(state.e);

const els = {};

export default {
  id: "keplerorbit",
  name: "Kepler's orbits",
  tag: "Astronomy · Orbits",
  subject: "Astronomy",
  grades: [9, 12],
  blurb: "Ellipses, a star at the focus, and equal areas in equal times.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="20" rx="15" ry="9" stroke="currentColor" stroke-width="2"/><circle cx="13" cy="20" r="2.6" fill="currentColor"/><circle cx="32" cy="20" r="2" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 11, theta: 0.4, phi: 0.9, minRadius: 5, maxRadius: 20 },

  lesson: `
    <p>Kepler's <strong>first law</strong>: planets don't orbit in perfect circles — they follow
    ellipses, with the star sitting at one <em>focus</em>, off-centre (not at the middle of the
    ellipse). The more eccentric the ellipse, the further off-centre the star sits.</p>
    <p>Kepler's <strong>second law</strong>: a line from the star to the planet sweeps out equal
    areas in equal times. The two shaded wedges below both represent the same amount of "swept
    area" — but the one near the star (perihelion) is a wider angle, because the planet moves
    <strong>faster</strong> when it's close to the star, and <strong>slower</strong> when it's far
    away (aphelion).</p>
  `,

  quiz: [
    { q: "According to Kepler's First Law, a planet's orbit is a(n)…", choices: ["perfect circle centred on the star", "ellipse with the star at one focus", "spiral that slowly shrinks", "straight line back and forth"], answer: 1, explain: "The orbit is an ellipse, and the star sits at one of its two foci — not the centre." },
    { q: "A planet moves fastest when it is…", choices: ["farthest from the star (aphelion)", "closest to the star (perihelion)", "exactly halfway around its orbit", "its speed never changes"], answer: 1, explain: "Gravity pulls hardest at closest approach, speeding the planet up." },
    { q: "Kepler's Second Law says a planet sweeps out…", choices: ["equal angles in equal times", "equal areas in equal times", "equal distances in equal times", "equal speeds at all times"], answer: 1, explain: "That's why it covers more distance (a wider angle) per unit time near the star, and less far away." },
  ],

  presets: [
    { label: "Nearly circular", note: "Low eccentricity — the star sits close to centre.", values: { "kp-e": 0.1 } },
    { label: "Moderately eccentric", note: "Like many real comets and some planets.", values: { "kp-e": 0.5 } },
    { label: "Highly eccentric", note: "A long, stretched-out ellipse.", values: { "kp-e": 0.8 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>eccentricity e</span><b class="mono" id="kp-eval"></b></div>
      <div class="control"><label for="kp-e">Eccentricity</label>
        <input type="range" id="kp-e" min="0" max="0.85" step="0.01" value="${state.e}"></div>
      <div class="control"><div class="row"><label for="kp-speed">Orbit speed</label><output id="kp-speedval" for="kp-speed"></output></div>
        <input type="range" id="kp-speed" min="0.2" max="3" step="0.1" value="${state.speed}"></div>
      <p class="fact">Teal wedge: a fixed reference angle at the far point (aphelion). Brass wedge:
      whatever angle at the near point (perihelion) sweeps out that same area — watch how much
      wider it is.</p>
    `;
  },

  wire(root) {
    els.e = root.querySelector("#kp-e");
    els.eval = root.querySelector("#kp-eval");
    els.speed = root.querySelector("#kp-speed");
    els.speedval = root.querySelector("#kp-speedval");

    els.e.addEventListener("input", () => {
      state.e = parseFloat(els.e.value);
      els.eval.textContent = state.e.toFixed(2);
      rebuildOrbit(state.e);
    });
    els.speed.addEventListener("input", () => {
      state.speed = parseFloat(els.speed.value);
      els.speedval.textContent = `${state.speed.toFixed(1)}×`;
    });
    els.eval.textContent = state.e.toFixed(2);
    els.speedval.textContent = `${state.speed.toFixed(1)}×`;
  },

  update(dt) {
    const r = orbitRadius(state.e, state.theta);
    // Kepler's 2nd law: dTheta/dt is proportional to 1/r^2, so the planet speeds
    // up near the star and slows down far away.
    const K = 5.5;
    state.theta += (dt * state.speed * K) / (r * r);
    planet.position.set(r * Math.cos(state.theta), 0, r * Math.sin(state.theta));
  },

  onEnter() {},
  onExit() {},
};
