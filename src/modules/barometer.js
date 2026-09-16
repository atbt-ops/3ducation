import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const CM_TO_UNIT = 0.045;
const RES_Y = -1.2;

// Reservoir dish of mercury.
const reservoir = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.1, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0xb5b5b0, roughness: 0.25, metalness: 0.7 }));
reservoir.position.y = RES_Y;
group.add(reservoir);
const dishRim = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0xdfe8e6, transparent: true, opacity: 0.4 }));
dishRim.position.y = RES_Y + 0.28;
group.add(dishRim);

// Glass tube, inverted, standing in the reservoir.
const TUBE_BOTTOM = RES_Y + 0.3;
const TUBE_HEIGHT = 5.2;
const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, TUBE_HEIGHT, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8f0ee, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
tube.position.y = TUBE_BOTTOM + TUBE_HEIGHT / 2;
group.add(tube);
const tubeCap = new THREE.Mesh(new THREE.CircleGeometry(0.14, 20), new THREE.MeshStandardMaterial({ color: 0xe8f0ee, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
tubeCap.position.y = TUBE_BOTTOM + TUBE_HEIGHT;
tubeCap.rotation.x = -Math.PI / 2;
group.add(tubeCap);

const vacuumLabel = createLabel("Vacuum", { fontSize: 22 });
group.add(vacuumLabel);

// Mercury column inside the tube.
const mercuryMat = new THREE.MeshBasicMaterial({ color: 0xb5b5b0 });
const mercuryCol = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1, 16), mercuryMat);
group.add(mercuryCol);

const scaleGroup = new THREE.Group();
group.add(scaleGroup);
for (let cm = 0; cm <= 90; cm += 10) {
  const y = TUBE_BOTTOM + cm * CM_TO_UNIT;
  const isBase = cm === 76;
  const tick = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: isBase ? 0x2c6e6b : 0x8a8a86 }));
  tick.position.set(0.5, y, 0);
  scaleGroup.add(tick);
  const label = createLabel(`${cm}`, { fontSize: 20 });
  label.position.set(0.95, y, 0);
  scaleGroup.add(label);
}

const MERCURY_DENSITY = 13.6; // relative to water
const state = { pressure: 1.0 };
const els = {};

function refresh() {
  const heightCm = 76 * state.pressure;
  const worldH = heightCm * CM_TO_UNIT;
  mercuryCol.scale.y = worldH;
  mercuryCol.position.y = TUBE_BOTTOM + worldH / 2;
  vacuumLabel.position.set(-0.9, TUBE_BOTTOM + worldH + (TUBE_HEIGHT - worldH) / 2, 0);

  const waterEquivM = (heightCm * MERCURY_DENSITY) / 100;
  if (els.h) els.h.textContent = `${heightCm.toFixed(1)} cm`;
  if (els.water) els.water.textContent = `${waterEquivM.toFixed(1)} m`;
}
refresh();

export default {
  id: "barometer",
  name: "Mercury barometer",
  tag: "Physics · Pressure",
  subject: "Physics",
  grades: [8, 11],
  flat: true,
  blurb: "Watch a mercury column rise and fall as atmospheric pressure changes.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="17" y="4" width="6" height="24" rx="2" stroke="currentColor" stroke-width="2"/><rect x="18.5" y="18" width="3" height="9" fill="currentColor"/><ellipse cx="20" cy="32" rx="11" ry="4" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0.5, 0], radius: 8.5, theta: 0, phi: 1.4, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>The air around us presses down with real weight — <strong>atmospheric pressure</strong>.
    <strong>Torricelli</strong> built the first way to measure it: fill a long glass tube with
    mercury, seal one end, and invert it into an open dish of mercury. The atmosphere pushes down
    on the mercury in the dish, holding a column up inside the sealed tube — with a genuine
    <strong>vacuum</strong> in the empty space above it.</p>
    <p>At normal atmospheric pressure, that column settles at almost exactly
    <strong>76 cm</strong> — a value so standard it's called "one atmosphere" (1 atm). Mercury is
    used rather than water because it is far denser: a water barometer would need a column over
    <strong>10 metres</strong> tall to balance the same atmospheric pressure, since a shorter,
    lighter column of water can't push back with the same force as mercury's much greater weight
    per unit volume.</p>
  `,

  quiz: [
    { q: "Who built the first mercury barometer?", choices: ["Isaac Newton", "Torricelli", "Galileo", "Archimedes"], answer: 1, explain: "Torricelli invented the mercury barometer to measure atmospheric pressure." },
    { q: "At normal atmospheric pressure, how tall is the mercury column?", choices: ["7.6 cm", "76 cm", "760 cm", "7.6 m"], answer: 1, explain: "76 cm of mercury defines 'one atmosphere' (1 atm) of pressure." },
    { q: "What fills the space above the mercury column inside the sealed tube?", choices: ["Compressed air", "Water vapour", "A vacuum", "Nitrogen gas"], answer: 2, explain: "The space above the mercury is essentially a vacuum." },
    { q: "Why is mercury used instead of water in a barometer?", choices: ["Mercury is cheaper", "Mercury is far denser, so a much shorter column can balance atmospheric pressure", "Water evaporates too quickly to see", "Mercury is a gas at room temperature"], answer: 1, explain: "Because mercury is about 13.6 times denser than water, its column only needs to be about 1/13.6th as tall." },
  ],

  presets: [
    { label: "Normal (1 atm)", note: "The standard 76 cm column.", values: { "br-pressure": 1.0 } },
    { label: "Low pressure (storm)", note: "Falling pressure — the column drops.", values: { "br-pressure": 0.9 } },
    { label: "High pressure", note: "Rising pressure pushes the column higher.", values: { "br-pressure": 1.1 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>Mercury column</span><b class="mono" id="br-h">—</b></div>
      <div class="control"><div class="row"><label for="br-pressure">Atmospheric pressure</label><output id="br-pressureval" for="br-pressure"></output></div>
        <input type="range" id="br-pressure" min="0.8" max="1.2" step="0.01" value="${state.pressure}"></div>
      <dl class="stat-grid">
        <div><dt>Equivalent water column</dt><dd class="mono" id="br-water">—</dd></div>
      </dl>
      <p class="fact">Water is only about 1/13.6th as dense as mercury, so it needs a much taller column.</p>
    `;
  },

  wire(root) {
    els.pressure = root.querySelector("#br-pressure");
    els.pressureval = root.querySelector("#br-pressureval");
    els.h = root.querySelector("#br-h");
    els.water = root.querySelector("#br-water");
    const sync = () => {
      els.pressureval.textContent = `${state.pressure.toFixed(2)} atm`;
      refresh();
    };
    els.pressure.addEventListener("input", () => ((state.pressure = +els.pressure.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
