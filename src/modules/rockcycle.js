import * as THREE from "three";
import { sceneLights, groundGrid } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.75, dir: 0.9, rim: 0.4 });
scene.add(groundGrid(7, 14, -0.9));

const R = 2.3;

const igneous = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.42, 0),
  new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 0.95, flatShading: true })
);
igneous.position.set(R, 0, 0);
scene.add(igneous);

const sedimentary = new THREE.Group();
const sedColors = [0xc9a86a, 0xb98f52, 0xd9bd82, 0xa87a45];
sedColors.forEach((c, i) => {
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.85 - i * 0.05, 0.12, 0.85 - i * 0.05),
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
  );
  slab.position.y = i * 0.13 - 0.2;
  sedimentary.add(slab);
});
sedimentary.position.set(0, 0.3, R);
scene.add(sedimentary);

const metamorphic = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.28, 0.12, 80, 8, 2, 3),
  new THREE.MeshStandardMaterial({ color: 0x7a6a86, roughness: 0.55, metalness: 0.15 })
);
metamorphic.position.set(-R, 0, 0);
scene.add(metamorphic);

const magma = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 24, 18),
  new THREE.MeshStandardMaterial({ color: 0xff7a1f, emissive: 0xff5a0a, emissiveIntensity: 0.9, roughness: 0.4 })
);
magma.position.set(0, 0, -R);
scene.add(magma);

const NODES = [igneous, sedimentary, metamorphic, magma];

function addLabel(node, text, y) {
  const label = createLabel(text);
  label.position.set(0, y, 0);
  node.add(label);
}
addLabel(igneous, "Igneous", 0.72);
addLabel(sedimentary, "Sedimentary", 0.5);
addLabel(metamorphic, "Metamorphic", 0.7);
addLabel(magma, "Magma", 0.7);

const orbitLine = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 97 }, (_, j) => {
      const t = (j / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * R, 0.35, Math.sin(t) * R);
    })
  ),
  new THREE.LineBasicMaterial({ color: 0x8a7a5a, transparent: true, opacity: 0.4 })
);
scene.add(orbitLine);

const marker = new THREE.Mesh(
  new THREE.SphereGeometry(0.14, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffcf6a, emissiveIntensity: 0.8 })
);
scene.add(marker);

const PROCESSES = [
  [0, "Weathering, erosion & deposition", "Wind, water and ice break igneous rock into fragments. Rivers carry these sediments away and drop them in layers."],
  [90, "Compaction & cementation", "Layers of sediment pile up. Pressure squeezes out water, and minerals cement the grains together into solid sedimentary rock."],
  [180, "Heat & pressure (metamorphism)", "Buried deep underground and squeezed hard — without fully melting — the rock's minerals reorganise into banded metamorphic rock."],
  [270, "Melting & crystallization", "Pushed deeper still, the rock fully melts into magma. When magma cools, it crystallizes into new igneous rock — closing the cycle."],
];

function processFor(deg) {
  const d = ((deg % 360) + 360) % 360;
  if (d < 90) return PROCESSES[0];
  if (d < 180) return PROCESSES[1];
  if (d < 270) return PROCESSES[2];
  return PROCESSES[3];
}

const state = { deg: 20, running: true, t: 0 };
const els = {};

export default {
  id: "rockcycle",
  name: "The rock cycle",
  tag: "Earth Science · Rocks",
  subject: "Earth Science",
  grades: [5, 9],
  blurb: "Igneous, sedimentary, metamorphic — and back to magma again.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28 12a12 12 0 1 1-6-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 6l4 4-5 2z" fill="currentColor"/><path d="M16 24l4-7 4 7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 7.5, theta: 0.6, phi: 1.0, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>No rock is permanent. Given enough time, heat and pressure, every rock can turn into either
    of the other two kinds — that's the <strong>rock cycle</strong>. There is no fixed starting
    point; the marker orbiting the four rock samples shows one possible path around the loop.</p>
    <p><strong>Igneous</strong> rock forms when magma cools and crystallizes. Weathered into
    fragments and compacted in layers, it becomes <strong>sedimentary</strong> rock. Squeezed and
    heated deep underground, that becomes <strong>metamorphic</strong> rock. Melted completely, any
    of the three becomes magma again.</p>
  `,

  quiz: [
    { q: "Sedimentary rock forms mainly by…", choices: ["cooling magma", "compaction and cementation of sediment layers", "melting under intense heat", "sudden cooling in water"], answer: 1, explain: "Layers of eroded fragments pile up and are cemented together over time." },
    { q: "Metamorphic rock forms when existing rock is…", choices: ["fully melted", "heated and squeezed without fully melting", "dissolved in water", "frozen"], answer: 1, explain: "Heat and pressure reorganise the minerals without melting the rock completely." },
    { q: "Which of the three rock types can turn into either of the other two?", choices: ["Only igneous", "Only sedimentary", "Only metamorphic", "All three — the cycle has no fixed starting point"], answer: 3, explain: "Any rock type can eventually become either of the others, given the right conditions." },
  ],

  presets: [
    { label: "Start at igneous", note: "Freshly cooled from magma.", values: { "rc-deg": 5 } },
    { label: "Start at sedimentary", note: "Compacted layers of sediment.", values: { "rc-deg": 95 } },
    { label: "Start at metamorphic", note: "Heated and squeezed underground.", values: { "rc-deg": 185 } },
    { label: "Start at magma", note: "Fully melted rock.", values: { "rc-deg": 275 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="rc-name"></span></div>
      <p class="fact" id="rc-desc"></p>
      <div class="control"><div class="row"><label for="rc-deg">Position in cycle</label><output id="rc-degval" for="rc-deg"></output></div>
        <input type="range" id="rc-deg" min="0" max="360" step="1" value="${state.deg}"></div>
      <div class="btn-row"><button class="btn primary" id="rc-toggle" type="button">Pause</button></div>
    `;
  },

  wire(root) {
    els.deg = root.querySelector("#rc-deg");
    els.degval = root.querySelector("#rc-degval");
    els.name = root.querySelector("#rc-name");
    els.desc = root.querySelector("#rc-desc");
    els.toggle = root.querySelector("#rc-toggle");

    const sync = () => {
      const deg = parseFloat(els.deg.value);
      els.degval.textContent = `${Math.round(deg)}°`;
      const p = processFor(deg);
      els.name.textContent = p[1];
      els.desc.textContent = p[2];
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
      state.deg = (state.deg + dt * 10) % 360;
      if (els.deg) {
        els.deg.value = String(Math.round(state.deg));
        els.degval.textContent = `${Math.round(state.deg)}°`;
        const p = processFor(state.deg);
        els.name.textContent = p[1];
        els.desc.textContent = p[2];
      }
    }
    const a = (state.deg * Math.PI) / 180;
    marker.position.set(Math.cos(a) * R, 0.35, Math.sin(a) * R);

    igneous.rotation.y += dt * 0.3;
    metamorphic.rotation.y += dt * 0.5;
    sedimentary.rotation.y += dt * 0.15;
    magma.scale.setScalar(1 + Math.sin(state.t * 2) * 0.05);

    const NODE_ANGLES = [0, 90, 180, 270];
    NODES.forEach((node, i) => {
      const d = Math.min(Math.abs(state.deg - NODE_ANGLES[i]), 360 - Math.abs(state.deg - NODE_ANGLES[i]));
      const near = d < 12;
      const scale = near ? 1.15 + Math.sin(state.t * 4) * 0.06 : 1;
      node.scale.setScalar(scale);
    });
  },

  onEnter() {},
  onExit() {},
};
