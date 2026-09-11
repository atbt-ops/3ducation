import * as THREE from "three";
import { ELEMENTS, CATEGORIES } from "../lib/elements.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));

const GAP = 1.06;
const TILE = 0.96;

function tilePos(col, row) {
  const x = (col - 9.5) * GAP;
  let y = (4.5 - row) * GAP;
  if (row >= 9) y -= 0.7; // drop the lanthanide/actinide strips
  return { x, y };
}

/** Shrinks the font until `text` fits `maxWidth`, so every element's full name always fits its card — no truncating to initials or an ellipsis. */
function fitFont(ctx, text, maxWidth, weight, startSize, minSize) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px 'JetBrains Mono', monospace`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 0.5;
  }
  return size;
}

function tileTexture(el) {
  const [z, sym, name, mass, cat] = el;
  const s = 192; // higher resolution than the tile's on-screen size, so names stay crisp up close
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  const col = "#" + CATEGORIES[cat].color.toString(16).padStart(6, "0");
  ctx.fillStyle = col;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.textAlign = "left";
  ctx.font = "600 27px 'JetBrains Mono', monospace";
  ctx.fillText(String(z), 15, 36);
  ctx.textAlign = "center";
  ctx.font = "700 72px 'Bricolage Grotesque', sans-serif";
  ctx.fillText(sym, s / 2, s / 2 + 21);
  const nameSize = fitFont(ctx, name, s - 20, 500, 20, 7);
  ctx.font = `500 ${nameSize}px 'JetBrains Mono', monospace`;
  ctx.fillText(name, s / 2, s - 39);
  ctx.font = "500 18px 'JetBrains Mono', monospace";
  ctx.fillText(mass >= 100 ? mass.toFixed(0) : mass.toFixed(2), s / 2, s - 15);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const tiles = [];
const tileGeo = new THREE.BoxGeometry(TILE, TILE, 0.16);
ELEMENTS.forEach((el) => {
  const [, , , , , col, row] = el;
  const { x, y } = tilePos(col, row);
  const mesh = new THREE.Mesh(
    tileGeo,
    new THREE.MeshBasicMaterial({ map: tileTexture(el) })
  );
  mesh.position.set(x, y, 0);
  mesh.userData.el = el;
  mesh.userData.home = mesh.position.clone();
  scene.add(mesh);
  tiles.push(mesh);
});

// Connector line from La/Ac to their strips.
[
  [3, 6, 3, 9],
  [3, 7, 3, 10],
].forEach(([c1, r1, c2, r2]) => {
  const a = tilePos(c1, r1);
  const b = tilePos(c2, r2);
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a.x, a.y - 0.5, 0),
        new THREE.Vector3(b.x, b.y + 0.5, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0xb0b0aa })
    )
  );
});

let selected = null;
const els = {};

function period(z) {
  const bounds = [2, 10, 18, 36, 54, 86, 118];
  return bounds.findIndex((b) => z <= b) + 1;
}

function select(el) {
  selected = el;
  tiles.forEach((t) => {
    const on = t.userData.el === el;
    t.position.z = on ? 0.6 : 0;
    t.scale.setScalar(on ? 1.18 : 1);
  });
  if (!els.name) return;
  const [z, sym, name, mass, cat, col] = el;
  els.sym.textContent = sym;
  els.name.textContent = name;
  els.z.textContent = `Z = ${z}`;
  els.meta.innerHTML = `
    <div><dt>Atomic mass</dt><dd class="mono">${mass} u</dd></div>
    <div><dt>Category</dt><dd>${CATEGORIES[cat].label}</dd></div>
    <div><dt>Period</dt><dd class="mono">${period(z)}</dd></div>
    <div><dt>Group</dt><dd class="mono">${col >= 3 && col <= 12 && (z > 70 || cat === "ln" || cat === "an") ? "—" : col}</dd></div>`;
  els.swatch.style.background = "#" + CATEGORIES[cat].color.toString(16).padStart(6, "0");
}

export default {
  id: "periodic",
  name: "Periodic table",
  tag: "Chemistry · Elements",
  subject: "Chemistry",
  grades: [7, 12],
  video: { id: "CtTmUlp3bBo", title: "The periodic table (Khan Academy)" },
  blurb: "All 118 elements — orbit the wall, tap one.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="7" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="27" y="7" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="5" y="19" width="30" height="8" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="9" y="31" width="22" height="5" rx="1.5" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  flat: true,
  view: { target: [0, -1.2, 0], radius: 27, theta: 0, phi: 1.54, minRadius: 8, maxRadius: 52 },

  lesson: `
    <p>The elements line up by <strong>atomic number</strong> — how many protons each atom carries —
    and wrap into rows so that atoms in the same <strong>column</strong> (group) share an outer-electron
    count, and so behave alike.</p>
    <p>Reading down a group or across a period, properties shift smoothly: metals on the left, nonmetals
    on the upper right, the noble gases sealed off in the last column. The two detached strips are the
    lanthanides and actinides, pulled out to keep the table narrow.</p>
  `,

  quiz: [
    {
      q: "What does an element's atomic number count?",
      choices: ["protons", "neutrons", "total mass", "electron shells"],
      answer: 0,
      explain: "Atomic number = number of protons, and it's what orders the whole table.",
    },
    {
      q: "Elements in the same column (group) tend to…",
      choices: [
        "have the same mass",
        "react in similar ways",
        "be in the same physical state",
        "have the same number of neutrons",
      ],
      answer: 1,
      explain: "Same number of outer electrons → similar chemistry.",
    },
    {
      q: "The noble gases (far-right column) are unreactive because…",
      choices: ["they are very heavy", "their outer electron shell is full", "they are radioactive", "they are metals"],
      answer: 1,
      explain: "A full outer shell leaves nothing to gain or share.",
    },
  ],

  panelHTML() {
    const cats = Object.entries(CATEGORIES)
      .map(
        ([, v]) =>
          `<span class="pt-cat"><span class="pt-dot" style="background:#${v.color
            .toString(16)
            .padStart(6, "0")}"></span>${v.label}</span>`
      )
      .join("");
    return `
      <div class="control">
        <label for="pt-search">Jump to element</label>
        <input type="text" id="pt-search" class="text-input" placeholder="symbol or name, e.g. Fe" autocomplete="off">
      </div>
      <div class="pt-card">
        <span class="pt-swatch" id="pt-swatch"></span>
        <div>
          <b class="pt-sym" id="pt-sym">—</b>
          <span class="pt-name" id="pt-name">Pick a tile</span>
          <span class="mono pt-z" id="pt-z"></span>
        </div>
      </div>
      <dl class="stat-grid pt-meta" id="pt-meta"></dl>
      <div class="section-label">Categories</div>
      <div class="pt-cats">${cats}</div>
    `;
  },

  wire(root) {
    els.search = root.querySelector("#pt-search");
    els.sym = root.querySelector("#pt-sym");
    els.name = root.querySelector("#pt-name");
    els.z = root.querySelector("#pt-z");
    els.meta = root.querySelector("#pt-meta");
    els.swatch = root.querySelector("#pt-swatch");

    els.search.addEventListener("input", () => {
      const q = els.search.value.trim().toLowerCase();
      if (!q) return;
      const hit = ELEMENTS.find(
        (e) => e[1].toLowerCase() === q || e[2].toLowerCase().startsWith(q)
      );
      if (hit) select(hit);
    });
    if (selected) select(selected);
  },

  update() {},

  onEnter(viewer) {
    viewer.onPick = (x, y) => {
      const hits = viewer.pick(x, y, tiles);
      if (hits.length) select(hits[0].object.userData.el);
    };
  },
  onExit(viewer) {
    if (viewer) viewer.onPick = null;
  },
};
