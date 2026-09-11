import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.66, dir: 0.85 });
scene.add(contactShadow({ radius: 3.4, y: -1.55, opacity: 0.2 }));

const BEAM_LEN = 5.2;
const beam = new THREE.Mesh(
  new THREE.BoxGeometry(BEAM_LEN, 0.16, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.5 })
);
scene.add(beam);

const fulcrum = new THREE.Mesh(
  new THREE.ConeGeometry(0.4, 1.1, 4),
  new THREE.MeshStandardMaterial({ color: 0x63665a, roughness: 0.6 })
);
fulcrum.rotation.y = Math.PI / 4;
fulcrum.position.y = -0.6;
scene.add(fulcrum);

const loadBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xb1520b, roughness: 0.5 }));
const effortBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x0f6b63, roughness: 0.5 }));
scene.add(loadBox, effortBox);

const state = { fulcrumPos: 0, loadMass: 10, loadDist: 2, effortDist: 2 };

function requiredEffort() {
  return (state.loadMass * state.loadDist) / state.effortDist;
}

function layout() {
  const f = state.fulcrumPos; // -1 (left end) .. 1 (right end), pivot x position
  const pivotX = f * (BEAM_LEN / 2 - 0.3);
  fulcrum.position.x = pivotX;

  const torque = state.loadMass * state.loadDist - requiredEffort() * state.effortDist;
  const angle = Math.max(-0.28, Math.min(0.28, torque * 0.01));
  beam.position.set(pivotX, -0.02, 0);
  beam.rotation.z = -angle;

  // place load on the left side, effort on the right side, both measured from pivot along the beam
  const loadX = pivotX - state.loadDist * 0.7;
  const effortX = pivotX + state.effortDist * 0.7;
  const beamYat = (x) => -angle * (x - pivotX) + 0.08;

  loadBox.position.set(loadX, beamYat(loadX) + 0.4, 0);
  effortBox.position.set(effortX, beamYat(effortX) + 0.35, 0);
  loadBox.scale.setScalar(0.6 + Math.min(1.4, state.loadMass / 12));
}
layout();

const els = {};

export default {
  id: "levers",
  name: "Levers & balance",
  tag: "Physics · Simple machines",
  subject: "Physics",
  grades: [5, 9],
  blurb: "Move the fulcrum, lift more with less.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 16l28 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 22l-3 8h6z" fill="currentColor"/><rect x="4" y="12" width="5" height="5" fill="currentColor"/><rect x="31" y="19" width="4" height="4" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0.35, phi: 1.2, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>A lever balances when the <strong>turning effect</strong> (torque) on each side matches:
    <span class="mono">load × load-distance = effort × effort-distance</span>.</p>
    <p>Push the fulcrum closer to the load and its distance shrinks — so a much smaller effort force,
    applied further out, can lift it. That's the whole trick behind crowbars, wheelbarrows and
    see-saws: trade distance for force.</p>
  `,

  quiz: [
    { q: "A 20 kg load sits 1 m from the fulcrum. How much effort is needed 4 m away to balance it?", choices: ["5 kg", "20 kg", "80 kg", "4 kg"], answer: 0, explain: "20 × 1 = effort × 4, so effort = 5." },
    { q: "Moving the fulcrum closer to the load makes lifting it…", choices: ["harder", "easier", "impossible", "no different"], answer: 1, explain: "A shorter load-arm needs less effort for the same balance." },
    { q: "What stays the same on both sides of a balanced lever?", choices: ["the distances", "the masses", "load × distance on each side", "nothing"], answer: 2, explain: "That product — the torque — is what must match." },
  ],

  presets: [
    { label: "Fulcrum in the middle", note: "Equal arms — effort must equal the load.", values: { "lv-fulcrum": 0, "lv-load": 10, "lv-ld": 2, "lv-ed": 2 } },
    { label: "Crowbar", note: "Fulcrum near the load — huge mechanical advantage.", values: { "lv-fulcrum": -0.6, "lv-load": 10, "lv-ld": 0.8, "lv-ed": 3.5 } },
    { label: "Heavy load, long arm", note: "A big load is still manageable with enough distance.", values: { "lv-load": 24, "lv-ld": 1, "lv-ed": 4 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>load·d₁ = effort·d₂</span><b class="mono" id="lv-effort">—</b></div>
      <div class="control"><div class="row"><label for="lv-fulcrum">Fulcrum position</label><output id="lv-fulcrumval" for="lv-fulcrum"></output></div>
        <input type="range" id="lv-fulcrum" min="-0.8" max="0.8" step="0.02" value="${state.fulcrumPos}"></div>
      <div class="control"><div class="row"><label for="lv-load">Load mass</label><output id="lv-loadval" for="lv-load"></output></div>
        <input type="range" id="lv-load" min="1" max="30" step="1" value="${state.loadMass}"></div>
      <div class="control"><div class="row"><label for="lv-ld">Load distance</label><output id="lv-ldval" for="lv-ld"></output></div>
        <input type="range" id="lv-ld" min="0.5" max="3" step="0.1" value="${state.loadDist}"></div>
      <div class="control"><div class="row"><label for="lv-ed">Effort distance</label><output id="lv-edval" for="lv-ed"></output></div>
        <input type="range" id="lv-ed" min="0.5" max="3" step="0.1" value="${state.effortDist}"></div>
    `;
  },

  wire(root) {
    els.fulcrum = root.querySelector("#lv-fulcrum");
    els.load = root.querySelector("#lv-load");
    els.ld = root.querySelector("#lv-ld");
    els.ed = root.querySelector("#lv-ed");
    els.fulcrumval = root.querySelector("#lv-fulcrumval");
    els.loadval = root.querySelector("#lv-loadval");
    els.ldval = root.querySelector("#lv-ldval");
    els.edval = root.querySelector("#lv-edval");
    els.effort = root.querySelector("#lv-effort");

    const sync = () => {
      els.fulcrumval.textContent = state.fulcrumPos.toFixed(2);
      els.loadval.textContent = `${state.loadMass} kg`;
      els.ldval.textContent = `${state.loadDist.toFixed(1)} m`;
      els.edval.textContent = `${state.effortDist.toFixed(1)} m`;
      els.effort.textContent = `${requiredEffort().toFixed(1)} kg`;
      layout();
    };
    els.fulcrum.addEventListener("input", () => ((state.fulcrumPos = +els.fulcrum.value), sync()));
    els.load.addEventListener("input", () => ((state.loadMass = +els.load.value), sync()));
    els.ld.addEventListener("input", () => ((state.loadDist = +els.ld.value), sync()));
    els.ed.addEventListener("input", () => ((state.effortDist = +els.ed.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
