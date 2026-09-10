import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.64, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);
scene.add(contactShadow({ radius: 4, y: -1.35, opacity: 0.18 }));

const RAMP_LEN = 5;
const ramp = new THREE.Mesh(
  new THREE.BoxGeometry(RAMP_LEN, 0.25, 2),
  new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.7, metalness: 0.15 })
);
group.add(ramp);

const wedge = new THREE.Mesh(
  new THREE.BoxGeometry(0.25, 3, 2),
  new THREE.MeshStandardMaterial({ color: 0x63665a, roughness: 0.8 })
);
group.add(wedge);

const block = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x0f6b63, roughness: 0.4 })
);
group.add(block);

const arrowDown = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, 0xb1520b, 0.25, 0.15);
const arrowSlope = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0x0f6b63, 0.25, 0.15);
group.add(arrowDown, arrowSlope);

const g = 9.8;
const state = { angle: 20, mu: 0.4, mass: 2, s: 0, v: 0, sliding: false };

function geometry() {
  const a = (state.angle * Math.PI) / 180;
  group.rotation.z = 0;
  ramp.rotation.z = a;
  ramp.position.set(0, 0, 0);
  wedge.rotation.z = 0;
  wedge.position.set(-RAMP_LEN / 2 + 0.1, -1.5 + (Math.sin(a) * RAMP_LEN) / 2, 0);
  wedge.scale.y = Math.max(0.05, (Math.sin(a) * RAMP_LEN) / 3);

  const along = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  const normal = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0);
  const top = new THREE.Vector3(-Math.cos(a) * RAMP_LEN * 0.42, -Math.sin(a) * RAMP_LEN * 0.42, 0);
  const p = top.clone().add(along.clone().multiplyScalar(state.s)).add(normal.clone().multiplyScalar(0.53));
  block.position.copy(p);
  block.rotation.z = a;

  arrowDown.position.copy(p);
  arrowDown.setLength(0.5 + state.mass * 0.25, 0.2, 0.13);
  arrowSlope.position.copy(p);
  arrowSlope.setDirection(along.clone().negate());
  arrowSlope.setLength(Math.max(0.1, g * Math.sin(a) * state.mass * 0.06), 0.2, 0.13);
}
geometry();

const els = {};

function forces() {
  const a = (state.angle * Math.PI) / 180;
  const driving = state.mass * g * Math.sin(a);
  const maxStatic = state.mu * state.mass * g * Math.cos(a);
  return { driving, maxStatic, slides: driving > maxStatic, a };
}

