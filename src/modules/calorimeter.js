import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);
scene.add(contactShadow({ radius: 1.4, y: -1.08 }));

const COLD = new THREE.Color(0x3a6fd6);
const HOT = new THREE.Color(0xc23b2b);

function tempColor(t) {
  const f = THREE.MathUtils.clamp((t - 10) / 90, 0, 1);
  return new THREE.Color().copy(COLD).lerp(HOT, f);
}

// The calorimeter — an insulated metal cup holding water, with a stirrer and thermometer.
// Drawn as a cutaway (semi-transparent) so the water level and colour stay visible.
const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.2, 2.0, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xb9bfc6, metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
cup.position.y = 0;
group.add(cup);
const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0xb9bfc6, metalness: 0.6, roughness: 0.3 }));
cupBase.position.y = -1.0;
group.add(cupBase);

const waterMat = new THREE.MeshBasicMaterial({ color: 0x3a6fd6 });
const water = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 1.3, 32), waterMat);
water.position.y = -0.3;
group.add(water);

const stirrer = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 8), new THREE.MeshStandardMaterial({ color: 0x8a8a86, metalness: 0.5 }));
stirrer.position.set(0.7, 0.4, 0);
group.add(stirrer);

const thermometerStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 12), new THREE.MeshStandardMaterial({ color: 0xe8f0ee, transparent: true, opacity: 0.4 }));
thermometerStem.position.set(-0.6, 0.5, 0);
group.add(thermometerStem);
const tempLabel = createLabel("—", { fontSize: 26 });
tempLabel.position.set(-0.6, 1.9, 0);
group.add(tempLabel);

const cupLabel = createLabel("Calorimeter", { fontSize: 22 });
cupLabel.position.set(1.9, -0.3, 0);
group.add(cupLabel);

// The hot solid, dropped in on "Mix".
const solidMat = new THREE.MeshStandardMaterial({ color: 0xc23b2b, roughness: 0.5, metalness: 0.3 });
const solid = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), solidMat);
group.add(solid);
const solidLabel = createLabel("Hot solid", { fontSize: 22 });
group.add(solidLabel);

const MATERIALS = {
  lead: { name: "Lead", s: 0.031 },
  copper: { name: "Copper", s: 0.095 },
  iron: { name: "Iron", s: 0.115 },
  aluminium: { name: "Aluminium", s: 0.215 },
};
const S_WATER = 1.0;

const state = {
  massWater: 200,
  tempWater: 25,
  massSolid: 100,
  tempSolid: 90,
  material: "lead",
  phase: "before", // before | mixed
  t: 0,
};
const els = {};

function equilibrium() {
  const sSolid = MATERIALS[state.material].s;
  const num = state.massWater * S_WATER * state.tempWater + state.massSolid * sSolid * state.tempSolid;
  const den = state.massWater * S_WATER + state.massSolid * sSolid;
  return num / den;
}

function refresh() {
  const tFinal = equilibrium();
  const showTemp = state.phase === "mixed" ? tFinal : state.tempWater;
  water.material.color.copy(tempColor(showTemp));
  tempLabel.position.y = 1.9;

  const solidY = state.phase === "mixed" ? -0.5 : 2.1;
  solid.position.set(0.15, solidY, 0.3);
  solid.material.color.copy(tempColor(state.phase === "mixed" ? tFinal : state.tempSolid));
  solidLabel.position.set(0.15, solidY + 0.7, 0);
  solidLabel.visible = state.phase !== "mixed";

  if (els.tempreadout) els.tempreadout.textContent = `${showTemp.toFixed(1)}°C`;
  if (els.final) els.final.textContent = `${tFinal.toFixed(1)}°C`;
}
refresh();

