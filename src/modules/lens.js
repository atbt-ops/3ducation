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
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-8, 0, 0),
    new THREE.Vector3(8, 0, 0),
  ]),
  new THREE.LineDashedMaterial({ color: 0x63665a, dashSize: 0.2, gapSize: 0.12 })
);
axis.computeLineDistances();
group.add(axis);

// Lens: a thin biconvex disc (scaled sphere).
const lens = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 20),
  new THREE.MeshPhysicalMaterial({
    color: 0x8fd8cb,
    transmission: 0.6,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
    metalness: 0,
  })
);
lens.scale.set(0.16, 1.7, 1.7);
group.add(lens);

function arrow(color) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1, 8),
    new THREE.MeshStandardMaterial({ color })
  );
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.28, 12),
    new THREE.MeshStandardMaterial({ color })
  );
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

// Focal markers.
const fMat = new THREE.MeshBasicMaterial({ color: 0x8a5f22 });
const fNear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), fMat);
const fFar = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), fMat);
group.add(fNear, fFar);

const rayMat = new THREE.LineBasicMaterial({ color: 0xd9a54a });
const ray1 = new THREE.Line(new THREE.BufferGeometry(), rayMat);
const ray2 = new THREE.Line(new THREE.BufferGeometry(), rayMat);
group.add(ray1, ray2);

const state = { f: 1.6, distance: 4 };

const EDGE = 8.5; // where rays leave the diagram

function refresh() {
  const { imageDist, magnification, real, inverted } = thinLens(state.f, state.distance);
  const objX = -state.distance;
  const imgH = magnification * OBJ_H;
  // Near dₒ = f the image races off to infinity; keep the drawing on the canvas.
  const onCanvas = Number.isFinite(imageDist) && Math.abs(imageDist) <= EDGE * 1.4;

  setArrow(objArrow, objX, OBJ_H);
  if (onCanvas) setArrow(imgArrow, imageDist, imgH || 0.001);
  else imgArrow.g.visible = false;

  fNear.position.set(-state.f, 0, 0);
  fFar.position.set(state.f, 0, 0);

  const tip = new THREE.Vector3(objX, OBJ_H, 0);
  const lensTop = new THREE.Vector3(0, OBJ_H, 0);
  const center = new THREE.Vector3(0, 0, 0);
  const imgTip = new THREE.Vector3(imageDist, imgH, 0);

  // Ray 1: parallel to the axis, then bent through the far focus.
  const ray1Slope = -OBJ_H / state.f; // after the lens
  ray1.geometry.setFromPoints(
    onCanvas
      ? [tip, lensTop, imgTip]
      : [tip, lensTop, new THREE.Vector3(EDGE, OBJ_H + ray1Slope * EDGE, 0)]
  );
  // Ray 2: straight through the lens centre.
  const ray2Slope = -OBJ_H / state.distance;
  ray2.geometry.setFromPoints(
    onCanvas
      ? [tip, center, imgTip]
      : [tip, center, new THREE.Vector3(EDGE, ray2Slope * EDGE, 0)]
  );

  return { imageDist, magnification, real, inverted };
}
refresh();

const els = {};

export default {
  id: "lens",
  name: "Converging lens",
  tag: "Physics · Optics",
  subject: "Physics",
  blurb: "Slide the object and find where the image lands.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6c5 6 5 22 0 28-5-6-5-22 0-28Z" stroke="currentColor" stroke-width="2"/><path d="M4 20h32" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 3"/></svg>',
  scene,
  view: { target: [0, 0.3, 0], radius: 15, theta: 0.12, phi: 1.44, minRadius: 7, maxRadius: 30 },

  lesson: `
    <p>A converging lens bends parallel light to a single point — the <strong>focal point</strong>, a
    distance <span class="mono">f</span> from the lens. Where an object's image forms follows the thin
    lens equation: <span class="mono">1/f = 1/dₒ + 1/dᵢ</span>.</p>
    <p>Outside the focal length the image is <em>real</em> and <em>inverted</em> (this is how a camera
    works). Move the object inside the focal length and <span class="mono">dᵢ</span> turns negative:
    the image becomes <em>virtual</em> and <em>upright</em>, larger than the object — a magnifying
    glass.</p>
  `,

  quiz: [
    {
      q: "An object sits well outside the focal length of a converging lens. Its image is…",
      choices: ["virtual and upright", "real and inverted", "the same size, upright", "nonexistent"],
      answer: 1,
      explain: "Beyond f, a converging lens forms a real, inverted image — like a camera.",
    },
    {
      q: "Move the object inside the focal length. Now the lens acts as a…",
      choices: ["magnifying glass (virtual, upright, enlarged)", "mirror", "prism", "camera"],
      answer: 0,
      explain: "dᵢ goes negative: virtual, upright, magnified — a magnifier.",
    },
    {
      q: "f = 2, object at dₒ = 2 (exactly at the focal point). The image forms…",
      choices: ["at the lens", "at 2 on the far side", "at infinity", "at −2"],
      answer: 2,
      explain: "1/dᵢ = 1/f − 1/dₒ = 0, so dᵢ → ∞: the rays leave parallel.",
    },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>1/f = 1/dₒ + 1/dᵢ</span><b class="mono" id="ln-di">—</b></div>
      <div class="control"><div class="row"><label for="ln-f">Focal length f</label><output id="ln-fval" for="ln-f"></output></div>
        <input type="range" id="ln-f" min="0.6" max="3" step="0.05" value="${state.f}"></div>
      <div class="control"><div class="row"><label for="ln-d">Object distance dₒ</label><output id="ln-dval" for="ln-d"></output></div>
        <input type="range" id="ln-d" min="0.8" max="7" step="0.1" value="${state.distance}"></div>
      <dl class="stat-grid">
        <div><dt>Magnification</dt><dd class="mono" id="ln-m">—</dd></div>
        <div><dt>Image</dt><dd class="mono" id="ln-kind">—</dd></div>
      </dl>
    `;
  },

  wire(root) {
    els.f = root.querySelector("#ln-f");
    els.fval = root.querySelector("#ln-fval");
    els.d = root.querySelector("#ln-d");
    els.dval = root.querySelector("#ln-dval");
    els.di = root.querySelector("#ln-di");
    els.m = root.querySelector("#ln-m");
    els.kind = root.querySelector("#ln-kind");

    const sync = () => {
      const { imageDist, magnification, real, inverted } = refresh();
      els.fval.textContent = `${state.f.toFixed(2)}`;
      els.dval.textContent = `${state.distance.toFixed(1)}`;
      els.di.textContent = Number.isFinite(imageDist) ? `${imageDist.toFixed(2)}` : "∞";
      els.m.textContent = Number.isFinite(magnification) ? `${magnification.toFixed(2)}×` : "∞";
      els.kind.textContent = !Number.isFinite(imageDist)
        ? "at infinity"
        : `${real ? "real" : "virtual"}, ${inverted ? "inverted" : "upright"}`;
    };
    els.f.addEventListener("input", () => ((state.f = parseFloat(els.f.value)), sync()));
    els.d.addEventListener("input", () => ((state.distance = parseFloat(els.d.value)), sync()));
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
