import { createSubmission, listMySubmissions } from "../submissions.js";
import { SUBJECTS } from "../modules/index.js";
import { isValidExpr } from "../lib/expr.js";
import { escapeHtml, BACK_BTN } from "../lib/html.js";

const CODE_TEMPLATE = `import * as THREE from "three";
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
  const kind = s.type === "formula" ? "No-code formula" : "Developer code";
  return `
    <div class="submission-row">
      <div>
        <b>${escapeHtml(s.name)}</b>
        <span class="badge is-${cls}">${escapeHtml(STATUS_LABEL[s.status] || s.status)}</span>
      </div>
      <p class="fact">${kind} · ${escapeHtml(s.subject)} · classes ${s.gradeMin}–${s.gradeMax}
        ${s.quiz?.length ? `· ${s.quiz.length} quiz question${s.quiz.length > 1 ? "s" : ""}` : ""}</p>
      ${
        s.status === "approved" && s.type === "formula"
          ? `<p class="fact"><a href="#/community/${s.id}">View it live →</a></p>`
          : ""
      }
      ${s.reviewNote ? `<p class="fact"><strong>Reviewer note:</strong> ${escapeHtml(s.reviewNote)}</p>` : ""}
    </div>`;
}

function subjectOptions() {
  return SUBJECTS.map((s) => `<option value="${s}">${s}</option>`).join("");
}

const MAX_QUIZ = 5;

function quizItemHTML(qid) {
  return `
    <div class="quiz-builder-item" data-qid="${qid}">
      <div class="row" style="display:flex;justify-content:space-between;align-items:center">
        <b>Question</b>
        <button class="btn" type="button" data-act="remove-quiz" data-qid="${qid}">Remove</button>
      </div>
      <div class="control"><label for="qq-${qid}">Question text</label>
        <input type="text" id="qq-${qid}" class="text-input" maxlength="200"
          placeholder="e.g. What happens to z when k increases?"></div>
      <div class="control"><label>Answer choices — pick the correct one</label>
        ${[0, 1, 2, 3]
          .map(
            (ci) => `
          <div class="row" style="justify-content:flex-start;gap:8px;align-items:center;margin-bottom:6px">
            <input type="radio" name="qans-${qid}" id="qans-${qid}-${ci}" value="${ci}" style="flex:none" aria-label="This is the correct choice">
            <input type="text" id="qc-${qid}-${ci}" class="text-input" maxlength="80" placeholder="Choice ${ci + 1}">
          </div>`
          )
          .join("")}
      </div>
      <div class="control"><label for="qe-${qid}">Why is that correct? (shown after answering)</label>
        <input type="text" id="qe-${qid}" class="text-input" maxlength="200"></div>
    </div>`;
}

function formulaFormHTML() {
  return `
    <form id="subForm" class="notebook" style="max-width:640px">
      <p class="fact">No programming needed — just a formula. Try ideas first in
        <a href="#/grapher" target="_blank" rel="noopener">Surface studio</a> to see how they look,
        then paste the one you like below.</p>
      <div class="control"><label for="f-name">Instrument name</label>
        <input type="text" id="f-name" class="text-input" required maxlength="60" placeholder="e.g. The Twisting Saddle"></div>
      <div class="control"><label for="f-subject">Subject</label>
        <select id="f-subject" class="text-input">${subjectOptions()}</select></div>
      <div class="control"><div class="row"><label>Grade range</label></div>
        <div class="btn-row">
          <input type="number" id="f-gmin" class="text-input" style="max-width:90px" min="1" max="12" value="8" aria-label="Minimum grade">
          <span style="align-self:center">to</span>
          <input type="number" id="f-gmax" class="text-input" style="max-width:90px" min="1" max="12" value="11" aria-label="Maximum grade">
        </div>
      </div>
      <div class="control"><label for="f-desc">What does it show? (1–3 sentences)</label>
        <textarea id="f-desc" class="text-input" rows="3" required maxlength="500"
          placeholder="e.g. A saddle-shaped surface that curves up along x and down along y."></textarea></div>
      <div class="control"><label for="f-formula">Formula — z = f(x, y), may use k as a free coefficient</label>
        <input type="text" id="f-formula" class="text-input mono" spellcheck="false" autocapitalize="off"
          autocomplete="off" required placeholder="e.g. k*sin(x)*cos(y)">
        <p class="fact" id="f-formula-status">Type a formula to check it.</p>
      </div>
      <div class="control">
        <div class="row"><label>Check-yourself quiz (optional)</label></div>
        <p class="fact">Add up to 5 questions so learners can test themselves after viewing your
          instrument. Leave this empty if you'd rather skip it.</p>
        <div id="f-quiz-list"></div>
        <p class="fact modal-error" id="f-quiz-error" role="alert" hidden></p>
        <div class="btn-row"><button class="btn" type="button" id="f-quiz-add">+ Add a question</button></div>
      </div>
      <p class="fact modal-error" id="f-error" role="alert" hidden></p>
      <div class="btn-row"><button class="btn primary" type="submit" id="f-submit" disabled>Submit for review</button></div>
    </form>`;
}

function codeFormHTML() {
  return `
    <form id="subForm" class="notebook" style="max-width:640px">
      <p class="fact">For people comfortable writing JavaScript / three.js. Follow the shape other
        instruments use — see any file in
        <a href="https://github.com/atbt-ops/3ducation/tree/main/src/modules" target="_blank" rel="noopener">src/modules</a>
        for real examples. A maintainer reviews the code by hand before it's merged and deployed —
        this never runs automatically.</p>
      <div class="control"><label for="c-name">Instrument name</label>
        <input type="text" id="c-name" class="text-input" required maxlength="60"></div>
      <div class="control"><label for="c-subject">Subject</label>
        <select id="c-subject" class="text-input">${subjectOptions()}</select></div>
      <div class="control"><div class="row"><label>Grade range</label></div>
        <div class="btn-row">
          <input type="number" id="c-gmin" class="text-input" style="max-width:90px" min="1" max="12" value="8" aria-label="Minimum grade">
          <span style="align-self:center">to</span>
          <input type="number" id="c-gmax" class="text-input" style="max-width:90px" min="1" max="12" value="11" aria-label="Maximum grade">
        </div>
      </div>
      <div class="control"><label for="c-desc">What does it teach? (1–3 sentences)</label>
        <textarea id="c-desc" class="text-input" rows="3" required maxlength="500"></textarea></div>
      <div class="control"><label for="c-code">Module code</label>
        <textarea id="c-code" class="text-input mono" rows="16" spellcheck="false">${CODE_TEMPLATE}</textarea></div>
      <p class="fact modal-error" id="c-error" role="alert" hidden></p>
      <div class="btn-row"><button class="btn primary" type="submit">Submit for review</button></div>
    </form>`;
}

export async function renderSubmit(main, user, requestSignIn) {
  if (!user) {
    main.innerHTML = `
      ${BACK_BTN}
      <section class="hero-panel">
        <div class="hero hero-main">
          <span class="eyebrow">Community instruments</span>
          <h1>Build the next instrument.</h1>
          <p>Sign in to submit your own instrument idea — no coding required, a simple formula is
          enough. Every submission is reviewed before it reaches other visitors.</p>
          <div class="btn-row"><button class="btn primary" id="submitSignIn" type="button">Sign in to submit</button></div>
        </div>
        <aside class="hero-spot">
          <h2>No coding needed</h2>
          <ul class="spot-list">
            <li><span class="spot-emoji" aria-hidden="true">🧮</span><span>Type a formula, see it plot live in Surface studio, then submit it.</span></li>
            <li><span class="spot-emoji" aria-hidden="true">✅</span><span>Approved formulas go live immediately at <span class="mono">#/community</span>.</span></li>
            <li><span class="spot-emoji" aria-hidden="true">💻</span><span>Comfortable with JavaScript? There's an advanced developer-code track too.</span></li>
          </ul>
        </aside>
      </section>`;
    main.querySelector("#submitSignIn").addEventListener("click", requestSignIn);
    return;
  }

  main.innerHTML = `
    ${BACK_BTN}
    <section class="hero-panel">
      <div class="hero hero-main">
        <span class="eyebrow">Community instruments</span>
        <h1>Submit an instrument.</h1>
        <p>Two ways in: a <strong>formula</strong> (no coding — recommended for almost everyone), or
        <strong>developer code</strong> for a fully custom instrument.</p>
      </div>
      <aside class="hero-spot">
        <h2>How review works</h2>
        <ul class="spot-list">
          <li><span class="spot-emoji" aria-hidden="true">🧮</span><span><strong>Formula:</strong> validated instantly by the same safe engine Surface studio uses — approved ones publish right away, no code review needed.</span></li>
          <li><span class="spot-emoji" aria-hidden="true">💻</span><span><strong>Developer code:</strong> saved as text, never executed — a maintainer reads it and merges it in by hand if it's a good fit.</span></li>
        </ul>
      </aside>
    </section>
    <div class="chip-row" role="group" aria-label="Submission type" style="margin-bottom:18px">
      <button class="chip" type="button" id="tabFormula" aria-pressed="true">🧮 Formula plot (no code)</button>
      <button class="chip" type="button" id="tabCode" aria-pressed="false">💻 Developer code (advanced)</button>
    </div>
    <div id="formHost"></div>
    <h2 style="margin-top:28px">Your submissions</h2>
    <div id="mySubs"><p class="fact">Loading…</p></div>
  `;

  const host = main.querySelector("#formHost");
  const tabFormula = main.querySelector("#tabFormula");
  const tabCode = main.querySelector("#tabCode");
  let type = "formula";

  function wireFormulaForm() {
    const form = main.querySelector("#subForm");
    const formulaInput = main.querySelector("#f-formula");
    const status = main.querySelector("#f-formula-status");
    const submitBtn = main.querySelector("#f-submit");
    const err = main.querySelector("#f-error");
    const quizList = main.querySelector("#f-quiz-list");
    const quizAddBtn = main.querySelector("#f-quiz-add");
    const quizErr = main.querySelector("#f-quiz-error");
    let quizIds = [];
    let quizSeq = 0;

    function refreshQuizAddBtn() {
      quizAddBtn.disabled = quizIds.length >= MAX_QUIZ;
      quizAddBtn.textContent = quizIds.length >= MAX_QUIZ ? "Maximum 5 questions" : "+ Add a question";
    }

    function addQuizBlock() {
      if (quizIds.length >= MAX_QUIZ) return;
      const qid = ++quizSeq;
      quizIds.push(qid);
      quizList.insertAdjacentHTML("beforeend", quizItemHTML(qid));
      quizList
        .querySelector(`[data-qid="${qid}"] [data-act="remove-quiz"]`)
        .addEventListener("click", () => {
          quizIds = quizIds.filter((x) => x !== qid);
          quizList.querySelector(`.quiz-builder-item[data-qid="${qid}"]`).remove();
          refreshQuizAddBtn();
        });
      refreshQuizAddBtn();
    }
    quizAddBtn.addEventListener("click", addQuizBlock);

    // Reads every quiz block the author started; returns null (with the error
    // message shown) if one was left half-filled, otherwise the finished list.
    function collectQuiz() {
      quizErr.hidden = true;
      const quiz = [];
      for (const qid of quizIds) {
        const q = main.querySelector(`#qq-${qid}`).value.trim();
        const choices = [0, 1, 2, 3].map((ci) => main.querySelector(`#qc-${qid}-${ci}`).value.trim());
        const checked = main.querySelector(`input[name="qans-${qid}"]:checked`);
        const explain = main.querySelector(`#qe-${qid}`).value.trim();
        const started = q || choices.some(Boolean) || checked || explain;
        if (!started) continue;
        if (!q || choices.some((c) => !c) || !checked) {
          quizErr.textContent =
            "Finish or remove any quiz question you've started — it needs question text, all 4 choices, and a marked correct answer.";
          quizErr.hidden = false;
          return null;
        }
        quiz.push({ q, choices, answer: +checked.value, explain: explain || "That's correct." });
      }
      return quiz;
    }

    formulaInput.addEventListener("input", () => {
      const src = formulaInput.value.trim();
      const ok = src && isValidExpr(src, ["x", "y", "k"]);
      submitBtn.disabled = !ok;
      formulaInput.setAttribute("aria-invalid", src && !ok ? "true" : "false");
      status.textContent = !src
        ? "Type a formula to check it."
        : ok
          ? "Looks good ✓ — you can submit it."
          : "Can't read that formula. Try it in Surface studio first to debug it.";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      const name = main.querySelector("#f-name").value.trim();
      const subject = main.querySelector("#f-subject").value;
      const gradeMin = +main.querySelector("#f-gmin").value;
      const gradeMax = +main.querySelector("#f-gmax").value;
      const description = main.querySelector("#f-desc").value.trim();
      const formula = formulaInput.value.trim();
      if (!name || !description || !isValidExpr(formula, ["x", "y", "k"])) {
        err.textContent = "Please fill in every field with a valid formula.";
        err.hidden = false;
        return;
      }
      const quiz = collectQuiz();
      if (quiz === null) return;
      try {
        await createSubmission(user, {
          type: "formula",
          name,
          subject,
          gradeMin,
          gradeMax,
          description,
          formula,
          quiz,
        });
        renderForm();
        loadMine();
      } catch {
        err.textContent = "Couldn't save your submission — please try again.";
        err.hidden = false;
      }
    });
  }

  function wireCodeForm() {
    const form = main.querySelector("#subForm");
    const err = main.querySelector("#c-error");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      const name = main.querySelector("#c-name").value.trim();
      const subject = main.querySelector("#c-subject").value;
      const gradeMin = +main.querySelector("#c-gmin").value;
      const gradeMax = +main.querySelector("#c-gmax").value;
      const description = main.querySelector("#c-desc").value.trim();
      const code = main.querySelector("#c-code").value;
      if (!name || !description || !code.trim()) {
        err.textContent = "Please fill in every field.";
        err.hidden = false;
        return;
      }
      try {
        await createSubmission(user, { type: "code", name, subject, gradeMin, gradeMax, description, code });
        renderForm();
        loadMine();
      } catch {
        err.textContent = "Couldn't save your submission — please try again.";
        err.hidden = false;
      }
    });
  }

  function renderForm() {
    if (type === "formula") {
      host.innerHTML = formulaFormHTML();
      wireFormulaForm();
    } else {
      host.innerHTML = codeFormHTML();
      wireCodeForm();
    }
  }
  renderForm();

  tabFormula.addEventListener("click", () => {
    type = "formula";
    tabFormula.setAttribute("aria-pressed", "true");
    tabCode.setAttribute("aria-pressed", "false");
    renderForm();
  });
  tabCode.addEventListener("click", () => {
    type = "code";
    tabFormula.setAttribute("aria-pressed", "false");
    tabCode.setAttribute("aria-pressed", "true");
    renderForm();
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
