import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.85, dir: 0.85, rim: 0.3 });

const COLS = 5; // 5 towers of ten = up to 50
const ROWS = 10;
const MAX = COLS * ROWS;
const CUBE = 0.42;
const GAP_X = 1.15;
const GAP_Y = 0.48;

const cubeGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
const cubes = [];
for (let col = 0; col < COLS; col++) {
  for (let row = 0; row < ROWS; row++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a8fc0,
      roughness: 0.6,
      emissive: 0x2a5f8a,
      emissiveIntensity: 0.08,
    });
    const cube = new THREE.Mesh(cubeGeo, mat);
    cube.position.set((col - (COLS - 1) / 2) * GAP_X, row * GAP_Y - 2.1, 0);
    cube.visible = false;
    scene.add(cube);
    cubes.push(cube);
  }
}

const state = { count: 7, t: 0 };
const els = {};

function sync() {
  const tens = Math.floor(state.count / 10);
  const ones = state.count % 10;
  cubes.forEach((cube, i) => (cube.visible = i < state.count));
  if (els.big) {
    els.big.textContent = String(state.count);
    els.breakdown.textContent =
      tens > 0 ? `${tens} ten${tens > 1 ? "s" : ""} and ${ones} one${ones === 1 ? "" : "s"}` : `${ones} one${ones === 1 ? "" : "s"}`;
  }
}

export default {
  id: "counting",
  name: "Counting blocks",
  tag: "Math · Numbers",
  subject: "Math",
  grades: [1, 3],
  blurb: "Count blocks one by one and watch tens and ones build up.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="22" width="8" height="8" rx="1" stroke="currentColor" stroke-width="2"/><rect x="16" y="22" width="8" height="8" rx="1" stroke="currentColor" stroke-width="2"/><rect x="16" y="12" width="8" height="8" rx="1" stroke="currentColor" stroke-width="2"/><rect x="26" y="22" width="8" height="8" rx="1" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0.3, phi: 1.15, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>Every number is really a bunch of ones — but counting one by one gets slow, so we group
    them into <strong>tens</strong> to make big numbers easy to read. Ten ones make one ten. Ten
    tens make one hundred.</p>
    <p>Move the slider to add or remove blocks. Each glowing tower of ten blocks is one
    <strong>ten</strong>; any blocks left over in a half-finished tower are the <strong>ones</strong>.</p>
  `,

  quiz: [
    { q: "23 is made up of how many tens and ones?", choices: ["2 tens, 3 ones", "3 tens, 2 ones", "2 tens, 30 ones", "23 tens"], answer: 0, explain: "23 = 2 groups of ten (20) plus 3 leftover ones." },
    { q: "Which is bigger — 3 tens, or 2 tens and 5 ones?", choices: ["3 tens", "2 tens and 5 ones", "They are equal", "Can't tell"], answer: 0, explain: "3 tens = 30. 2 tens and 5 ones = 25. 30 is bigger." },
    { q: "How many ones make one ten?", choices: ["5", "10", "12", "20"], answer: 1, explain: "Ten ones grouped together make one ten." },
  ],

  presets: [
    { label: "Show 5", note: "Fewer than a full ten.", values: { "ct-count": 5 } },
    { label: "Show 23", note: "2 full towers plus 3 loose blocks.", values: { "ct-count": 23 } },
    { label: "Show 47", note: "4 full towers plus 7 loose blocks.", values: { "ct-count": 47 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>Count</span><b class="mono" id="ct-big">${state.count}</b></div>
      <p class="fact" id="ct-breakdown"></p>
      <div class="control"><div class="row"><label for="ct-count">How many blocks?</label><output id="ct-countval" for="ct-count"></output></div>
        <input type="range" id="ct-count" min="0" max="${MAX}" step="1" value="${state.count}"></div>
    `;
  },

  wire(root) {
    els.count = root.querySelector("#ct-count");
    els.countval = root.querySelector("#ct-countval");
    els.big = root.querySelector("#ct-big");
    els.breakdown = root.querySelector("#ct-breakdown");
    els.count.addEventListener("input", () => {
      state.count = Math.max(0, Math.min(MAX, Math.round(+els.count.value)));
      els.countval.textContent = String(state.count);
      sync();
    });
    els.countval.textContent = String(state.count);
    sync();
  },

  update(dt) {
    state.t += dt;
    cubes.forEach((cube, i) => {
      const col = Math.floor(i / ROWS);
      const towerComplete = state.count >= (col + 1) * ROWS;
      cube.material.emissiveIntensity = towerComplete ? 0.4 + Math.sin(state.t * 3) * 0.15 : 0.08;
    });
  },

  onEnter() {},
  onExit() {},
};
