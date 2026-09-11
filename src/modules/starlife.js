import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.5, dir: 0.7, rim: 0.3 });

const core = new THREE.Mesh(
  new THREE.SphereGeometry(1, 40, 30),
  new THREE.MeshStandardMaterial({ color: 0x8a7aa0, emissive: 0x8a7aa0, emissiveIntensity: 0.1, roughness: 0.4 })
);
scene.add(core);

const nebulaCloud = new THREE.Mesh(
  new THREE.SphereGeometry(1.8, 24, 18),
  new THREE.MeshStandardMaterial({ color: 0x7a5fa0, transparent: true, opacity: 0.28, roughness: 1, emissive: 0x5a3f8a, emissiveIntensity: 0.3 })
);
scene.add(nebulaCloud);

const remnantShell = new THREE.Mesh(
  new THREE.SphereGeometry(2.2, 24, 18),
  new THREE.MeshStandardMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.22, roughness: 1, emissive: 0x6fb0e0, emissiveIntensity: 0.4 })
);
scene.add(remnantShell);

const accretionRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.7, 0.09, 10, 60),
  new THREE.MeshStandardMaterial({ color: 0xffa04a, emissive: 0xff7a1f, emissiveIntensity: 1.1, roughness: 0.4 })
);
accretionRing.rotation.x = Math.PI / 2.4;
scene.add(accretionRing);

/** Where a star ends up depends on how massive it started out. */
function stagesFor(mass) {
  const common = [
    { name: "Nebula", desc: "A vast, cold cloud of gas and dust — the raw material every star is born from.", r: 0.35, color: 0x8a7aa0, emissive: 0.08, extra: "nebula" },
    { name: "Protostar", desc: "Gravity pulls the cloud inward. It heats up and starts to glow, though fusion hasn't ignited yet.", r: 0.55, color: 0xd97a3a, emissive: 0.55, extra: null },
    { name: "Main sequence star", desc: "Hydrogen fusion ignites in the core, producing a stable outward pressure that balances gravity — this is the longest stage of a star's life.", r: mainSeqRadius(mass), color: mainSeqColor(mass), emissive: 1.0, extra: null },
  ];
  if (mass < 8) {
    return [
      ...common,
      { name: "Red giant", desc: "Core hydrogen runs out. The core shrinks and heats further while the outer layers swell up and cool, turning the star red and enormous.", r: 2.1, color: 0xe0562a, emissive: 0.55, extra: null },
      { name: "Planetary nebula", desc: "The outer layers drift away into space as a glowing shell, unveiling the small, exposed core underneath.", r: 0.32, color: 0xdfefff, emissive: 1.2, extra: "shell" },
      { name: "White dwarf", desc: "What's left is an extremely dense, Earth-sized core — no more fusion, just slowly cooling over billions of years.", r: 0.22, color: 0xeaf4ff, emissive: 1.8, extra: null },
    ];
  }
  return [
    ...common,
    { name: "Red supergiant", desc: "A massive star swells dramatically as it fuses ever-heavier elements in its core, layer by layer.", r: 2.9, color: 0xc23a1e, emissive: 0.45, extra: null },
    { name: "Supernova", desc: "The core collapses in an instant and rebounds in a catastrophic explosion, briefly outshining an entire galaxy and forging the heaviest elements.", r: 3.4, color: 0xffffff, emissive: 3.2, extra: null },
    mass < 20
      ? { name: "Neutron star", desc: "The crushed core left behind — city-sized, but so dense that a teaspoon would weigh billions of tonnes.", r: 0.16, color: 0xcfe0ff, emissive: 2.4, extra: null }
      : { name: "Black hole", desc: "For the most massive cores, gravity wins completely — collapsing past any known stopping point into a black hole, from which not even light escapes.", r: 0.32, color: 0x0a0a0c, emissive: 0.05, extra: "ring" },
  ];
}

function mainSeqRadius(mass) {
  return Math.max(0.55, Math.min(1.9, 0.55 + mass * 0.05));
}
function mainSeqColor(mass) {
  if (mass < 1.5) return 0xffcf7a;
  if (mass < 5) return 0xfff2c0;
  return 0xbfd4ff;
}

const state = { mass: 1, stageIndex: 2, t: 0 };
const current = { r: 0.55, color: new THREE.Color(0xd97a3a) };
const els = {};

function stageList() {
  return stagesFor(state.mass);
}

