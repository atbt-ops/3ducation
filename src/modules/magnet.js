import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.66, dir: 0.8 });
const group = new THREE.Group();
scene.add(group);

function barMagnet() {
  const g = new THREE.Group();
  const north = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xc23b2b, roughness: 0.5 })
  );
  north.position.x = 0.35;
  const nLabel = createLabel("N", { fontSize: 34 });
  nLabel.position.set(0, 0.5, 0);
  north.add(nLabel);
  const south = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x3a5fa8, roughness: 0.5 })
  );
  south.position.x = -0.35;
  const sLabel = createLabel("S", { fontSize: 34 });
  sLabel.position.set(0, 0.5, 0);
  south.add(sLabel);
  g.add(north, south);
  return g;
}

const magA = barMagnet();
const magB = barMagnet();
group.add(magA, magB);

const fieldGroup = new THREE.Group();
group.add(fieldGroup);

const state = { separation: 2.6, flipB: false, showField: true };

// field of a dipole pair, sampled on a grid → streamlines
function dipoleField(x, y, poles) {
  let fx = 0;
  let fy = 0;
  for (const [px, py, q] of poles) {
    const dx = x - px;
    const dy = y - py;
    const r2 = dx * dx + dy * dy + 0.04;
    const inv = q / (r2 * Math.sqrt(r2));
    fx += dx * inv;
    fy += dy * inv;
  }
  return [fx, fy];
}

function rebuildField() {
  while (fieldGroup.children.length) fieldGroup.remove(fieldGroup.children[0]);
  fieldGroup.visible = state.showField;
  if (!state.showField) return;

  const d = state.separation / 2;
  const sB = state.flipB ? -1 : 1;
  const poles = [
    [-d + 0.35, 0, 1], [-d - 0.35, 0, -1], // magnet A: N right, S left
    [d + 0.35, 0, sB], [d - 0.35, 0, -sB], // magnet B
  ];

  const mat = new THREE.LineBasicMaterial({ color: 0x8a5f22, transparent: true, opacity: 0.55 });
  const starts = [];
  for (let a = 0; a < 10; a++) {
    const ang = (a / 10) * Math.PI * 2;
    starts.push([-d + 0.35 + Math.cos(ang) * 0.28, Math.sin(ang) * 0.28]);
  }
  for (const [sx, sy] of starts) {
    const pts = [new THREE.Vector3(sx, sy, 0)];
    let x = sx;
    let y = sy;
    for (let step = 0; step < 240; step++) {
      const [fx, fy] = dipoleField(x, y, poles);
      const mag = Math.hypot(fx, fy) || 1;
      x += (fx / mag) * 0.09;
      y += (fy / mag) * 0.09;
      if (Math.abs(x) > 6 || Math.abs(y) > 4) break;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    fieldGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
}

function layout() {
  const d = state.separation / 2;
  magA.position.x = -d;
  magB.position.x = d;
  magB.rotation.y = state.flipB ? Math.PI : 0;
  rebuildField();
}
layout();

const els = {};

export default {
  id: "magnet",
  name: "Magnetic field",
  tag: "Physics · Magnetism",
  subject: "Physics",
  grades: [7, 12],
  flat: true,
  blurb: "Field lines, and poles that pull or push.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v14a8 8 0 0 0 16 0V8M12 8h6M22 8h6M12 15h6M22 15h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 11, theta: 0, phi: 1.5708, minRadius: 5, maxRadius: 20 },

  lesson: `
    <p>A magnet has two poles, north and south, and invisible <strong>field lines</strong> that loop
    from N around to S. Where the lines crowd together the field is strong; where they spread out it's
    weak.</p>
    <p>Bring two magnets close and the rule is simple: <strong>unlike poles attract, like poles
    repel</strong>. Flip one magnet and watch the field lines snap from smooth arcs joining the two
    (attraction) to a squashed cushion pushing them apart (repulsion).</p>
  `,

  quiz: [
    { q: "Magnetic field lines run…", choices: ["from south to north outside the magnet", "from north to south outside the magnet", "in straight lines only", "nowhere — they're imaginary"], answer: 1, explain: "Outside the magnet, field lines go N → S; inside, S → N, forming closed loops." },
    { q: "Two north poles brought together will…", choices: ["attract", "repel", "do nothing", "cancel out"], answer: 1, explain: "Like poles repel; unlike poles attract." },
    { q: "Where field lines are packed most tightly, the field is…", choices: ["weakest", "strongest", "zero", "reversed"], answer: 1, explain: "Line density represents field strength." },
  ],

  presets: [
    { label: "Attracting", note: "N of one faces S of the other — smooth lines link them.", values: { "mg-flip": "no", "mg-sep": 2.4 } },
    { label: "Repelling", note: "Like poles face off — the lines bunch and bend away.", values: { "mg-flip": "yes", "mg-sep": 2.4 } },
    { label: "Far apart", note: "Each magnet's field is almost its own simple dipole.", values: { "mg-sep": 5 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span id="mg-state">Unlike poles — attract</span></div>
      <div class="control"><div class="row"><label for="mg-sep">Separation</label><output id="mg-sepval" for="mg-sep"></output></div>
        <input type="range" id="mg-sep" min="1.4" max="5.5" step="0.1" value="${state.separation}"></div>
      <select id="mg-flip" class="text-input" aria-label="Right magnet orientation">
        <option value="no">Right magnet: N faces left</option>
        <option value="yes">Right magnet: flipped (S faces left)</option>
      </select>
      <div class="btn-row"><button class="btn" id="mg-field" type="button" aria-pressed="true">Field lines: on</button></div>
      <p class="fact"><strong style="color:#c23b2b">red</strong> = north pole ·
        <strong style="color:#3a5fa8">blue</strong> = south pole</p>
    `;
  },

  wire(root) {
    els.sep = root.querySelector("#mg-sep");
    els.sepval = root.querySelector("#mg-sepval");
    els.flip = root.querySelector("#mg-flip");
    els.field = root.querySelector("#mg-field");
    els.state = root.querySelector("#mg-state");

    const sync = () => {
      els.sepval.textContent = `${state.separation.toFixed(1)}`;
      els.state.textContent = state.flipB ? "Like poles — repel" : "Unlike poles — attract";
      layout();
    };
    els.sep.addEventListener("input", () => ((state.separation = +els.sep.value), sync()));
    els.flip.addEventListener("input", () => {
      state.flipB = els.flip.value === "yes";
      sync();
    });
    els.field.addEventListener("click", () => {
      state.showField = !state.showField;
      els.field.textContent = `Field lines: ${state.showField ? "on" : "off"}`;
      els.field.setAttribute("aria-pressed", String(state.showField));
      rebuildField();
    });
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
