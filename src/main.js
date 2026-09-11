import "./style.css";
import { Viewer } from "./engine/viewer.js";
import { MODULES, MODULE_IDS, SUBJECTS, BANDS, inBand, getModule } from "./modules/index.js";
import { progress } from "./state.js";
import { mountQuiz } from "./learn/quiz.js";
import { mountPresets } from "./learn/presets.js";

const app = document.getElementById("app");

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#/" aria-label="3ducation home">
      <svg class="brand-mark" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="13" r="3.6" fill="currentColor"/>
        <ellipse cx="13" cy="13" rx="12" ry="5.2" stroke="currentColor" stroke-width="1.4"/>
        <ellipse cx="13" cy="13" rx="12" ry="5.2" stroke="currentColor" stroke-width="1.4" transform="rotate(60 13 13)"/>
      </svg>
      <span class="brand-word"><span class="d3">3d</span>ucation</span>
    </a>
    <nav class="crumbs" id="crumbs" aria-live="polite">Workshop</nav>
  </header>

  <main id="main" class="view" tabindex="-1"></main>

  <footer class="site-foot">
    <p>Free and open source — <a href="https://github.com/atbt-ops/3ducation">github.com/atbt-ops/3ducation</a>.
    Models run on real equations; your progress stays in this browser.</p>
    <button class="linklike" id="resetProgress" type="button">Reset my progress</button>
  </footer>