export default {
  id: "calorimeter",
  name: "Calorimeter",
  tag: "Physics · Heat",
  subject: "Physics",
  grades: [8, 11],
  blurb: "Drop a hot solid into water and predict the equilibrium temperature.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 8v22a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V8" stroke="currentColor" stroke-width="2"/><path d="M9 8h22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="22" r="4" fill="currentColor"/></svg>',
  scene,
  view: { target: [0.3, 0, 0], radius: 8, theta: 0.3, phi: 1.3, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>The <strong>specific heat</strong> of a substance is the amount of heat needed to raise the
    temperature of a unit mass of it by one degree. Water's specific heat is unusually high — that's
    why it takes so long to heat up or cool down, and why it keeps things like a watermelon cool for
    hours after it comes out of a fridge.</p>
    <p>A <strong>calorimeter</strong> is an insulated container used to measure specific heat
    experimentally. Drop a hot solid of known mass and temperature into a known mass of cooler
    water, and — since (ignoring small losses) heat lost by the solid equals heat gained by the
    water — the mixture settles at one shared final temperature. Knowing every other quantity lets
    you calculate the one you don't: the solid's specific heat.</p>
  `,

  quiz: [
    { q: "What does 'specific heat' measure?", choices: ["How hot an object can get", "The heat needed to raise a unit mass of a substance by one degree", "The total heat energy in an object", "The melting point of a substance"], answer: 1, explain: "Specific heat is a per-unit-mass, per-degree property of a material." },
    { q: "In the calorimeter experiment, heat lost by the hot solid equals…", choices: ["Nothing — heat just disappears", "Heat gained by the water (and calorimeter)", "Twice the heat gained by the water", "Heat lost by the room"], answer: 1, explain: "Ignoring losses, energy is conserved: heat lost by the solid transfers into the water and calorimeter." },
    { q: "Why does water help keep a watermelon cool for a long time after it leaves the fridge?", choices: ["Watermelon repels heat", "Water's high specific heat means its temperature changes slowly", "Watermelons have no water in them", "Cold air is trapped inside"], answer: 1, explain: "A high specific heat means water absorbs a lot of heat while warming only a little." },
    { q: "Two identical-mass metal balls at the same hot temperature are dropped into identical cups of water. The one with LOWER specific heat will make the water…", choices: ["warm up more", "warm up less", "boil instantly", "cool down"], answer: 1, explain: "Lower specific heat means the solid stores less heat energy per degree, so it has less heat to give up." },
  ],

  presets: [
    { label: "Lead shot into water", note: "Lead has a very low specific heat, so it barely warms the water.", values: { "cm-material": "lead", "cm-massSolid": 100, "cm-tempSolid": 90, "cm-massWater": 200, "cm-tempWater": 25 } },
    { label: "Aluminium into water", note: "Aluminium's higher specific heat means it releases more heat.", values: { "cm-material": "aluminium", "cm-massSolid": 100, "cm-tempSolid": 90, "cm-massWater": 200, "cm-tempWater": 25 } },
    { label: "Small solid, lots of water", note: "A large water mass barely changes temperature at all.", values: { "cm-material": "copper", "cm-massSolid": 50, "cm-tempSolid": 90, "cm-massWater": 500, "cm-tempWater": 25 } },
  ],

  panelHTML() {
    return `
      <select id="cm-material" class="text-input" aria-label="Solid material">
        ${Object.entries(MATERIALS).map(([k, v]) => `<option value="${k}">${v.name} (s = ${v.s} cal/g°C)</option>`).join("")}
      </select>
      <div class="control"><div class="row"><label for="cm-massWater">Water mass (g)</label><output id="cm-massWaterval" for="cm-massWater"></output></div>
        <input type="range" id="cm-massWater" min="50" max="500" step="10" value="${state.massWater}"></div>
      <div class="control"><div class="row"><label for="cm-tempWater">Water temperature (°C)</label><output id="cm-tempWaterval" for="cm-tempWater"></output></div>
        <input type="range" id="cm-tempWater" min="0" max="50" step="1" value="${state.tempWater}"></div>
      <div class="control"><div class="row"><label for="cm-massSolid">Solid mass (g)</label><output id="cm-massSolidval" for="cm-massSolid"></output></div>
        <input type="range" id="cm-massSolid" min="10" max="300" step="10" value="${state.massSolid}"></div>
      <div class="control"><div class="row"><label for="cm-tempSolid">Solid temperature (°C)</label><output id="cm-tempSolidval" for="cm-tempSolid"></output></div>
        <input type="range" id="cm-tempSolid" min="50" max="150" step="1" value="${state.tempSolid}"></div>
      <div class="btn-row"><button class="btn primary" id="cm-mix" type="button">Drop it in</button></div>
      <dl class="stat-grid">
        <div><dt>Current reading</dt><dd class="mono" id="cm-tempreadout">—</dd></div>
        <div><dt>Equilibrium temperature</dt><dd class="mono" id="cm-final">—</dd></div>
      </dl>
    `;
  },

  wire(root) {
    els.material = root.querySelector("#cm-material");
    els.massWater = root.querySelector("#cm-massWater");
    els.massWaterval = root.querySelector("#cm-massWaterval");
    els.tempWater = root.querySelector("#cm-tempWater");
    els.tempWaterval = root.querySelector("#cm-tempWaterval");
    els.massSolid = root.querySelector("#cm-massSolid");
    els.massSolidval = root.querySelector("#cm-massSolidval");
    els.tempSolid = root.querySelector("#cm-tempSolid");
    els.tempSolidval = root.querySelector("#cm-tempSolidval");
    els.mix = root.querySelector("#cm-mix");
    els.tempreadout = root.querySelector("#cm-tempreadout");
    els.final = root.querySelector("#cm-final");

    const sync = () => {
      els.massWaterval.textContent = `${state.massWater} g`;
      els.tempWaterval.textContent = `${state.tempWater}°C`;
      els.massSolidval.textContent = `${state.massSolid} g`;
      els.tempSolidval.textContent = `${state.tempSolid}°C`;
      refresh();
    };
    els.material.addEventListener("input", () => {
      state.material = els.material.value;
      state.phase = "before";
      els.mix.textContent = "Drop it in";
      sync();
    });
    [
      ["massWater", "massWater"],
      ["tempWater", "tempWater"],
      ["massSolid", "massSolid"],
      ["tempSolid", "tempSolid"],
    ].forEach(([key, id]) => {
      els[id].addEventListener("input", () => {
        state[key] = +els[id].value;
        state.phase = "before";
        els.mix.textContent = "Drop it in";
        sync();
      });
    });
    els.mix.addEventListener("click", () => {
      state.phase = state.phase === "before" ? "mixed" : "before";
      els.mix.textContent = state.phase === "mixed" ? "Reset" : "Drop it in";
      sync();
    });
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
