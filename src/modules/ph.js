import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.75 });
scene.add(contactShadow({ radius: 2.6, y: -1.55, opacity: 0.16 }));

const beaker = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1, 1, 2.4, 32, 1, true),
  new THREE.MeshPhysicalMaterial({ color: 0xdddddd, transmission: 0.7, transparent: true, opacity: 0.3, roughness: 0.05, side: THREE.DoubleSide })
);
beaker.position.y = -0.2;
scene.add(beaker);

const liquid = new THREE.Mesh(
  new THREE.CylinderGeometry(1.02, 0.92, 1.7, 32),
  new THREE.MeshStandardMaterial({ color: 0x4fa032, roughness: 0.25, transparent: true, opacity: 0.9 })
);
liquid.position.y = -0.55;
scene.add(liquid);

// universal-indicator colour ramp by pH 0..14
const STOPS = [
  [0, 0xd11f1f], [2, 0xe0531c], [4, 0xe0a81c], [6, 0xc9d21c],
  [7, 0x4fa032], [8, 0x2fae7a], [10, 0x2f7fae], [12, 0x3f4fae], [14, 0x6d3fae],
];
function phColor(ph) {
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (ph >= STOPS[i][0] && ph <= STOPS[i + 1][0]) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const t = (ph - a[0]) / (b[0] - a[0] || 1);
  return new THREE.Color(a[1]).lerp(new THREE.Color(b[1]), t);
}

const state = { ph: 7 };
function apply() {
  liquid.material.color.copy(phColor(state.ph));
}
apply();

const els = {};

export default {
  id: "ph",
  name: "The pH scale",
  tag: "Chemistry · Acids & bases",
  subject: "Chemistry",
  grades: [7, 12],
  blurb: "Slide from lemon juice to drain cleaner.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 6h12M16 6v10L9 30a3 3 0 0 0 3 4h16a3 3 0 0 0 3-4l-7-14V6" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 24h16" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, -0.3, 0], radius: 7, theta: 0.55, phi: 1.15, minRadius: 3.5, maxRadius: 13 },

  lesson: `
    <p>The pH scale measures how acidic or basic a solution is — really, how many hydrogen ions
    (<span class="mono">H⁺</span>) are floating in it. Low pH = lots of H⁺ = acidic; high pH = very
    few = basic (alkaline); <span class="mono">pH 7</span> is neutral, like pure water.</p>
    <p>It's a <strong>logarithmic</strong> scale: each step is a ten-fold change. pH 3 isn't twice as
    acidic as pH 6 — it's a thousand times. Universal indicator shows it as a colour, red through
    green to purple.</p>
  `,

  quiz: [
    { q: "A solution of pH 3 is…", choices: ["basic", "neutral", "acidic", "salty"], answer: 2, explain: "Anything below 7 is acidic; the lower the number, the stronger the acid." },
    { q: "How much more acidic is pH 4 than pH 6?", choices: ["1.5 times", "2 times", "20 times", "100 times"], answer: 3, explain: "The scale is logarithmic: each unit is ×10, so two units is ×100." },
    { q: "Pure water has a pH of…", choices: ["0", "7", "10", "14"], answer: 1, explain: "pH 7 is neutral — equal H⁺ and OH⁻." },
  ],

  presets: [
    { label: "Lemon juice (2)", note: "A strong household acid — citric acid.", values: { "ph-val": 2 } },
    { label: "Black coffee (5)", note: "Weakly acidic.", values: { "ph-val": 5 } },
    { label: "Pure water (7)", note: "Neutral — the middle of the scale.", values: { "ph-val": 7 } },
    { label: "Baking soda (9)", note: "Mildly basic — used to neutralise acids.", values: { "ph-val": 9 } },
    { label: "Drain cleaner (14)", note: "A powerful base — dangerously corrosive.", values: { "ph-val": 14 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="ph-label">Neutral</span><b class="mono" id="ph-num">7.0</b></div>
      <div class="control"><div class="row"><label for="ph-val">pH</label><output id="ph-valout" for="ph-val"></output></div>
        <input type="range" id="ph-val" min="0" max="14" step="0.1" value="${state.ph}"></div>
      <p class="fact" id="ph-conc">—</p>
    `;
  },

  wire(root) {
    els.val = root.querySelector("#ph-val");
    els.valout = root.querySelector("#ph-valout");
    els.label = root.querySelector("#ph-label");
    els.num = root.querySelector("#ph-num");
    els.conc = root.querySelector("#ph-conc");

    const sync = () => {
      els.valout.textContent = state.ph.toFixed(1);
      els.num.textContent = state.ph.toFixed(1);
      els.label.textContent = state.ph < 6.5 ? "Acidic" : state.ph > 7.5 ? "Basic" : "Neutral";
      const conc = Math.pow(10, -state.ph);
      els.conc.textContent = `[H⁺] ≈ ${conc.toExponential(1)} mol/L`;
      apply();
    };
    els.val.addEventListener("input", () => ((state.ph = +els.val.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
