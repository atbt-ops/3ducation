import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { createLabel } from "../engine/label.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.68, dir: 0.9 });
const group = new THREE.Group();
scene.add(group);

const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0b08c, roughness: 0.7 });
const rulerMat = new THREE.MeshStandardMaterial({ color: 0xd9b871, roughness: 0.6 });
const tickMat = new THREE.MeshBasicMaterial({ color: 0x2b2b2e });
const zeroMat = new THREE.MeshBasicMaterial({ color: 0xc23b2b });

// Thumb and forefinger, held apart at the "zero" mark, waiting to catch the ruler.
const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.3), skinMat);
thumb.position.set(0, 0.18, 0.05);
group.add(thumb);
const finger = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.3), skinMat);
finger.position.set(0, -0.18, -0.05);
group.add(finger);
const handLabel = createLabel("Fingers, ready to catch", { fontSize: 22 });
handLabel.position.set(1.3, 0, 0);
group.add(handLabel);

// The ruler — hangs with its zero mark level with the fingers until it's dropped.
const RULER_LEN = 3.4;
const ruler = new THREE.Group();
group.add(ruler);
const START_Y = 0;
ruler.position.set(0, START_Y, 0);
const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, RULER_LEN, 0.06), rulerMat);
body.position.y = RULER_LEN / 2;
ruler.add(body);
for (let cm = 0; cm <= 100; cm += 10) {
  const y = (cm / 100) * RULER_LEN;
  const tick = new THREE.Mesh(new THREE.BoxGeometry(cm % 50 === 0 ? 0.34 : 0.22, 0.02, 0.03), cm === 0 ? zeroMat : tickMat);
  tick.position.set(0, y, 0.04);
  ruler.add(tick);
}
const rulerLabel = createLabel("Ruler (zero mark at the bottom)", { fontSize: 22 });
rulerLabel.position.set(0, RULER_LEN + 0.4, 0);
ruler.add(rulerLabel);

const G = 9.8; // m/s^2
const WORLD_PER_M = 6; // how far the ruler visibly falls per metre of real fall

const state = { phase: "idle", t: 0, delay: 1.5, lastMs: null, best: null };
const els = {};

function fallDistanceM(t) {
  return 0.5 * G * t * t;
}

function armIt() {
  state.phase = "armed";
  state.t = 0;
  state.delay = 1 + Math.random() * 1.8;
  ruler.position.y = START_Y;
  syncButton();
}

function catchIt() {
  if (state.phase === "armed") {
    // Clicked before the ruler was even released.
    state.phase = "falsestart";
    syncButton();
    return;
  }
  if (state.phase !== "falling") return;
  const ms = Math.round(state.t * 1000);
  state.lastMs = ms;
  if (state.best === null || ms < state.best) state.best = ms;
  state.phase = "caught";
  syncButton();
}

function reset() {
  state.phase = "idle";
  ruler.position.y = START_Y;
  syncButton();
}

function syncButton() {
  if (!els.btn) return;
  const distCm = (fallDistanceM(state.t) * 100).toFixed(1);
  if (state.phase === "idle") {
    els.btn.textContent = "Drop the ruler";
    els.result.textContent = state.best !== null ? `Best so far: ${state.best} ms` : "No attempts yet.";
  } else if (state.phase === "armed") {
    els.btn.textContent = "Catch it!";
    els.result.textContent = "Watching… don't click until it actually falls.";
  } else if (state.phase === "falling") {
    els.btn.textContent = "Catch it!";
    els.result.textContent = "Falling now — catch it!";
  } else if (state.phase === "caught") {
    els.btn.textContent = "Try again";
    els.result.textContent = `Reaction time: ${state.lastMs} ms — the ruler fell ${distCm} cm.`;
  } else if (state.phase === "falsestart") {
    els.btn.textContent = "Try again";
    els.result.textContent = "Too soon! It hadn't been released yet — that's a false start.";
  }
}

export default {
  id: "reactiontime",
  name: "Reaction time ruler",
  tag: "Biology · Coordination",
  subject: "Biology",
  grades: [6, 11],
  blurb: "Catch a falling ruler — the drop distance times your reaction time.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="17" y="4" width="6" height="26" rx="1" fill="currentColor"/><path d="M12 33l8-6 8 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  scene,
  view: { target: [0.2, 1.2, 0], radius: 8.5, theta: 0.25, phi: 1.35, minRadius: 4, maxRadius: 15 },

  lesson: `
    <p>Hold a ruler so its zero mark sits right between a friend's open thumb and finger, then
    drop it without warning. There's always a short gap between the moment they see it move and
    the moment their fingers actually close — that gap is their <strong>reaction time</strong>.</p>
    <p>Because the ruler falls under gravity, the distance it drops (<span class="mono">d = ½gt²</span>)
    directly reveals how long that gap was: catch it early and it's barely moved; hesitate and it
    falls much further. Unlike an automatic reflex such as the knee-jerk, catching a falling
    object is a <strong>voluntary</strong> response — the signal has to travel all the way up to
    the brain and back before the fingers close, which is exactly why it takes noticeably longer
    than a reflex.</p>
  `,

  quiz: [
    { q: "Why is there always a delay before you can catch the falling ruler?", choices: ["The ruler is enchanted", "There's a real gap — your reaction time — between seeing it fall and your fingers closing", "Rulers fall slower than other objects", "Your eyes are shut"], answer: 1, explain: "Reaction time is the real, measurable gap between sensing a stimulus and responding to it." },
    { q: "Catching a falling ruler is an example of a response that is…", choices: ["involuntary, like the knee-jerk reflex", "voluntary — a conscious decision to close your fingers", "not a nervous response", "purely muscular, with no nerves involved"], answer: 1, explain: "You consciously choose to grab it, unlike an automatic reflex such as the knee-jerk." },
    { q: "If the ruler falls further before being caught, that means the reaction time was…", choices: ["shorter", "longer", "exactly zero", "impossible to know"], answer: 1, explain: "More fall distance means more time passed before the catch — a longer reaction time." },
    { q: "Compared to the knee-jerk reflex, a voluntary response like this one usually travels…", choices: ["a shorter pathway, straight to the spinal cord", "a longer pathway, up to the brain and back", "no nerve pathway at all", "the exact same pathway"], answer: 1, explain: "Voluntary responses are processed by the brain, a longer route than a reflex arc to the spinal cord alone." },
  ],

  panelHTML() {
    return `
      <div class="btn-row"><button class="btn primary" id="rt-btn" type="button">Drop the ruler</button></div>
      <p class="fact" id="rt-result">No attempts yet.</p>
      <p class="fact">Formula: <span class="mono">d = ½gt²</span> — the fall distance reveals the reaction time.</p>
    `;
  },

  wire(root) {
    els.btn = root.querySelector("#rt-btn");
    els.result = root.querySelector("#rt-result");
    els.btn.addEventListener("click", () => {
      if (state.phase === "idle" || state.phase === "caught" || state.phase === "falsestart") {
        armIt();
      } else {
        catchIt();
      }
    });
    syncButton();
  },

  update(dt) {
    if (state.phase === "armed") {
      state.t += dt;
      if (state.t >= state.delay) {
        state.phase = "falling";
        state.t = 0;
        syncButton();
      }
    } else if (state.phase === "falling") {
      state.t += dt;
      ruler.position.y = START_Y - fallDistanceM(state.t) * WORLD_PER_M;
    }
  },

  onEnter() {},
  onExit() {
    reset();
  },
};
