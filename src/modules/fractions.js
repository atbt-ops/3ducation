import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const BAR_W = 5.4;
const BAR_H = 0.42;
const GAP = 0.14;
const ROWS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

const matA = new THREE.MeshBasicMaterial({ color: 0x0f6b63 });
const matB = new THREE.MeshBasicMaterial({ color: 0xb1520b });
const emptyMat = new THREE.MeshBasicMaterial({ color: 0xe8e6e0 });
const edgeMat = new THREE.LineBasicMaterial({ color: 0xb8b4aa });

const state = { a: [2, 3], b: [1, 2] }; // [numerator, denominator]

const cells = []; // {mesh, row, denom, idx}
function build() {
  while (group.children.length) group.remove(group.children[0]);
  cells.length = 0;
  const totalH = ROWS.length * (BAR_H + GAP);
  ROWS.forEach((denom, r) => {
    const y = totalH / 2 - r * (BAR_H + GAP);
    const cw = BAR_W / denom;
    for (let i = 0; i < denom; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(cw - 0.02, BAR_H), emptyMat);
      m.position.set(-BAR_W / 2 + cw * (i + 0.5), y, 0);
      m.userData = { denom, idx: i };
      group.add(m);
      cells.push(m);
    }
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(BAR_W, BAR_H)),
      edgeMat
    );
    edges.position.set(0, y, 0.01);
    group.add(edges);
  });
  paint();
}

function paint() {
  const [an, ad] = state.a;
  const [bn, bd] = state.b;
  cells.forEach((c) => {
    const { denom, idx } = c.userData;
    if (denom === bd && idx < bn) c.material = matB;
    else if (denom === ad && idx < an) c.material = matA;
    else c.material = emptyMat;
  });
}
build();

const els = {};

function value(f) {
  return f[0] / f[1];
}

export default {
  id: "fractions",
  name: "Fraction wall",
  tag: "Math · Fractions",
  subject: "Math",
  grades: [3, 6],
  flat: true,
  blurb: "See which fraction is bigger.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="9" width="30" height="6" stroke="currentColor" stroke-width="2"/><rect x="5" y="18" width="30" height="6" stroke="currentColor" stroke-width="2"/><path d="M20 18v6M12.5 18v6M27.5 18v6" stroke="currentColor" stroke-width="2"/><rect x="5" y="27" width="30" height="6" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8.5, theta: 0, phi: 1.5708, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>A fraction cuts a whole into equal parts. The bottom number (<em>denominator</em>) says how many
    parts; the top (<em>numerator</em>) says how many you take.</p>
    <p>Line the bars up and you can compare at a glance: <span class="mono">1/2</span> reaches exactly
    as far as <span class="mono">2/4</span> or <span class="mono">3/6</span> — those are
    <strong>equivalent</strong>. And the more parts you cut a whole into, the smaller each part
    becomes.</p>
  `,

  quiz: [
    { q: "Which is larger, 2/3 or 1/2?", choices: ["2/3", "1/2", "they're equal", "can't tell"], answer: 0, explain: "2/3 ≈ 0.67 reaches further along the bar than 1/2 = 0.5." },
    { q: "3/6 is equivalent to…", choices: ["1/3", "1/2", "2/3", "3/4"], answer: 1, explain: "Both cover half the whole." },
    { q: "Cutting a whole into more equal parts makes each part…", choices: ["bigger", "smaller", "stay the same", "disappear"], answer: 1, explain: "1/8 of a bar is shorter than 1/4 of the same bar." },
  ],

  presets: [
    { label: "1/2 vs 2/3", note: "Two-thirds reaches further — it's the bigger fraction.", values: { "fr-a": "2/3", "fr-b": "1/2" } },
    { label: "1/2 vs 3/6", note: "Exactly the same length: 3/6 is equivalent to 1/2.", values: { "fr-a": "3/6", "fr-b": "1/2" } },
    { label: "3/4 vs 5/8", note: "Three-quarters just edges out five-eighths.", values: { "fr-a": "3/4", "fr-b": "5/8" } },
    { label: "1/3 vs 1/12", note: "Same numerator, but twelfths are tiny.", values: { "fr-a": "1/3", "fr-b": "1/12" } },
  ],

  panelHTML() {
    const opts = (sel) =>
      [1, 2, 3, 4, 5, 6, 8, 10, 12]
        .flatMap((d) =>
          Array.from({ length: d }, (_, n) => `${n + 1}/${d}`).map(
            (v) => `<option value="${v}" ${v === sel ? "selected" : ""}>${v}</option>`
          )
        )
        .join("");
    return `
      <div class="control">
        <label for="fr-a">Teal fraction</label>
        <select id="fr-a" class="text-input">${opts("2/3")}</select>
      </div>
      <div class="control">
        <label for="fr-b">Orange fraction</label>
        <select id="fr-b" class="text-input">${opts("1/2")}</select>
      </div>
      <div class="formula"><span id="fr-compare">—</span></div>
    `;
  },

  wire(root) {
    els.a = root.querySelector("#fr-a");
    els.b = root.querySelector("#fr-b");
    els.compare = root.querySelector("#fr-compare");

    const parse = (s) => s.split("/").map(Number);
    const sync = () => {
      state.a = parse(els.a.value);
      state.b = parse(els.b.value);
      const va = value(state.a);
      const vb = value(state.b);
      const sign = Math.abs(va - vb) < 1e-9 ? "=" : va > vb ? ">" : "<";
      els.compare.textContent = `${els.a.value}  ${sign}  ${els.b.value}`;
      paint();
    };
    els.a.addEventListener("input", sync);
    els.b.addEventListener("input", sync);
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
