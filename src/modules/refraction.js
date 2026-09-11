import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const HALF = 4;
// medium 2 (below the surface)
const medium = new THREE.Mesh(
  new THREE.PlaneGeometry(HALF * 2, HALF),
  new THREE.MeshBasicMaterial({ color: 0xbcd6ee, transparent: true, opacity: 0.5 })
);
medium.position.y = -HALF / 2;
group.add(medium);

group.add(
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-HALF, 0, 0), new THREE.Vector3(HALF, 0, 0)]),
    new THREE.LineBasicMaterial({ color: 0x63665a })
  )
);
group.add(
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -HALF, 0), new THREE.Vector3(0, HALF, 0)]),
    new THREE.LineDashedMaterial({ color: 0x9a9a94, dashSize: 0.15, gapSize: 0.1 })
  )
);

const incident = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xe3b23c }));
const refracted = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x0f6b63 }));
const reflected = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb1520b, transparent: true, opacity: 0.5 }));
group.add(incident, refracted, reflected);

const MEDIA = { air: 1.0, water: 1.33, glass: 1.5, diamond: 2.42 };
const state = { n1: "air", n2: "water", angle: 40 };

function draw() {
  const n1 = MEDIA[state.n1];
  const n2 = MEDIA[state.n2];
  const t1 = (state.angle * Math.PI) / 180;
  const R = 3.6;
  const originY = 0;
  const inStart = new THREE.Vector3(-Math.sin(t1) * R, Math.cos(t1) * R, 0);
  incident.geometry.setFromPoints([inStart, new THREE.Vector3(0, originY, 0)]);

  const sinT2 = (n1 / n2) * Math.sin(t1);
  reflected.geometry.setFromPoints([
    new THREE.Vector3(0, originY, 0),
    new THREE.Vector3(Math.sin(t1) * R * 0.5, Math.cos(t1) * R * 0.5, 0),
  ]);

  if (Math.abs(sinT2) > 1) {
    // total internal reflection
    refracted.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    return { tir: true, t2deg: null };
  }
  const t2 = Math.asin(sinT2);
  const outEnd = new THREE.Vector3(Math.sin(t2) * R, -Math.cos(t2) * R, 0);
  refracted.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), outEnd]);
  return { tir: false, t2deg: (t2 * 180) / Math.PI };
}
draw();

const els = {};

export default {
  id: "refraction",
  name: "Refraction",
  tag: "Physics · Optics",
  subject: "Physics",
  grades: [9, 12],
  flat: true,
  blurb: "Light bends where it crosses into water or glass.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h32" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 3"/><path d="M12 6l8 14" stroke="currentColor" stroke-width="2"/><path d="M20 20l6 14" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, -0.4, 0], radius: 9, theta: 0, phi: 1.5708, minRadius: 4, maxRadius: 16 },

  lesson: `
    <p>Light travels slower in denser materials, and that speed change bends its path — like a wheel
    hitting mud at an angle and veering. The bending obeys <strong>Snell's law</strong>:</p>
    <p><span class="mono">n₁·sin θ₁ = n₂·sin θ₂</span></p>
    <p>Going into a denser medium (higher refractive index <span class="mono">n</span>) the ray bends
    <em>toward</em> the normal. Going the other way, past a critical angle, it can't get out at all —
    it reflects entirely back inside, called <strong>total internal reflection</strong> (how optical
    fibres work).</p>
  `,

  quiz: [
    { q: "Light passing from air into water bends…", choices: ["toward the normal", "away from the normal", "not at all", "backward"], answer: 0, explain: "Water is denser (higher n), so the ray bends toward the normal." },
    { q: "Which has the highest refractive index?", choices: ["air", "water", "glass", "diamond"], answer: 3, explain: "Diamond, n ≈ 2.42, bends light the most — its famous sparkle." },
    { q: "Total internal reflection happens when light tries to go from a denser to a less dense medium at…", choices: ["a small angle", "too steep an angle (past the critical angle)", "exactly 0°", "never happens"], answer: 1, explain: "Past the critical angle, Snell's law has no solution, so all the light reflects." },
  ],

  presets: [
    { label: "Air → water", note: "A gentle bend toward the normal.", values: { "rf-n1": "air", "rf-n2": "water", "rf-angle": 40 } },
    { label: "Air → diamond", note: "A dramatic bend — diamond slows light a lot.", values: { "rf-n1": "air", "rf-n2": "diamond", "rf-angle": 40 } },
    { label: "Near-grazing angle", note: "A shallow angle still refracts, just less dramatically.", values: { "rf-angle": 75 } },
    { label: "Water → air (steep)", note: "Going the other way at a steep angle can trigger total internal reflection.", values: { "rf-n1": "water", "rf-n2": "air", "rf-angle": 60 } },
  ],

  panelHTML() {
    const opt = (sel) => Object.keys(MEDIA).map((k) => `<option value="${k}" ${k === sel ? "selected" : ""}>${k[0].toUpperCase() + k.slice(1)} (n=${MEDIA[k]})</option>`).join("");
    return `
      <div class="formula"><span>n₁sinθ₁ = n₂sinθ₂</span><b class="mono" id="rf-t2">—</b></div>
      <div class="control"><label for="rf-n1">From</label><select id="rf-n1" class="text-input">${opt(state.n1)}</select></div>
      <div class="control"><label for="rf-n2">Into</label><select id="rf-n2" class="text-input">${opt(state.n2)}</select></div>
      <div class="control"><div class="row"><label for="rf-angle">Angle of incidence</label><output id="rf-angleval" for="rf-angle"></output></div>
        <input type="range" id="rf-angle" min="1" max="85" step="1" value="${state.angle}"></div>
      <p class="fact" id="rf-note">—</p>
    `;
  },

  wire(root) {
    els.n1 = root.querySelector("#rf-n1");
    els.n2 = root.querySelector("#rf-n2");
    els.angle = root.querySelector("#rf-angle");
    els.angleval = root.querySelector("#rf-angleval");
    els.t2 = root.querySelector("#rf-t2");
    els.note = root.querySelector("#rf-note");

    const sync = () => {
      els.angleval.textContent = `${state.angle}°`;
      const { tir, t2deg } = draw();
      if (tir) {
        els.t2.textContent = "—";
        els.note.textContent = "Total internal reflection: the light can't escape and bounces back.";
      } else {
        els.t2.textContent = `θ₂ = ${t2deg.toFixed(1)}°`;
        els.note.textContent = "Yellow = incoming ray, teal = refracted ray, faint orange = partial reflection.";
      }
    };
    els.n1.addEventListener("input", () => ((state.n1 = els.n1.value), sync()));
    els.n2.addEventListener("input", () => ((state.n2 = els.n2.value), sync()));
    els.angle.addEventListener("input", () => ((state.angle = +els.angle.value), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
