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
    <div class="filters" id="clFilters" hidden>
      <input type="search" id="cl-q" class="text-input search-input" placeholder="Search community instruments…" aria-label="Search community instruments">
      <div class="chip-row" id="clChips" role="group" aria-label="Filter by subject"></div>
    </div>
    <div class="bench" id="commBench"><p class="fact">Loading…</p></div>
    <p class="bench-empty" id="clEmpty" hidden>Nothing matches that search — try a different word or subject.</p>
  `;
  const bench = main.querySelector("#commBench");
  const countEl = main.querySelector("#cl-count");
  const filtersEl = main.querySelector("#clFilters");
  const qInput = main.querySelector("#cl-q");
  const chipsEl = main.querySelector("#clChips");
  const emptyEl = main.querySelector("#clEmpty");

  try {
    const { listApprovedFormulas } = await import("../submissions.js");
    const items = await listApprovedFormulas();
    if (!items.length) {
      bench.innerHTML = '<p class="fact">Nothing published yet — be the first at <a href="#/submit">Submit an instrument</a>.</p>';
      return;
    }

    countEl.innerHTML = `<strong>${items.length}</strong> instrument${items.length > 1 ? "s" : ""} built
      by other learners and approved so far. Want to add one?
      <a href="#/submit">Submit an instrument</a> — no programming needed, just a formula.`;

    const subjects = [...new Set(items.map((s) => s.subject))].sort();
    let filter = "All";
    let query = "";

    function paintChips() {
      chipsEl.innerHTML = ["All", ...subjects]
        .map((name) => {
          const accent = SUBJECT_ACCENT[name];
          const dot = accent ? `<span class="chip-dot" style="background:${accent}" aria-hidden="true"></span>` : "";
          return `<button class="chip" type="button" data-filter="${escapeHtml(name)}" style="${accent ? `--chip-accent:${accent}` : ""}" aria-pressed="${name === filter}">${dot}${escapeHtml(name)}</button>`;
        })
        .join("");
    }

    function paint() {
      const q = query.toLowerCase();
      const list = items.filter((s) => {
        if (filter !== "All" && s.subject !== filter) return false;
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.subject.toLowerCase().includes(q)
        );
      });
      emptyEl.hidden = list.length > 0;
      bench.innerHTML = list.map(card).join("");
      paintChips();
    }

    filtersEl.hidden = items.length <= 4;
    chipsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filter = btn.dataset.filter;
      paint();
    });
    qInput.addEventListener("input", () => {
      query = qInput.value.trim();
      paint();
    });

    paint();
  } catch {
    bench.innerHTML = '<p class="fact">Couldn\'t load community instruments right now.</p>';
  }
}
