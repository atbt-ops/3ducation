import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
const dnaIllustration = new URL("../assets/illustrations/dna.jpg", import.meta.url).href;

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.68, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);

const RISE = 0.42; // vertical gap per base pair
const TWIST = 0.6; // radians per base pair
const RADIUS = 1.1;

const PAIRS = ["AT", "TA", "GC", "CG", "AT", "GC", "TA", "CG", "GC", "AT", "TA", "GC"];
const BASE_COLOR = { A: 0xd9503f, T: 0xe3b23c, G: 0x3f7fd9, C: 0x4fa032 };

const state = { pairs: 12, unzip: 0, spin: true };

const backboneA = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x8a5f22 }));
const backboneB = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x8a5f22 }));
group.add(backboneA, backboneB);

let rungs = [];
function build() {
  rungs.forEach((r) => group.remove(r));
  rungs = [];
  const n = state.pairs;
  const aPts = [];
  const bPts = [];
  const yMid = ((n - 1) * RISE) / 2;

  for (let i = 0; i < n; i++) {
    const y = i * RISE - yMid;
    const ang = i * TWIST;
    const open = state.unzip * RADIUS * 0.9;
    const a = new THREE.Vector3(Math.cos(ang) * RADIUS - open, y, Math.sin(ang) * RADIUS);
    const b = new THREE.Vector3(Math.cos(ang + Math.PI) * RADIUS + open, y, Math.sin(ang + Math.PI) * RADIUS);
    aPts.push(a);
    bPts.push(b);

    const pair = PAIRS[i % PAIRS.length];
    const rung = new THREE.Group();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    [
      [a, mid, pair[0]],
      [b, mid, pair[1]],
    ].forEach(([p1, p2, base]) => {
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, dir.length(), 8),
        new THREE.MeshStandardMaterial({ color: BASE_COLOR[base], roughness: 0.45 })
      );
      bar.position.copy(p1).add(p2).multiplyScalar(0.5);
      bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      rung.add(bar);
    });
    group.add(rung);
    rungs.push(rung);
  }
  backboneA.geometry.setFromPoints(aPts);
  backboneB.geometry.setFromPoints(bPts);
}
build();

const els = {};

export default {
  id: "dna",
  name: "DNA double helix",
  tag: "Biology · Genetics",
  subject: "Biology",
  grades: [9, 12],
  video: { id: "34Jr2U7KwOE", title: "DNA structure and replication (Khan Academy)" },
  blurb: "Twist the ladder, watch A pair with T.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 6c0 8 12 8 12 16s-12 8-12 16M26 6c0 8-12 8-12 16s12 8 12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 13h10M15 27h10" stroke="currentColor" stroke-width="2"/></svg>',
  illustration: {
    src: dnaIllustration,
    alt: "Diagram of a DNA double helix, showing the twisted sugar-phosphate backbone and paired bases connecting the two strands.",
    caption: "<b>Reference diagram</b> — the same twisted backbone and base pairs from the 3D model above.",
  },
  scene,
  view: { target: [0, 0, 0], radius: 9, theta: 0.6, phi: 1.25, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>DNA is a twisted ladder. The two side rails are sugar-phosphate <strong>backbones</strong>; each
    rung is a pair of <strong>bases</strong> reaching in from opposite strands.</p>
    <p>The pairing is strict: <span class="mono">A</span> only bonds with <span class="mono">T</span>,
    and <span class="mono">G</span> only with <span class="mono">C</span>. So one strand is a template
    for the other — which is how DNA copies itself. Pull the strands apart (unzip) and each half can
    rebuild its missing partner.</p>
  `,

  quiz: [
    { q: "In DNA, adenine (A) always pairs with…", choices: ["guanine (G)", "cytosine (C)", "thymine (T)", "another A"], answer: 2, explain: "A–T and G–C are the only base pairs." },
    { q: "If one strand reads G–A–T–C, its partner strand reads…", choices: ["G–A–T–C", "C–T–A–G", "C–A–T–G", "T–G–C–A"], answer: 1, explain: "Each base is replaced by its complement: G→C, A→T, T→A, C→G." },
    { q: "The two rails of the DNA ladder are made of…", choices: ["bases", "sugar and phosphate", "protein", "water"], answer: 1, explain: "The backbone alternates sugar and phosphate groups." },
  ],

  presets: [
    { label: "Relaxed ladder", note: "Fewer turns — you can see the base pairs face-on.", values: { "dna-pairs": 6, "dna-unzip": 0 } },
    { label: "Full helix", note: "Twelve base pairs make roughly one full turn of the helix.", values: { "dna-pairs": 12, "dna-unzip": 0 } },
    { label: "Unzipping", note: "The strands peel apart — each exposed base will pair with a fresh nucleotide.", values: { "dna-unzip": 1 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>A–T &nbsp; G–C</span></div>
      <div class="control"><div class="row"><label for="dna-pairs">Base pairs</label><output id="dna-pairsval" for="dna-pairs"></output></div>
        <input type="range" id="dna-pairs" min="4" max="12" step="1" value="${state.pairs}"></div>
      <div class="control"><div class="row"><label for="dna-unzip">Unzip</label><output id="dna-unzipval" for="dna-unzip"></output></div>
        <input type="range" id="dna-unzip" min="0" max="1" step="0.02" value="${state.unzip}"></div>
      <p class="fact"><strong style="color:#d9503f">A</strong> adenine ·
        <strong style="color:#e3b23c">T</strong> thymine ·
        <strong style="color:#3f7fd9">G</strong> guanine ·
        <strong style="color:#4fa032">C</strong> cytosine</p>
      <div class="btn-row"><button class="btn" id="dna-spin" type="button" aria-pressed="${state.spin}">Spin: ${state.spin ? "on" : "off"}</button></div>
    `;
  },

  wire(root) {
    els.pairs = root.querySelector("#dna-pairs");
    els.pairsval = root.querySelector("#dna-pairsval");
    els.unzip = root.querySelector("#dna-unzip");
    els.unzipval = root.querySelector("#dna-unzipval");
    els.spin = root.querySelector("#dna-spin");

    const sync = () => {
      els.pairsval.textContent = String(state.pairs);
      els.unzipval.textContent = `${Math.round(state.unzip * 100)}%`;
    };
    els.pairs.addEventListener("input", () => {
      state.pairs = parseInt(els.pairs.value, 10);
      sync();
      build();
    });
    els.unzip.addEventListener("input", () => {
      state.unzip = parseFloat(els.unzip.value);
      sync();
      build();
    });
    els.spin.addEventListener("click", () => {
      state.spin = !state.spin;
      els.spin.textContent = `Spin: ${state.spin ? "on" : "off"}`;
      els.spin.setAttribute("aria-pressed", String(state.spin));
    });
    sync();
  },

  update(dt, viewer) {
    if (state.spin && !viewer.dragging) group.rotation.y += dt * 0.35;
  },

  onEnter() {
    group.rotation.y = 0;
  },
  onExit() {},
};
