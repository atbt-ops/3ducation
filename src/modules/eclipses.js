import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.24));
const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
sunLight.position.set(12, 0, 0);
scene.add(sunLight);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.8, 36, 28),
  new THREE.MeshStandardMaterial({ color: 0x3f7fd9, roughness: 0.8 })
);
scene.add(earth);

const ORBIT = 3.2;
const baseMoonColor = new THREE.Color(0xccccc4);
const bloodColor = new THREE.Color(0x8a3020);
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.28, 28, 22),
  new THREE.MeshStandardMaterial({ color: baseMoonColor.clone(), roughness: 0.95 })
);
scene.add(moon);

const orbitLine = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 97 }, (_, j) => {
      const t = (j / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * ORBIT, 0, Math.sin(t) * ORBIT);
    })
  ),
  new THREE.LineBasicMaterial({ color: 0x555550, transparent: true, opacity: 0.4 })
);
scene.add(orbitLine);

const sunMark = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
sunMark.position.set(6.5, 0, 0);
scene.add(sunMark);

// Shadow "beams" — simplified as straight rods pointing away from the Sun (-X),
// not physically exact umbra cones, but a clear teaching picture of which body's
// shadow is falling on the other.
function shadowRod(radius, length) {
  const geo = new THREE.CylinderGeometry(radius, radius, length, 14, 1, true);
  geo.rotateZ(Math.PI / 2);
  geo.translate(-length / 2, 0, 0);
  return new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ color: 0x14100c, transparent: true, opacity: 0, side: THREE.DoubleSide })
  );
}
const moonShadow = shadowRod(0.14, 4.2);
scene.add(moonShadow);
const earthShadow = shadowRod(0.4, 5.5);
earthShadow.position.set(0, 0, 0);
scene.add(earthShadow);

function angDist(a, b) {
  return Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
}
function eclipseFor(deg) {
  if (angDist(deg, 0) < 12) {
    return ["Solar eclipse", "The Moon passes directly between Earth and the Sun — its shadow sweeps across part of Earth."];
  }
  if (angDist(deg, 180) < 12) {
    return ["Lunar eclipse", "Earth passes directly between the Sun and the Moon — Earth's shadow falls on the Moon, often turning it reddish (a “blood moon”)."];
  }
  return ["No eclipse", "The Moon is off to one side of the Sun-Earth line. Its orbit is tilted about 5°, so most months it passes just above or below a perfect line-up."];
}

const state = { deg: 45, running: true, t: 0 };
const els = {};

export default {
  id: "eclipses",
  name: "Solar & lunar eclipses",
  tag: "Astronomy · The sky",
  subject: "Astronomy",
  grades: [5, 10],
  blurb: "Line up Sun, Earth and Moon to see why eclipses happen.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="20" r="10" fill="currentColor"/><circle cx="24" cy="20" r="10" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 13, theta: 0.8, phi: 0.6, minRadius: 4, maxRadius: 18 },

  lesson: `
    <p>Eclipses happen when the Sun, Earth and Moon line up almost exactly. A <strong>solar
    eclipse</strong> happens at new moon, when the Moon passes between the Sun and Earth and its
    shadow sweeps across part of Earth's surface. A <strong>lunar eclipse</strong> happens at full
    moon, when Earth passes between the Sun and the Moon and Earth's much bigger shadow falls on
    the Moon.</p>
    <p>The Moon reaches both of these positions every month — so why isn't there an eclipse every
    month? The Moon's orbit is tilted about 5° from Earth's orbit around the Sun, so most months its
    shadow (or Earth's) misses, passing just above or below. Only when a line-up happens near where
    the two orbital planes cross do we get an eclipse.</p>
  `,

  quiz: [
    { q: "A solar eclipse happens when…", choices: ["Earth's shadow falls on the Moon", "the Moon's shadow falls on Earth", "the Sun turns off briefly", "the Moon changes colour"], answer: 1, explain: "The Moon passes directly between the Sun and Earth, casting its shadow onto Earth's surface." },
    { q: "Why can the Moon look reddish during a lunar eclipse?", choices: ["It's covered in red dust", "Earth's atmosphere bends red sunlight onto it", "It briefly catches fire", "It's an optical illusion with no real cause"], answer: 1, explain: "Earth's atmosphere scatters blue light and bends red light around the edge of Earth onto the Moon — the same reason sunsets are red." },
    { q: "Why isn't there an eclipse every single new moon and full moon?", choices: ["The Moon moves too fast", "The Moon's orbit is tilted about 5° from Earth's orbit around the Sun", "Eclipses only happen once a decade", "Earth's shadow doesn't reach the Moon"], answer: 1, explain: "Most months the tilt makes the shadow miss, passing above or below the other body." },
  ],

  presets: [
    { label: "New moon position", note: "Watch for a possible solar eclipse.", values: { "ec-deg": 0 } },
    { label: "In between", note: "No eclipse — the usual case most months.", values: { "ec-deg": 90 } },
    { label: "Full moon position", note: "Watch for a possible lunar eclipse.", values: { "ec-deg": 180 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="ec-name"></span></div>
      <p class="fact" id="ec-desc"></p>
      <div class="control"><div class="row"><label for="ec-deg">Moon's position in orbit</label><output id="ec-degval" for="ec-deg"></output></div>
        <input type="range" id="ec-deg" min="0" max="360" step="1" value="${state.deg}"></div>
      <div class="btn-row"><button class="btn primary" id="ec-toggle" type="button">Pause</button></div>
    `;
  },

  wire(root) {
    els.deg = root.querySelector("#ec-deg");
    els.degval = root.querySelector("#ec-degval");
    els.name = root.querySelector("#ec-name");
    els.desc = root.querySelector("#ec-desc");
    els.toggle = root.querySelector("#ec-toggle");

    const sync = () => {
      const deg = ((parseFloat(els.deg.value) % 360) + 360) % 360;
      els.degval.textContent = `${Math.round(deg)}°`;
      const e = eclipseFor(deg);
      els.name.textContent = e[0];
      els.desc.textContent = e[1];
    };
    els.deg.addEventListener("input", () => {
      state.deg = parseFloat(els.deg.value);
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
      state.deg = (state.deg + dt * 14) % 360;
      if (els.deg) {
        els.deg.value = String(Math.round(state.deg));
        els.degval.textContent = `${Math.round(state.deg)}°`;
        const e = eclipseFor(state.deg);
        els.name.textContent = e[0];
        els.desc.textContent = e[1];
      }
    }
    const deg = ((state.deg % 360) + 360) % 360;
    const a = (deg * Math.PI) / 180;
    moon.position.set(Math.cos(a) * ORBIT, 0, Math.sin(a) * ORBIT);
    earth.rotation.y += dt * 0.3;

    const solarT = Math.max(0, 1 - angDist(deg, 0) / 12);
    const lunarT = Math.max(0, 1 - angDist(deg, 180) / 12);

    moonShadow.position.copy(moon.position);
    moonShadow.material.opacity = 0.55 * solarT;

    earthShadow.material.opacity = 0.5 * lunarT;

    moon.material.color.copy(baseMoonColor).lerp(bloodColor, lunarT);
  },

  onEnter() {},
  onExit() {},
};
