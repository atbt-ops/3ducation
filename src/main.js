import "./style.css";
import { Viewer } from "./engine/viewer.js";
import { createHeroOrbit } from "./engine/heroOrbit.js";
import { prefersReducedMotion } from "./engine/helpers.js";
import { MODULES, MODULE_IDS, SUBJECTS, BANDS, inBand, getModule, loadModule } from "./modules/index.js";
import { SUBJECT_ACCENT } from "./lib/subjectAccent.js";
import { progress } from "./state.js";
import { mountQuiz } from "./learn/quiz.js";
import { mountPresets } from "./learn/presets.js";
import { onAuth, signOutUser } from "./auth.js";
import { isAdmin } from "./firebase.js";
import { openAuthModal } from "./authModal.js";
import { registerSW } from "virtual:pwa-register";
import showcaseOrrery from "./assets/showcase/orrery.jpg";
import showcaseMirrors from "./assets/showcase/mirrors.jpg";
import showcaseCell from "./assets/showcase/cell.jpg";
import showcaseIonicbond from "./assets/showcase/ionicbond.jpg";
import showcaseGalaxies from "./assets/showcase/galaxies.jpg";
// Firestore (sync + submissions) is the heaviest slice of the Firebase SDK,
// so it's only fetched once someone actually signs in or opens those pages.

// Theme: defaults to following the visitor's device (no data-theme attribute
// at all — see style.css's prefers-color-scheme rule); an explicit choice
// here overrides that via data-theme, independent of the OS setting. Applied
// before app.innerHTML below, so there's no flash of the wrong theme.
const THEME_KEY = "3ducation.theme";
const THEME_ORDER = ["system", "light", "dark"];
const THEME_META = {
  system: { icon: "🌗", label: "Theme: Auto (follows your device)" },
  light: { icon: "☀️", label: "Theme: Light" },
  dark: { icon: "🌙", label: "Theme: Dark" },
};
let theme = "system";
try {
  theme = localStorage.getItem(THEME_KEY) || "system";
} catch {
  /* ignore */
}
function applyTheme(t) {
  const root = document.documentElement;
  if (t === "system") {
    root.removeAttribute("data-theme");
    root.style.colorScheme = "light dark";
  } else {
    root.setAttribute("data-theme", t);
    root.style.colorScheme = t;
  }
}
applyTheme(theme);

// Auto-refresh a tab that's been open since before the latest deploy. Vite
// content-hashes every build's filenames, so a tab still running yesterday's
// JS will 404 the moment it tries to lazily load a page that changed (this
// is what caused "the page is stuck / won't load" reports). registerType:
// "autoUpdate" in vite.config.js makes the new service worker take over
// immediately (skipWaiting + clientsClaim) and reload this tab once it does
// — but only once a new service worker is actually *found*, which normally
// only happens on a fresh navigation. The interval below checks for one
// periodically so an open tab picks up a deploy without needing to be
// closed and reopened. Sign-in survives the reload (Firebase keeps it in
// IndexedDB, independent of the page).
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    setInterval(() => registration.update(), 60_000);
  },
});

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
      <button class="theme-toggle" id="themeToggle" type="button"></button>
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

