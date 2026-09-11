import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.8 });
scene.add(contactShadow({ radius: 3.5, y: -1.05, opacity: 0.18 }));

const cold = new THREE.Color(0x2f6ea8);
const hot = new THREE.Color(0xc23b2b);
const mid = new THREE.Color(0xe8e2d0);

function tempColor(t) {
  // t in 0..1
  const c = new THREE.Color();
  if (t < 0.5) c.copy(cold).lerp(mid, t * 2);
  else c.copy(mid).lerp(hot, (t - 0.5) * 2);
  return c;
}

const blockA = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshStandardMaterial({ roughness: 0.6 }));
const blockB = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshStandardMaterial({ roughness: 0.6 }));
scene.add(blockA, blockB);

const state = { tA: 80, tB: 10, mA: 1, mB: 1, contact: false, curA: 80, curB: 10 };

function equilibrium() {
  return (state.mA * state.tA + state.mB * state.tB) / (state.mA + state.mB);
}

function layout() {
  blockA.scale.setScalar(Math.cbrt(state.mA));
  blockB.scale.setScalar(Math.cbrt(state.mB));
  const gap = state.contact ? 0.02 : 0.5;
  blockA.position.set(-0.7 * blockA.scale.x - gap, 0, 0);
  blockB.position.set(0.7 * blockB.scale.x + gap, 0, 0);
  blockA.material.color.copy(tempColor(state.curA / 100));
  blockB.material.color.copy(tempColor(state.curB / 100));
}
layout();

const els = {};

export default {
  id: "heat",
  name: "Heat flow",
  tag: "Physics · Thermal",
  subject: "Physics",
  grades: [7, 11],
  blurb: "Touch a hot block to a cold one — watch them meet.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="12" width="12" height="16" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="22" y="12" width="12" height="16" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M18 20h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8, theta: 0.6, phi: 1.15, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>Heat always flows from <strong>hot to cold</strong>, never the other way, until both objects
    reach the same temperature — <strong>thermal equilibrium</strong>.</p>
    <p>Where they end up isn't the simple average: a bigger object has more stuff to heat or cool, so
    it pulls the final temperature toward itself. The energy the hot block loses exactly equals what
    the cold block gains: <span class="mono">m₁·(T₁ − T_f) = m₂·(T_f − T₂)</span>.</p>
  `,

  quiz: [
    { q: "Heat flows…", choices: ["from cold to hot", "from hot to cold", "in whichever direction is faster", "only when you stir it"], answer: 1, explain: "Always hot → cold, until temperatures equalise." },
    { q: "A large hot block touches a small cold one. The final temperature is…", choices: ["exactly halfway", "closer to the large block's start", "closer to the small block's start", "colder than both"], answer: 1, explain: "The larger mass has more thermal energy, so it dominates the mix." },
    { q: "At thermal equilibrium, the two objects have equal…", choices: ["mass", "energy", "temperature", "colour"], answer: 2, explain: "Equal temperature is the definition of thermal equilibrium." },
  ],

  presets: [
    { label: "Equal blocks", note: "Same size — the final temperature is the plain average.", values: { "ht-ta": 80, "ht-tb": 20, "ht-ma": 1, "ht-mb": 1 } },
    { label: "Big cold, small hot", note: "The large cold block barely warms; the small hot one plunges.", values: { "ht-ta": 90, "ht-tb": 10, "ht-ma": 0.4, "ht-mb": 3 } },
    { label: "Tiny difference", note: "Nearly the same temperature — very little heat moves.", values: { "ht-ta": 55, "ht-tb": 45 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>equilibrium T</span><b class="mono" id="ht-eq">—</b></div>
      <div class="control"><div class="row"><label for="ht-ta">Left temp</label><output id="ht-taval" for="ht-ta"></output></div>
        <input type="range" id="ht-ta" min="0" max="100" step="1" value="${state.tA}"></div>
      <div class="control"><div class="row"><label for="ht-tb">Right temp</label><output id="ht-tbval" for="ht-tb"></output></div>
        <input type="range" id="ht-tb" min="0" max="100" step="1" value="${state.tB}"></div>
      <div class="control"><div class="row"><label for="ht-ma">Left mass</label><output id="ht-maval" for="ht-ma"></output></div>
        <input type="range" id="ht-ma" min="0.3" max="3" step="0.1" value="${state.mA}"></div>
      <div class="control"><div class="row"><label for="ht-mb">Right mass</label><output id="ht-mbval" for="ht-mb"></output></div>
        <input type="range" id="ht-mb" min="0.3" max="3" step="0.1" value="${state.mB}"></div>
      <div class="btn-row">
        <button class="btn primary" id="ht-go" type="button">Bring into contact</button>
        <button class="btn" id="ht-reset" type="button">Separate</button>
      </div>
    `;
  },

  wire(root) {
    els.ta = root.querySelector("#ht-ta");
    els.tb = root.querySelector("#ht-tb");
    els.ma = root.querySelector("#ht-ma");
    els.mb = root.querySelector("#ht-mb");
    els.taval = root.querySelector("#ht-taval");
    els.tbval = root.querySelector("#ht-tbval");
    els.maval = root.querySelector("#ht-maval");
    els.mbval = root.querySelector("#ht-mbval");
    els.eq = root.querySelector("#ht-eq");
    els.go = root.querySelector("#ht-go");
    els.reset = root.querySelector("#ht-reset");

    const sync = () => {
      els.taval.textContent = `${state.tA}°`;
      els.tbval.textContent = `${state.tB}°`;
      els.maval.textContent = `${state.mA.toFixed(1)} kg`;
      els.mbval.textContent = `${state.mB.toFixed(1)} kg`;
      els.eq.textContent = `${equilibrium().toFixed(1)}°`;
      if (!state.contact) {
        state.curA = state.tA;
        state.curB = state.tB;
      }
      layout();
    };
    const setC = (on) => {
      state.contact = on;
      if (!on) {
        state.curA = state.tA;
        state.curB = state.tB;
      }
      layout();
    };
    [els.ta, els.tb, els.ma, els.mb].forEach((el, i) => {
      el.addEventListener("input", () => {
        const v = parseFloat(el.value);
        if (i === 0) state.tA = v;
        else if (i === 1) state.tB = v;
        else if (i === 2) state.mA = v;
        else state.mB = v;
        state.contact = false;
        sync();
      });
    });
    els.go.addEventListener("click", () => setC(true));
    els.reset.addEventListener("click", () => setC(false));
    sync();
  },

  update(dt) {
    if (state.contact) {
      const target = equilibrium();
      const rate = 0.7 * Math.min(dt, 0.05);
      state.curA += (target - state.curA) * rate;
      state.curB += (target - state.curB) * rate;
    }
    layout();
  },

  onEnter() {
    state.contact = false;
    state.curA = state.tA;
    state.curB = state.tB;
  },
  onExit() {},
};
