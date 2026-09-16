import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

const ACETONE_BP = 56;
const WATER_BP = 100;
const ACETONE_COLOR = 0x8fd8cb;
const MIX_COLOR = 0xdfe8ee;

const glassMat = () => new THREE.MeshPhysicalMaterial({ color: 0xe8f0ee, transmission: 0.6, transparent: true, opacity: 0.35, roughness: 0.1 });

// Heat source.
const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 20), new THREE.MeshStandardMaterial({ color: 0x555a63, roughness: 0.4, metalness: 0.5 }));
burner.position.set(-2.6, -1.9, 0);
group.add(burner);
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 12), new THREE.MeshBasicMaterial({ color: 0xffb020 }));
flame.position.set(-2.6, -1.65, 0);
group.add(flame);

// Distillation flask, with liquid inside and a thermometer at the neck.
const flask = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), glassMat());
flask.position.set(-2.6, -0.9, 0);
group.add(flask);
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 16), glassMat());
neck.position.set(-2.6, 0.0, 0);
group.add(neck);
const liquidMat = new THREE.MeshBasicMaterial({ color: MIX_COLOR });
const liquid = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), liquidMat);
liquid.position.set(-2.6, -0.9, 0);
group.add(liquid);
const thermometer = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), new THREE.MeshStandardMaterial({ color: 0xe8f0ee, transparent: true, opacity: 0.5 }));
thermometer.rotation.z = THREE.MathUtils.degToRad(20);
thermometer.position.set(-2.85, 0.35, 0);
group.add(thermometer);
const flaskLabel = createLabel("Distillation flask", { fontSize: 20 });
flaskLabel.position.set(-2.6, -2.15, 0);
group.add(flaskLabel);

// Side-arm down to the condenser, with an optional fractionating column.
const armCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.6, 0.5, 0),
  new THREE.Vector3(-1.7, 0.6, 0),
  new THREE.Vector3(-1.0, 0.35, 0),
]);
const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 20, 0.09, 8, false), glassMat());
group.add(arm);

const columnGroup = new THREE.Group();
columnGroup.position.set(-1.9, 1.0, 0);
group.add(columnGroup);
const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.3, 16, 1, true), glassMat());
columnGroup.add(column);
for (let i = 0; i < 10; i++) {
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.3 }));
  bead.position.set((Math.random() - 0.5) * 0.2, -0.55 + Math.random() * 1.1, (Math.random() - 0.5) * 0.2);
  columnGroup.add(bead);
}
const columnLabel = createLabel("Fractionating column", { fontSize: 20 });
columnLabel.position.set(-1.9, 1.85, 0);
columnGroup.add(columnLabel);

// Condenser jacket.
const condenser = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.0, 16, 1, true), glassMat());
condenser.rotation.z = Math.PI / 2;
condenser.position.set(0.2, 0.15, 0);
group.add(condenser);
const condenserLabel = createLabel("Condenser", { fontSize: 20 });
condenserLabel.position.set(0.2, 0.9, 0);
group.add(condenserLabel);

// Collection flask.
const collectFlask = new THREE.Mesh(new THREE.SphereGeometry(0.7, 22, 16), glassMat());
collectFlask.position.set(2.0, -1.4, 0);
group.add(collectFlask);
const collectLiquidMat = new THREE.MeshBasicMaterial({ color: ACETONE_COLOR, transparent: true, opacity: 0 });
const collectLiquid = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), collectLiquidMat);
collectLiquid.position.set(2.0, -1.4, 0);
group.add(collectLiquid);
const collectNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), glassMat());
collectNeck.position.set(1.2, -0.55, 0);
collectNeck.rotation.z = THREE.MathUtils.degToRad(70);
group.add(collectNeck);
const collectLabel = createLabel("Collected distillate", { fontSize: 20 });
collectLabel.position.set(2.0, -2.25, 0);
group.add(collectLabel);

// Vapour droplets travelling from flask to collection flask while distilling.
const DROP_N = 6;
const drops = Array.from({ length: DROP_N }, () => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: ACETONE_COLOR }));
  m.visible = false;
  group.add(m);
  return { mesh: m, u: 0 };
});
const dropPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.6, 0.5, 0),
  new THREE.Vector3(-1.7, 0.6, 0),
  new THREE.Vector3(-1.9, 1.5, 0),
  new THREE.Vector3(-0.9, 0.3, 0),
  new THREE.Vector3(1.1, 0.15, 0),
  new THREE.Vector3(1.9, -0.8, 0),
  new THREE.Vector3(2.0, -1.4, 0),
]);

const state = { temp: 30, mode: "simple", collected: 0, t: 0 };
const els = {};

function statusText() {
  if (state.temp < ACETONE_BP) return "Not hot enough yet — nothing is boiling.";
  if (state.temp < WATER_BP - 5) return "Acetone (b.p. 56°C) is boiling off and being collected — water (b.p. 100°C) stays behind.";
  return "Danger zone — close to water's boiling point. Water vapour may start contaminating the sample!";
}

function refresh() {
  columnGroup.visible = state.mode === "fractional";
  const distilling = state.temp >= ACETONE_BP;
  drops.forEach((d) => (d.mesh.visible = distilling));
  flame.visible = true;

  const remaining = THREE.MathUtils.clamp(1 - state.collected, 0.15, 1);
  liquid.scale.setScalar(remaining);
  liquid.position.y = -0.9 - (1 - remaining) * 0.3;

  collectLiquidMat.opacity = Math.min(0.85, state.collected * 1.2);
  collectLiquid.scale.setScalar(0.3 + Math.min(1, state.collected) * 0.9);

  if (els.status) els.status.textContent = statusText();
  if (els.temp) els.temp.textContent = `${state.temp}°C`;
}
refresh();

