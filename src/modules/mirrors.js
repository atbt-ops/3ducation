import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { thinLens } from "../lib/physics.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.72, dir: 0.7 });
const group = new THREE.Group();
scene.add(group);

const OBJ_H = 1.0;

// Optical axis.
const axis = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)]),
  new THREE.LineDashedMaterial({ color: 0x63665a, dashSize: 0.2, gapSize: 0.12 })
);
axis.computeLineDistances();
group.add(axis);

// The mirror: a thin curved band cut from a sphere's equator, built so its
// centre sits at x = 0 and it bulges toward the object (concave, cupping
// away from it) by default. Rotating it 180° about Y flips the same
// geometry into the convex orientation — no need for two separate meshes.
const CAP_R = 2.6;
const THETA_HALF = 0.6;
const PHI_HALF = 0.1;
const mirrorGeo = new THREE.SphereGeometry(
  CAP_R, 32, 20,
  Math.PI - PHI_HALF, PHI_HALF * 2,
  Math.PI / 2 - THETA_HALF, THETA_HALF * 2
);
mirrorGeo.translate(-CAP_R, 0, 0);
const mirror = new THREE.Mesh(
  mirrorGeo,
  new THREE.MeshStandardMaterial({ color: 0xd7dde0, metalness: 0.85, roughness: 0.18, side: THREE.DoubleSide })
);
group.add(mirror);

function arrow(color) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), new THREE.MeshStandardMaterial({ color }));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), new THREE.MeshStandardMaterial({ color }));
  g.add(shaft, head);
  return { g, shaft, head };
}
const objArrow = arrow(0x2c6e6b);
const imgArrow = arrow(0xa9762e);
group.add(objArrow.g, imgArrow.g);

function setArrow(a, x, height) {
  if (!Number.isFinite(x) || !Number.isFinite(height)) {
    a.g.visible = false;
    return;
  }
  a.g.visible = true;
  const h = Math.abs(height);
  const dir = Math.sign(height) || 1;
  a.shaft.scale.y = h;
  a.shaft.position.set(x, (dir * h) / 2, 0);
  a.head.position.set(x, dir * h + dir * 0.14, 0);
  a.head.rotation.z = dir > 0 ? 0 : Math.PI;
}

const fMat = new THREE.MeshBasicMaterial({ color: 0x8a5f22 });
const fMarker = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), fMat);
group.add(fMarker);

const rayMat = new THREE.LineBasicMaterial({ color: 0xd9a54a });
const ray1 = new THREE.Line(new THREE.BufferGeometry(), rayMat);
const ray2 = new THREE.Line(new THREE.BufferGeometry(), rayMat);
group.add(ray1, ray2);

const state = { type: "concave", fMag: 1.3, distance: 4 };

const EDGE = 8.5;

function refresh() {
  const f = state.type === "concave" ? state.fMag : -state.fMag;
  mirror.rotation.y = state.type === "concave" ? 0 : Math.PI;

  const { imageDist, magnification, real, inverted } = thinLens(f, state.distance);
  const objX = -state.distance;
  const imgX = -imageDist;
  const imgH = magnification * OBJ_H;
  const onCanvas = Number.isFinite(imgX) && Math.abs(imgX) <= EDGE * 1.4;

  setArrow(objArrow, objX, OBJ_H);
  if (onCanvas) setArrow(imgArrow, imgX, imgH || 0.001);
  else imgArrow.g.visible = false;

  fMarker.position.set(-f, 0, 0);

  const tip = new THREE.Vector3(objX, OBJ_H, 0);
  const mirrorTop = new THREE.Vector3(0, OBJ_H, 0);
  const pole = new THREE.Vector3(0, 0, 0);
  const imgTip = new THREE.Vector3(imgX, imgH, 0);

  // Ray 1: parallel to the axis, then bent through the focus.
  const ray1Slope = OBJ_H / f;
  ray1.geometry.setFromPoints(
    onCanvas ? [tip, mirrorTop, imgTip] : [tip, mirrorTop, new THREE.Vector3(-EDGE, OBJ_H + ray1Slope * -EDGE, 0)]
  );
  // Ray 2: straight to the pole, reflecting at an equal angle on the other side of the axis.
  const ray2Slope = OBJ_H / state.distance;
  ray2.geometry.setFromPoints(
    onCanvas ? [tip, pole, imgTip] : [tip, pole, new THREE.Vector3(-EDGE, ray2Slope * -EDGE, 0)]
  );

  return { imageDist, magnification, real, inverted };
}
refresh();

const els = {};

