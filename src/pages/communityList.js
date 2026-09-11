import { escapeHtml, BACK_BTN } from "../lib/html.js";
import { SUBJECT_ACCENT } from "../lib/subjectAccent.js";

function card(s) {
  const accent = SUBJECT_ACCENT[s.subject];
  return `
    <a class="card" href="#/community/${s.id}">
      <span class="rivet tl"></span><span class="rivet tr"></span>
      <span class="rivet bl"></span><span class="rivet br"></span>
      <span class="card-icon"><svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6l4 8 9 1-6.5 6 1.5 9-8-4.5-8 4.5 1.5-9L7 15l9-1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></span>
      <span class="tag" ${accent ? `style="color:${accent}"` : ""}>${escapeHtml(s.subject)} · Community</span>
      <h3>${escapeHtml(s.name)}</h3>
      <p>${escapeHtml(s.description)}</p>
    </a>`;
}

export async function renderCommunityList(main) {
  main.innerHTML = `
    ${BACK_BTN}
    <section class="hero">
      <span class="eyebrow">Community instruments</span>
      <h1>Built by other learners.</h1>
      <p id="cl-count">No-code formula instruments other visitors have submitted and a
      maintainer has approved. Want to add one? Head to
      <a href="#/submit">Submit an instrument</a> — no programming needed, just a formula.</p>
    </section>
    <div class="bench" id="commBench"><p class="fact">Loading…</p></div>
  `;
  const bench = main.querySelector("#commBench");
  const countEl = main.querySelector("#cl-count");
  try {
    const { listApprovedFormulas } = await import("../submissions.js");
    const items = await listApprovedFormulas();
    if (items.length) {
      countEl.innerHTML = `<strong>${items.length}</strong> instrument${items.length > 1 ? "s" : ""} built
        by other learners and approved so far. Want to add one?
        <a href="#/submit">Submit an instrument</a> — no programming needed, just a formula.`;
    }
    bench.innerHTML = items.length
      ? items.map(card).join("")
      : '<p class="fact">Nothing published yet — be the first at <a href="#/submit">Submit an instrument</a>.</p>';
  } catch {
    bench.innerHTML = '<p class="fact">Couldn\'t load community instruments right now.</p>';
  }
}
