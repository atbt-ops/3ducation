import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.68, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);

const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0b08c, roughness: 0.7 });
const cuffMat = new THREE.MeshStandardMaterial({ color: 0x3d5a80, roughness: 0.6 });
const strapMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, roughness: 0.5 });
const tubeMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.85 });
const bulbMat = new THREE.MeshStandardMaterial({ color: 0x7a1f1f, roughness: 0.6 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0xb9bfc6, roughness: 0.3, metalness: 0.75 });
const faceMat = new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.5 });
const needleMat = new THREE.MeshBasicMaterial({ color: 0xc23b2b });

// Arm, lying along X.
const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 3.6, 24), skinMat);
arm.rotation.z = Math.PI / 2;
arm.position.set(-1.6, -1.4, 0);
group.add(arm);
const armLabel = createLabel("Arm", { fontSize: 22, scale: 0.5 });
armLabel.position.set(-3.1, -1.4, 0);
group.add(armLabel);

// Inflatable cuff, wrapped around the arm.
const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.0, 24), cuffMat);
cuff.rotation.z = Math.PI / 2;
cuff.position.set(-1.8, -1.4, 0);
group.add(cuff);
const strap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.9), strapMat);
strap.position.set(-1.8, -0.78, 0);
group.add(strap);
const cuffLabel = createLabel("Cuff", { fontSize: 22, scale: 0.5 });
cuffLabel.position.set(-1.8, -0.35, 0);
group.add(cuffLabel);

// Rubber bulb pump, connected by a tube.
function tubeBetween(a, b, radius) {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 12, radius, 8, false), tubeMat);
}
group.add(tubeBetween([-1.2, -1.85, 0.55], [1.0, -2.6, 0.4], 0.06));
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 14), bulbMat);
bulb.scale.set(0.85, 1.4, 0.85);
bulb.position.set(1.5, -3.0, 0.4);
group.add(bulb);
const bulbLabel = createLabel("Bulb pump", { fontSize: 22, scale: 0.5 });
bulbLabel.position.set(1.5, -3.75, 0);
group.add(bulbLabel);

// Gauge, connected by a second tube.
const gaugeCenter = [1.9, 1.0, 0];
group.add(tubeBetween([-1.4, -1.0, -0.55], [gaugeCenter[0], gaugeCenter[1] - 0.65, 0], 0.06));
const gaugeRim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 32), metalMat);
gaugeRim.rotation.x = Math.PI / 2;
gaugeRim.position.set(...gaugeCenter);
group.add(gaugeRim);
const gaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.05, 32), faceMat);
gaugeFace.rotation.x = Math.PI / 2;
gaugeFace.position.set(gaugeCenter[0], gaugeCenter[1], gaugeCenter[2] + 0.09);
group.add(gaugeFace);
const gaugeLabel = createLabel("Gauge", { fontSize: 22, scale: 0.5 });
gaugeLabel.position.set(gaugeCenter[0], gaugeCenter[1] + 1.05, 0);
group.add(gaugeLabel);

// Gauge dial: a 220° sweep, 0 mmHg at the lower-left to 220 mmHg at the lower-right.
const MAX_P = 220;
const START_DEG = 200;
const END_DEG = -20;
function angleFor(p) {
  const deg = START_DEG + (p / MAX_P) * (END_DEG - START_DEG);
  return THREE.MathUtils.degToRad(deg);
}
[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220].forEach((p) => {
  const a = angleFor(p);
  const isMark = p === 80 || p === 120;
  const r1 = isMark ? 0.42 : 0.5;
  const tick = new THREE.Mesh(
    new THREE.BoxGeometry(0.62 - r1, isMark ? 0.06 : 0.035, 0.02),
    new THREE.MeshBasicMaterial({ color: p === 80 ? 0x2e7d32 : p === 120 ? 0xc9931f : 0x8a8a86 })
  );
  tick.position.set(
    gaugeCenter[0] + Math.cos(a) * (r1 + (0.62 - r1) / 2),
    gaugeCenter[1] + Math.sin(a) * (r1 + (0.62 - r1) / 2),
    gaugeCenter[2] + 0.12
  );
  tick.rotation.z = a;
  group.add(tick);
});
const needlePivot = new THREE.Group();
needlePivot.position.set(gaugeCenter[0], gaugeCenter[1], gaugeCenter[2] + 0.13);
group.add(needlePivot);
const needle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.02), needleMat);
needle.position.x = 0.25;
needlePivot.add(needle);

const state = { pressure: 0, t: 0 };
const els = {};

