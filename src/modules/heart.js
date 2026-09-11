import * as THREE from "three";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const RED = 0xc23b2b;
const BLUE = 0x3a5fa8;

// heart (two overlapping blobs), lungs, body
function blob(color, x, y, s) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(s, 32),
    new THREE.MeshBasicMaterial({ color })
  );
  m.position.set(x, y, 0);
  return m;
}
const heartL = blob(RED, 0.5, 0, 0.9);
const heartR = blob(BLUE, -0.5, 0, 0.9);
group.add(heartR, heartL);
// Added to the mesh itself — heartL/heartR only ever get a uniform beat-pulse
// scale, so a child label isn't distorted by it.
heartL.add(createLabel("Left heart", { fontSize: 26 }));
heartR.add(createLabel("Right heart", { fontSize: 26 }));

const lungs = blob(0xf0c0c8, 0, 2.6, 0.9);
lungs.scale.x = 2.4;
group.add(lungs);
const body = blob(0xd8c6a0, 0, -2.8, 0.9);
body.scale.x = 3;
group.add(body);
// Added to the outer group, not the meshes themselves — lungs/body have a
// non-uniform x-scale (they're stretched ellipses), which would otherwise
// distort a child label horizontally.
const lungsLabel = createLabel("Lungs", { fontSize: 28 });
lungsLabel.position.set(0, 3.3, 0);
group.add(lungsLabel);
const bodyLabel = createLabel("Body", { fontSize: 28 });
bodyLabel.position.set(0, -3.5, 0);
group.add(bodyLabel);

// two loop paths
function loopPath(pts) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], 0)), true);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)),
    new THREE.LineBasicMaterial({ color: 0xc9c9c4 })
  );
  group.add(line);
  return curve;
}
const pulmonary = loopPath([[-0.5, 0.7], [-1.6, 1.6], [-1.2, 2.6], [0, 2.9], [1.2, 2.6], [1.4, 1.4], [0.5, 0.7]]);
const systemic = loopPath([[0.5, -0.7], [1.8, -1.6], [1.4, -2.8], [0, -3.1], [-1.6, -2.8], [-1.7, -1.4], [-0.5, -0.7]]);

const cellGeo = new THREE.CircleGeometry(0.11, 12);
function makeCells(curve, n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(cellGeo, new THREE.MeshBasicMaterial({ color: RED }));
    m.userData = { u: i / n };
    group.add(m);
    arr.push(m);
  }
  return { curve, cells: arr };
}
const loops = [makeCells(pulmonary, 10), makeCells(systemic, 12)];

const state = { bpm: 72, t: 0 };
const els = {};

export default {
  id: "heart",
  name: "The heart",
  tag: "Biology · Circulation",
  subject: "Biology",
  grades: [6, 11],
  flat: true,
  blurb: "Two loops, one pump, blue to red and back.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 33S6 24 6 15a7 7 0 0 1 14-3 7 7 0 0 1 14 3c0 9-14 18-14 18Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 11, theta: 0, phi: 1.5708, minRadius: 5, maxRadius: 18 },

  lesson: `
    <p>The heart is really two pumps side by side. The <strong>right</strong> side collects
    oxygen-poor blood (blue) from the body and sends it to the <strong>lungs</strong> — the
    <em>pulmonary</em> loop. The <strong>left</strong> side receives the freshly oxygenated blood
    (red) and drives it out to the whole <strong>body</strong> — the <em>systemic</em> loop.</p>
    <p>Every drop makes a figure-eight: body → right heart → lungs → left heart → body. Your pulse is
    the left side squeezing, about 60–100 times a minute at rest.</p>
  `,

  quiz: [
    { q: "The right side of the heart pumps blood to the…", choices: ["body", "lungs", "brain only", "stomach"], answer: 1, explain: "Right heart → lungs (pulmonary loop) to pick up oxygen." },
    { q: "Blood returning from the body to the heart is…", choices: ["oxygen-rich (red)", "oxygen-poor (blue)", "clear", "the same as arterial blood"], answer: 1, explain: "The body has used the oxygen, so it comes back deoxygenated." },
    { q: "How many circulation loops does blood pass through per full circuit?", choices: ["one", "two", "three", "four"], answer: 1, explain: "Pulmonary (heart–lungs) then systemic (heart–body): a double circulation." },
  ],

  presets: [
    { label: "Resting (60)", note: "A calm, slow beat.", values: { "hr-bpm": 60 } },
    { label: "Brisk walk (100)", note: "Muscles need more oxygen, so the pump speeds up.", values: { "hr-bpm": 100 } },
    { label: "Sprint (170)", note: "Near maximum — blood races round both loops.", values: { "hr-bpm": 170 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>heart rate</span><b class="mono" id="hr-out">72 bpm</b></div>
      <div class="control"><div class="row"><label for="hr-bpm">Beats per minute</label><output id="hr-bpmval" for="hr-bpm"></output></div>
        <input type="range" id="hr-bpm" min="40" max="180" step="1" value="${state.bpm}"></div>
      <p class="fact"><strong style="color:#c23b2b">red</strong> = oxygen-rich ·
        <strong style="color:#3a5fa8">blue</strong> = oxygen-poor.
        Top loop = lungs, bottom loop = body.</p>
    `;
  },

  wire(root) {
    els.bpm = root.querySelector("#hr-bpm");
    els.bpmval = root.querySelector("#hr-bpmval");
    els.out = root.querySelector("#hr-out");
    const sync = () => {
      els.bpmval.textContent = `${state.bpm}`;
      els.out.textContent = `${state.bpm} bpm`;
    };
    els.bpm.addEventListener("input", () => ((state.bpm = +els.bpm.value), sync()));
    sync();
  },

  update(dt) {
    state.t += dt;
    const flow = (state.bpm / 72) * 0.12;
    const beat = 1 + 0.08 * Math.max(0, Math.sin(state.t * (state.bpm / 60) * Math.PI * 2));
    heartL.scale.setScalar(beat);
    heartR.scale.setScalar(beat);

    loops.forEach(({ curve, cells }, li) => {
      cells.forEach((c) => {
        c.userData.u = (((c.userData.u + flow * dt * 4) % 1) + 1) % 1;
        const p = curve.getPointAt(Math.min(0.9999, Math.max(0, c.userData.u)));
        c.position.set(p.x, p.y, 0.01);
        // pulmonary (li 0): blue near heart, red after lungs. systemic: opposite.
        const u = c.userData.u;
        const oxy = li === 0 ? u > 0.45 : u < 0.5;
        c.material.color.setHex(oxy ? RED : BLUE);
      });
    });
  },

  onEnter() {},
  onExit() {},
};