export default {
  id: "mirrors",
  name: "Concave & convex mirrors",
  tag: "Physics · Optics",
  subject: "Physics",
  grades: [8, 12],
  blurb: "Curved mirrors and where their images really form.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 6C9 12 9 28 13 34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 20h9M27 20h9" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 3"/><circle cx="27" cy="20" r="2.4" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0.3, 0], radius: 15, theta: 0.12, phi: 1.44, minRadius: 7, maxRadius: 30 },

  lesson: `
    <p>A <strong>concave</strong> mirror curves inward, cupping away from you like the inside of a
    bowl — it can focus reflected light to a real point in front of it. A <strong>convex</strong>
    mirror bulges outward like the back of a spoon — it always spreads reflected light out, so it
    only ever forms a smaller, upright, virtual image behind the mirror (which is why they're used
    for wide-view car and shop mirrors).</p>
    <p>Both still follow the same mirror equation as a lens: <span class="mono">1/f = 1/dₒ + 1/dᵢ</span>
    — a concave mirror has a positive focal length, a convex mirror a negative one.</p>
  `,

  quiz: [
    {
      q: "A concave mirror, object well beyond its centre of curvature (dₒ > 2f). The image is…",
      choices: ["virtual and upright", "real, inverted and smaller than the object", "real, upright and enlarged", "at infinity"],
      answer: 1,
      explain: "Beyond 2f, a concave mirror forms a real, inverted, diminished image — like a security mirror's reflection of a distant hallway.",
    },
    {
      q: "A convex mirror's image is always…",
      choices: ["real and inverted", "virtual, upright, and smaller than the object", "virtual and enlarged", "impossible to form"],
      answer: 1,
      explain: "A convex mirror only ever spreads rays apart, so its image is always virtual, upright, and diminished — that wider field of view is why they're used as car mirrors.",
    },
    {
      q: "Concave mirror, f = 1.5, object placed exactly at the focal point (dₒ = 1.5). The reflected rays…",
      choices: ["converge back onto the object", "leave parallel to the axis — the image forms at infinity", "form a real image at the pole", "form a virtual image close behind the mirror"],
      answer: 1,
      explain: "1/dᵢ = 1/f − 1/dₒ = 0, so dᵢ → ∞: rays reflect off parallel to the axis, just like a torch's parabolic reflector.",
    },
  ],

  presets: [
    { label: "Concave: object far out", note: "Beyond the centre of curvature — a real, inverted, diminished image.", values: { "mr-type": "concave", "mr-f": 1.2, "mr-d": 5 } },
    { label: "Concave: between f and 2f", note: "A real, inverted image — larger than the object.", values: { "mr-type": "concave", "mr-f": 1.4, "mr-d": 2.2 } },
    { label: "Concave: inside f", note: "Object closer than the focus — a magnified, upright, virtual image, like a shaving mirror.", values: { "mr-type": "concave", "mr-f": 1.4, "mr-d": 0.9 } },
    { label: "Convex mirror", note: "Always virtual, upright and smaller, whatever the distance — a wide field of view.", values: { "mr-type": "convex", "mr-f": 1.3, "mr-d": 3 } },
  ],

  panelHTML() {
    return `
      <select id="mr-type" class="text-input" aria-label="Mirror type">
        <option value="concave" ${state.type === "concave" ? "selected" : ""}>Concave</option>
        <option value="convex" ${state.type === "convex" ? "selected" : ""}>Convex</option>
      </select>
      <div class="formula"><span>1/f = 1/dₒ + 1/dᵢ</span><b class="mono" id="mr-di">—</b></div>
      <div class="control"><div class="row"><label for="mr-f">Focal length magnitude |f|</label><output id="mr-fval" for="mr-f"></output></div>
        <input type="range" id="mr-f" min="0.6" max="2.2" step="0.05" value="${state.fMag}"></div>
      <div class="control"><div class="row"><label for="mr-d">Object distance dₒ</label><output id="mr-dval" for="mr-d"></output></div>
        <input type="range" id="mr-d" min="0.3" max="7" step="0.1" value="${state.distance}"></div>
      <dl class="stat-grid">
        <div><dt>Magnification</dt><dd class="mono" id="mr-m">—</dd></div>
        <div><dt>Image</dt><dd class="mono" id="mr-kind">—</dd></div>
      </dl>
    `;
  },

  wire(root) {
    els.type = root.querySelector("#mr-type");
    els.f = root.querySelector("#mr-f");
    els.fval = root.querySelector("#mr-fval");
    els.d = root.querySelector("#mr-d");
    els.dval = root.querySelector("#mr-dval");
    els.di = root.querySelector("#mr-di");
    els.m = root.querySelector("#mr-m");
    els.kind = root.querySelector("#mr-kind");

    const sync = () => {
      const { imageDist, magnification, real, inverted } = refresh();
      els.fval.textContent = `${state.fMag.toFixed(2)}`;
      els.dval.textContent = `${state.distance.toFixed(1)}`;
      els.di.textContent = Number.isFinite(imageDist) ? `${imageDist.toFixed(2)}` : "∞";
      els.m.textContent = Number.isFinite(magnification) ? `${magnification.toFixed(2)}×` : "∞";
      els.kind.textContent = !Number.isFinite(imageDist)
        ? "at infinity"
        : `${real ? "real" : "virtual"}, ${inverted ? "inverted" : "upright"}`;
    };
    els.type.addEventListener("input", () => ((state.type = els.type.value), sync()));
    els.f.addEventListener("input", () => ((state.fMag = parseFloat(els.f.value)), sync()));
    els.d.addEventListener("input", () => ((state.distance = parseFloat(els.d.value)), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
