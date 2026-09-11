import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const sqA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x0f6b63, transparent: true, opacity: 0.85 }));
const sqB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xb1520b, transparent: true, opacity: 0.85 }));
const sqC = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x5b3fb1, transparent: true, opacity: 0.85 }));
const tri = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x23271f }));
group.add(sqA, sqB, sqC, tri);

const state = { a: 3, b: 4 };

function layout() {
  const { a, b } = state;
  const scale = 0.9;
  const A = a * scale;
  const B = b * scale;
  // right angle at origin, leg a along -x, leg b along -y (so squares sit outside)
  const O = new THREE.Vector3(0, 0, 0);
  const PA = new THREE.Vector3(-A, 0, 0);
  const PB = new THREE.Vector3(0, -B, 0);
  tri.geometry.setFromPoints([O, PA, PB, O]);

  // square on side a (below, along the x extent)
  sqA.scale.set(A, A, 1);
  sqA.position.set(-A / 2, -A / 2, -0.01);
  // square on side b (left)
  sqB.scale.set(B, B, 1);
  sqB.position.set(-B / 2 - 0.0, -B / 2, -0.01);
  // hypotenuse square — rotate to sit on PA→PB
  const C = Math.hypot(A, B);
  const dir = new THREE.Vector3().subVectors(PB, PA).normalize();
  const ang = Math.atan2(dir.y, dir.x);
  sqC.scale.set(C, C, 1);
  const mid = new THREE.Vector3().addVectors(PA, PB).multiplyScalar(0.5);
  const outward = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(C / 2);
  sqC.position.copy(mid).add(outward).setZ(-0.02);
  sqC.rotation.z = ang + Math.PI / 2;
}
layout();

const els = {};

export default {
  id: "pythagoras",
  name: "Pythagoras",
  tag: "Math · Geometry",
  subject: "Math",
  grades: [7, 10],
  flat: true,
  blurb: "a² + b² = c², drawn as real squares.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 30V12h18Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 30H4v6h6zM10 12v-6H4v6z" stroke="currentColor" stroke-width="1.6"/></svg>',
  scene,
  view: { target: [-1, -1, 0], radius: 12, theta: 0, phi: 1.5708, minRadius: 5, maxRadius: 22 },

  lesson: `
    <p>For a right-angled triangle, build a square on each side. Pythagoras' theorem says the two
    smaller squares, added together, have exactly the same area as the big square on the longest side
    (the <em>hypotenuse</em>): <span class="mono">a² + b² = c²</span>.</p>
    <p>The classic case is the 3-4-5 triangle: <span class="mono">9 + 16 = 25</span>. Any triple that
    works — 5-12-13, 8-15-17 — gives a perfect right angle, which is how builders square up corners
    with a knotted rope.</p>
  `,

  quiz: [
    { q: "A right triangle has legs 3 and 4. Its hypotenuse is…", choices: ["5", "7", "12", "25"], answer: 0, explain: "3² + 4² = 9 + 16 = 25, and √25 = 5." },
    { q: "Pythagoras' theorem applies to…", choices: ["every triangle", "only right-angled triangles", "only equilateral triangles", "squares"], answer: 1, explain: "It needs the 90° angle between the two legs." },
    { q: "If a² + b² is greater than c², the angle opposite c is…", choices: ["exactly 90°", "less than 90° (acute)", "more than 90° (obtuse)", "impossible"], answer: 1, explain: "Equality is 90°; a bigger a²+b² means the triangle is 'opened less' — acute." },
  ],

  presets: [
    { label: "3-4-5", note: "9 + 16 = 25. The most famous right triangle.", values: { "py-a": 3, "py-b": 4 } },
    { label: "5-12-13", note: "25 + 144 = 169 = 13². Another whole-number triple.", values: { "py-a": 5, "py-b": 12 } },
    { label: "Isosceles right", note: "Equal legs: c = a·√2, never a whole number.", values: { "py-a": 5, "py-b": 5 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="py-eq">9 + 16 = 25</span><b class="mono" id="py-c">c = 5.00</b></div>
      <div class="control"><div class="row"><label for="py-a">Leg a</label><output id="py-aval" for="py-a"></output></div>
        <input type="range" id="py-a" min="1" max="12" step="0.5" value="${state.a}"></div>
      <div class="control"><div class="row"><label for="py-b">Leg b</label><output id="py-bval" for="py-b"></output></div>
        <input type="range" id="py-b" min="1" max="12" step="0.5" value="${state.b}"></div>
      <p class="fact"><strong style="color:#0f6b63">a²</strong> +
        <strong style="color:#b1520b">b²</strong> =
        <strong style="color:#5b3fb1">c²</strong></p>
    `;
  },

  wire(root) {
    els.a = root.querySelector("#py-a");
    els.b = root.querySelector("#py-b");
    els.aval = root.querySelector("#py-aval");
    els.bval = root.querySelector("#py-bval");
    els.eq = root.querySelector("#py-eq");
    els.c = root.querySelector("#py-c");

    const sync = () => {
      els.aval.textContent = state.a.toFixed(1);
      els.bval.textContent = state.b.toFixed(1);
      const c2 = state.a * state.a + state.b * state.b;
      els.eq.textContent = `${(state.a * state.a).toFixed(1)} + ${(state.b * state.b).toFixed(1)} = ${c2.toFixed(1)}`;
      els.c.textContent = `c = ${Math.sqrt(c2).toFixed(2)}`;
      layout();
    };
    els.a.addEventListener("input", () => ((state.a = +els.a.value), sync()));
    els.b.addEventListener("input", () => ((state.b = +els.b.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
