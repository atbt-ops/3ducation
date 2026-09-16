import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const TUBE_BOTTOM = -2.6;
const TUBE_TOP = 2.6;
const RANGES = {
  lab: {
    min: -10,
    max: 110,
    marks: [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],
    labeled: [-10, 0, 20, 40, 60, 80, 100, 110],
  },
  clinical: {
    min: 35,
    max: 42,
    marks: [35, 36, 37, 38, 39, 40, 41, 42],
    labeled: [35, 36, 37, 38, 39, 40, 41, 42],
  },
};

// Glass tube and bulb.
const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, TUBE_TOP - TUBE_BOTTOM, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8f0ee, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
tube.position.y = (TUBE_TOP + TUBE_BOTTOM) / 2;
group.add(tube);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), new THREE.MeshStandardMaterial({ color: 0xe8f0ee, transparent: true, opacity: 0.35 }));
bulb.position.y = TUBE_BOTTOM;
group.add(bulb);

// Liquid column, height set by refresh().
const liquidMat = new THREE.MeshBasicMaterial({ color: 0xc23b2b });
const liquidBulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), liquidMat);
liquidBulb.position.y = TUBE_BOTTOM;
group.add(liquidBulb);
const liquidCol = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 12), liquidMat);
group.add(liquidCol);

const tickGroup = new THREE.Group();
group.add(tickGroup);
const iceMarker = createLabel("0°C ice point", { fontSize: 20, scale: 0.45 });
group.add(iceMarker);
const boilMarker = createLabel("100°C boiling point", { fontSize: 20, scale: 0.45 });
group.add(boilMarker);

function yFor(range, temp) {
  const f = (temp - range.min) / (range.max - range.min);
  return TUBE_BOTTOM + f * (TUBE_TOP - TUBE_BOTTOM);
}

function buildTicks(kind) {
  tickGroup.clear();
  const range = RANGES[kind];
  range.marks.forEach((m) => {
    const y = yFor(range, m);
    const isFixed = m === 0 || m === 100;
    const labeled = range.labeled.includes(m);
    const tick = new THREE.Mesh(new THREE.BoxGeometry(labeled ? 0.3 : 0.16, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: isFixed ? 0x2c6e6b : 0x8a8a86 }));
    tick.position.set(0.3, y, 0);
    tickGroup.add(tick);
    if (labeled) {
      const label = createLabel(String(m), { fontSize: 24 });
      label.position.set(0.95, y, 0);
      tickGroup.add(label);
    }
  });
  iceMarker.visible = kind === "lab";
  boilMarker.visible = kind === "lab";
  if (kind === "lab") {
    iceMarker.position.set(-1.1, yFor(range, 0), 0);
    boilMarker.position.set(-1.3, yFor(range, 100), 0);
  }
}

const state = { temp: 25, kind: "lab" };
const els = {};

function refresh() {
  const range = RANGES[state.kind];
  const clamped = THREE.MathUtils.clamp(state.temp, range.min, range.max);
  const topY = yFor(range, clamped);
  const h = Math.max(0.02, topY - TUBE_BOTTOM);
  liquidCol.scale.y = h;
  liquidCol.position.y = TUBE_BOTTOM + h / 2;

  const f = (state.temp * 9) / 5 + 32;
  if (els.c) els.c.textContent = `${state.temp}°C`;
  if (els.f) els.f.textContent = `${f.toFixed(1)}°F`;
}

