import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const N = 12;
const STEP = 0.62;

function label(text, bg, fg) {
  const s = 96;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = fg;
  ctx.font = "700 40px 'Bricolage Grotesque', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, s / 2, s / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const tileGeo = new THREE.PlaneGeometry(STEP * 0.92, STEP * 0.92);
const grid = [];
for (let r = 1; r <= N; r++) {
  grid[r] = [];
  for (let col = 1; col <= N; col++) {
    const prod = r * col;
    const shade = 0.12 + (prod / 144) * 0.7;
    const bg = `rgb(${Math.round(255 - shade * 150)}, ${Math.round(235 - shade * 90)}, ${Math.round(225 - shade * 140)})`;
    const m = new THREE.Mesh(tileGeo, new THREE.MeshBasicMaterial({ map: label(String(prod), bg, "#1c1c1f") }));
    m.position.set((col - (N + 1) / 2) * STEP, ((N + 1) / 2 - r) * STEP, 0);
    m.userData = { r, col, prod, baseZ: 0 };
    group.add(m);
    grid[r][col] = m;
  }
}
// headers
for (let k = 1; k <= N; k++) {
  const top = new THREE.Mesh(tileGeo, new THREE.MeshBasicMaterial({ map: label(String(k), "#0f6b63", "#fff") }));
  top.position.set((k - (N + 1) / 2) * STEP, ((N + 1) / 2) * STEP, 0);
  group.add(top);
  const left = new THREE.Mesh(tileGeo, new THREE.MeshBasicMaterial({ map: label(String(k), "#b1520b", "#fff") }));
  left.position.set((-(N + 1) / 2) * STEP, ((N + 1) / 2 - k) * STEP, 0);
  group.add(left);
}

let sel = { r: 7, col: 8 };
const els = {};

function highlight() {
  for (let r = 1; r <= N; r++)
    for (let col = 1; col <= N; col++) {
      const m = grid[r][col];
      const on = r === sel.r || col === sel.col;
      const pick = r === sel.r && col === sel.col;
      m.position.z = pick ? 0.35 : on ? 0.12 : 0;
      m.scale.setScalar(pick ? 1.15 : 1);
    }
  if (els.eq) els.eq.textContent = `${sel.r} × ${sel.col} = ${sel.r * sel.col}`;
}
highlight();

export default {
  id: "times",
  name: "Times table",
  tag: "Math · Multiplication",
  subject: "Math",
  grades: [2, 5],
  flat: true,
  blurb: "Tap a square, see the product light up.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="28" height="28" rx="2" stroke="currentColor" stroke-width="2"/><path d="M6 15h28M6 24h28M15 6v28M24 6v28" stroke="currentColor" stroke-width="1.6" opacity="0.7"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 12.5, theta: 0, phi: 1.5708, minRadius: 6, maxRadius: 22 },

  lesson: `
    <p>Multiplication is repeated addition, and it's the same either way round:
    <span class="mono">7 × 8</span> and <span class="mono">8 × 7</span> land on the same square — the
    grid is a mirror image across its diagonal.</p>
    <p>The shading here gets deeper as the product grows, so patterns jump out: the even rows, the
    steady climb of the 9s, the perfect squares marching down the diagonal.</p>
  `,

  quiz: [
    { q: "Why is the multiplication grid symmetric across its diagonal?", choices: ["a × b = b × a", "the grid is square", "each row adds up the same", "it isn't symmetric"], answer: 0, explain: "Multiplication is commutative: order doesn't matter." },
    { q: "The numbers straight down the diagonal (1, 4, 9, 16, …) are the…", choices: ["even numbers", "prime numbers", "perfect squares", "multiples of 3"], answer: 2, explain: "Row k meets column k at k × k." },
    { q: "7 × 6 equals…", choices: ["13", "42", "48", "76"], answer: 1, explain: "Six sevens: 7, 14, 21, 28, 35, 42." },
  ],

  presets: [
    { label: "7 × 8", note: "A classic tricky one — 56.", values: { "tm-r": 7, "tm-c": 8 } },
    { label: "9 × 9", note: "81 — the bottom-right of the 1–9 tables.", values: { "tm-r": 9, "tm-c": 9 } },
    { label: "12 × 12", note: "144 — the corner of the whole grid.", values: { "tm-r": 12, "tm-c": 12 } },
    { label: "6 × 4", note: "24 — and 4 × 6 lands on the very same square.", values: { "tm-r": 6, "tm-c": 4 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><b class="mono" id="tm-eq">7 × 8 = 56</b></div>
      <div class="control"><div class="row"><label for="tm-r">Row (orange)</label><output id="tm-rval" for="tm-r"></output></div>
        <input type="range" id="tm-r" min="1" max="12" step="1" value="${sel.r}"></div>
      <div class="control"><div class="row"><label for="tm-c">Column (teal)</label><output id="tm-cval" for="tm-c"></output></div>
        <input type="range" id="tm-c" min="1" max="12" step="1" value="${sel.col}"></div>
      <p class="fact">Tap any square in the grid, or use the sliders.</p>
    `;
  },

  wire(root) {
    els.r = root.querySelector("#tm-r");
    els.c = root.querySelector("#tm-c");
    els.rval = root.querySelector("#tm-rval");
    els.cval = root.querySelector("#tm-cval");
    els.eq = root.querySelector("#tm-eq");

    const sync = () => {
      sel = { r: +els.r.value, col: +els.c.value };
      els.rval.textContent = els.r.value;
      els.cval.textContent = els.c.value;
      highlight();
    };
    els.r.addEventListener("input", sync);
    els.c.addEventListener("input", sync);
    els._sync = sync;
    sync();
  },

  update() {},

  onEnter(viewer) {
    viewer.onPick = (x, y) => {
      const hits = viewer.pick(x, y, group.children);
      const cell = hits.find((h) => h.object.userData.prod);
      if (cell) {
        sel = { r: cell.object.userData.r, col: cell.object.userData.col };
        if (els.r) {
          els.r.value = String(sel.r);
          els.c.value = String(sel.col);
          els._sync();
        } else highlight();
      }
    };
  },
  onExit(viewer) {
    if (viewer) viewer.onPick = null;
  },
};
