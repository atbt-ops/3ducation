import * as THREE from "three";
import { sceneLights, contactShadow } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.6, dir: 0.95 });
scene.add(contactShadow({ radius: 3.5, y: -2.1, opacity: 0.2 }));

const frameMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, metalness: 0.4, roughness: 0.4 });
const barY = 1.9;
const bar = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 0.12), frameMat);
bar.position.y = barY;
scene.add(bar);
[-2.1, 2.1].forEach((x) => {
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4, 0.12), frameMat);
  post.position.set(x, barY - 2, 0);
  scene.add(post);
});

const N = 5;
const R = 0.32;
const LEN = 1.7;
const spacing = R * 2 + 0.005;
const balls = [];
const ballMat = new THREE.MeshStandardMaterial({ color: 0xc9c9c4, metalness: 0.7, roughness: 0.18 });
for (let i = 0; i < N; i++) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 18), ballMat);
  const anchorX = (i - (N - 1) / 2) * spacing;
  b.userData = { anchorX, theta: 0, omega: 0 };
  scene.add(b);
  const str = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x63665a }));
  b.userData.string = str;
  scene.add(str);
  balls.push(b);
}

const state = { lift: 1, running: true };

function place() {
  balls.forEach((b) => {
    const { anchorX, theta } = b.userData;
    const bx = anchorX + Math.sin(theta) * LEN;
    const by = barY - Math.cos(theta) * LEN;
    b.position.set(bx, by, 0);
    b.userData.string.geometry.setFromPoints([
      new THREE.Vector3(anchorX, barY, 0),
      new THREE.Vector3(bx, by, 0),
    ]);
  });
}

function reset() {
  balls.forEach((b, i) => {
    b.userData.theta = i < state.lift ? -0.7 : 0;
    b.userData.omega = 0;
  });
  place();
}
reset();

const els = {};

export default {
  id: "cradle",
  name: "Newton's cradle",
  tag: "Physics · Momentum",
  subject: "Physics",
  grades: [9, 11],
  blurb: "Lift two, two swing out — every time.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 8h24M12 8l-4 16M20 8v16M28 8v16M12 8v16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="26" r="3" fill="currentColor"/><circle cx="20" cy="26" r="3" fill="currentColor"/><circle cx="28" cy="26" r="3" fill="currentColor"/></svg>',
  scene,
  view: { target: [0, 0.3, 0], radius: 8, theta: 0.35, phi: 1.25, minRadius: 4, maxRadius: 14 },

  lesson: `
    <p>Lift one ball and let it fall. It stops dead on impact — and one ball flies out the far side at
    the same speed. Lift two, and exactly two swing out.</p>
    <p>Two rules must both hold at once: <strong>momentum</strong> (mass × velocity) is conserved, and
    so is <strong>kinetic energy</strong> (in an elastic collision). One incoming ball at speed
    <span class="mono">v</span> could <em>not</em> launch two balls at
    <span class="mono">v/2</span> — that keeps momentum but loses half the energy. The only solution
    that satisfies both is "same number out, same speed".</p>
  `,

  quiz: [
    { q: "Lift 2 balls on a 5-ball cradle. How many swing out the other side?", choices: ["1", "2", "3", "5"], answer: 1, explain: "Conserving both momentum and energy forces two out at the same speed." },
    { q: "Why can't one ball hitting at speed v push two balls out at v/2?", choices: ["it can, that's what happens", "momentum wouldn't be conserved", "kinetic energy wouldn't be conserved", "friction stops it"], answer: 2, explain: "That would conserve momentum (2·½v = v) but lose half the kinetic energy." },
    { q: "The collisions in an ideal Newton's cradle are…", choices: ["inelastic", "elastic", "explosive", "frictional"], answer: 1, explain: "Elastic: kinetic energy is (nearly) fully preserved." },
  ],

  presets: [
    { label: "Lift one", note: "One in, one out.", values: { "cr-lift": 1 } },
    { label: "Lift two", note: "Two in, two out — never one-fast or three-slow.", values: { "cr-lift": 2 } },
    { label: "Lift three", note: "Three swing through; two stay put in the middle.", values: { "cr-lift": 3 } },
  ],

  panelHTML() {
    return `
      <div class="formula"><span>momentum &amp; energy both conserved</span></div>
      <div class="control"><div class="row"><label for="cr-lift">Balls lifted</label><output id="cr-liftval" for="cr-lift"></output></div>
        <input type="range" id="cr-lift" min="1" max="4" step="1" value="${state.lift}"></div>
      <div class="btn-row">
        <button class="btn primary" id="cr-go" type="button">Release</button>
        <button class="btn" id="cr-pause" type="button">Pause</button>
      </div>
    `;
  },

  wire(root) {
    els.lift = root.querySelector("#cr-lift");
    els.liftval = root.querySelector("#cr-liftval");
    els.go = root.querySelector("#cr-go");
    els.pause = root.querySelector("#cr-pause");

    els.liftval.textContent = String(state.lift);
    els.lift.addEventListener("input", () => {
      state.lift = +els.lift.value;
      els.liftval.textContent = String(state.lift);
      reset();
    });
    els.go.addEventListener("click", reset);
    els.pause.addEventListener("click", () => {
      state.running = !state.running;
      els.pause.textContent = state.running ? "Pause" : "Play";
    });
  },

  update(dt) {
    if (!state.running) return;
    const h = Math.min(dt, 0.02);
    const g = 26;
    for (let iter = 0; iter < 3; iter++) {
      balls.forEach((b) => {
        b.userData.omega += -(g / LEN) * Math.sin(b.userData.theta) * h;
        b.userData.theta += b.userData.omega * h;
      });
      // resolve contacts left-to-right: if neighbours overlap and are closing, swap omegas
      for (let i = 0; i < N - 1; i++) {
        const a = balls[i].userData;
        const c = balls[i + 1].userData;
        if (a.theta > c.theta - 0.001 && a.omega > c.omega) {
          const tmp = a.omega;
          a.omega = c.omega;
          c.omega = tmp;
        }
      }
    }
    place();
  },

  onEnter() {
    reset();
  },
  onExit() {},
};