export default {
  id: "thermometer",
  name: "Thermometer",
  tag: "Physics · Heat",
  subject: "Physics",
  grades: [5, 9],
  flat: true,
  blurb: "Watch the liquid rise and fall — and see how Celsius and Fahrenheit relate.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="17" y="6" width="6" height="20" rx="3" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="30" r="5" fill="currentColor"/><rect x="18.5" y="16" width="3" height="12" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 7, theta: 0, phi: 1.5708, minRadius: 4, maxRadius: 12 },

  lesson: `
    <p>A thermometer works because liquids <strong>expand</strong> when heated and
    <strong>contract</strong> when cooled. A thin column of liquid (traditionally mercury or
    coloured alcohol) sealed in a narrow glass tube rises and falls with temperature, and a
    printed scale reads off the value. The first thermometer was built by <strong>Galileo</strong>
    around 1593, using air instead of a liquid.</p>
    <p>The Celsius scale is fixed by two reference points: the tube is marked <strong>0°C</strong>
    at the temperature of melting ice, and <strong>100°C</strong> at the temperature steam forms
    from boiling water, with the gap between them divided into 100 equal parts. A
    <strong>clinical thermometer</strong> only needs to cover a narrow band around human body
    temperature — about 35°C to 42°C (95°F to 110°F) — so its scale is stretched out over just
    that range for a more precise reading.</p>
  `,

  quiz: [
    { q: "Who is credited with building the first thermometer, and roughly when?", choices: ["Isaac Newton, 1687", "Galileo, around 1593", "Marie Curie, 1898", "Alexander Fleming, 1928"], answer: 1, explain: "Galileo built an early air-based thermometer around 1593." },
    { q: "What two fixed points calibrate the Celsius scale?", choices: ["Room temperature and body temperature", "The melting point of ice (0°C) and the boiling point of water (100°C)", "Absolute zero and room temperature", "Sunrise and sunset temperatures"], answer: 1, explain: "0°C and 100°C are fixed at ice's melting point and water's boiling point, with 100 equal divisions between." },
    { q: "Why does the liquid column in a thermometer rise when it gets hotter?", choices: ["The liquid evaporates", "The liquid expands as it warms", "The glass tube shrinks", "Air pressure pushes it up"], answer: 1, explain: "Liquids expand when heated, pushing the column higher up the narrow tube." },
    { q: "Why does a clinical thermometer only show a narrow range, like 35°C to 42°C?", choices: ["It is a manufacturing mistake", "It only ever needs to measure temperatures near normal human body temperature", "It cannot be made any longer", "Body temperature is always exactly 42°C"], answer: 1, explain: "Stretching the scale over just the relevant range gives a more precise reading for its one job." },
  ],

  presets: [
    { label: "Ice melting (0°C)", note: "One of the two fixed points used to calibrate the scale.", values: { "th-kind": "lab", "th-temp": 0 } },
    { label: "Water boiling (100°C)", note: "The other fixed point.", values: { "th-kind": "lab", "th-temp": 100 } },
    { label: "Normal body temperature", note: "About 37°C — right in a clinical thermometer's narrow range.", values: { "th-kind": "clinical", "th-temp": 37 } },
    { label: "A fever", note: "39°C is well above normal body temperature.", values: { "th-kind": "clinical", "th-temp": 39 } },
  ],

  panelHTML() {
    return `
      <select id="th-kind" class="text-input" aria-label="Thermometer type">
        <option value="lab">Laboratory thermometer (-10°C to 110°C)</option>
        <option value="clinical">Clinical thermometer (35°C to 42°C)</option>
      </select>
      <div class="control"><div class="row"><label for="th-temp">Temperature</label><output id="th-tempval" for="th-temp"></output></div>
        <input type="range" id="th-temp" min="-10" max="110" step="1" value="${state.temp}"></div>
      <dl class="stat-grid">
        <div><dt>Celsius</dt><dd class="mono" id="th-c">—</dd></div>
        <div><dt>Fahrenheit</dt><dd class="mono" id="th-f">—</dd></div>
      </dl>
    `;
  },

  wire(root) {
    els.kind = root.querySelector("#th-kind");
    els.temp = root.querySelector("#th-temp");
    els.tempval = root.querySelector("#th-tempval");
    els.c = root.querySelector("#th-c");
    els.f = root.querySelector("#th-f");
    const applyRange = () => {
      const r = RANGES[state.kind];
      els.temp.min = r.min;
      els.temp.max = r.max;
      if (state.temp < r.min) state.temp = r.min;
      if (state.temp > r.max) state.temp = r.max;
      els.temp.value = state.temp;
      buildTicks(state.kind);
    };
    const sync = () => {
      els.tempval.textContent = `${state.temp}°C`;
      refresh();
    };
    els.kind.addEventListener("input", () => {
      state.kind = els.kind.value;
      applyRange();
      sync();
    });
    els.temp.addEventListener("input", () => ((state.temp = +els.temp.value), sync()));
    applyRange();
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
