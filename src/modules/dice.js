import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

function pip(x, y) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0x1c1c1f }));
  m.position.set(x, y, 0.251);
  return m;
}
const PIP_LAYOUT = {
  1: [[0, 0]],
  2: [[-0.13, 0.13], [0.13, -0.13]],
  3: [[-0.15, 0.15], [0, 0], [0.15, -0.15]],
  4: [[-0.13, 0.13], [0.13, 0.13], [-0.13, -0.13], [0.13, -0.13]],
  5: [[-0.13, 0.13], [0.13, 0.13], [0, 0], [-0.13, -0.13], [0.13, -0.13]],
  6: [[-0.13, 0.15], [0.13, 0.15], [-0.13, 0], [0.13, 0], [-0.13, -0.15], [0.13, -0.15]],
};

function makeDie() {
  const g = new THREE.Group();
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.4 })
  );
  g.add(cube);
  g.userData.pips = new THREE.Group();
  g.add(g.userData.pips);
  return g;
}
function showFace(die, n) {
  const p = die.userData.pips;
  while (p.children.length) p.remove(p.children[0]);
  (PIP_LAYOUT[n] || []).forEach(([x, y]) => p.add(pip(x, y)));
}

const dice = [makeDie(), makeDie(), makeDie()];
dice.forEach((d, i) => {
  d.position.set((i - 1) * 0.9, 2.4, 0);
  group.add(d);
});

const state = { count: 2, rolling: false, spin: 0 };
let counts = {};
let bars = [];

function bounds() {
  return { lo: state.count, hi: state.count * 6 };
}

function rebuildBars() {
  bars.forEach((b) => group.remove(b));
  bars = [];
  counts = {};
  const { lo, hi } = bounds();
  const span = hi - lo;
  for (let s = lo; s <= hi; s++) {
    counts[s] = 0;
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 1, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x0f6b63, roughness: 0.4 })
    );
    b.position.set((s - lo - span / 2) * 0.5, -1.5, 0);
    b.scale.y = 0.02;
    group.add(b);
    bars.push(b);
  }
}
rebuildBars();

function roll(times) {
  for (let k = 0; k < times; k++) {
    let sum = 0;
    for (let d = 0; d < state.count; d++) sum += 1 + Math.floor(Math.random() * 6);
    counts[sum]++;
    if (k === times - 1) {
      dice.forEach((die, i) => {
        die.visible = i < state.count;
        if (i < state.count) showFace(die, 1 + Math.floor(Math.random() * 6));
      });
    }
  }
  const max = Math.max(...Object.values(counts), 1);
  const { lo: L } = bounds();
  bars.forEach((b, i) => {
    const h = 0.02 + (counts[L + i] / max) * 4;
    b.scale.y = h;
    b.position.y = -1.5 + h / 2;
  });
}

const els = {};

export default {
  id: "dice",
  name: "Dice sums",
  tag: "Math · Probability",
  subject: "Math",
  grades: [6, 11],
  blurb: "Roll and roll — why 7 wins.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="7" width="26" height="26" rx="4" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="15" r="2" fill="currentColor"/><circle cx="25" cy="25" r="2" fill="currentColor"/><circle cx="20" cy="20" r="2" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0.3, 0], radius: 9, theta: 0.15, phi: 1.35, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>One die is fair — every face 1 to 6 is equally likely. But add <em>two</em> dice and the sums
    are not equal at all.</p>
    <p>There's only one way to roll a 2 (1+1) or a 12 (6+6), but six ways to roll a 7
    (1+6, 2+5, 3+4, 4+3, 5+2, 6+1). More combinations means higher probability, so the histogram piles
    up in the middle. Roll enough times and the bars settle into that exact triangular shape — the
    <strong>law of large numbers</strong>.</p>
  `,

  quiz: [
    { q: "Rolling two dice, which sum is most likely?", choices: ["2", "6", "7", "12"], answer: 2, explain: "7 has six combinations; 2 and 12 have only one each." },
    { q: "The probability of rolling a 7 with two dice is…", choices: ["1/6", "1/12", "1/36", "6/36 = 1/6"], answer: 3, explain: "6 favourable outcomes out of 36 total." },
    { q: "As you roll more and more times, the experimental results…", choices: ["stay random forever", "approach the theoretical probabilities", "always hit exactly the average", "become less predictable"], answer: 1, explain: "The law of large numbers: the average of many trials converges." },
  ],

  presets: [
    { label: "One die", note: "Flat — every value 1–6 is equally likely.", values: { "dc-count": 1 } },
    { label: "Two dice", note: "The classic triangle, peaking at 7.", values: { "dc-count": 2 } },
    { label: "Three dice", note: "Sums 3–18; the shape rounds toward a bell curve.", values: { "dc-count": 3 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="dc-count">Number of dice</label><output id="dc-countval" for="dc-count"></output></div>
        <input type="range" id="dc-count" min="1" max="3" step="1" value="${state.count}"></div>
      <div class="btn-row">
        <button class="btn primary" id="dc-roll" type="button">Roll 200</button>
        <button class="btn" id="dc-clear" type="button">Clear</button>
      </div>
      <p class="fact">Bars show how often each total has come up.</p>
    `;
  },

  wire(root) {
    els.count = root.querySelector("#dc-count");
    els.countval = root.querySelector("#dc-countval");
    els.roll = root.querySelector("#dc-roll");
    els.clear = root.querySelector("#dc-clear");

    els.countval.textContent = String(state.count);
    els.count.addEventListener("input", () => {
      state.count = +els.count.value;
      els.countval.textContent = String(state.count);
      rebuildBars();
    });
    els.roll.addEventListener("click", () => roll(200));
    els.clear.addEventListener("click", rebuildBars);
  },

  update(dt) {
    state.spin += dt;
    dice.forEach((d, i) => {
      if (i < state.count) d.rotation.set(state.spin * 0.6 + i, state.spin * 0.4 + i, 0);
    });
  },

  onEnter() {
    rebuildBars();
  },
  onExit() {},
};
