import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

const EYE_HEIGHT = 1.5;

// Ground.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 10), new THREE.MeshStandardMaterial({ color: 0x9c8a5e, roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2;
group.add(ground);

// The clinometer: a small stand with a protractor scale and a rotating sighting arm.
const standMat = new THREE.MeshStandardMaterial({ color: 0x555a63, roughness: 0.4, metalness: 0.4 });
const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, EYE_HEIGHT, 12), standMat);
stand.position.y = EYE_HEIGHT / 2;
group.add(stand);
const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), standMat);
box.position.y = EYE_HEIGHT;
group.add(box);
const clinometerLabel = createLabel("Clinometer", { fontSize: 24 });
clinometerLabel.position.set(0, EYE_HEIGHT + 0.6, 0);
group.add(clinometerLabel);

// Protractor arc ticks, every 10 degrees from 0 to 90.
for (let d = 0; d <= 90; d += 10) {
  const a = THREE.MathUtils.degToRad(d);
  const r1 = d % 30 === 0 ? 0.55 : 0.65;
  const tick = new THREE.Mesh(
    new THREE.BoxGeometry(0.7 - r1, d % 30 === 0 ? 0.05 : 0.03, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x8a8a86 })
  );
  tick.position.set(Math.cos(a) * (r1 + (0.7 - r1) / 2), EYE_HEIGHT + Math.sin(a) * (r1 + (0.7 - r1) / 2), 0.2);
  tick.rotation.z = a;
  group.add(tick);
}

// Horizontal reference line, dashed, from the clinometer toward the tower.
const horizontal = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, EYE_HEIGHT, 0), new THREE.Vector3(45, EYE_HEIGHT, 0)]),
  new THREE.LineDashedMaterial({ color: 0x8a8a86, dashSize: 0.4, gapSize: 0.25 })
);
horizontal.computeLineDistances();
group.add(horizontal);

// The rotating sighting arm and line of sight.
const sightPivot = new THREE.Group();
sightPivot.position.y = EYE_HEIGHT;
group.add(sightPivot);
const sightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8), new THREE.MeshBasicMaterial({ color: 0xc23b2b }));
sightArm.position.x = 0.325;
sightArm.rotation.z = Math.PI / 2;
sightPivot.add(sightArm);

const sightLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xc9931f }));
group.add(sightLine);
const angleLabel = createLabel("Angle of elevation", { fontSize: 20 });
group.add(angleLabel);

// The tower being sighted.
const tower = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 1.1), new THREE.MeshStandardMaterial({ color: 0xb0895a, roughness: 0.7 }));
group.add(tower);
const towerLabel = createLabel("Tower", { fontSize: 22 });
group.add(towerLabel);
const heightLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineDashedMaterial({ color: 0x63665a, dashSize: 0.2, gapSize: 0.15 })
);
group.add(heightLine);
const distLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineDashedMaterial({ color: 0x63665a, dashSize: 0.2, gapSize: 0.15 })
);
group.add(distLine);
const heightLabel = createLabel("h", { fontSize: 22 });
group.add(heightLabel);
const distLabel = createLabel("d", { fontSize: 22 });
group.add(distLabel);

const state = { angle: 45, distance: 20 };
const els = {};

function height() {
  return EYE_HEIGHT + state.distance * Math.tan(THREE.MathUtils.degToRad(state.angle));
}

function refresh() {
  const d = state.distance;
  const h = height();
  const rad = THREE.MathUtils.degToRad(state.angle);

  sightPivot.rotation.z = rad;
  sightLine.geometry.setFromPoints([new THREE.Vector3(0, EYE_HEIGHT, 0), new THREE.Vector3(d, h, 0)]);
  angleLabel.position.set(1.1, EYE_HEIGHT + 0.55, 0);

  tower.scale.y = h;
  tower.position.set(d, h / 2, 0);
  towerLabel.position.set(d, h + 0.6, 0);

  heightLine.geometry.setFromPoints([new THREE.Vector3(d + 1.3, 0, 0), new THREE.Vector3(d + 1.3, h, 0)]);
  heightLine.computeLineDistances();
  heightLabel.position.set(d + 1.7, h / 2, 0);

  distLine.geometry.setFromPoints([new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(d, 0.02, 0)]);
  distLine.computeLineDistances();
  distLabel.position.set(d / 2, 0.5, 0);

  if (els.h) els.h.textContent = `${h.toFixed(2)} m`;
}
refresh();

