import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.62, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);
scene.add(contactShadow({ radius: 3, y: -1.6, opacity: 0.2 }));

// iron core
const core = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 3.2, 20),
  new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.35 })
);
core.rotation.z = Math.PI / 2;
group.add(core);

// coil helix
const COIL_PTS = 400;
const coilGeo = new THREE.BufferGeometry();
coilGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COIL_PTS * 3), 3));
const coil = new THREE.Line(coilGeo, new THREE.LineBasicMaterial({ color: 0xb0803f }));
group.add(coil);

// Added to the outer group at fixed absolute offsets — core is rotated 90°
// to lie along X, so a child label would inherit that rotation and end up
// sideways instead of above it.
const coreLabel = createLabel("Iron core", { fontSize: 26 });
coreLabel.position.set(-1.1, 0.5, 0);
group.add(coreLabel);
const coilLabel = createLabel("Coil", { fontSize: 26 });
coilLabel.position.set(0.6, 0.75, 0);
group.add(coilLabel);

const state = { turns: 20, current: 1.4, t: 0 };

function buildCoil() {
  const arr = coilGeo.attributes.position.array;
  const span = 2.6;
  for (let i = 0; i < COIL_PTS; i++) {
    const f = i / (COIL_PTS - 1);
    const ang = f * state.turns * Math.PI * 2;
    arr[i * 3] = -span / 2 + f * span;
    arr[i * 3 + 1] = Math.cos(ang) * 0.34;
    arr[i * 3 + 2] = Math.sin(ang) * 0.34;
  }
  coilGeo.attributes.position.needsUpdate = true;
}
buildCoil();

// paperclips near the tip
const clipMat = new THREE.MeshStandardMaterial({ color: 0xc9c9c4, metalness: 0.7, roughness: 0.3 });
const clips = [];
for (let i = 0; i < 8; i++) {
  const c = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 14), clipMat);
  c.userData.home = new THREE.Vector3(2.6 + Math.random() * 1.2, -1.5 + Math.random() * 0.1, (Math.random() - 0.5) * 1.4);
  c.position.copy(c.userData.home);
  group.add(c);
  clips.push(c);
}

function strength() {
  // ampere-turns, normalised 0..1
  return Math.min(1, (state.turns * state.current) / 90);
}

const els = {};

export default {
  id: "electromagnet",
  name: "Electromagnet",
  tag: "Physics · Electromagnetism",
  subject: "Physics",
  grades: [8, 12],
  blurb: "Current through a coil makes a magnet you can switch off.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 20h4M30 20h4M11 12c-4 0-4 16 0 16M15 12c-4 0-4 16 0 16M19 12c-4 0-4 16 0 16M23 12c-4 0-4 16 0 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, -0.2, 0], radius: 8.5, theta: 0.6, phi: 1.2, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>An electric current always wraps a magnetic field around itself. Coil the wire into many loops
    and the fields add up; slip an iron core inside and it concentrates them enormously.</p>
    <p>The strength depends on the <strong>current</strong> times the <strong>number of turns</strong>
    (ampere-turns). Cut the current and the magnetism vanishes instantly — which is exactly why
    scrapyard cranes, maglev trains and doorbells use electromagnets rather than permanent ones.</p>
  `,

  quiz: [
    { q: "The magnetic strength of an electromagnet depends on…", choices: ["the wire's colour", "current × number of turns", "the length of the core only", "the room temperature"], answer: 1, explain: "More amps or more loops → a stronger field (ampere-turns)." },
    { q: "Why does a scrapyard crane use an electromagnet instead of a normal magnet?", choices: ["it's cheaper", "it can be switched off to drop the load", "it's lighter", "it never wears out"], answer: 1, explain: "Cutting the current releases whatever it's holding." },
    { q: "Adding an iron core to a coil…", choices: ["weakens the field", "greatly strengthens the field", "reverses the field", "has no effect"], answer: 1, explain: "Iron channels and multiplies the magnetic field." },
  ],

  presets: [
    { label: "Off", note: "No current — no magnetism. The clips stay put.", values: { "em-current": 0 } },
    { label: "Weak", note: "A little current, few turns — picks up one or two clips.", values: { "em-current": 0.6, "em-turns": 8 } },
    { label: "Strong", note: "Full current, many turns — the whole pile jumps to the core.", values: { "em-current": 3, "em-turns": 40 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>strength ∝ turns × current</span><b class="mono" id="em-str">—</b></div>
      <div class="control"><div class="row"><label for="em-turns">Turns of wire</label><output id="em-turnsval" for="em-turns"></output></div>
        <input type="range" id="em-turns" min="4" max="40" step="1" value="${state.turns}"></div>
      <div class="control"><div class="row"><label for="em-current">Current</label><output id="em-currentval" for="em-current"></output></div>
        <input type="range" id="em-current" min="0" max="3" step="0.1" value="${state.current}"></div>
      <p class="fact" id="em-clips">—</p>
    `;
  },

  wire(root) {
    els.turns = root.querySelector("#em-turns");
    els.current = root.querySelector("#em-current");
    els.turnsval = root.querySelector("#em-turnsval");
    els.currentval = root.querySelector("#em-currentval");
    els.str = root.querySelector("#em-str");
    els.clips = root.querySelector("#em-clips");

    const sync = () => {
      els.turnsval.textContent = String(state.turns);
      els.currentval.textContent = `${state.current.toFixed(1)} A`;
      const s = strength();
      els.str.textContent = `${Math.round(s * 100)}%`;
      const held = Math.round(s * clips.length);
      els.clips.textContent = held === 0 ? "Nothing is picked up." : `Holding ${held} paper-clip${held > 1 ? "s" : ""}.`;
      buildCoil();
    };
    els.turns.addEventListener("input", () => ((state.turns = +els.turns.value), sync()));
    els.current.addEventListener("input", () => ((state.current = +els.current.value), sync()));
    sync();
  },

  update(dt) {
    state.t += dt;
    const s = strength();
    const held = Math.round(s * clips.length);
    const tip = new THREE.Vector3(1.5, 0, 0);
    clips.forEach((c, i) => {
      const target = i < held
        ? tip.clone().add(new THREE.Vector3((i % 3) * 0.14, 0.34 + Math.sin(state.t * 3 + i) * 0.02, (Math.floor(i / 3) - 1) * 0.18))
        : c.userData.home;
      c.position.lerp(target, 0.12);
      c.rotation.x += dt * (i < held ? 0.4 : 0);
    });
  },

  onEnter() {
    clips.forEach((c) => c.position.copy(c.userData.home));
  },
  onExit() {},
};