const themeToggle = document.getElementById("themeToggle");
function syncThemeButton() {
  const meta = THEME_META[theme];
  themeToggle.textContent = meta.icon;
  themeToggle.title = meta.label;
  themeToggle.setAttribute("aria-label", meta.label);
}
syncThemeButton();
themeToggle.addEventListener("click", () => {
  theme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
  applyTheme(theme);
  syncThemeButton();
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
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

// Bumped by route() on every navigation. Async page renderers (module load,
// submit/review/community) capture it when they start and check it again
// after their own await — if it's moved on, a newer navigation has already
// taken over the screen, so the stale result is dropped instead of
// clobbering whatever's there now. Matters more since the lazy-loading
// refactor: every instrument is now a real network request, not an instant
// swap, so clicking through several quickly is a real scenario, not just a
// theoretical one.
let navToken = 0;

/* ---------------- shared 3D viewer ---------------- */
let viewer = null;
let canvas = null;
let stageWrap = null;
let active = null;
let lastT = performance.now();

/** The home hero's decorative live scene — its own tiny renderer, only ever running on "#/". */
let heroOrbit = null;
function stopHeroOrbit() {
  heroOrbit?.dispose();
  heroOrbit = null;
}

/** The home showcase carousel's autoplay — torn down the same way as heroOrbit
 * above, so repeat visits to "#/" don't stack up intervals and listeners. */
let carouselCleanup = null;
function stopCarousel() {
  carouselCleanup?.();
  carouselCleanup = null;
}

/** Counts a stat up from 0 to `target`, skipped (jumps straight there) if the visitor prefers reduced motion. */
function animateCount(el, target) {
  if (prefersReducedMotion || !target) {
    el.textContent = target;
    return;
  }
  const duration = 700;
  const t0 = performance.now();
  function step(t) {
    const p = Math.min(1, (t - t0) / duration);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

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
let homeBand = "All";
try {
  homeBand = localStorage.getItem("3ducation.band") || "All";
} catch {
  /* ignore */
}

const SUBJECT_BLURB = {
  Physics: "Forces, energy, circuits, light and sound — push, drop, and short-circuit your way through it.",
  Chemistry: "Atoms, reactions, gases and the periodic table — 118 elements to explore.",
  Biology: "Cells, DNA, the heart, and how living things work and grow.",
  "Earth Science": "Inside the planet, its plates, rocks, and the water cycle.",
  Math: "Numbers, shapes, graphs and calculus — geometry and algebra you can turn around.",
  Astronomy: "Orbits, eclipses, moon phases, and how stars are born and die.",
};

// Real screenshots of the running app (captured from the actual 3D stage of
// each instrument) — not mockups. A quick, honest preview of the variety
// inside before a visitor commits to opening one.
const SHOWCASE = [
  { src: showcaseOrrery, caption: "Orrery — planets and orbits drawn to real relative sizes." },
  { src: showcaseMirrors, caption: "Concave & convex mirrors — drag the object and watch the ray diagram update." },
  { src: showcaseCell, caption: "Cell explorer — tap any organelle to read what it does." },
  { src: showcaseIonicbond, caption: "Ionic bonding — watch an electron jump from sodium to chlorine." },
  { src: showcaseGalaxies, caption: "Galaxy types — spiral, elliptical and irregular, side by side." },
];

/** A small, dependency-free carousel: one slide visible at a time, dot and
 * arrow navigation, autoplay that pauses on hover/focus/hidden-tab and never
 * runs at all for prefers-reduced-motion. */
function mountCarousel(root, slides) {
  root.setAttribute("role", "region");
  root.setAttribute("aria-roledescription", "carousel");
  root.setAttribute("aria-label", "Instrument showcase");
  root.innerHTML = `
    <button class="carousel-arrow prev" type="button" aria-label="Previous instrument">‹</button>
    <div class="carousel-viewport">
      <div class="carousel-track">
        ${slides
          .map(
            (s, i) => `
          <figure class="carousel-slide" id="carousel-slide-${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">
            <img src="${s.src}" alt="${s.caption}" loading="${i === 0 ? "eager" : "lazy"}" width="1280" height="960">
            <figcaption>${s.caption}</figcaption>
          </figure>`
          )
          .join("")}
      </div>
    </div>
    <button class="carousel-arrow next" type="button" aria-label="Next instrument">›</button>
    <div class="carousel-dots" role="tablist" aria-label="Showcase slides">
      ${slides
        .map(
          (s, i) =>
            `<button class="carousel-dot" type="button" role="tab" aria-controls="carousel-slide-${i}" aria-label="Show slide ${i + 1}: ${s.caption}"></button>`
        )
        .join("")}
    </div>
    <div class="sr-only" aria-live="polite"></div>
  `;

  const track = root.querySelector(".carousel-track");
  const dots = [...root.querySelectorAll(".carousel-dot")];
  const liveRegion = root.querySelector("[aria-live]");
  let index = 0;
  let timer = null;

  function paint(announce) {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === index)));
    // Only announce on user-driven navigation, not every autoplay tick —
    // a screen reader narrating an unrequested slide change every 4.5s
    // would be closer to a nuisance than a courtesy.
    if (announce) liveRegion.textContent = `Slide ${index + 1} of ${slides.length}: ${slides[index].caption}`;
  }
  function go(i, announce = true) {
    index = (i + slides.length) % slides.length;
    paint(announce);
  }
  function play() {
    if (prefersReducedMotion) return;
    stop();
    timer = setInterval(() => go(index + 1, false), 4500);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  root.querySelector(".prev").addEventListener("click", () => {
    go(index - 1);
    play();
  });
  root.querySelector(".next").addEventListener("click", () => {
    go(index + 1);
    play();
  });
  dots.forEach((d, i) =>
    d.addEventListener("click", () => {
      go(i);
      play();
    })
  );
  root.addEventListener("pointerenter", stop);
  root.addEventListener("pointerleave", play);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", play);
  const onVisibility = () => (document.hidden ? stop() : play());
  document.addEventListener("visibilitychange", onVisibility);

  paint();
  play();

  // The document-level listener otherwise outlives this DOM (it's on
  // `document`, not `root`) — every return to "#/" would stack another one.
  return () => {
    stop();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

function subjectSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}
function subjectFromSlug(slug) {
  return SUBJECTS.find((s) => subjectSlug(s) === slug) || null;
}

function inScope(m) {
  if (homeBand === "All") return true;
  const band = BANDS.find((b) => b.label === homeBand);
  return inBand(m, band);
}
function matchesQuery(m, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return m.name.toLowerCase().includes(q) || m.blurb.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q);
}

function bandChipsHTML(selected) {
  return ["All", ...BANDS.map((b) => b.label)]
    .map(
      (name) =>
        `<button class="chip" type="button" data-band="${name}" aria-pressed="${name === selected}">${name}</button>`
    )
    .join("");
}

/** Wires the shared grade-band chip row; `onChange` repaints whatever list is currently shown. */
function wireBandRow(root, onChange) {
  root.querySelector(".band-row").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-band]");
    if (!btn) return;
    homeBand = btn.dataset.band;
    try {
      localStorage.setItem("3ducation.band", homeBand);
    } catch {
      /* ignore */
    }
    root.querySelectorAll(".band-row .chip").forEach((c) => c.setAttribute("aria-pressed", c === btn ? "true" : "false"));
    onChange();
  });
}

