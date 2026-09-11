import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.85 });
const group = new THREE.Group();
scene.add(group);

// speaker cone
const cone = new THREE.Mesh(
  new THREE.ConeGeometry(1, 0.6, 32, 1, true),
  new THREE.MeshStandardMaterial({ color: 0x2b2b31, roughness: 0.5, side: THREE.DoubleSide })
);
cone.rotation.z = Math.PI / 2;
cone.position.x = -3.2;
group.add(cone);
const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 10, 30), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.5 }));
rim.rotation.y = Math.PI / 2;
rim.position.x = -3.5;
group.add(rim);

// waveform trace
const PTS = 200;
const waveGeo = new THREE.BufferGeometry();
waveGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PTS * 3), 3));
const wave = new THREE.Line(waveGeo, new THREE.LineBasicMaterial({ color: 0x0f6b63 }));
group.add(wave);

// rings expanding from the speaker = compression waves
const RINGS = 5;
const rings = [];
for (let i = 0; i < RINGS; i++) {
  const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 32), new THREE.MeshBasicMaterial({ color: 0xb1520b, transparent: true }));
  r.rotation.y = Math.PI / 2;
  group.add(r);
  rings.push(r);
}

const state = { freq: 3, amp: 0.6, t: 0 };

function drawWave() {
  const arr = waveGeo.attributes.position.array;
  const span = 5.5;
  for (let i = 0; i < PTS; i++) {
    const f = i / (PTS - 1);
    const x = -2 + f * span;
    const y = Math.sin(f * span * state.freq - state.t * 6) * state.amp * 0.9;
    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = 0;
  }
  waveGeo.attributes.position.needsUpdate = true;
}

function pitchLabel() {
  if (state.freq < 1.5) return "Low pitch (bass)";
  if (state.freq < 3.5) return "Medium pitch";
  return "High pitch (treble)";
}

const els = {};

export default {
  id: "sound",
  name: "Sound: pitch & loudness",
  tag: "Physics · Sound",
  subject: "Physics",
  grades: [6, 10],
  blurb: "Frequency is pitch, amplitude is loudness.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 16v8h6l8 7V9l-8 7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M27 14a10 10 0 0 1 0 12M31 10a15 15 0 0 1 0 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [-0.5, 0, 0], radius: 8.5, theta: 0.05, phi: 1.5, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>Sound is a vibration that squeezes and stretches the air. Two things about that vibration are
    what you actually perceive:</p>
    <p><strong>Frequency</strong> — how many vibrations per second (hertz) — is heard as
    <strong>pitch</strong>: fast vibrations sound high, slow ones sound low.
    <strong>Amplitude</strong> — how big each vibration is — is heard as <strong>loudness</strong>: a
    bigger swing pushes the air harder, giving a louder sound. The two are independent: a sound can be
    high-pitched and quiet, or low-pitched and loud.</p>
  `,

  quiz: [
    { q: "Frequency of a sound wave is perceived as…", choices: ["loudness", "pitch", "tone colour only", "distance"], answer: 1, explain: "More vibrations per second = higher pitch." },
    { q: "Turning up the volume increases the wave's…", choices: ["frequency", "amplitude", "speed", "wavelength"], answer: 1, explain: "Loudness comes from amplitude, not frequency." },
    { q: "A bat's ultrasonic call has a very high frequency, meaning it is…", choices: ["very loud", "very quiet always", "very high-pitched", "silent"], answer: 2, explain: "High frequency = high pitch, beyond what humans can hear." },
  ],

  presets: [
    { label: "Low & soft", note: "Slow, small vibrations — a quiet bass hum.", values: { "sd-freq": 1, "sd-amp": 0.25 } },
    { label: "High & loud", note: "Fast, big vibrations — a piercing loud tone.", values: { "sd-freq": 5, "sd-amp": 1 } },
    { label: "Same pitch, louder", note: "Frequency unchanged, amplitude way up — same note, more volume.", values: { "sd-freq": 3, "sd-amp": 1 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="sd-pitch">Medium pitch</span></div>
      <div class="control"><div class="row"><label for="sd-freq">Frequency (pitch)</label><output id="sd-freqval" for="sd-freq"></output></div>
        <input type="range" id="sd-freq" min="0.5" max="6" step="0.1" value="${state.freq}"></div>
      <div class="control"><div class="row"><label for="sd-amp">Amplitude (loudness)</label><output id="sd-ampval" for="sd-amp"></output></div>
        <input type="range" id="sd-amp" min="0.1" max="1" step="0.02" value="${state.amp}"></div>
    `;
  },

  wire(root) {
    els.freq = root.querySelector("#sd-freq");
    els.amp = root.querySelector("#sd-amp");
    els.freqval = root.querySelector("#sd-freqval");
    els.ampval = root.querySelector("#sd-ampval");
    els.pitch = root.querySelector("#sd-pitch");

    const sync = () => {
      els.freqval.textContent = `${state.freq.toFixed(1)} Hz-ish`;
      els.ampval.textContent = `${Math.round(state.amp * 100)}%`;
      els.pitch.textContent = pitchLabel();
    };
    els.freq.addEventListener("input", () => ((state.freq = +els.freq.value), sync()));
    els.amp.addEventListener("input", () => ((state.amp = +els.amp.value), sync()));
    sync();
  },

  update(dt) {
    state.t += dt;
    drawWave();
    cone.position.x = -3.2 + Math.sin(state.t * state.freq * 3) * state.amp * 0.25;
    rings.forEach((r, i) => {
      const phase = ((state.t * state.freq * 0.6 + i / RINGS) % 1);
      const s = 0.3 + phase * 2.4;
      r.scale.setScalar(s);
      r.position.x = -3.5 + phase * 2.6;
      r.material.opacity = state.amp * (1 - phase) * 0.8;
    });
  },

  onEnter() {
    state.t = 0;
  },
  onExit() {},
};
