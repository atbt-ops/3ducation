import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

const DATASETS = {
  test: { label: "Test scores", data: [62, 71, 71, 78, 80, 82, 82, 82, 88, 91, 95] },
  goals: { label: "Match goals", data: [0, 1, 1, 1, 2, 2, 2, 2, 3, 5] },
  skewed: { label: "One outlier", data: [4, 5, 5, 6, 6, 6, 7, 7, 40] },
  uniform: { label: "Spread evenly", data: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
};

let bars = [];
const barMat = new THREE.MeshStandardMaterial({ color: 0x0f6b63, roughness: 0.45 });
const markMat = new THREE.MeshBasicMaterial({ color: 0xb1520b });
const meanMark = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), markMat);
meanMark.rotation.z = Math.PI;
group.add(meanMark);

function stats(data) {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const freq = {};
  data.forEach((v) => (freq[v] = (freq[v] || 0) + 1));
  const maxFreq = Math.max(...Object.values(freq));
  const modes = Object.keys(freq).filter((k) => freq[k] === maxFreq && maxFreq > 1).map(Number);
  const range = sorted[n - 1] - sorted[0];
  return { mean, median, mode: modes, range, min: sorted[0], max: sorted[n - 1] };
}

function build(data) {
  bars.forEach((b) => group.remove(b));
  bars = [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 5.4 / data.length;
  data.forEach((v, i) => {
    const h = 0.3 + ((v - min) / span) * 2.6;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, h, w * 0.78), barMat);
    b.position.set(-2.7 + w * (i + 0.5), -1.6 + h / 2, 0);
    group.add(b);
    bars.push(b);
  });
  const s = stats(data);
  const mx = -2.7 + (((s.mean - min) / span) * data.length * w);
  meanMark.position.set(mx, 1.3, 0);
  return s;
}

const els = {};
let current = "test";

export default {
  id: "statistics",
  name: "Mean, median, mode",
  tag: "Math · Statistics",
  subject: "Math",
  grades: [6, 10],
  video: { id: "h8EYEJ32oQ8", title: "Mean, median and mode, intro (Khan Academy)" },
  blurb: "Three ways to find the 'middle' — and when they disagree.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="22" width="5" height="12" fill="currentColor"/><rect x="14" y="14" width="5" height="20" fill="currentColor"/><rect x="22" y="8" width="5" height="26" fill="currentColor"/><rect x="30" y="18" width="5" height="16" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0.15, phi: 1.3, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>"Average" can mean three different things. The <strong>mean</strong> adds everything up and
    divides by how many there are. The <strong>median</strong> is the middle value once everything is
    sorted. The <strong>mode</strong> is whichever value shows up most often.</p>
    <p>They usually sit close together — but not always. One huge outlier drags the mean a long way
    while barely nudging the median, which is why the median is often the fairer summary for things
    like income or house prices.</p>
  `,

  quiz: [
    { q: "The median of {3, 5, 7, 9, 100} is…", choices: ["100", "24.8", "7", "5"], answer: 2, explain: "Sorted, the middle value (3rd of 5) is 7 — the outlier barely matters." },
    { q: "Which measure is most affected by one extreme outlier?", choices: ["mean", "median", "mode", "none of them"], answer: 0, explain: "The mean sums every value, so one huge number pulls it far." },
    { q: "The mode of a dataset is…", choices: ["always the middle value", "the most frequently occurring value", "the average", "the range"], answer: 1, explain: "Mode = most common value(s)." },
  ],

  presets: [
    { label: "Test scores", note: "Fairly even — mean and median sit close together.", values: { "st-set": "test" } },
    { label: "One huge outlier", note: "Watch the mean jump while the median barely moves.", values: { "st-set": "skewed" } },
    { label: "Evenly spread", note: "No repeats, so there's no mode.", values: { "st-set": "uniform" } },
  ],

  panelHTML() {
    const opts = Object.entries(DATASETS).map(([k, v]) => `<option value="${k}" ${k === current ? "selected" : ""}>${v.label}</option>`).join("");
    return `
      <div class="control"><label for="st-set">Dataset</label><select id="st-set" class="text-input">${opts}</select></div>
      <p class="fact mono" id="st-data">—</p>
      <dl class="stat-grid">
        <div><dt>Mean</dt><dd class="mono" id="st-mean">—</dd></div>
        <div><dt>Median</dt><dd class="mono" id="st-median">—</dd></div>
        <div><dt>Mode</dt><dd class="mono" id="st-mode">—</dd></div>
        <div><dt>Range</dt><dd class="mono" id="st-range">—</dd></div>
      </dl>
      <p class="fact">The orange marker on the chart points at the mean.</p>
    `;
  },

  wire(root) {
    els.set = root.querySelector("#st-set");
    els.data = root.querySelector("#st-data");
    els.mean = root.querySelector("#st-mean");
    els.median = root.querySelector("#st-median");
    els.mode = root.querySelector("#st-mode");
    els.range = root.querySelector("#st-range");

    const sync = () => {
      const d = DATASETS[current].data;
      els.data.textContent = `{ ${d.join(", ")} }`;
      const s = build(d);
      els.mean.textContent = s.mean.toFixed(1);
      els.median.textContent = String(s.median);
      els.mode.textContent = s.mode.length ? s.mode.join(", ") : "none";
      els.range.textContent = String(s.range);
    };
    els.set.addEventListener("input", () => {
      current = els.set.value;
      sync();
    });
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