function badgeHTML(moduleId) {
  const p = progress.for(moduleId);
  const mastered = p.quizCount && p.quizBest === p.quizCount;
  return mastered
    ? '<span class="badge is-mastered">Mastered</span>'
    : p.quizCount
      ? `<span class="badge is-score">Quiz ${p.quizBest}/${p.quizCount}</span>`
      : p.visited
        ? '<span class="badge is-visited">Visited</span>'
        : "";
}

function moduleCard(m) {
  return `
    <a class="card" href="#/${m.id}">
      <span class="rivet tl"></span><span class="rivet tr"></span>
      <span class="rivet bl"></span><span class="rivet br"></span>
      <span class="card-icon">${m.icon}</span>
      <span class="tag">${m.tag}${m.video ? ' <span class="tag-video" title="Has a video lecture">▶ video</span>' : ""}</span>
      <h3>${m.name} ${badgeHTML(m.id)}</h3>
      <p>${m.blurb}</p>
    </a>`;
}

/** Progress bar + completion badge for one subject's `items` — shared by the home page's subject tiles and the subject page's own header. Empty string until there's any progress to show. */
function subjectProgressHTML(subj, items) {
  const sSummary = progress.summary(items.map((m) => m.id));
  if (!sSummary.visited) return "";
  const accent = SUBJECT_ACCENT[subj];
  const allMastered = sSummary.mastered === items.length;
  const allExplored = sSummary.visited === items.length;
  const completionBadge = allMastered
    ? `<span class="badge is-mastered subject-badge" title="Every instrument in ${subj} mastered">🏆 Subject mastered</span>`
    : allExplored
      ? `<span class="badge is-visited" title="Every instrument in ${subj} explored">✓ Fully explored</span>`
      : "";
  return `
    <div class="subject-progress" style="${accent ? `--accent:${accent}` : ""}">
      <div class="subject-progress-bar"><div class="subject-progress-fill" style="width:${Math.round((sSummary.visited / items.length) * 100)}%"></div></div>
      <span class="subject-progress-label">${sSummary.visited}/${items.length} explored${sSummary.mastered ? ` · ${sSummary.mastered} mastered` : ""}</span>
      ${completionBadge}
    </div>`;
}

