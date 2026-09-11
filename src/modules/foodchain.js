import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);

const LEVELS = [
  { name: "Producers", ex: "Grass", color: 0x4fa032 },
  { name: "Primary consumers", ex: "Grasshopper", color: 0xc9931f },
  { name: "Secondary consumers", ex: "Frog", color: 0xb1520b },
  { name: "Tertiary consumers", ex: "Hawk", color: 0xc23b2b },
];

const state = { start: 10000 };
let tiers = [];

function energyAt(i) {
  return state.start * Math.pow(0.1, i);
}

function build() {
  tiers.forEach((t) => group.remove(t));
  tiers = [];
  const maxW = 4.6;
  let y = -1.6;
  LEVELS.forEach((lvl, i) => {
    const e = energyAt(i);
    const w = Math.max(0.4, maxW * Math.pow(e / state.start, 0.33));
    const h = 0.8;
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.6), new THREE.MeshStandardMaterial({ color: lvl.color, roughness: 0.5 }));
    box.position.set(0, y + h / 2, 0);
    group.add(box);
    tiers.push(box);
    y += h + 0.08;
  });
}
build();

const els = {};

export default {
  id: "foodchain",
  name: "Energy pyramid",
  tag: "Biology · Ecosystems",
  subject: "Biology",
  grades: [6, 10],
  blurb: "Only 10% of energy passes up each level.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6l14 28H6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M11 24h18M14.5 17h11" stroke="currentColor" stroke-width="1.6"/></svg>',
  scene,
  view: { target: [0, 0.6, 0], radius: 8, theta: 0.5, phi: 1.15, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>Energy flows through an ecosystem in one direction: from sunlight, into plants
    (<strong>producers</strong>), into the animals that eat them, and on up the chain. But at every
    step, most of it is lost — used up for movement, warmth, and everyday living.</p>
    <p>Only about <strong>10%</strong> of the energy at one level makes it into the next
    (<em>the 10% rule</em>). That's why food chains rarely have more than four or five links, and why
    there are always far more producers than top predators — the pyramid narrows fast.</p>
  `,

  quiz: [
    { q: "Roughly what fraction of energy transfers from one trophic level to the next?", choices: ["90%", "50%", "10%", "1%"], answer: 2, explain: "The 10% rule: most energy is lost as heat and activity at each step." },
    { q: "Why are top predators always rare compared to plants?", choices: ["they eat less", "energy shrinks by ~90% at each level, so little remains to support them", "they are hunted", "plants reproduce slower"], answer: 1, explain: "By the top of the pyramid there's only a tiny fraction of the original energy left." },
    { q: "The ultimate source of energy for almost every food chain is…", choices: ["the soil", "the Sun", "water", "other animals"], answer: 1, explain: "Producers capture sunlight; everything else depends on that first step." },
  ],

  presets: [
    { label: "Grassland (10,000 kcal)", note: "Grass → grasshopper → frog → hawk.", values: { "fc-start": 10000 } },
    { label: "Smaller patch (1,000 kcal)", note: "Same shape, smaller pyramid — same 10% rule.", values: { "fc-start": 1000 } },
  ],

  panelHTML() {
    const rows = LEVELS.map(
      (lvl, i) => `
      <div class="pt-cat"><span class="pt-dot" style="background:#${lvl.color.toString(16).padStart(6, "0")}"></span>
      ${lvl.name} (${lvl.ex}) — <b class="mono" id="fc-e${i}"></b></div>`
    ).join("");
    return `
      <div class="control"><div class="row"><label for="fc-start">Starting energy (producers)</label><output id="fc-startval" for="fc-start"></output></div>
        <input type="range" id="fc-start" min="500" max="20000" step="500" value="${state.start}"></div>
      <div class="section-label">Trophic levels</div>
      <div class="pt-cats">${rows}</div>
    `;
  },

  wire(root) {
    els.start = root.querySelector("#fc-start");
    els.startval = root.querySelector("#fc-startval");
    const sync = () => {
      els.startval.textContent = `${state.start.toLocaleString()} kcal`;
      LEVELS.forEach((_, i) => {
        const el = root.querySelector(`#fc-e${i}`);
        if (el) el.textContent = `${Math.round(energyAt(i)).toLocaleString()} kcal`;
      });
      build();
    };
    els.start.addEventListener("input", () => ((state.start = +els.start.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
