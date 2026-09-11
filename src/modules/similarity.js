import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const BASE = [
  [0, 0], [2.4, 0], [0.6, 1.6],
];

const triA = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x0f6b63 }));
const triB = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb1520b }));
const fillA = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(BASE.map(([x, y]) => new THREE.Vector2(x, y)))), new THREE.MeshBasicMaterial({ color: 0x0f6b63, transparent: true, opacity: 0.16 }));
group.add(fillA, triA, triB);

const state = { k: 1.5 };

function pts(scale, offsetX) {
  return BASE.map(([x, y]) => new THREE.Vector3(x * scale + offsetX, y * scale, 0));
}

function draw() {
  const a = pts(1, -1.5);
  triA.geometry.setFromPoints([...a, a[0]]);
  fillA.geometry = new THREE.ShapeGeometry(new THREE.Shape(a.map((p) => new THREE.Vector2(p.x, p.y))));
  const b = pts(state.k, 1.5);
  triB.geometry.setFromPoints([...b, b[0]]);
}
draw();

function sideLen(scale) {
  const a = pts(scale, 0);
  return [a[0].distanceTo(a[1]), a[1].distanceTo(a[2]), a[2].distanceTo(a[0])];
}

const els = {};

export default {
  id: "similarity",
  name: "Similar triangles",
  tag: "Math · Geometry",
  subject: "Math",
  grades: [8, 10],
  flat: true,
  blurb: "Same shape, different size — sides scale, area scales faster.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 30L12 14l10 16Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M16 34L26 8l16 26Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 0.6, 0], radius: 7, theta: 0, phi: 1.5708, minRadius: 3.5, maxRadius: 14 },

  lesson: `
    <p>Two shapes are <strong>similar</strong> when one is a scaled copy of the other — same angles,
    same proportions, just bigger or smaller. Every side grows by the same
    <strong>scale factor k</strong>.</p>
    <p>But area doesn't scale by k — it scales by <span class="mono">k²</span>, because area is a
    product of two lengths. Double every side (k = 2) and the area doesn't double, it
    <strong>quadruples</strong>. Volume, being three lengths multiplied, would scale by
    <span class="mono">k³</span>.</p>
  `,

  quiz: [
    { q: "A triangle's sides are all scaled by k = 3. Its area is multiplied by…", choices: ["3", "6", "9", "27"], answer: 2, explain: "Area scales with k²: 3² = 9." },
    { q: "Two similar triangles always have equal…", choices: ["side lengths", "areas", "corresponding angles", "perimeters"], answer: 2, explain: "Similar shapes keep the same angles; only the size changes." },
    { q: "If k = 0.5, the new shape is…", choices: ["twice as big", "the same size", "half the size", "a different shape entirely"], answer: 2, explain: "k < 1 shrinks the shape; every side becomes half as long." },
  ],

  presets: [
    { label: "Same size (k=1)", note: "k = 1 means identical, congruent triangles.", values: { "sm-k": 1 } },
    { label: "Double (k=2)", note: "Sides double, but area quadruples.", values: { "sm-k": 2 } },
    { label: "Shrink (k=0.5)", note: "Half the linear size, a quarter the area.", values: { "sm-k": 0.5 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>scale factor k</span><b class="mono" id="sm-kval">1.50</b></div>
      <div class="control"><div class="row"><label for="sm-k">k</label><output id="sm-kout" for="sm-k"></output></div>
        <input type="range" id="sm-k" min="0.3" max="3" step="0.05" value="${state.k}"></div>
      <dl class="stat-grid">
        <div><dt style="color:#0f6b63">Teal sides</dt><dd class="mono" id="sm-a">—</dd></div>
        <div><dt style="color:#b1520b">Orange sides</dt><dd class="mono" id="sm-b">—</dd></div>
      </dl>
      <p class="fact" id="sm-area">—</p>
    `;
  },

  wire(root) {
    els.k = root.querySelector("#sm-k");
    els.kout = root.querySelector("#sm-kout");
    els.kval = root.querySelector("#sm-kval");
    els.a = root.querySelector("#sm-a");
    els.b = root.querySelector("#sm-b");
    els.area = root.querySelector("#sm-area");

    const sync = () => {
      els.kout.textContent = state.k.toFixed(2);
      els.kval.textContent = state.k.toFixed(2);
      els.a.textContent = sideLen(1).map((s) => s.toFixed(2)).join(", ");
      els.b.textContent = sideLen(state.k).map((s) => s.toFixed(2)).join(", ");
      els.area.textContent = `Area ratio = k² = ${(state.k * state.k).toFixed(2)}×`;
      draw();
    };
    els.k.addEventListener("input", () => ((state.k = +els.k.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
