import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const RADIUS = 2.6;

// The housing and dial — this whole group turns as the compass is turned around.
const dial = new THREE.Group();
group.add(dial);
const housing = new THREE.Mesh(new THREE.CircleGeometry(RADIUS, 48), new THREE.MeshBasicMaterial({ color: 0xf3efe0 }));
dial.add(housing);
const rim = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return new THREE.Vector3(Math.sin(a) * RADIUS, Math.cos(a) * RADIUS, 0.01);
    })
  ),
  new THREE.LineBasicMaterial({ color: 0x2b2b2e })
);
dial.add(rim);

const DIRS = [
  { d: "N", deg: 0, main: true },
  { d: "NE", deg: 45, main: false },
  { d: "E", deg: 90, main: true },
  { d: "SE", deg: 135, main: false },
  { d: "S", deg: 180, main: true },
  { d: "SW", deg: 225, main: false },
  { d: "W", deg: 270, main: true },
  { d: "NW", deg: 315, main: false },
];
DIRS.forEach(({ d, deg, main }) => {
  const a = THREE.MathUtils.degToRad(deg);
  const tick = new THREE.Mesh(
    new THREE.BoxGeometry(main ? 0.07 : 0.04, main ? 0.35 : 0.2, 0.02),
    new THREE.MeshBasicMaterial({ color: main ? 0xc23b2b : 0x8a8a86 })
  );
  tick.position.set(Math.sin(a) * (RADIUS - (main ? 0.22 : 0.14)), Math.cos(a) * (RADIUS - (main ? 0.22 : 0.14)), 0.01);
  tick.rotation.z = -a;
  dial.add(tick);
  const label = createLabel(d, { fontSize: main ? 26 : 20, scale: main ? 0.55 : 0.42 });
  label.position.set(Math.sin(a) * (RADIUS - 0.65), Math.cos(a) * (RADIUS - 0.65), 0.02);
  dial.add(label);
});

// The magnetised needle — always settles pointing to real (screen) north, no matter
// how the housing beneath it is turned.
const needle = new THREE.Group();
group.add(needle);
const northHalf = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.5, 3), new THREE.MeshBasicMaterial({ color: 0xc23b2b }));
northHalf.position.y = 0.75;
needle.add(northHalf);
const southHalf = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.5, 3), new THREE.MeshBasicMaterial({ color: 0x8a8a86 }));
southHalf.position.y = -0.75;
southHalf.rotation.z = Math.PI;
needle.add(southHalf);
const pivot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0x2b2b2e }));
pivot.position.z = 0.03;
needle.add(pivot);

const captionLabel = createLabel("The needle always points the same real-world way", { fontSize: 20, scale: 0.5 });
captionLabel.position.set(0, -RADIUS - 0.7, 0);
group.add(captionLabel);

const state = { turn: 0 };
const els = {};

function nearestDir(deg) {
  const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return DIRS[idx].d;
}

function refresh() {
  dial.rotation.z = THREE.MathUtils.degToRad(state.turn);
  // The label whose original angle equals the housing's turn ends up aligned
  // with the (screen-fixed) needle — see the rotation derivation in review.
  const heading = ((state.turn % 360) + 360) % 360;
  if (els.heading) els.heading.textContent = `${Math.round(heading)}°`;
  if (els.dir) els.dir.textContent = nearestDir(heading);
}
refresh();

export default {
  id: "compass",
  name: "Magnetic compass",
  tag: "Physics · Magnetism",
  subject: "Physics",
  grades: [5, 8],
  flat: true,
  blurb: "Turn the housing — the needle always settles pointing the same real-world way.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="2"/><path d="M20 8l4 12-4 12-4-12z" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 6.5, theta: 0, phi: 1.5708, minRadius: 3.5, maxRadius: 11 },

  lesson: `
    <p>A freely-pivoted magnet always settles pointing the same way — one end toward geographic
    North, the other toward South. This is the <strong>directional property</strong> of magnets,
    and it's exactly how a <strong>magnetic compass</strong> works: a magnetised needle balanced
    on a pivot inside a housing marked with North, South, East and West.</p>
    <p>To find directions, you turn the whole compass housing until the marked "N" lines up under
    the needle's coloured (north-seeking) tip — the needle itself never really "turns" to face a
    new way, the housing turns <em>around</em> it. Sailors, pilots, mountaineers and soldiers have
    relied on this simple trick for centuries to keep from getting lost.</p>
  `,

  quiz: [
    { q: "Why does a compass needle always settle pointing the same way?", choices: ["It is glued in place", "Magnets have a directional property and align North–South", "It spins randomly", "It follows the Sun"], answer: 1, explain: "A freely-pivoted magnet naturally aligns itself North–South." },
    { q: "To find North with a compass, you should…", choices: ["Ignore the needle and guess", "Turn the housing until N on the dial lines up with the needle's coloured tip", "Shake the compass", "Turn the needle by hand"], answer: 1, explain: "The needle stays put — you turn the dial beneath it to read off directions." },
    { q: "Which of these professions is mentioned as relying on a compass to avoid getting lost?", choices: ["Chefs", "Mountaineers and sailors", "Painters", "Musicians"], answer: 1, explain: "Sailors, pilots, mountaineers and soldiers have all used compasses to navigate." },
    { q: "What should you avoid placing a compass near?", choices: ["Wood", "Other magnets", "Paper", "Water"], answer: 1, explain: "Nearby magnets disturb the needle and give a false reading." },
  ],

  presets: [
    { label: "Facing North", note: "The dial's N sits right under the needle's tip.", values: { "cp-turn": 0 } },
    { label: "Facing East", note: "Turn the housing 90° — now E lines up with the needle.", values: { "cp-turn": 90 } },
    { label: "Facing Southwest", note: "A 225° turn of the housing.", values: { "cp-turn": 225 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>heading</span><b class="mono" id="cp-dir">N</b></div>
      <div class="control"><div class="row"><label for="cp-turn">Turn the housing</label><output id="cp-turnval" for="cp-turn"></output></div>
        <input type="range" id="cp-turn" min="0" max="359" step="1" value="${state.turn}"></div>
      <p class="fact">Bearing: <strong class="mono" id="cp-heading">0°</strong></p>
    `;
  },

  wire(root) {
    els.turn = root.querySelector("#cp-turn");
    els.turnval = root.querySelector("#cp-turnval");
    els.heading = root.querySelector("#cp-heading");
    els.dir = root.querySelector("#cp-dir");
    els.turn.addEventListener("input", () => {
      state.turn = +els.turn.value;
      els.turnval.textContent = `${state.turn}°`;
      refresh();
    });
    els.turnval.textContent = `${state.turn}°`;
  },

  update() {},
  onEnter() {},
  onExit() {},
};
