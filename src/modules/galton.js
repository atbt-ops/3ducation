import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

const ROWS_MAX = 12;
const SPACING = 0.62;
let rows = 9;

const pegMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.5 });
const pegGeo = new THREE.SphereGeometry(0.09, 10, 8);
let pegGroup = new THREE.Group();
group.add(pegGroup);

const binMat = new THREE.MeshStandardMaterial({ color: 0x0f6b63, roughness: 0.4 });
let bins = [];
let binCounts = [];
let binMeshes = [];

function topY() {
  return rows * SPACING + 1.4;
}

function buildBoard() {
  group.remove(pegGroup);
  pegGroup = new THREE.Group();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= r; c++) {
      const peg = new THREE.Mesh(pegGeo, pegMat);
      peg.position.set((c - r / 2) * SPACING, topY() - 1.4 - r * SPACING, 0);
      pegGroup.add(peg);
    }
  }
  group.add(pegGroup);

  binMeshes.forEach((m) => group.remove(m));
  binMeshes = [];
  bins = rows + 1;
  binCounts = new Array(bins).fill(0);
  const floorY = topY() - 1.4 - rows * SPACING - 0.4;
  for (let i = 0; i < bins; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(SPACING * 0.8, 0.1, 0.4), binMat);
    m.position.set((i - rows / 2) * SPACING, floorY, 0);
    m.scale.y = 0.2;
    group.add(m);
    binMeshes.push(m);
  }
}
buildBoard();

const balls = [];
const ballGeo = new THREE.SphereGeometry(0.11, 12, 10);
const ballMat = new THREE.MeshStandardMaterial({ color: 0xb1520b, roughness: 0.3 });

function drop(n) {
  for (let k = 0; k < n; k++) {
    const b = new THREE.Mesh(ballGeo, ballMat);
    b.position.set((Math.random() - 0.5) * 0.1, topY(), 0);
    b.userData = { vy: 0, row: 0, x: 0, done: false, delay: k * 0.05 };
    group.add(b);
    balls.push(b);
  }
}

function settle(b) {
  const idx = Math.max(0, Math.min(bins - 1, Math.round(b.userData.x + rows / 2)));
  binCounts[idx]++;
  const maxC = Math.max(...binCounts, 1);
  binMeshes[idx].scale.y = 0.2 + (binCounts[idx] / maxC) * 12;
  const floorY = topY() - 1.4 - rows * SPACING - 0.4;
  binMeshes[idx].position.y = floorY + (binMeshes[idx].scale.y * 0.1) / 2 - 0.05;
  group.remove(b);
}

const els = {};

export default {
  id: "galton",
  name: "Galton board",
  tag: "Math · Probability",
  subject: "Math",
  grades: [8, 12],
  blurb: "Drop beads, build a bell curve.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="8" r="1.6" fill="currentColor"/><circle cx="16" cy="15" r="1.6" fill="currentColor"/><circle cx="24" cy="15" r="1.6" fill="currentColor"/><circle cx="12" cy="22" r="1.6" fill="currentColor"/><circle cx="20" cy="22" r="1.6" fill="currentColor"/><circle cx="28" cy="22" r="1.6" fill="currentColor"/><path d="M8 34c3-10 21-10 24 0" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 1.5, 0], radius: 12, theta: 0.1, phi: 1.45, minRadius: 6, maxRadius: 22 },

  lesson: `
    <p>Each bead hits a row of pegs and bounces left or right — a coin flip — at every row. After
    <span class="mono">n</span> rows it has made n independent choices.</p>
    <p>Most beads land near the middle because there are many left-right sequences that roughly cancel
    out, and very few that go the same way every time. Pile up thousands and the shape that emerges is
    the <strong>normal distribution</strong> — the bell curve — the central limit theorem in wood and
    glass.</p>
  `,

  quiz: [
    { q: "At each peg, a bead is equally likely to go left or right. Landing far to one side is…", choices: ["common", "rare", "impossible", "guaranteed"], answer: 1, explain: "It needs a long run of the same choice — only one such path out of many." },
    { q: "The pile that builds up in the bins approaches which shape?", choices: ["a flat line", "a bell curve", "a staircase", "two peaks"], answer: 1, explain: "Sums of many independent coin flips tend toward a normal distribution." },
    { q: "Adding more rows of pegs makes the bell curve…", choices: ["narrower", "wider and smoother", "disappear", "flip upside down"], answer: 1, explain: "More independent steps → a broader, smoother spread." },
  ],

  presets: [
    { label: "Few rows", note: "With only 4 rows the outcomes are coarse — a lumpy histogram.", values: { "ga-rows": 4 } },
    { label: "Many rows", note: "12 rows gives a fine, smooth bell.", values: { "ga-rows": 12 } },
  ],

  panelHTML() {
    return `
      <div class="control"><div class="row"><label for="ga-rows">Rows of pegs</label><output id="ga-rowsval" for="ga-rows"></output></div>
        <input type="range" id="ga-rows" min="3" max="${ROWS_MAX}" step="1" value="${rows}"></div>
      <div class="btn-row">
        <button class="btn primary" id="ga-drop" type="button">Drop 100</button>
        <button class="btn" id="ga-clear" type="button">Clear</button>
      </div>
      <p class="fact">Each bead makes one left/right coin-flip per row.</p>
    `;
  },

  wire(root) {
    els.rows = root.querySelector("#ga-rows");
    els.rowsval = root.querySelector("#ga-rowsval");
    els.drop = root.querySelector("#ga-drop");
    els.clear = root.querySelector("#ga-clear");

    els.rowsval.textContent = String(rows);
    els.rows.addEventListener("input", () => {
      rows = parseInt(els.rows.value, 10);
      els.rowsval.textContent = String(rows);
      balls.splice(0).forEach((b) => group.remove(b));
      buildBoard();
    });
    els.drop.addEventListener("click", () => drop(100));
    els.clear.addEventListener("click", () => {
      balls.splice(0).forEach((b) => group.remove(b));
      buildBoard();
    });
  },

  update(dt) {
    const h = Math.min(dt, 0.04);
    const pegTop = topY() - 1.4;
    for (let k = balls.length - 1; k >= 0; k--) {
      const b = balls[k];
      const u = b.userData;
      if (u.delay > 0) { u.delay -= h; continue; }
      u.vy -= 9 * h;
      b.position.y += u.vy * h;
      const rowY = pegTop - u.row * SPACING;
      if (u.row < rows && b.position.y <= rowY) {
        u.x += Math.random() < 0.5 ? -0.5 : 0.5;
        u.row++;
        u.vy = -0.4;
        b.position.x = u.x * SPACING;
      }
      if (u.row >= rows && b.position.y <= topY() - 1.4 - rows * SPACING - 0.2) {
        settle(b);
        balls.splice(k, 1);
      }
    }
  },

  onEnter() {
    balls.splice(0).forEach((b) => group.remove(b));
    buildBoard();
  },
  onExit() {},
};
