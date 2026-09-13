import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.8, dir: 0.6 });
const group = new THREE.Group();
scene.add(group);

// Sky dome and ground.
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(30, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xaed4ec, side: THREE.BackSide })
);
group.add(sky);
const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: 0x9c8a5e, roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2;
group.add(ground);

// Observer, at the centre of the ground.
const observer = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshStandardMaterial({ color: 0x2c6e6b }));
observer.position.set(0, 0.3, 0);
group.add(observer);
const observerLabel = createLabel("You", { fontSize: 22 });
observerLabel.position.set(0, 0.9, 0);
group.add(observerLabel);

// The Sun — high overhead at noon, low on the horizon at sunset.
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 20, 16),
  new THREE.MeshBasicMaterial({ color: 0xffdd66 })
);
group.add(sun);
const sunLabel = createLabel("Sun", { fontSize: 22 });
group.add(sunLabel);

const POSITIONS = {
  noon: new THREE.Vector3(0.6, 5.5, -1),
  sunset: new THREE.Vector3(-6.2, 0.55, -1),
};

// The direct ray from Sun to observer, and the scattering centres (gas molecules) along its path.
const rayGeo = new THREE.BufferGeometry();
const ray = new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
group.add(ray);

const N_PARTICLES = 10;
const particles = Array.from({ length: N_PARTICLES }, () => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3a6fd6 }));
  group.add(m);
  return m;
});
const scatterLines = Array.from({ length: N_PARTICLES }, () => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x8fbaf0, transparent: true, opacity: 0.55 })));
scatterLines.forEach((l) => group.add(l));

const rayLabel = createLabel("Sunlight reaching you", { fontSize: 20 });
group.add(rayLabel);

const state = { time: "noon" };
const els = {};

function statusText(time) {
  return time === "noon"
    ? "At noon, sunlight takes a short path through the atmosphere. Some blue scatters out to colour the sky, but plenty of every colour still reaches you — the Sun looks white/yellow."
    : "At sunrise and sunset, sunlight travels a much longer path through the atmosphere. Almost all the blue scatters away before it reaches you, so mostly red and orange survive the trip — the Sun looks red.";
}

function refresh() {
  const sunPos = POSITIONS[state.time];
  sun.position.copy(sunPos);
  sunLabel.position.set(sunPos.x, sunPos.y + 0.7, sunPos.z);

  const obsPos = observer.position;
  const pathLength = sunPos.distanceTo(obsPos);
  // A longer path through the atmosphere scatters away more blue before it reaches you.
  const maxPath = 8;
  const reddening = THREE.MathUtils.clamp((pathLength - 5.5) / (maxPath - 5.5), 0, 1);
  const rayColor = new THREE.Color(0xfff6df).lerp(new THREE.Color(0xd0451f), reddening);
  ray.material.color.copy(rayColor);
  rayGeo.setFromPoints([sunPos, obsPos]);
  const mid = sunPos.clone().lerp(obsPos, 0.5);
  rayLabel.position.set(mid.x, mid.y + 0.55, mid.z);

  particles.forEach((p, i) => {
    const t = (i + 1) / (N_PARTICLES + 1);
    const pos = sunPos.clone().lerp(obsPos, t);
    p.position.copy(pos);
    const outward = new THREE.Vector3(Math.sin(i * 2.4), Math.cos(i * 1.7) * 0.6 + 0.3, Math.cos(i * 2.1)).normalize();
    const end = pos.clone().addScaledVector(outward, 0.9 + reddening * 0.6);
    scatterLines[i].geometry.setFromPoints([pos, end]);
  });

  if (els.status) els.status.textContent = statusText(state.time);
}
refresh();

export default {
  id: "lightscattering",
  name: "Why the sky is blue",
  tag: "Physics · Optics",
  subject: "Physics",
  grades: [8, 12],
  blurb: "Scattering explains a blue sky at noon and a red sun at sunset.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="14" r="6" fill="currentColor"/><path d="M4 30c6-6 12-6 16 0s10 6 16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [-1, 1.5, 0], radius: 12, theta: 0.5, phi: 1.25, minRadius: 6, maxRadius: 20 },

  lesson: `
    <p>Air is full of tiny gas molecules — mostly nitrogen (N₂) and oxygen (O₂) — far smaller than
    the wavelength of visible light. When sunlight hits them, it bounces off in all directions, a
    process called <strong>scattering</strong>. Shorter wavelengths (blue, violet) scatter far more
    strongly than longer ones (red, orange). Blue light gets bounced all over the sky before it
    reaches your eyes, arriving from every direction at once — which is exactly why the daytime sky
    looks blue instead of black.</p>
    <p>At sunrise and sunset, sunlight has to travel a much longer path through the atmosphere to
    reach you, low along the horizon instead of straight down. Along that longer path, almost all
    the blue light scatters away before it arrives, leaving mostly red and orange to complete the
    journey — which is why the Sun (and the sky around it) turns red at dawn and dusk.</p>
  `,

  quiz: [
    { q: "Why does the daytime sky look blue?", choices: ["The atmosphere is naturally blue-coloured", "Gas molecules scatter blue (shorter-wavelength) light far more than red", "Blue light travels faster than red light", "It reflects the colour of the ocean"], answer: 1, explain: "Air molecules scatter shorter wavelengths (blue) much more strongly than longer ones (red)." },
    { q: "Why does the Sun look red at sunrise and sunset?", choices: ["The Sun is actually cooler at those times", "Sunlight travels a much longer path through the atmosphere, scattering away most of the blue", "Clouds turn the sunlight red", "It is an optical illusion with no physical cause"], answer: 1, explain: "A longer atmospheric path scatters away nearly all the blue, leaving mostly red light to reach you." },
    { q: "The phenomenon of light bouncing off tiny particles or molecules in its path is called…", choices: ["Refraction", "Reflection", "Scattering", "Interference"], answer: 2, explain: "This redirection of light by small particles or molecules is called scattering." },
    { q: "Compared to red light, blue light has a…", choices: ["longer wavelength", "shorter wavelength", "identical wavelength", "wavelength that depends on the observer"], answer: 1, explain: "Blue light has a shorter wavelength than red light, which is exactly why it scatters more." },
  ],

  presets: [
    { label: "Noon", note: "A short path through the atmosphere — the Sun looks white/yellow.", values: { "ls-time": "noon" } },
    { label: "Sunrise / sunset", note: "A long path through the atmosphere scatters away the blue.", values: { "ls-time": "sunset" } },
  ],

  panelHTML() {
    return `
      <select id="ls-time" class="text-input" aria-label="Time of day">
        <option value="noon">Noon — Sun overhead</option>
        <option value="sunset">Sunrise / sunset — Sun on the horizon</option>
      </select>
      <p class="fact" id="ls-status">${statusText(state.time)}</p>
      <p class="fact">Blue dots mark scattering molecules; the pale lines show blue light heading off in other directions instead of reaching you.</p>
    `;
  },

  wire(root) {
    els.time = root.querySelector("#ls-time");
    els.status = root.querySelector("#ls-status");
    els.time.addEventListener("input", () => {
      state.time = els.time.value;
      refresh();
    });
    refresh();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
