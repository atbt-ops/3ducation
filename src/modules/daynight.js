import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.22));
const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.3);
sunLight.position.set(10, 1, 0);
scene.add(sunLight);

const sunMark = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
sunMark.position.set(5.5, 0.5, 0);
scene.add(sunMark);

const EARTH_R = 0.95;
const earthGroup = new THREE.Group();
scene.add(earthGroup);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(EARTH_R, 40, 30),
  new THREE.MeshStandardMaterial({ color: 0x3f7fd9, roughness: 0.85 })
);
earthGroup.add(earth);

const marker = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffcf6a, emissiveIntensity: 0.3 })
);
marker.position.set(0.75, 0.35, 0.55).setLength(EARTH_R * 1.03);
earthGroup.add(marker);

function angleForHour(hour) {
  // Noon (12) faces the Sun directly; midnight (0/24) faces directly away.
  return ((hour - 12) / 24) * Math.PI * 2;
}

function fmtHour(h) {
  h = ((h % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const period = hh < 12 ? "AM" : "PM";
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
}

function isDaytime(hour) {
  return Math.cos(angleForHour(hour)) >= 0;
}

const state = { hour: 12, running: true, t: 0 };
const els = {};

function sync() {
  els.hourval.textContent = fmtHour(state.hour);
  const day = isDaytime(state.hour);
  els.status.textContent = day
    ? "☀️ It's daytime where the marker is — that side of Earth faces the Sun."
    : "🌙 It's night-time where the marker is — that side of Earth faces away from the Sun.";
  marker.material.emissiveIntensity = day ? 0.9 : 0.15;
}

export default {
  id: "daynight",
  name: "Day and night",
  tag: "Earth Science · Earth",
  subject: "Earth Science",
  grades: [1, 4],
  blurb: "Spin the Earth and watch day turn into night.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="2"/><path d="M20 7a13 13 0 0 1 0 26 13 13 0 0 1 0-26Z" fill="currentColor"/><path d="M20 3v4M20 33v4M3 20h4M33 20h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 7, theta: 0.55, phi: 1.05, minRadius: 3.5, maxRadius: 14 },

  lesson: `
    <p>Earth spins all the way around once about every 24 hours — that spin is what makes a
    <strong>day</strong>. The half of Earth facing the Sun is lit up and having daytime, while the
    half facing away is dark and having night-time.</p>
    <p>The Sun isn't moving around Earth — Earth is turning. As you spin the slider, watch the small
    marker on the globe: sometimes it faces the Sun (day), and sometimes it faces away (night).</p>
  `,

  quiz: [
    { q: "Why does it become night where you live?", choices: ["The Sun goes out", "Earth spins, turning your side away from the Sun", "The Moon blocks the Sun", "Clouds cover the whole sky"], answer: 1, explain: "Earth's own spin carries you from the sunlit side to the shadowed side and back, every 24 hours." },
    { q: "About how long does it take Earth to spin around once?", choices: ["1 hour", "24 hours (a day)", "1 month", "1 year"], answer: 1, explain: "One full spin is what we call a day." },
    { q: "When it's noon where you are, the exact opposite side of Earth is having…", choices: ["Also noon", "Midnight", "Sunrise", "Sunset"], answer: 1, explain: "The opposite side of Earth faces directly away from the Sun at that moment." },
  ],

  presets: [
    { label: "Noon", note: "The marker faces the Sun directly.", values: { "dn-hour": 12 } },
    { label: "Sunset", note: "The marker is turning away from the Sun.", values: { "dn-hour": 18 } },
    { label: "Midnight", note: "The marker faces directly away from the Sun.", values: { "dn-hour": 0 } },
    { label: "Sunrise", note: "The marker is turning back toward the Sun.", values: { "dn-hour": 6 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>Time</span><b class="mono" id="dn-hourval"></b></div>
      <p class="fact" id="dn-status"></p>
      <div class="control"><label for="dn-hour">Time of day</label>
        <input type="range" id="dn-hour" min="0" max="24" step="0.25" value="${state.hour}"></div>
      <div class="btn-row"><button class="btn primary" id="dn-toggle" type="button">Pause</button></div>
    `;
  },

  wire(root) {
    els.hour = root.querySelector("#dn-hour");
    els.hourval = root.querySelector("#dn-hourval");
    els.status = root.querySelector("#dn-status");
    els.toggle = root.querySelector("#dn-toggle");

    els.hour.addEventListener("input", () => {
      state.hour = parseFloat(els.hour.value);
      sync();
    });
    els.toggle.addEventListener("click", () => {
      state.running = !state.running;
      els.toggle.textContent = state.running ? "Pause" : "Play";
    });
    sync();
  },

  update(dt) {
    state.t += dt;
    if (state.running) {
      state.hour = (state.hour + dt * 2) % 24;
      if (els.hour) {
        els.hour.value = String(state.hour);
        sync();
      }
    }
    earthGroup.rotation.y = angleForHour(state.hour);
  },

  onEnter() {},
  onExit() {},
};
