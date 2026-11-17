import {
  readState,
  readGuestState,
  removeItem,
  subscribe,
  getOwner,
  mergeStates,
  writeState,
} from "./store.js";
import { MODULES } from "../modules/index.js";
import { INSTRUMENTS } from "../instruments/catalog.js";
import { escapeHtml as esc, BACK_BTN } from "../lib/html.js";
export function mount(root) {
  const all = [...MODULES, ...INSTRUMENTS],
    byId = new Map(all.map((i) => [i.id, i]));
  const href = (id) =>
    byId.has(id)
      ? INSTRUMENTS.some((i) => i.id === id)
        ? `#/instruments/${id}`
        : `#/${id}`
      : "#/community";
  function paint() {
    const s = readState(),
      entries = Object.entries(s.progress),
      complete = entries.filter(([, e]) => e.completed),
      saved = Object.entries(s.saved).filter(([, e]) => !e.deleted),
      visited = entries.filter(([, e]) => e.visited);
    root.innerHTML = `${BACK_BTN}<section class="hero"><span class="eyebrow">My learning</span><h1>Your discoveries, kept.</h1><p>${getOwner() === "guest" ? "Guest learning is saved in this browser. Sign in for a separate cloud-backed learning space." : "This account has its own learning space. Local work stays available when offline."}</p></section><div class="learning-stats"><article><b>${visited.length}</b><span>Explored</span></article><article><b>${complete.length}</b><span>Completed</span></article><article><b>${saved.length}</b><span>Saved visualizations</span></article></div><label>Built-in learning completed <progress max="${all.length}" value="${complete.filter(([id]) => byId.has(id)).length}"></progress></label><div class="btn-row">${getOwner() !== "guest" ? '<button class="btn" id="import-guest">Copy guest learning into this account</button>' : ""}<button class="btn" id="export-progress">Export my learning</button><label class="btn">Import backup<input type="file" id="import-progress" accept="application/json" hidden></label></div><p id="backup-status" role="status"></p><section><h2>Continue exploring</h2><div class="bench">${
      visited
        .sort((a, b) => b[1].visitedAt - a[1].visitedAt)
        .slice(0, 6)
        .map(
          ([id, e]) =>
            `<a class="card" href="${href(id)}"><h3>${esc(byId.get(id)?.name || "Community activity")}</h3><p>${e.completed ? "Completed ✓" : "Continue →"}${e.quizCount ? ` · Best quiz: ${e.quizBest}/${e.quizCount}` : ""}</p></a>`
        )
        .join("") || "<p>Open an experiment or instrument to start your learning record.</p>"
    }</div></section><section><h2>Saved visualizations</h2><div class="bench">${saved.map(([id, e]) => `<article class="card"><h3>${esc(e.name || e.expr || "Visualization")}</h3><p>${esc(e.mode || "surface")}</p><div class="btn-row"><a class="btn" href="#/formula/${id}">Open</a><button class="btn" data-remove="${id}">Remove</button></div></article>`).join("") || '<p>Save a visualization in the <a href="#/formula">Formula Box</a>.</p>'}</div></section><section><h2>Completed activities</h2><ul>${complete.map(([id]) => `<li><a href="${href(id)}">${esc(byId.get(id)?.name || id)}</a></li>`).join("") || "<li>Complete a quiz or mark an activity as completed.</li>"}</ul></section>`;
    root.querySelector("#import-guest")?.addEventListener("click", () => {
      writeState(mergeStates(readState(), readGuestState()));
    });
    root
      .querySelectorAll("[data-remove]")
      .forEach((b) => (b.onclick = () => removeItem("saved", b.dataset.remove)));
    root.querySelector("#export-progress").onclick = () => {
      const blob = new Blob([JSON.stringify(readState(), null, 2)], { type: "application/json" }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "spark-learning.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    root.querySelector("#import-progress").onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2000000) throw new Error("Backup must be under 2 MB.");
        const data = JSON.parse(await file.text());
        if (data.version !== 2 || typeof data.progress !== "object")
          throw new Error("Not a Spark learning backup.");
        writeState(mergeStates(readState(), data));
        root.querySelector("#backup-status").textContent = "Backup merged with your learning.";
      } catch (err) {
        root.querySelector("#backup-status").textContent = err.message;
      }
    };
  }
  paint();
  return subscribe(paint);
}
