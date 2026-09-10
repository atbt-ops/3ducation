import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.28));
const sunLight = new THREE.PointLight(0xfff2d0, 2.4, 60);
scene.add(sunLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 28, 22),
  new THREE.MeshBasicMaterial({ color: 0xffd27a })
);
scene.add(sun);

const ORBIT = 5;
const TILT = (23.5 * Math.PI) / 180;

const earthPivot = new THREE.Group(); // holds the tilt
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.7, 40, 30),
  new THREE.MeshStandardMaterial({ color: 0x3f7fd9, roughness: 0.85 })
);
earthPivot.add(earth);
earthPivot.rotation.z = TILT;
scene.add(earthPivot);

// axis + equator guides
const axis = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.1, 0), new THREE.Vector3(0, 1.1, 0)]),
  new THREE.LineBasicMaterial({ color: 0xe3b23c })
);
earthPivot.add(axis);
const equator = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 65 }, (_, j) => {
      const t = (j / 64) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * 0.72, 0, Math.sin(t) * 0.72);
    })
  ),
  new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
);
earthPivot.add(equator);

const orbitLine = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 129 }, (_, j) => {
      const t = (j / 128) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * ORBIT, 0, Math.sin(t) * ORBIT);
    })
  ),
  new THREE.LineBasicMaterial({ color: 0x555550, transparent: true, opacity: 0.35 })
);
scene.add(orbitLine);

const state = { month: 0, running: true };

const SEASONS = [
  [0, "June solstice", "North Pole tilts toward the Sun: summer in the Northern Hemisphere, winter in the South."],
  [90, "September equinox", "Neither pole tilts sunward — day and night are equal everywhere."],
  [180, "December solstice", "North Pole tilts away: winter in the North, summer in the South."],
  [270, "March equinox", "Equal day and night again as the Northern Hemisphere heads into spring."],
];

function seasonFor(deg) {
  const d = ((deg % 360) + 360) % 360;
  let best = SEASONS[0];
  let bd = 999;
  for (const s of SEASONS) {
    const dist = Math.min(Math.abs(d - s[0]), 360 - Math.abs(d - s[0]));
    if (dist < bd) { bd = dist; best = s; }
  }
  return best;
}

const els = {};

export default {
  id: "seasons",
  name: "Seasons & the tilt",
  tag: "Astronomy · Earth",
  subject: "Astronomy",
  grades: [6, 9],
  blurb: "Why summer and winter — it's the 23.5° tilt.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="26" cy="20" r="7" stroke="currentColor" stroke-width="2"/><path d="M23 13l6 14" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="20" r="3" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 17, theta: 0.6, phi: 0.55, minRadius: 6, maxRadius: 26 },

  lesson: `
    <p>Earth's axis is tilted <strong>23.5°</strong> and always points the same way as we orbit the
    Sun. It is <em>not</em> that we get closer to the Sun in summer.</p>
    <p>For half the year the Northern Hemisphere leans toward the Sun — its light arrives more
    directly and the days are longer, so it's warmer. Half a year later the same hemisphere leans
    away and gets winter. The Southern Hemisphere is always in the opposite season.</p>
  `,

  quiz: [
    { q: "What causes the seasons?", choices: ["Earth's distance from the Sun changes", "Earth's 23.5° axial tilt", "The Sun gets hotter and cooler", "The Moon blocks sunlight"], answer: 1, explain: "The tilt changes how directly sunlight hits each hemisphere through the year." },
    { q: "When it's summer in India, in Australia it is…", choices: ["also summer", "winter", "always the same season", "spring"], answer: 1, explain: "The hemispheres tilt oppositely, so their seasons are reversed." },
    { q: "On an equinox…", choices: ["the day is longest", "the night is longest", "day and night are equal", "the Sun doesn't rise"], answer: 2, explain: "Neither pole tilts toward the Sun, so daylight is split evenly." },
  ],

  presets: [
    { label: "June solstice", note: "N. Hemisphere summer — its half of Earth leans into the light.", values: { "se-month": 0 } },
    { label: "September equinox", note: "Equal day and night worldwide.", values: { "se-month": 90 } },
    { label: "December solstice", note: "N. Hemisphere winter; summer in the South.", values: { "se-month": 180 } },
    { label: "March equinox", note: "Balanced again, heading into northern spring.", values: { "se-month": 270 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="se-name">June solstice</span><b class="mono">23.5°</b></div>
      <p class="fact" id="se-desc">North Pole tilts toward the Sun.</p>
      <div class="control"><div class="row"><label for="se-month">Point in orbit</label><output id="se-monthval" for="se-month"></output></div>
        <input type="range" id="se-month" min="0" max="360" step="1" value="${state.month}"></div>
      <div class="btn-row"><button class="btn primary" id="se-toggle" type="button">Pause</button></div>
    `;
  },

  wire(root) {
    els.month = root.querySelector("#se-month");
    els.monthval = root.querySelector("#se-monthval");
    els.name = root.querySelector("#se-name");
    els.desc = root.querySelector("#se-desc");
    els.toggle = root.querySelector("#se-toggle");

    const sync = () => {
      const deg = parseFloat(els.month.value);
      els.monthval.textContent = `${Math.round(deg)}°`;
      const s = seasonFor(deg);
      els.name.textContent = s[1];
      els.desc.textContent = s[2];
    };
    els.month.addEventListener("input", () => {
      state.month = parseFloat(els.month.value);
      sync();
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    sync();
  },

  update(dt) {
    if (state.running) {
      state.month = (state.month + dt * 12) % 360;
      if (els.month) {
        els.month.value = String(Math.round(state.month));
        els.monthval.textContent = `${Math.round(state.month)}°`;
        const s = seasonFor(state.month);
        els.name.textContent = s[1];
        els.desc.textContent = s[2];
      }
    }
    const a = (state.month * Math.PI) / 180;
    earthPivot.position.set(Math.cos(a) * ORBIT, 0, Math.sin(a) * ORBIT);
    earth.rotation.y += dt * 0.8;
  },

  onEnter() {},
  onExit() {},
};
