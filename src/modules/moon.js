import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.24));
const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
sun.position.set(12, 0, 0);
scene.add(sun);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.8, 36, 28),
  new THREE.MeshStandardMaterial({ color: 0x3f7fd9, roughness: 0.8 })
);
scene.add(earth);

const ORBIT = 3.2;
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.28, 28, 22),
  new THREE.MeshStandardMaterial({ color: 0xccccc4, roughness: 0.95 })
);
scene.add(moon);

const orbitLine = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 97 }, (_, j) => {
      const t = (j / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * ORBIT, 0, Math.sin(t) * ORBIT);
    })
  ),
  new THREE.LineBasicMaterial({ color: 0x555550, transparent: true, opacity: 0.4 })
);
scene.add(orbitLine);

const sunMark = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 20, 16),
  new THREE.MeshBasicMaterial({ color: 0xffd27a })
);
sunMark.position.set(6.5, 0, 0);
scene.add(sunMark);
scene.add(
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(6, 0, 0), new THREE.Vector3(4.2, 0, 0)]),
    new THREE.LineBasicMaterial({ color: 0xffd27a })
  )
);

const state = { angle: 0.6, running: true, speed: 1 };

const PHASES = [
  [0, "New moon", "The lit side faces away from Earth — the Moon is nearly invisible."],
  [45, "Waxing crescent", "A sliver of the lit side comes into view on the right."],
  [90, "First quarter", "Half lit, half dark — one week after new moon."],
  [135, "Waxing gibbous", "More than half lit and still growing."],
  [180, "Full moon", "Earth sits between Sun and Moon; we see the whole lit face."],
  [225, "Waning gibbous", "Past full, the lit fraction is shrinking."],
  [270, "Last quarter", "Half lit again, but the opposite half from first quarter."],
  [315, "Waning crescent", "A thin sliver on the left, just before the next new moon."],
];

function phaseFor(deg) {
  const d = ((deg % 360) + 360) % 360;
  let best = PHASES[0];
  let bestDist = 999;
  for (const p of PHASES) {
    const dist = Math.min(Math.abs(d - p[0]), 360 - Math.abs(d - p[0]));
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  return best;
}

const els = {};

export default {
  id: "moon",
  name: "Moon phases",
  tag: "Astronomy · The sky",
  subject: "Astronomy",
  grades: [5, 8],
  blurb: "Orbit the Moon and see why it changes shape.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="2"/><path d="M20 7a13 13 0 0 1 0 26 9 9 0 0 0 0-26Z" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 13, theta: 0.8, phi: 0.6, minRadius: 4, maxRadius: 18 },

  lesson: `
    <p>The Moon doesn't make light — the Sun lights up one half of it, always. As the Moon orbits
    Earth (about once a month), we see that lit half from a changing angle.</p>
    <p>When the Moon is between us and the Sun, its lit side points away and we get a <strong>new
    moon</strong>. When Earth is in the middle, the whole lit face turns toward us — a
    <strong>full moon</strong>. In between we catch it side-on: crescents and quarters.</p>
  `,

  quiz: [
    { q: "Why does the Moon appear to change shape?", choices: ["Earth's shadow falls on it", "It really changes size", "We see its sunlit half from different angles", "Clouds cover part of it"], answer: 2, explain: "The Moon is always half-lit; our viewing angle changes as it orbits." },
    { q: "A full moon happens when…", choices: ["the Moon is between Earth and Sun", "Earth is between the Moon and Sun", "the Moon is in Earth's shadow", "the Sun is behind the Moon"], answer: 1, explain: "With Earth in the middle, the Moon's whole lit face points at us." },
    { q: "Roughly how long is one full cycle of phases?", choices: ["one day", "one week", "one month", "one year"], answer: 2, explain: "About 29.5 days — the origin of the word 'month'." },
  ],

  presets: [
    { label: "New moon", note: "Moon between Earth and Sun — lit side away from us.", values: { "mn-angle": 0 } },
    { label: "First quarter", note: "Quarter of the way round; we see half the lit face.", values: { "mn-angle": 90 } },
    { label: "Full moon", note: "Earth in the middle — the entire lit face is turned toward us.", values: { "mn-angle": 180 } },
    { label: "Last quarter", note: "Three-quarters round; the other half is lit now.", values: { "mn-angle": 270 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="mn-name">First quarter</span></div>
      <p class="fact" id="mn-desc">Half lit, half dark.</p>
      <div class="control"><div class="row"><label for="mn-angle">Position in orbit</label><output id="mn-angleval" for="mn-angle"></output></div>
        <input type="range" id="mn-angle" min="0" max="360" step="1" value="${Math.round((state.angle * 180) / Math.PI)}"></div>
      <div class="btn-row"><button class="btn primary" id="mn-toggle" type="button">Pause</button></div>
    `;
  },

  wire(root) {
    els.angle = root.querySelector("#mn-angle");
    els.angleval = root.querySelector("#mn-angleval");
    els.name = root.querySelector("#mn-name");
    els.desc = root.querySelector("#mn-desc");
    els.toggle = root.querySelector("#mn-toggle");

    const sync = () => {
      const deg = parseFloat(els.angle.value);
      els.angleval.textContent = `${Math.round(deg)}°`;
      const p = phaseFor(deg);
      els.name.textContent = p[1];
      els.desc.textContent = p[2];
    };
    els.angle.addEventListener("input", () => {
      state.angle = (parseFloat(els.angle.value) * Math.PI) / 180;
      sync();
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    sync();
  },

  update(dt) {
    if (state.running) {
      state.angle += dt * 0.35 * state.speed;
      if (els.angle) {
        const deg = Math.round(((state.angle * 180) / Math.PI) % 360);
        els.angle.value = String((deg + 360) % 360);
        els.angleval.textContent = `${(deg + 360) % 360}°`;
        const p = phaseFor(deg);
        els.name.textContent = p[1];
        els.desc.textContent = p[2];
      }
    }
    moon.position.set(Math.cos(state.angle) * ORBIT, 0, Math.sin(state.angle) * ORBIT);
    earth.rotation.y += dt * 0.3;
  },

  onEnter() {},
  onExit() {},
};