export default {
  id: "starlife",
  name: "Star life cycle",
  tag: "Astronomy · Stars",
  subject: "Astronomy",
  grades: [8, 12],
  blurb: "From nebula to white dwarf, neutron star, or black hole.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5l3.2 9.8L33 18l-9.8 3.2L20 31l-3.2-9.8L7 18l9.8-3.2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8, theta: 0.6, phi: 1.0, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>Every star is born the same way — gravity collapsing a cloud of gas and dust until fusion
    ignites — but how it dies depends almost entirely on <strong>how much mass</strong> it started
    with. Stars like our Sun end quietly, as a white dwarf. Stars many times more massive end
    violently, in a supernova, leaving behind a neutron star or, if massive enough, a black hole.</p>
    <p>Set a starting mass, then step through the stages to see the path that mass takes.</p>
  `,

  quiz: [
    { q: "What happens in a star's 'main sequence' stage?", choices: ["It's still just a cloud of gas", "Hydrogen fusion in the core balances gravity", "It has already exploded", "It's shrinking into a black hole"], answer: 1, explain: "This stable, fusion-powered stage is the longest part of a star's life — our Sun is in it now." },
    { q: "A star like the Sun most likely ends its life as a…", choices: ["black hole", "neutron star", "white dwarf", "supernova remnant only"], answer: 2, explain: "Sun-like stars shed their outer layers and leave behind a small, dense white dwarf." },
    { q: "What determines whether a dead massive star becomes a neutron star or a black hole?", choices: ["Its colour", "How much mass the collapsing core has", "How old the star was", "Pure random chance"], answer: 1, explain: "Above a certain core mass, gravity overwhelms every other force and collapse continues into a black hole." },
  ],

  presets: [
    { label: "Sun-like star", note: "About 1 solar mass — ends as a white dwarf.", values: { "sl-mass": 1, "sl-stage": 0 } },
    { label: "Massive star", note: "About 15 solar masses — ends in a supernova.", values: { "sl-mass": 15, "sl-stage": 0 } },
    { label: "Very massive star", note: "About 25 solar masses — collapses into a black hole.", values: { "sl-mass": 25, "sl-stage": 0 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="sl-name"></span></div>
      <p class="fact" id="sl-desc"></p>
      <div class="control"><div class="row"><label for="sl-mass">Starting mass (solar masses)</label><output id="sl-massval" for="sl-mass"></output></div>
        <input type="range" id="sl-mass" min="0.5" max="30" step="0.5" value="${state.mass}"></div>
      <div class="control"><div class="row"><label for="sl-stage">Life stage</label><output id="sl-stageval" for="sl-stage"></output></div>
        <input type="range" id="sl-stage" min="0" max="5" step="1" value="${state.stageIndex}"></div>
    `;
  },

  wire(root) {
    els.mass = root.querySelector("#sl-mass");
    els.massval = root.querySelector("#sl-massval");
    els.stage = root.querySelector("#sl-stage");
    els.stageval = root.querySelector("#sl-stageval");
    els.name = root.querySelector("#sl-name");
    els.desc = root.querySelector("#sl-desc");

    const sync = () => {
      const stages = stageList();
      const maxIdx = stages.length - 1;
      els.stage.max = String(maxIdx);
      let idx = Math.max(0, Math.min(maxIdx, Math.round(+els.stage.value)));
      state.stageIndex = idx;
      els.massval.textContent = `${state.mass}×`;
      const s = stages[idx];
      els.stageval.textContent = s.name;
      els.name.textContent = s.name;
      els.desc.textContent = s.desc;
    };
    els.mass.addEventListener("input", () => {
      state.mass = parseFloat(els.mass.value);
      sync();
    });
    els.stage.addEventListener("input", () => {
      state.stageIndex = Math.round(+els.stage.value);
      sync();
    });
    sync();
  },

  update(dt) {
    state.t += dt;
    const stages = stageList();
    const s = stages[Math.min(state.stageIndex, stages.length - 1)];

    // Smoothly tween the core toward the current stage's look, rather than snapping.
    current.r += (s.r - current.r) * Math.min(1, dt * 4);
    current.color.lerp(new THREE.Color(s.color), Math.min(1, dt * 4));
    core.scale.setScalar(current.r);
    core.material.color.copy(current.color);
    core.material.emissive.copy(current.color);
    core.material.emissiveIntensity = s.emissive;

    nebulaCloud.visible = s.extra === "nebula";
    remnantShell.visible = s.extra === "shell";
    accretionRing.visible = s.extra === "ring";

    if (nebulaCloud.visible) nebulaCloud.scale.setScalar(1 + Math.sin(state.t * 0.6) * 0.04);
    if (remnantShell.visible) remnantShell.scale.setScalar(1 + Math.sin(state.t * 0.8) * 0.05);
    if (accretionRing.visible) accretionRing.rotation.z += dt * 0.5;

    core.rotation.y += dt * 0.15;
  },

  onEnter() {},
  onExit() {},
};