`;

const main = document.getElementById("main");
const crumbs = document.getElementById("crumbs");

document.getElementById("resetProgress").addEventListener("click", () => {
  if (confirm("Clear your visited/mastered marks on this device?")) progress.reset();
});

/* ---------------- shared 3D viewer ---------------- */
let viewer = null;
let canvas = null;
let stageWrap = null;
let active = null;
let lastT = performance.now();

function ensureViewer() {
  if (viewer) return;
  canvas = document.createElement("canvas");
  canvas.id = "stage";
  canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", "3D model viewport. Drag or use arrow keys to orbit, +/- to zoom.");
  viewer = new Viewer(canvas);
}

function loop(t) {
  const dt = Math.max(0, Math.min(0.05, (t - lastT) / 1000));
  lastT = t;
  if (active && viewer) {
    active.update(dt, viewer);
    viewer.updateCamera();
    viewer.resize(stageWrap);
    viewer.render(active.scene);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------------- home ---------------- */
let homeFilter = "All";
let homeBand = "All";
try {
  homeFilter = localStorage.getItem("3ducation.filter") || "All";
  homeBand = localStorage.getItem("3ducation.band") || "All";
} catch {
  /* ignore */
}

function moduleCard(m) {
  const p = progress.for(m.id);
  const mastered = p.quizCount && p.quizBest === p.quizCount;
  const badge = mastered
    ? '<span class="badge is-mastered">Mastered</span>'
    : p.quizCount
      ? `<span class="badge is-score">Quiz ${p.quizBest}/${p.quizCount}</span>`
      : p.visited
        ? '<span class="badge is-visited">Visited</span>'
        : "";
  return `
    <a class="card" href="#/${m.id}">
      <span class="rivet tl"></span><span class="rivet tr"></span>
      <span class="rivet bl"></span><span class="rivet br"></span>
      <span class="card-icon">${m.icon}</span>
      <span class="tag">${m.tag}</span>
      <h3>${m.name} ${badge}</h3>
      <p>${m.blurb}</p>
    </a>`;
}

function renderHome() {
  active?.onExit?.(viewer);
  active = null;
  if (viewer) viewer.onPick = null;
  crumbs.textContent = "Workshop";

  const s = progress.summary(MODULE_IDS);
  const subjectChips = ["All", ...SUBJECTS]
    .map(
      (name) =>
        `<button class="chip" type="button" data-filter="${name}" aria-pressed="${name === homeFilter}">${name}</button>`
    )
    .join("");
  const bandChips = ["All", ...BANDS.map((b) => b.label)]
    .map(
      (name) =>
        `<button class="chip" type="button" data-band="${name}" aria-pressed="${name === homeBand}">${name}</button>`
    )
    .join("");

  main.innerHTML = `
    <section class="hero">
      <span class="eyebrow">${MODULES.length} instruments · classes I–XII · every subject · free</span>
      <h1>Science you can pick up and turn over.</h1>
      <p>Every model is a real <span class="d3">3D</span> object running on the same equations
      scientists use — physics, chemistry, biology, maths and space, from primary counting to
      senior-secondary. Guided experiments, a live formula box, a check-yourself quiz. No sign-up,
      works offline.</p>
      <p class="progress-line" role="status">
        <strong>${s.visited}</strong> of ${s.total} explored ·
        <strong>${s.mastered}</strong> mastered
      </p>
    </section>
    <div class="filters">
      <div class="chip-row filter-row" role="group" aria-label="Filter by subject">${subjectChips}</div>
      <div class="chip-row band-row" role="group" aria-label="Filter by school level">${bandChips}</div>
    </div>
    <div class="bench" id="bench"></div>
    <p class="bench-empty" id="benchEmpty" hidden>Nothing in that combination yet — try a wider filter.</p>
  `;

  const bench = main.querySelector("#bench");
  const emptyEl = main.querySelector("#benchEmpty");
  const paint = () => {
    const band = BANDS.find((b) => b.label === homeBand);
    const list = MODULES.filter(
      (m) =>
        (homeFilter === "All" || m.subject === homeFilter) &&
        (homeBand === "All" || inBand(m, band))
    );
    bench.innerHTML = list.map(moduleCard).join("");
    emptyEl.hidden = list.length > 0;
  };
  paint();

  main.querySelector(".filter-row").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    homeFilter = btn.dataset.filter;
    try {
      localStorage.setItem("3ducation.filter", homeFilter);
    } catch {
      /* ignore */
    }
    main.querySelectorAll(".filter-row .chip").forEach((c) =>
      c.setAttribute("aria-pressed", c === btn ? "true" : "false")
    );
    paint();
  });

  main.querySelector(".band-row").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-band]");
    if (!btn) return;
    homeBand = btn.dataset.band;
    try {
      localStorage.setItem("3ducation.band", homeBand);
    } catch {
      /* ignore */
    }
    main.querySelectorAll(".band-row .chip").forEach((c) =>
      c.setAttribute("aria-pressed", c === btn ? "true" : "false")
    );
    paint();
  });

  window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}

/* ---------------- module view ---------------- */
function renderModule(id) {
  const m = getModule(id);
  if (!m) return renderHome();

  active?.onExit?.(viewer);
  ensureViewer();
  progress.markVisited(m.id);
  crumbs.innerHTML = `Workshop <span aria-hidden="true">/</span> <b>${m.name}</b>`;

  main.innerHTML = `
    <a class="back-btn" href="#/">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L3 7L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Workshop
    </a>
    <div class="workbench">
      <div class="stage-wrap">
        <span class="module-eyebrow">${m.tag}</span>
        <div class="stage-tools">
          <button class="stage-tool" id="resetView" type="button" title="Reset view" aria-label="Reset view">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.46-3.54M13 3v3h-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="stage-tool" id="fsToggle" type="button" title="Fullscreen" aria-label="Toggle fullscreen">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <span class="viewport-hint">drag or arrow-keys to orbit · scroll to zoom</span>
      </div>
      <aside class="notebook">
        <h2>${m.name}</h2>
        <details class="lesson" open>
          <summary>Learn</summary>
          <div class="lesson-body">${m.lesson}</div>
        </details>
        <div class="presets" id="presets" hidden></div>
        <div class="panel" id="panel"></div>
        <div class="quiz-slot" id="quiz"></div>
      </aside>
    </div>
  `;

  stageWrap = main.querySelector(".stage-wrap");
  stageWrap.insertBefore(canvas, stageWrap.firstChild);

  main.querySelector("#resetView").addEventListener("click", () => {
    viewer.applyView(m.view);
    m.onEnter?.(viewer); // re-arms picking for modules that use it
  });
  main.querySelector("#fsToggle").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else stageWrap.requestFullscreen?.().then(() => viewer.resize(stageWrap), () => {});
  });

  const panel = main.querySelector("#panel");
  panel.innerHTML = m.panelHTML();
  m.wire(panel);

  mountPresets(main.querySelector("#presets"), m.presets, panel);
  mountQuiz(main.querySelector("#quiz"), m.id, m.quiz);

  viewer.applyView(m.view);
  viewer.setFlat(!!m.flat);
  m.onEnter?.(viewer);
  active = m;
  viewer.resize(stageWrap);
  window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}

/* ---------------- router ---------------- */
function route() {
  const raw = location.hash;
  // Only "#/..." paths are routes; plain anchors like "#main" are left alone.
  if (raw && !raw.startsWith("#/")) return;
  const id = raw.replace(/^#\/?/, "");
  if (id && getModule(id)) renderModule(id);
  else renderHome();
}
window.addEventListener("hashchange", route);
window.addEventListener("resize", () => viewer && stageWrap && viewer.resize(stageWrap));
route();
