import { createSubmission, listMySubmissions } from "../submissions.js";
import { SUBJECTS } from "../modules/index.js";
import { escapeHtml } from "../lib/html.js";

const TEMPLATE = `import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";

const scene = new THREE.Scene();
sceneLights(scene, { ambient: 0.7, dir: 0.85 });

// ... build your THREE.js scene here ...

export default {
  id: "my-instrument",
  name: "My instrument",
  tag: "Physics · Your topic",
  subject: "Physics",
  grades: [8, 11],
  blurb: "One line describing what it does.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 8, theta: 0.5, phi: 1.2, minRadius: 4, maxRadius: 16 },
  lesson: \`<p>Short explanation of the concept.</p>\`,
  quiz: [
    { q: "A question?", choices: ["a", "b", "c", "d"], answer: 0, explain: "Why a is right." },
  ],
  panelHTML() { return \`<div class="formula"><span>...</span></div>\`; },
  wire(root) { /* attach input listeners */ },
  update(dt, viewer) { /* animate each frame */ },
  onEnter() {},
  onExit() {},
};
`;

const STATUS_LABEL = { pending: "In review", approved: "Approved ✓", rejected: "Not accepted" };

function statusRow(s) {
  const cls = s.status === "approved" ? "mastered" : s.status === "rejected" ? "score" : "visited";
  return `
    <div class="submission-row">
      <div>
        <b>${escapeHtml(s.name)}</b>
        <span class="badge is-${cls}">${escapeHtml(STATUS_LABEL[s.status] || s.status)}</span>
      </div>
      <p class="fact">${escapeHtml(s.subject)} · classes ${s.gradeMin}–${s.gradeMax}</p>
      ${s.reviewNote ? `<p class="fact"><strong>Reviewer note:</strong> ${escapeHtml(s.reviewNote)}</p>` : ""}
    </div>`;
}

export async function renderSubmit(main, user, requestSignIn) {
  if (!user) {
    main.innerHTML = `
      <section class="hero">
        <span class="eyebrow">Community instruments</span>
        <h1>Build the next instrument.</h1>
        <p>Sign in to submit your own module idea. Every submission is reviewed by a maintainer
        before it ever reaches other visitors — nothing you write runs in anyone else's browser
        automatically.</p>
        <div class="btn-row"><button class="btn primary" id="submitSignIn" type="button">Sign in to submit</button></div>
      </section>`;
    main.querySelector("#submitSignIn").addEventListener("click", requestSignIn);
    return;
  }

  main.innerHTML = `
    <section class="hero">
      <span class="eyebrow">Community instruments</span>
      <h1>Submit an instrument.</h1>
      <p>Describe your idea and paste module code following the shape below. A maintainer reviews
      every submission — approved ones get merged into the real codebase and deployed like any
      other change. This never auto-publishes.</p>
    </section>
    <form id="subForm" class="notebook" style="max-width:640px">
      <div class="control"><label for="s-name">Instrument name</label>
        <input type="text" id="s-name" class="text-input" required maxlength="60"></div>
      <div class="control"><label for="s-subject">Subject</label>
        <select id="s-subject" class="text-input">${SUBJECTS.map((s) => `<option value="${s}">${s}</option>`).join("")}</select></div>
      <div class="control"><div class="row"><label>Grade range</label></div>
        <div class="btn-row">
          <input type="number" id="s-gmin" class="text-input" style="max-width:90px" min="1" max="12" value="8" aria-label="Minimum grade">
          <span style="align-self:center">to</span>
          <input type="number" id="s-gmax" class="text-input" style="max-width:90px" min="1" max="12" value="11" aria-label="Maximum grade">
        </div>
      </div>
      <div class="control"><label for="s-desc">What does it teach? (1–3 sentences)</label>
        <textarea id="s-desc" class="text-input" rows="3" required maxlength="500"></textarea></div>
      <div class="control"><label for="s-code">Module code</label>
        <textarea id="s-code" class="text-input mono" rows="16" spellcheck="false">${TEMPLATE}</textarea>
        <p class="fact">Follow the shape other instruments use — see any file in
          <a href="https://github.com/atbt-ops/3ducation/tree/main/src/modules" target="_blank" rel="noopener">src/modules</a>
          for real examples.</p></div>
      <p class="fact modal-error" id="s-error" role="alert" hidden></p>
      <div class="btn-row"><button class="btn primary" type="submit">Submit for review</button></div>
    </form>
    <h2 style="margin-top:28px">Your submissions</h2>
    <div id="mySubs"><p class="fact">Loading…</p></div>
  `;

  const err = main.querySelector("#s-error");
  main.querySelector("#subForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    const name = main.querySelector("#s-name").value.trim();
    const subject = main.querySelector("#s-subject").value;
    const gradeMin = +main.querySelector("#s-gmin").value;
    const gradeMax = +main.querySelector("#s-gmax").value;
    const description = main.querySelector("#s-desc").value.trim();
    const code = main.querySelector("#s-code").value;
    if (!name || !description || !code.trim()) {
      err.textContent = "Please fill in every field.";
      err.hidden = false;
      return;
    }
    try {
      await createSubmission(user, { name, subject, gradeMin, gradeMax, description, code });
      main.querySelector("#subForm").reset();
      main.querySelector("#s-code").value = TEMPLATE;
      loadMine();
    } catch {
      err.textContent = "Couldn't save your submission — please try again.";
      err.hidden = false;
    }
  });

  async function loadMine() {
    const box = main.querySelector("#mySubs");
    try {
      const mine = await listMySubmissions(user.uid);
      box.innerHTML = mine.length
        ? mine.map(statusRow).join("")
        : '<p class="fact">Nothing submitted yet.</p>';
    } catch {
      box.innerHTML = '<p class="fact">Couldn\'t load your submissions.</p>';
    }
  }
  loadMine();
}
