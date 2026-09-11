import "./style.css";
import { Viewer } from "./engine/viewer.js";
import { MODULES, MODULE_IDS, SUBJECTS, BANDS, inBand, getModule } from "./modules/index.js";
import { progress } from "./state.js";
import { mountQuiz } from "./learn/quiz.js";
import { mountPresets } from "./learn/presets.js";
import { onAuth, signOutUser } from "./auth.js";
import { isAdmin } from "./firebase.js";
import { openAuthModal } from "./authModal.js";
// Firestore (sync + submissions) is the heaviest slice of the Firebase SDK,
// so it's only fetched once someone actually signs in or opens those pages.

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
    <div class="topbar-right">
      <nav class="crumbs" id="crumbs" aria-live="polite">Workshop</nav>
      <div class="auth-area" id="authArea"></div>
    </div>
  </header>

  <main id="main" class="view" tabindex="-1"></main>

  <footer class="site-foot">
    <p>Free and open source — <a href="https://github.com/atbt-ops/3ducation">github.com/atbt-ops/3ducation</a>.
    Signed-in progress syncs across devices; signed-out progress stays in this browser.
    <a href="#/community">Browse community instruments</a> or
    <a href="#/submit">submit your own</a> — no coding required.</p>
    <button class="linklike" id="resetProgress" type="button">Reset my progress</button>
  </footer>
`;

const main = document.getElementById("main");
const crumbs = document.getElementById("crumbs");
const authArea = document.getElementById("authArea");

document.getElementById("resetProgress").addEventListener("click", () => {
  if (confirm("Clear your visited/mastered marks on this device?")) progress.reset();
});

/* ---------------- auth ---------------- */
let currentUser = null;

function initials(user) {
  const src = user.displayName || user.email || "?";
  return src.trim().slice(0, 1).toUpperCase();
}

function renderAuthArea() {
  const communityLink = '<a class="auth-link" href="#/community">Community</a>';
  if (!currentUser) {
    authArea.innerHTML = `${communityLink}<button class="btn" id="signInBtn" type="button">Sign in</button>`;
    authArea.querySelector("#signInBtn").addEventListener("click", () => requestSignIn());
    return;
  }
  const admin = isAdmin(currentUser);
  authArea.innerHTML = `
    ${communityLink}
    <a class="auth-link" href="#/submit">Submit</a>
    ${admin ? '<a class="auth-link" href="#/review">Review</a>' : ""}
    <span class="auth-avatar" title="${currentUser.email || ""}">${initials(currentUser)}</span>
    <button class="btn" id="signOutBtn" type="button">Sign out</button>
  `;
  authArea.querySelector("#signOutBtn").addEventListener("click", () => signOutUser());
}

function requestSignIn(onSignedIn) {
  openAuthModal((user) => {
    currentUser = user;
    renderAuthArea();
    onSignedIn?.(user);
  });
}

let syncModule = null;
async function getSync() {
  if (!syncModule) syncModule = await import("./sync.js");
  return syncModule;
}

renderAuthArea(); // signed-out UI immediately; onAuth below replaces it once Firebase resolves

onAuth(async (user) => {
  currentUser = user;
  renderAuthArea();
  if (user) {
    const { attachSync } = await getSync();
    attachSync(user.uid);
  } else if (syncModule) {
    syncModule.detachSync();
  }
  // Re-render a gated page once auth resolves (it's async on first load), or
  // again whenever sign-in state changes underneath it.
  const raw = location.hash.replace(/^#\/?/, "");
  if (raw === "submit" || raw === "review") route();
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
      <span class="tag">${m.tag}${m.video ? ' <span class="tag-video" title="Has a video lecture">▶ video</span>' : ""}</span>
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
      <input type="search" id="q" class="text-input search-input" placeholder="Search instruments…" aria-label="Search instruments">
      <div class="chip-row filter-row" role="group" aria-label="Filter by subject" id="subjectChips"></div>
      <div class="chip-row band-row" role="group" aria-label="Filter by school level">${bandChips}</div>
    </div>
    <div id="benchWrap"></div>
    <p class="bench-empty" id="benchEmpty" hidden>Nothing matches that combination — try a wider search or filter.</p>
  `;

  const wrap = main.querySelector("#benchWrap");
  const emptyEl = main.querySelector("#benchEmpty");
  const subjectChipsEl = main.querySelector("#subjectChips");
  const qInput = main.querySelector("#q");
  let query = "";

  const inScope = (m) => {
    if (homeBand === "All") return true;
    const band = BANDS.find((b) => b.label === homeBand);
    return inBand(m, band);
  };
  const matchesQuery = (m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.blurb.toLowerCase().includes(q) ||
      m.tag.toLowerCase().includes(q)
    );
  };

  function paintChips() {
    const counts = {};
    MODULES.filter(inScope).forEach((m) => (counts[m.subject] = (counts[m.subject] || 0) + 1));
    const total = MODULES.filter(inScope).length;
    subjectChipsEl.innerHTML = ["All", ...SUBJECTS]
      .map((name) => {
        const n = name === "All" ? total : counts[name] || 0;
        return `<button class="chip" type="button" data-filter="${name}" aria-pressed="${name === homeFilter}" ${n === 0 && name !== "All" ? "disabled" : ""}>${name}${name === "All" ? "" : ` (${n})`}</button>`;
      })
      .join("");
  }

  function paint() {
    const list = MODULES.filter(
      (m) => inScope(m) && (homeFilter === "All" || m.subject === homeFilter) && matchesQuery(m)
    );
    emptyEl.hidden = list.length > 0;

    if (query || homeFilter !== "All") {
      // A focused set — one flat grid reads fine.
      wrap.innerHTML = `<div class="bench">${list.map(moduleCard).join("")}</div>`;
    } else {
      // Everything — group by subject so 48+ cards stay scannable.
      wrap.innerHTML = SUBJECTS.map((subj) => {
        const items = list.filter((m) => m.subject === subj);
        if (!items.length) return "";
        return `
          <section class="subject-group">
            <h2 class="subject-heading">${subj} <span class="subject-count">${items.length}</span></h2>
            <div class="bench">${items.map(moduleCard).join("")}</div>
          </section>`;
      }).join("");
    }
    paintChips();
  }
  paint();

  subjectChipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn || btn.disabled) return;
    homeFilter = btn.dataset.filter;
    try {
      localStorage.setItem("3ducation.filter", homeFilter);
    } catch {
      /* ignore */
    }
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

  qInput.addEventListener("input", () => {
    query = qInput.value.trim();
    paint();
  });

  window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}

