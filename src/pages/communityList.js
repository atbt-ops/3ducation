import { escapeHtml } from "../lib/html.js";

function card(s) {
  return `
    <a class="card" href="#/community/${s.id}">
      <span class="rivet tl"></span><span class="rivet tr"></span>
      <span class="rivet bl"></span><span class="rivet br"></span>
      <span class="card-icon"><svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6l4 8 9 1-6.5 6 1.5 9-8-4.5-8 4.5 1.5-9L7 15l9-1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></span>
      <span class="tag">${escapeHtml(s.subject)} · Community</span>
      <h3>${escapeHtml(s.name)}</h3>
      <p>${escapeHtml(s.description)}</p>
    </a>`;
}

export async function renderCommunityList(main) {
  main.innerHTML = `
    <section class="hero">
      <span class="eyebrow">Community instruments</span>
      <h1>Built by other learners.</h1>
      <p>No-code formula instruments other visitors have submitted and a maintainer has
      approved. Want to add one? Head to <a href="#/submit">Submit an instrument</a> —
      no programming needed, just a formula.</p>
    </section>
    <div class="bench" id="commBench"><p class="fact">Loading…</p></div>
  `;
  const bench = main.querySelector("#commBench");
  try {
    const { listApprovedFormulas } = await import("../submissions.js");
    const items = await listApprovedFormulas();
    bench.innerHTML = items.length
      ? items.map(card).join("")
      : '<p class="fact">Nothing published yet — be the first at <a href="#/submit">Submit an instrument</a>.</p>';
  } catch {
    bench.innerHTML = '<p class="fact">Couldn\'t load community instruments right now.</p>';
  }
}