export default {
  id: "incline",
  name: "Ramp & friction",
  tag: "Physics · Forces",
  subject: "Physics",
  grades: [9, 12],
  blurb: "Tilt the ramp until the block gives way.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 32h30L5 14z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="16" y="16" width="7" height="7" rx="1" fill="currentColor" transform="rotate(-31 19.5 19.5)"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 9, theta: 0.15, phi: 1.35, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>On a ramp, gravity splits into two parts: one pressing the block <em>into</em> the surface
    (<span class="mono">mg·cos θ</span>) and one pulling it <em>down the slope</em>
    (<span class="mono">mg·sin θ</span>).</p>
    <p>Friction resists sliding, up to a maximum of <span class="mono">μ·mg·cos θ</span>. The block
    stays put while that maximum beats the driving force. Tip the ramp past the angle where
    <span class="mono">tan θ = μ</span> and it slips — note that the mass cancels out of that
    condition entirely.</p>
  `,

  quiz: [
    { q: "The component of gravity pulling a block down a slope of angle θ is…", choices: ["mg", "mg·cos θ", "mg·sin θ", "μmg"], answer: 2, explain: "sin θ resolves gravity along the slope; cos θ resolves it into the surface." },
    { q: "A block starts to slide when tan θ exceeds…", choices: ["the mass m", "the coefficient of friction μ", "gravity g", "1"], answer: 1, explain: "mg·sin θ > μmg·cos θ  →  tan θ > μ. Mass cancels." },
    { q: "Doubling the block's mass changes the angle at which it slips…", choices: ["it doubles", "it halves", "not at all", "it depends on g"], answer: 2, explain: "The slip condition tan θ > μ has no mass in it." },
  ],

  presets: [
    { label: "Rough & shallow", note: "High friction, gentle slope — the block holds firmly.", values: { "in-angle": 12, "in-mu": 0.7 } },
    { label: "At the tipping point", note: "θ ≈ arctan μ — the block is on the edge of sliding.", values: { "in-angle": 22, "in-mu": 0.4 } },
    { label: "Steep & slippery", note: "Low friction, steep ramp — it slides away.", values: { "in-angle": 40, "in-mu": 0.15 } },
    { label: "Frictionless", note: "μ = 0: any tilt at all sends it sliding.", values: { "in-angle": 25, "in-mu": 0 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>slides when tan θ &gt; μ</span><b class="mono" id="in-state">—</b></div>
      <div class="control"><div class="row"><label for="in-angle">Ramp angle θ</label><output id="in-angleval" for="in-angle"></output></div>
        <input type="range" id="in-angle" min="0" max="55" step="1" value="${state.angle}"></div>
      <div class="control"><div class="row"><label for="in-mu">Friction μ</label><output id="in-muval" for="in-mu"></output></div>
        <input type="range" id="in-mu" min="0" max="0.9" step="0.02" value="${state.mu}"></div>
      <div class="control"><div class="row"><label for="in-mass">Mass</label><output id="in-massval" for="in-mass"></output></div>
        <input type="range" id="in-mass" min="0.5" max="5" step="0.1" value="${state.mass}"></div>
      <dl class="stat-grid">
        <div><dt>Down-slope pull</dt><dd class="mono" id="in-drive">—</dd></div>
        <div><dt>Max friction</dt><dd class="mono" id="in-fric">—</dd></div>
      </dl>
      <div class="btn-row"><button class="btn" id="in-reset" type="button">Reset block</button></div>
    `;
  },

  wire(root) {
    els.angle = root.querySelector("#in-angle");
    els.mu = root.querySelector("#in-mu");
    els.mass = root.querySelector("#in-mass");
    els.angleval = root.querySelector("#in-angleval");
    els.muval = root.querySelector("#in-muval");
    els.massval = root.querySelector("#in-massval");
    els.state = root.querySelector("#in-state");
    els.drive = root.querySelector("#in-drive");
    els.fric = root.querySelector("#in-fric");
    els.reset = root.querySelector("#in-reset");

    const sync = () => {
      const f = forces();
      els.angleval.textContent = `${Math.round(state.angle)}°`;
      els.muval.textContent = state.mu.toFixed(2);
      els.massval.textContent = `${state.mass.toFixed(1)} kg`;
      els.drive.textContent = `${f.driving.toFixed(1)} N`;
      els.fric.textContent = `${f.maxStatic.toFixed(1)} N`;
      els.state.textContent = f.slides ? "sliding" : "held";
      state.s = 0;
      state.v = 0;
      state.sliding = false;
      geometry();
    };
    els.angle.addEventListener("input", () => ((state.angle = +els.angle.value), sync()));
    els.mu.addEventListener("input", () => ((state.mu = +els.mu.value), sync()));
    els.mass.addEventListener("input", () => ((state.mass = +els.mass.value), sync()));
    els.reset.addEventListener("click", sync);
    sync();
  },

  update(dt) {
    const f = forces();
    if (f.slides) {
      const acc = (f.driving - f.maxStatic) / state.mass;
      state.v += acc * Math.min(dt, 0.05);
      state.s += state.v * Math.min(dt, 0.05);
      if (state.s > RAMP_LEN * 0.84) {
        state.s = 0;
        state.v = 0;
      }
    }
    geometry();
  },

  onEnter() {
    state.s = 0;
    state.v = 0;
  },
  onExit() {},
};