function subjectTile(subj, items) {
  const accent = SUBJECT_ACCENT[subj];
  const progressHTML = subjectProgressHTML(subj, items);
  return `
    <a class="subject-tile" href="#/subject/${subjectSlug(subj)}" style="${accent ? `--accent:${accent}` : ""}">
      <span class="subject-tile-dot" aria-hidden="true"></span>
      <h2>${subj}</h2>
      <p class="subject-tile-blurb">${SUBJECT_BLURB[subj] || ""}</p>
      ${progressHTML || `<p class="subject-tile-count">${items.length} instrument${items.length === 1 ? "" : "s"}</p>`}
    </a>`;
}

function renderHome() {
  active?.onExit?.(viewer);
  active = null;
  if (viewer) viewer.onPick = null;
  crumbs.textContent = "Workshop";

  const s = progress.summary(MODULE_IDS);
  const recentIds = progress.recent(MODULE_IDS, 6);
  const recentHTML = recentIds.length
    ? `
    <section class="continue-section">
      <h2 class="continue-heading">Continue exploring <span>— picked up where you left off</span></h2>
      <div class="bench">${recentIds.map((id) => moduleCard(getModule(id))).join("")}</div>
    </section>`
    : "";

  main.innerHTML = `
    <section class="hero-panel">
      <div class="hero hero-main">
        <span class="eyebrow">${MODULES.length} instruments · classes I–XII · every subject · free</span>
        <h1>Science and math you can pick up and turn over.</h1>
        <p>Every model is a real <span class="d3">3D</span> object running on the same equations
        scientists use — physics, chemistry, biology, maths and space, from primary counting to
        senior-secondary. Guided experiments, a live formula box, a check-yourself quiz.</p>
        <div class="stat-strip" role="status">
          <div class="stat"><b data-count="${s.visited}">0</b><span>of ${s.total} explored</span></div>
          <div class="stat"><b data-count="${s.mastered}">0</b><span>mastered</span></div>
          <div class="stat"><b data-count="${SUBJECTS.length}">0</b><span>subjects</span></div>
        </div>
        <div class="btn-row" style="margin-top:16px">
          <button class="btn" type="button" id="surpriseBtn">🎲 Surprise me</button>
        </div>
      </div>
      <aside class="hero-spot">
        <div class="hero-orbit-wrap"><canvas class="hero-orbit-canvas" aria-hidden="true"></canvas></div>
        <h2>Not just a solo build</h2>
        <ul class="spot-list">
          <li><span class="spot-emoji" aria-hidden="true">🧪</span><span>${MODULES.length} hands-on instruments — no sign-up or install needed</span></li>
          <li><span class="spot-emoji" aria-hidden="true">🎥</span><span>Video lectures attached to select topics</span></li>
          <li><span class="spot-emoji" aria-hidden="true">👥</span><span>Community-submitted instruments, always growing</span></li>
        </ul>
        <div class="btn-row">
          <a class="btn primary" href="#/community">Browse community</a>
          <a class="btn" href="#/submit">Submit an instrument</a>
        </div>
      </aside>
    </section>
    <section class="showcase">
      <h2 class="showcase-heading">See it in action</h2>
      <div class="carousel" id="showcaseCarousel"></div>
    </section>
    ${recentHTML}
    <div class="filters">
      <input type="search" id="q" class="text-input search-input" placeholder="Search instruments…" aria-label="Search instruments">
      <div class="chip-row band-row" role="group" aria-label="Filter by school level">${bandChipsHTML(homeBand)}</div>
    </div>
    <div id="benchWrap"></div>
    <p class="bench-empty" id="benchEmpty" hidden>Nothing matches that search — try a different word or level.</p>
  `;

  const orbitCanvas = main.querySelector(".hero-orbit-canvas");
  if (orbitCanvas) {
    heroOrbit = createHeroOrbit(orbitCanvas);
    heroOrbit.start();
  }
  stopCarousel();
  carouselCleanup = mountCarousel(main.querySelector("#showcaseCarousel"), SHOWCASE);
  main.querySelectorAll(".stat b[data-count]").forEach((el) => animateCount(el, +el.dataset.count));

  main.querySelector("#surpriseBtn").addEventListener("click", () => {
    const pick = MODULES[Math.floor(Math.random() * MODULES.length)];
    location.hash = `#/${pick.id}`;
  });

  const wrap = main.querySelector("#benchWrap");
  const emptyEl = main.querySelector("#benchEmpty");
  const qInput = main.querySelector("#q");
  let query = "";

  function paint() {
    if (query) {
      // Searching cuts across subjects — one flat grid of matches reads fine.
      const list = MODULES.filter((m) => inScope(m) && matchesQuery(m, query));
      emptyEl.hidden = list.length > 0;
      wrap.innerHTML = `<div class="bench">${list.map(moduleCard).join("")}</div>`;
      return;
    }
    // No search — subjects as big tiles, not 50+ cards at once. Click one to open it.
    const visibleSubjects = SUBJECTS.filter((subj) => MODULES.some((m) => m.subject === subj && inScope(m)));
    emptyEl.hidden = visibleSubjects.length > 0;
    wrap.innerHTML = visibleSubjects.length
      ? `<div class="subject-tiles">${visibleSubjects
          .map((subj) => subjectTile(subj, MODULES.filter((m) => m.subject === subj && inScope(m))))
          .join("")}</div>`
      : "";
  }
  paint();

  wireBandRow(main, paint);

  qInput.addEventListener("input", () => {
    query = qInput.value.trim();
    paint();
  });

  window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}

