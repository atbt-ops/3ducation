import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const RADIUS = 3;

// Clock face.
const face = new THREE.Mesh(new THREE.CircleGeometry(RADIUS, 48), new THREE.MeshBasicMaterial({ color: 0xfaf7ec }));
group.add(face);
const rim = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return new THREE.Vector3(Math.sin(a) * RADIUS, Math.cos(a) * RADIUS, 0.01);
    })
  ),
  new THREE.LineBasicMaterial({ color: 0x2b2b2e })
);
group.add(rim);

function posFor(h, r) {
  const a = (h / 12) * Math.PI * 2;
  return [Math.sin(a) * r, Math.cos(a) * r];
}

// Hour ticks and numerals.
for (let h = 1; h <= 12; h++) {
  const [tx, ty] = posFor(h, RADIUS - 0.22);
  const tick = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), new THREE.MeshBasicMaterial({ color: 0x2b2b2e }));
  tick.position.set(tx, ty, 0.01);
  group.add(tick);
  const [lx, ly] = posFor(h, RADIUS - 0.62);
  const label = createLabel(String(h), { fontSize: 26, scale: 0.55 });
  label.position.set(lx, ly, 0.02);
  group.add(label);
}
const centerDot = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: 0x2b2b2e }));
centerDot.position.z = 0.03;
group.add(centerDot);

// Hour and minute hands, each a pivot rotating clockwise from 12.
function hand(length, width, color) {
  const pivot = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.PlaneGeometry(width, length), new THREE.MeshBasicMaterial({ color }));
  rod.position.y = length / 2;
  pivot.add(rod);
  return pivot;
}
const hourPivot = hand(1.5, 0.13, 0x2b2b2e);
hourPivot.position.z = 0.02;
group.add(hourPivot);
const minutePivot = hand(2.4, 0.08, 0xc23b2b);
minutePivot.position.z = 0.025;
group.add(minutePivot);

const clockLabel = createLabel("The smaller hand shows hours, the longer hand shows minutes", { fontSize: 22, scale: 0.5 });
clockLabel.position.set(0, -RADIUS - 0.7, 0);
group.add(clockLabel);

const HOUR_WORDS = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const MINUTE_WORDS = { 0: "o'clock", 5: "oh five", 10: "ten", 15: "fifteen", 20: "twenty", 25: "twenty five", 30: "thirty", 35: "thirty five", 40: "forty", 45: "forty five", 50: "fifty", 55: "fifty five" };

const state = { hour: 8, minute: 15 };
const els = {};

function refresh() {
  const hourAngle = ((state.hour % 12) + state.minute / 60) / 12 * Math.PI * 2;
  const minuteAngle = (state.minute / 60) * Math.PI * 2;
  hourPivot.rotation.z = -hourAngle;
  minutePivot.rotation.z = -minuteAngle;

  const digital = `${state.hour}:${String(state.minute).padStart(2, "0")}`;
  const phrase = state.minute === 0 ? `${HOUR_WORDS[state.hour]} o'clock` : `${HOUR_WORDS[state.hour]} ${MINUTE_WORDS[state.minute]}`;
  if (els.digital) els.digital.textContent = digital;
  if (els.phrase) els.phrase.textContent = phrase;
}
refresh();

export default {
  id: "clock",
  name: "Reading the clock",
  tag: "Math · Time",
  subject: "Math",
  grades: [2, 5],
  flat: true,
  blurb: "Set the hands and read the time — the short hand for hours, the long for minutes.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="2"/><path d="M20 20V11M20 20l7 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 7, theta: 0, phi: 1.5708, minRadius: 4, maxRadius: 12 },

  lesson: `
    <p>A clock has two hands. The <strong>shorter, thicker hand</strong> points to the
    <strong>hour</strong>. The <strong>longer, thinner hand</strong> points to the
    <strong>minutes</strong> — each number it passes means 5 more minutes, since
    1 → 5 minutes, 2 → 10 minutes, 3 → 15 minutes, and so on all the way round to
    12 → 60 minutes (a full hour).</p>
    <p>Try setting the hands to <strong>8:15</strong> — the minute hand points at the 3
    (3 × 5 = 15 minutes), and the hour hand has moved a little past the 8, not sitting right on
    it, because a quarter of the hour has already gone by.</p>
  `,

  quiz: [
    { q: "What does the short hand on a clock show?", choices: ["Minutes", "Hours", "Seconds", "The day of the week"], answer: 1, explain: "The short, thick hand points to the hour." },
    { q: "What does the long hand on a clock show?", choices: ["Hours", "Minutes", "Months", "Nothing important"], answer: 1, explain: "The long, thin hand points to the minutes." },
    { q: "If the minute hand points exactly at the 3, how many minutes have passed?", choices: ["3 minutes", "15 minutes", "30 minutes", "45 minutes"], answer: 1, explain: "Each number is 5 minutes apart, so the 3 means 3 × 5 = 15 minutes." },
    { q: "It is 8:15. Thirty minutes later, what time is it?", choices: ["8:30", "8:45", "9:15", "8:15"], answer: 1, explain: "8:15 plus 30 minutes is 8:45." },
  ],

  presets: [
    { label: "8:15 — quarter past eight", note: "The minute hand points at the 3.", values: { "ck-hour": 8, "ck-minute": 15 } },
    { label: "3 o'clock", note: "Both hands make a clean right angle.", values: { "ck-hour": 3, "ck-minute": 0 } },
    { label: "12:30 — half past twelve", note: "The minute hand points straight down at the 6.", values: { "ck-hour": 12, "ck-minute": 30 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>time</span><b class="mono" id="ck-digital">—</b></div>
      <div class="control"><div class="row"><label for="ck-hour">Hour</label><output id="ck-hourval" for="ck-hour"></output></div>
        <input type="range" id="ck-hour" min="1" max="12" step="1" value="${state.hour}"></div>
      <div class="control"><div class="row"><label for="ck-minute">Minute</label><output id="ck-minuteval" for="ck-minute"></output></div>
        <input type="range" id="ck-minute" min="0" max="55" step="5" value="${state.minute}"></div>
      <p class="fact">In words: <strong id="ck-phrase">—</strong></p>
    `;
  },

  wire(root) {
    els.hour = root.querySelector("#ck-hour");
    els.hourval = root.querySelector("#ck-hourval");
    els.minute = root.querySelector("#ck-minute");
    els.minuteval = root.querySelector("#ck-minuteval");
    els.digital = root.querySelector("#ck-digital");
    els.phrase = root.querySelector("#ck-phrase");
    const sync = () => {
      els.hourval.textContent = `${state.hour}`;
      els.minuteval.textContent = `${state.minute}`;
      refresh();
    };
    els.hour.addEventListener("input", () => ((state.hour = +els.hour.value), sync()));
    els.minute.addEventListener("input", () => ((state.minute = +els.minute.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
