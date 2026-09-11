import { listAllSubmissions, reviewSubmission } from "../submissions.js";
import { isAdmin } from "../firebase.js";
import { escapeHtml, BACK_BTN } from "../lib/html.js";

function body(s) {
  if (s.type === "formula") {
    return `
      <div class="formula"><span>z = f(x, y)</span><b class="mono">${escapeHtml(s.formula)}</b></div>
      <p class="fact"><a href="#/community/${s.id}" target="_blank" rel="noopener">Preview it live →</a>
        (you can see it as admin even before approving)</p>
      <p class="fact">${
        s.quiz?.length
          ? `🧠 Includes ${s.quiz.length} check-yourself question${s.quiz.length > 1 ? "s" : ""} —
             visible in the live preview above.`
          : "No check-yourself quiz was added — that's fine, quizzes are optional."
      }</p>`;
  }
  return `
    <details><summary>View code (read-only, never executed)</summary>
      <pre class="mono submission-code">${escapeHtml(s.code || "")}</pre>
    </details>`;
}

function card(s) {
  const kind = s.type === "formula" ? "No-code formula" : "Developer code";
  return `
    <div class="submission-row" data-id="${s.id}">
      <div>
        <b>${escapeHtml(s.name)}</b>
        <span class="badge is-visited">${escapeHtml(s.status)}</span>
      </div>
      <p class="fact">${kind} · ${escapeHtml(s.subject)} · classes ${s.gradeMin}–${s.gradeMax} ·
        by ${escapeHtml(s.authorName || s.authorEmail || "unknown")}</p>
      <p class="fact">${escapeHtml(s.description)}</p>
      ${body(s)}
      ${
        s.status === "pending"
          ? `<div class="control"><label for="note-${s.id}">Reviewer note (optional)</label>
             <input type="text" id="note-${s.id}" class="text-input" maxlength="300"></div>
           <div class="btn-row">
             <button class="btn primary" data-act="approve" data-id="${s.id}" type="button">Approve</button>
             <button class="btn" data-act="reject" data-id="${s.id}" type="button">Reject</button>
           </div>`
          : `<p class="fact">${s.reviewNote ? `Note: ${escapeHtml(s.reviewNote)}` : ""}</p>`
      }
    </div>`;
}

export async function renderReview(main, user) {
  if (!user || !isAdmin(user)) {
    main.innerHTML = `
      ${BACK_BTN}
      <section class="hero">
        <span class="eyebrow">Review queue</span>
        <h1>Admins only.</h1>
        <p>This page is for reviewing community-submitted instruments. Sign in with an admin
        account to see it.</p>
      </section>`;
    return;
  }

  main.innerHTML = `
    ${BACK_BTN}
    <section class="hero">
      <span class="eyebrow">Review queue</span>
      <h1>Community submissions.</h1>
      <p>Approving a <strong>formula</strong> submission publishes it immediately at
      <span class="mono">#/community</span> — it only ever runs through the same sandboxed
      expression engine Surface studio uses, so there's nothing to execute unsafely. Approving
      <strong>developer code</strong> does <em>not</em> publish it — copy it into
      <span class="mono">src/modules/</span>, review it properly, add it to the registry, and
      deploy as a normal commit.</p>
    </section>
    <div id="revList"><p class="fact">Loading…</p></div>
  `;

  const list = main.querySelector("#revList");

  async function load() {
    try {
      const all = await listAllSubmissions();
      const pending = all.filter((s) => s.status === "pending");
      const rest = all.filter((s) => s.status !== "pending");
      list.innerHTML = `
        <h2>Pending (${pending.length})</h2>
        ${pending.length ? pending.map(card).join("") : '<p class="fact">Nothing waiting.</p>'}
        <h2 style="margin-top:24px">Reviewed</h2>
        ${rest.length ? rest.map(card).join("") : '<p class="fact">None yet.</p>'}
      `;
    } catch {
      list.innerHTML = '<p class="fact">Couldn\'t load submissions.</p>';
    }
  }

  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    const note = main.querySelector(`#note-${id}`)?.value.trim() || "";
    const status = btn.dataset.act === "approve" ? "approved" : "rejected";
    btn.disabled = true;
    try {
      await reviewSubmission(id, status, note);
      load();
    } catch {
      btn.disabled = false;
    }
  });

  load();
}