export default {
  id: "clinometer",
  name: "Clinometer",
  tag: "Math · Trigonometry",
  subject: "Math",
  grades: [9, 11],
  blurb: "Sight the top of a tower and find its height from an angle and a distance.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="17" y="24" width="6" height="10" rx="1" fill="currentColor"/><path d="M20 24V8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 24l11-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 24h24" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 3"/></svg>',
  scene,
  view: { target: [10, 11, 0], radius: 40, theta: 0.4, phi: 1.15, minRadius: 15, maxRadius: 60 },

  lesson: `
    <p>A <strong>clinometer</strong> measures the <em>angle of elevation</em> — the angle between a
    horizontal line and your line of sight when looking up at something, like the top of a tower.
    Surveyors have used this idea for centuries with a more precise instrument called a
    <strong>theodolite</strong>. In 1852, giant theodolites were used from six stations up to
    160 km away to measure the height of what turned out to be the world's tallest peak — later
    named after Sir George Everest, who commissioned the survey.</p>
    <p>Once you know the angle of elevation <span class="mono">θ</span> and your distance
    <span class="mono">d</span> from the base, simple trigonometry finds the height:
    <span class="mono">tan θ = (h − eye height) / d</span>, so
    <span class="mono">h = eye height + d·tan θ</span>. Textbook problems often simplify by
    ignoring the observer's own height — try setting the angle to exactly 45°, where
    <span class="mono">tan θ = 1</span> and the tower's height (above eye level) exactly equals
    your distance from it.</p>
  `,

  quiz: [
    { q: "What is the 'angle of elevation'?", choices: ["The angle between two towers", "The angle between the horizontal and the line of sight, looking upward", "The angle a tower leans", "The angle of the Sun at noon"], answer: 1, explain: "It's measured from a horizontal reference line up to the line of sight." },
    { q: "A clinometer (or a surveyor's theodolite) is used to measure…", choices: ["Temperature", "Angles of elevation and depression", "Wind speed", "Electrical current"], answer: 1, explain: "These instruments measure the angle to a sighted object, which then gives heights and distances by trigonometry." },
    { q: "Which trig ratio directly relates the angle of elevation, the height, and the distance to the base?", choices: ["sine", "cosine", "tangent", "secant"], answer: 2, explain: "tan θ = opposite/adjacent = height/distance, so tan θ links all three directly." },
    { q: "At an angle of elevation of exactly 45°, from 20 m away (ignoring eye height), a tower's height is…", choices: ["10 m", "20 m", "40 m", "It can't be found"], answer: 1, explain: "tan 45° = 1, so height = distance × 1 = 20 m." },
    { q: "Moving closer to a tower of the same height, the angle of elevation to its top…", choices: ["decreases", "increases", "stays exactly the same", "becomes negative"], answer: 1, explain: "A shorter distance with the same height means a steeper (larger) angle of elevation." },
  ],

  presets: [
    { label: "45° — height ≈ distance", note: "tan 45° = 1, so the tower's height above eye level equals your distance from it.", values: { "cl-angle": 45, "cl-dist": 20 } },
    { label: "Low angle, far away", note: "A shallow sightline from a long way off.", values: { "cl-angle": 20, "cl-dist": 35 } },
    { label: "Steep angle, close up", note: "Standing near the base, the sightline is almost straight up.", values: { "cl-angle": 65, "cl-dist": 8 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>h = eye height + d·tanθ</span><b class="mono" id="cl-h">—</b></div>
      <div class="control"><div class="row"><label for="cl-angle">Angle of elevation θ</label><output id="cl-angleval" for="cl-angle"></output></div>
        <input type="range" id="cl-angle" min="15" max="65" step="1" value="${state.angle}"></div>
      <div class="control"><div class="row"><label for="cl-dist">Distance to tower d</label><output id="cl-distval" for="cl-dist"></output></div>
        <input type="range" id="cl-dist" min="8" max="35" step="1" value="${state.distance}"></div>
      <p class="fact">Eye height is fixed at ${EYE_HEIGHT} m — many textbook problems simplify this to zero.</p>
    `;
  },

  wire(root) {
    els.angle = root.querySelector("#cl-angle");
    els.angleval = root.querySelector("#cl-angleval");
    els.dist = root.querySelector("#cl-dist");
    els.distval = root.querySelector("#cl-distval");
    els.h = root.querySelector("#cl-h");
    const sync = () => {
      els.angleval.textContent = `${state.angle}°`;
      els.distval.textContent = `${state.distance} m`;
      refresh();
    };
    els.angle.addEventListener("input", () => ((state.angle = +els.angle.value), sync()));
    els.dist.addEventListener("input", () => ((state.distance = +els.dist.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