/* ---------------- video lecture ---------------- */
function videoBlock(m) {
  if (!m.video) return "";
  const { id, title } = m.video;
  return `
    <details class="lesson video-lesson">
      <summary>Watch: ${title}</summary>
      <div class="video-embed">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}"
          title="${title}"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </details>`;
}

/* ---------------- module view ---------------- */
function renderModule(id) {
  const m = getModule(id);
  if (!m) return renderHome();
  renderModuleObject(m);
}

/** Shared by built-in modules and community formula instruments (see pages/communityModule.js). */
function renderModuleObject(m) {
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
        ${videoBlock(m)}
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

/* ---------------- static pages (submit / review) ---------------- */
function leaveModule() {
  active?.onExit?.(viewer);
  active = null;
  if (viewer) viewer.onPick = null;
}

/** Shown when a lazily-loaded page chunk fails or times out (e.g. stale service worker after a deploy). */
function chunkLoadError(label) {
  leaveModule();
  main.innerHTML = `
    <section class="hero">
      <span class="eyebrow">Couldn't load this page</span>
      <h1>${label} didn't load.</h1>
      <p>This sometimes happens right after the site updates, if your browser is holding onto an
      older cached version. Reloading usually fixes it.</p>
      <div class="btn-row"><button class="btn primary" id="reloadBtn" type="button">Reload page</button></div>
    </section>`;
  main.querySelector("#reloadBtn").addEventListener("click", () => window.location.reload());
}

/** Rejects if `promise` hasn't settled within `ms` — dynamic import() can hang forever on a bad network/SW. */
function withTimeout(promise, ms = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function renderSubmitPage() {
  leaveModule();
  crumbs.innerHTML = 'Workshop <span aria-hidden="true">/</span> <b>Submit an instrument</b>';
  main.innerHTML = '<p class="fact">Loading…</p>';
  try {
    const { renderSubmit } = await withTimeout(import("./pages/submit.js"));
    await renderSubmit(main, currentUser, () => requestSignIn(() => renderSubmitPage()));
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  } catch {
    chunkLoadError("The submission form");
  }
}

async function renderReviewPage() {
  leaveModule();
  crumbs.innerHTML = 'Workshop <span aria-hidden="true">/</span> <b>Review queue</b>';
  main.innerHTML = '<p class="fact">Loading…</p>';
  try {
    const { renderReview } = await withTimeout(import("./pages/review.js"));
    await renderReview(main, currentUser);
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  } catch {
    chunkLoadError("The review queue");
  }
}

async function renderCommunityListPage() {
  leaveModule();
  crumbs.innerHTML = 'Workshop <span aria-hidden="true">/</span> <b>Community</b>';
  main.innerHTML = '<p class="fact">Loading…</p>';
  try {
    const { renderCommunityList } = await withTimeout(import("./pages/communityList.js"));
    await renderCommunityList(main);
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  } catch {
    chunkLoadError("The community gallery");
  }
}

async function renderCommunityInstrument(subId) {
  ensureViewer();
  crumbs.innerHTML = 'Workshop <span aria-hidden="true">/</span> <b>Community</b>';
  main.innerHTML = '<p class="fact">Loading…</p>';
  try {
    const [{ getSubmission }, { buildCommunityModule }] = await withTimeout(
      Promise.all([import("./submissions.js"), import("./pages/communityModule.js")])
    );
    const sub = await getSubmission(subId);
    if (!sub || sub.type !== "formula" || (sub.status !== "approved" && !isAdmin(currentUser))) {
      leaveModule();
      main.innerHTML = '<p class="fact">This instrument isn\'t available — it may still be in review, or not exist.</p>';
      return;
    }
    renderModuleObject(buildCommunityModule(sub));
  } catch {
    chunkLoadError("That instrument");
  }
}

/* ---------------- router ---------------- */
function route() {
  const raw = location.hash;
  // Only "#/..." paths are routes; plain anchors like "#main" are left alone.
  if (raw && !raw.startsWith("#/")) return;
  const id = raw.replace(/^#\/?/, "");
  if (id === "submit") renderSubmitPage();
  else if (id === "review") renderReviewPage();
  else if (id === "community") renderCommunityListPage();
  else if (id.startsWith("community/")) renderCommunityInstrument(id.slice("community/".length));
  else if (id && getModule(id)) renderModule(id);
  else renderHome();
}
window.addEventListener("hashchange", route);
window.addEventListener("resize", () => viewer && stageWrap && viewer.resize(stageWrap));
route();