/** A single subject's full instrument grid — reached from a home page tile. */
function renderSubjectPage(subj) {
  active?.onExit?.(viewer);
  active = null;
  if (viewer) viewer.onPick = null;
  crumbs.innerHTML = `<a href="#/">Workshop</a> <span aria-hidden="true">/</span> <b>${subj}</b>`;

  const allItems = MODULES.filter((m) => m.subject === subj);
  const accent = SUBJECT_ACCENT[subj];

  main.innerHTML = `
    <a class="back-btn" href="#/">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L3 7L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Workshop
    </a>
    <section class="hero subject-hero" style="${accent ? `--accent:${accent}` : ""}">
      <span class="eyebrow" style="color:var(--accent, var(--teal))">${allItems.length} instrument${allItems.length === 1 ? "" : "s"} · ${subj}</span>
      <h1>${subj}</h1>
      <p>${SUBJECT_BLURB[subj] || ""}</p>
      ${subjectProgressHTML(subj, allItems)}
    </section>
    <div class="filters">
      <input type="search" id="sq" class="text-input search-input" placeholder="Search ${subj} instruments…" aria-label="Search instruments in this subject">
      <div class="chip-row band-row" role="group" aria-label="Filter by school level">${bandChipsHTML(homeBand)}</div>
    </div>
    <div id="subjBenchWrap"></div>
    <p class="bench-empty" id="subjEmpty" hidden>Nothing matches — try a wider search or a different level.</p>
  `;

  const wrap = main.querySelector("#subjBenchWrap");
  const emptyEl = main.querySelector("#subjEmpty");
  const qInput = main.querySelector("#sq");
  let query = "";

  function paint() {
    const list = allItems.filter((m) => inScope(m) && matchesQuery(m, query));
    emptyEl.hidden = list.length > 0;
    wrap.innerHTML = `<div class="bench">${list.map(moduleCard).join("")}</div>`;
  }
  paint();

  wireBandRow(main, paint);
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

/* ---------------- reference illustration ---------------- */
// A handful of flagship instruments (see each module's `illustration` field)
// carry a static reference image — a professionally-styled scientific
// diagram, shown stacked beneath the live 3D stage. The interactive model
// stays the primary experience; this is a supplementary aid, closer to a
// textbook plate, for the instruments where that context helps most.
function illustrationHTML(m) {
  if (!m.illustration) return "";
  const { src, alt, caption } = m.illustration;
  return `
    <figure class="stage-illustration">
      <img src="${src}" alt="${alt}" loading="lazy" width="1280" height="720">
      <figcaption>${caption}</figcaption>
    </figure>`;
}

/* ---------------- module view ---------------- */
async function renderModule(id) {
  const meta = getModule(id);
  if (!meta) return renderHome();
  const myToken = navToken;
  leaveModule();
  crumbs.innerHTML = `<a href="#/">Workshop</a> <span aria-hidden="true">/</span> <b>${meta.name}</b>`;
  // A skeleton in the instrument's own layout (not a bare "Loading…") — this
  // chunk is small and usually flashes by in well under a second, but with
  // 61 separate per-instrument chunks now (see registry.js), every open is a
  // real network request instead of the instant swap it used to be.
  main.innerHTML = `
    <a class="back-btn" href="#/">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L3 7L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Workshop
    </a>
    <div class="workbench" aria-busy="true" aria-label="Loading ${meta.name}">
      <div class="stage-column"><div class="stage-wrap skeleton-block"></div></div>
      <aside class="notebook">
        <div class="skeleton-line skeleton-line-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line" style="width:70%"></div>
      </aside>
    </div>
  `;
  try {
    const m = await withTimeout(loadModule(id));
    if (myToken !== navToken) return; // superseded by a newer navigation while this was loading
    if (!m) return renderHome();
    renderModuleObject(m);
  } catch {
    if (myToken !== navToken) return;
    chunkLoadError(meta.name);
  }
}

/** Shared by built-in modules and community formula instruments (see pages/communityModule.js). */
function renderModuleObject(m) {
  active?.onExit?.(viewer);
  ensureViewer();
  progress.markVisited(m.id);
  crumbs.innerHTML = `<a href="#/">Workshop</a> <span aria-hidden="true">/</span> <b>${m.name}</b>`;

  const accent = SUBJECT_ACCENT[m.subject];
  const accentStyle = accent ? `style="--accent:${accent}"` : "";
  const related = MODULES.filter((x) => x.subject === m.subject && x.id !== m.id).slice(0, 4);
  const relatedHTML = related.length
    ? `
    <section class="continue-section">
      <h2 class="continue-heading">More in ${m.subject} <span>— keep exploring the subject</span></h2>
      <div class="bench">${related.map(moduleCard).join("")}</div>
    </section>`
    : "";

  main.innerHTML = `
    <a class="back-btn" href="#/">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L3 7L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Workshop
    </a>
    <div class="workbench">
      <div class="stage-column">
        <div class="stage-wrap">
          <span class="module-eyebrow" ${accentStyle}>${m.tag}</span>
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
        ${illustrationHTML(m)}
      </div>
      <aside class="notebook" ${accentStyle}>
        <h2>${m.name} ${badgeHTML(m.id)}</h2>
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
    ${relatedHTML}
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
  const myToken = navToken;
  leaveModule();
  crumbs.innerHTML = '<a href="#/">Workshop</a> <span aria-hidden="true">/</span> <b>Submit an instrument</b>';
  main.innerHTML = '<p class="fact">Loading…</p>';
  try {
    const { renderSubmit } = await withTimeout(import("./pages/submit.js"));
    if (myToken !== navToken) return;
    await renderSubmit(main, currentUser, () => requestSignIn(() => renderSubmitPage()));
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  } catch {
    if (myToken !== navToken) return;
    chunkLoadError("The submission form");
  }
}

async function renderReviewPage() {
  const myToken = navToken;
  leaveModule();
  crumbs.innerHTML = '<a href="#/">Workshop</a> <span aria-hidden="true">/</span> <b>Review queue</b>';
  main.innerHTML = '<p class="fact">Loading…</p>';
  try {
    const { renderReview } = await withTimeout(import("./pages/review.js"));
    if (myToken !== navToken) return;
    await renderReview(main, currentUser);
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  } catch {
    if (myToken !== navToken) return;
    chunkLoadError("The review queue");
  }
}

async function renderCommunityListPage() {
  const myToken = navToken;
  leaveModule();
  crumbs.innerHTML = '<a href="#/">Workshop</a> <span aria-hidden="true">/</span> <b>Community</b>';
  main.innerHTML = '<p class="fact">Loading…</p>';
  try {
    const { renderCommunityList } = await withTimeout(import("./pages/communityList.js"));
    if (myToken !== navToken) return;
    await renderCommunityList(main);
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  } catch {
    if (myToken !== navToken) return;
    chunkLoadError("The community gallery");
  }
}

async function renderCommunityInstrument(subId) {
  const myToken = navToken;
  ensureViewer();
  crumbs.innerHTML = '<a href="#/">Workshop</a> <span aria-hidden="true">/</span> <b>Community</b>';
  main.innerHTML = '<p class="fact">Loading…</p>';
  try {
    const [{ getSubmission }, { buildCommunityModule }] = await withTimeout(
      Promise.all([import("./submissions.js"), import("./pages/communityModule.js")])
    );
    const sub = await getSubmission(subId);
    if (myToken !== navToken) return;
    if (!sub || sub.type !== "formula" || (sub.status !== "approved" && !isAdmin(currentUser))) {
      leaveModule();
      main.innerHTML = '<p class="fact">This instrument isn\'t available — it may still be in review, or not exist.</p>';
      return;
    }
    renderModuleObject(buildCommunityModule(sub));
  } catch {
    if (myToken !== navToken) return;
    chunkLoadError("That instrument");
  }
}

/* ---------------- router ---------------- */
function route() {
  const raw = location.hash;
  // Only "#/..." paths are routes; plain anchors like "#main" are left alone.
  if (raw && !raw.startsWith("#/")) return;
  navToken++;
  stopHeroOrbit(); // torn down on every navigation; renderHome() below recreates it if we're headed back there
  stopCarousel();
  const id = raw.replace(/^#\/?/, "");
  if (id === "submit") renderSubmitPage();
  else if (id === "review") renderReviewPage();
  else if (id === "community") renderCommunityListPage();
  else if (id.startsWith("community/")) renderCommunityInstrument(id.slice("community/".length));
  else if (id.startsWith("subject/")) {
    const subj = subjectFromSlug(id.slice("subject/".length));
    if (subj) renderSubjectPage(subj);
    else renderHome();
  } else if (id && getModule(id)) renderModule(id);
  else renderHome();
}
window.addEventListener("hashchange", route);
window.addEventListener("resize", () => viewer && stageWrap && viewer.resize(stageWrap));
route();