function zoneText(p) {
  if (p > 120) return "Cuff pressure is above systolic — the artery under the cuff is squeezed fully shut, no blood gets through.";
  if (p >= 80) return "Between diastolic and systolic — this is the range where a doctor, slowly releasing the cuff, hears the pulsing “Korotkoff sounds” through a stethoscope.";
  return "Below diastolic — the cuff is loose enough that blood flows freely again, and the sounds stop.";
}

function sync() {
  const p = state.pressure;
  needlePivot.rotation.z = angleFor(p);
  const cuffTightness = 1 + (p / MAX_P) * 0.05;
  cuff.scale.set(1, cuffTightness, cuffTightness);
  if (els.out) els.out.textContent = `${Math.round(p)} mmHg`;
  if (els.val) els.val.textContent = `${Math.round(p)}`;
  if (els.zone) els.zone.textContent = zoneText(p);
}

export default {
  id: "sphygmomanometer",
  name: "Sphygmomanometer",
  tag: "Biology · Circulation",
  subject: "Biology",
  grades: [7, 11],
  blurb: "Squeeze the cuff and read blood pressure off the dial.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="16" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M19 20h6" stroke="currentColor" stroke-width="2"/><circle cx="29" cy="20" r="8" stroke="currentColor" stroke-width="2"/><path d="M29 20l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, -0.4, 0], radius: 10, theta: 0.3, phi: 1.3, minRadius: 5, maxRadius: 17 },

  lesson: `
    <p>Blood pressure is the push of blood against the walls of the arteries. It peaks
    (<strong>systolic</strong> pressure, around 120 mm of mercury in a healthy young adult) the
    instant the heart's ventricles contract and force blood out, then eases off
    (<strong>diastolic</strong> pressure, around 80 mm of mercury) as the ventricles relax and
    refill for the next beat.</p>
    <p>A <strong>sphygmomanometer</strong> measures both numbers. Squeezing the rubber bulb pumps
    air into a cuff wrapped around the upper arm, squeezing the artery shut. As the cuff is slowly
    released, a doctor listens with a stethoscope: the first thumping sound marks the systolic
    pressure, and the moment the sound disappears marks the diastolic pressure — read straight off
    the gauge.</p>
  `,

  quiz: [
    { q: "What device is used to measure blood pressure?", choices: ["Stethoscope", "Sphygmomanometer", "Thermometer", "Dialyzer"], answer: 1, explain: "The sphygmomanometer — cuff, pump, and pressure gauge — measures blood pressure." },
    { q: "Systolic pressure is measured at the moment…", choices: ["the ventricles relax and refill", "the ventricles contract and push blood out", "the heart stops briefly", "blood enters the lungs"], answer: 1, explain: "Systolic pressure is the peak pressure, created as the ventricles contract." },
    { q: "For a healthy young adult, typical blood pressure is about…", choices: ["80/120 mmHg", "120/80 mmHg", "200/150 mmHg", "40/20 mmHg"], answer: 1, explain: "About 120 mmHg systolic over 80 mmHg diastolic — written systolic over diastolic." },
    { q: "How does the cuff let a doctor measure the pressure?", choices: ["It weighs the arm", "It squeezes the artery shut, then is slowly released while listening for pulse sounds", "It measures body temperature", "It counts heartbeats directly"], answer: 1, explain: "Inflating the cuff blocks the artery; releasing it slowly reveals the systolic and diastolic points by sound." },
  ],

  presets: [
    { label: "Fully deflated", note: "No pressure on the artery — blood flows freely, no sound.", values: { "sg-p": 0 } },
    { label: "Normal reading zone (100)", note: "Between diastolic and systolic — where Korotkoff sounds are heard.", values: { "sg-p": 100 } },
    { label: "Above systolic (150)", note: "The cuff is squeezing the artery fully shut.", values: { "sg-p": 150 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>cuff pressure</span><b class="mono" id="sg-out">${state.pressure} mmHg</b></div>
      <div class="control"><div class="row"><label for="sg-p">Cuff pressure</label><output id="sg-pval" for="sg-p"></output></div>
        <input type="range" id="sg-p" min="0" max="${MAX_P}" step="1" value="${state.pressure}"></div>
      <p class="fact" id="sg-zone">${zoneText(state.pressure)}</p>
      <p class="fact"><strong style="color:#c9931f">orange mark</strong> = systolic (120) ·
        <strong style="color:#2e7d32">green mark</strong> = diastolic (80).</p>
    `;
  },

  wire(root) {
    els.p = root.querySelector("#sg-p");
    els.val = root.querySelector("#sg-pval");
    els.out = root.querySelector("#sg-out");
    els.zone = root.querySelector("#sg-zone");
    els.p.addEventListener("input", () => ((state.pressure = +els.p.value), sync()));
    sync();
  },

  update(dt) {
    state.t += dt;
  },

  onEnter() {},
  onExit() {},
};