export default {
  id: "distillation",
  name: "Distillation",
  tag: "Chemistry · Separation",
  subject: "Chemistry",
  grades: [8, 11],
  blurb: "Heat a liquid mixture and separate it by boiling point, drop by drop.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="26" r="7" stroke="currentColor" stroke-width="2"/><path d="M12 19V9M12 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="30" r="5" stroke="currentColor" stroke-width="2"/><path d="M30 25v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [-0.3, -0.4, 0], radius: 10.5, theta: 0.15, phi: 1.35, minRadius: 5, maxRadius: 18 },

  lesson: `
    <p><strong>Distillation</strong> separates two miscible liquids by heating the mixture and
    taking advantage of their different <strong>boiling points</strong>. Acetone and water, for
    example, boil at 56°C and 100°C. Heat the mixture in a flask fitted with a thermometer:
    once the temperature reaches acetone's boiling point, acetone vapour rises, passes through a
    water-cooled <strong>condenser</strong> that turns it back into a liquid, and drips into a
    collection flask — while the water, far from its own boiling point, stays behind.</p>
    <p>When two liquids' boiling points are close together — less than about 25°C apart — simple
    distillation isn't precise enough to separate them cleanly. <strong>Fractional distillation</strong>
    adds a <strong>fractionating column</strong> packed with glass beads between the flask and the
    condenser; vapour condenses and re-evaporates repeatedly on the beads, letting only the
    lowest-boiling component travel all the way through. This exact technique is used industrially
    to separate liquid air into oxygen, nitrogen and argon.</p>
  `,

  quiz: [
    { q: "Distillation separates two miscible liquids based on their difference in…", choices: ["colour", "boiling point", "smell", "weight"], answer: 1, explain: "Heating to just above the lower boiling point vaporizes one liquid while the other stays behind." },
    { q: "In the acetone-water mixture, which liquid is collected first as the temperature rises?", choices: ["Water, because it boils first", "Acetone, since its boiling point (56°C) is lower", "Both at exactly the same time", "Neither — they can't be separated this way"], answer: 1, explain: "Acetone's lower boiling point means it vaporizes and is collected before water does." },
    { q: "What does the condenser do in a distillation setup?", choices: ["Heats the liquid", "Cools the vapour back into a liquid so it can be collected", "Measures temperature", "Filters out solids"], answer: 1, explain: "The condenser cools the rising vapour, turning it back into a liquid distillate." },
    { q: "When is fractional distillation needed instead of simple distillation?", choices: ["Never — they are the same thing", "When the two liquids' boiling points are close together (less than about 25°C apart)", "Only for solids", "Only when there is just one liquid"], answer: 1, explain: "A fractionating column gives the extra separating power needed when boiling points are close." },
  ],

  presets: [
    { label: "Not yet boiling (30°C)", note: "Below both boiling points — nothing happens.", values: { "ds-temp": 30, "ds-mode": "simple" } },
    { label: "Distilling acetone (70°C)", note: "Well above acetone's 56°C, safely below water's 100°C.", values: { "ds-temp": 70, "ds-mode": "simple" } },
    { label: "Danger zone (98°C)", note: "Too close to water's boiling point — risk of contamination.", values: { "ds-temp": 98, "ds-mode": "simple" } },
    { label: "Fractional distillation", note: "Adds the fractionating column, needed for close-boiling mixtures.", values: { "ds-temp": 70, "ds-mode": "fractional" } },
  ],

  panelHTML() {
    return `
      <select id="ds-mode" class="text-input" aria-label="Distillation type">
        <option value="simple">Simple distillation</option>
        <option value="fractional">Fractional distillation</option>
      </select>
      <div class="control"><div class="row"><label for="ds-temp">Heating temperature</label><output id="ds-tempval" for="ds-temp"></output></div>
        <input type="range" id="ds-temp" min="30" max="105" step="1" value="${state.temp}"></div>
      <p class="fact" id="ds-status">—</p>
    `;
  },

  wire(root) {
    els.mode = root.querySelector("#ds-mode");
    els.temp = root.querySelector("#ds-temp");
    els.tempval = root.querySelector("#ds-tempval");
    els.status = root.querySelector("#ds-status");
    els.mode.addEventListener("input", () => {
      state.mode = els.mode.value;
      refresh();
    });
    els.temp.addEventListener("input", () => {
      state.temp = +els.temp.value;
      els.tempval.textContent = `${state.temp}°C`;
      refresh();
    });
    els.tempval.textContent = `${state.temp}°C`;
  },

  update(dt) {
    state.t += dt;
    const distilling = state.temp >= ACETONE_BP && state.temp < WATER_BP + 2;
    if (distilling) {
      state.collected = Math.min(1, state.collected + dt * 0.03);
      drops.forEach((d, i) => {
        d.u = (((state.t * 0.5 + i / DROP_N) % 1) + 1) % 1;
        const p = dropPath.getPointAt(d.u);
        d.mesh.position.copy(p);
      });
      refresh();
    }
  },

  onEnter() {},
  onExit() {},
};
