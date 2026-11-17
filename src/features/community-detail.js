import { escapeHtml as esc } from "../lib/html.js";
import { mountPreview } from "./preview.js";
import { progress } from "../state.js";
export function mountContribution(root, sub) {
  progress.markVisited("community-" + sub.id);
  const safeLink = (() => {
    try {
      return new URL(sub.resourceUrl).protocol === "https:" ? sub.resourceUrl : "";
    } catch {
      return "";
    }
  })();
  const safeImage =
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(sub.image || "") &&
    sub.image.length <= 180000
      ? sub.image
      : "";
  root.innerHTML = `<a class="back-btn" href="#/community">← Community library</a><section class="hero"><span class="eyebrow">${esc(sub.subject)} · ${esc(sub.type)}</span><h1>${esc(sub.name)}</h1><p>${esc(sub.description)}</p><p class="fact">By <a href="#/contributors/${encodeURIComponent(sub.authorUid)}">${esc(sub.authorName || "Learner")}</a> · ${esc(sub.status)}</p></section>${sub.type === "code" ? '<div class="btn-row"><button class="btn primary" id="start-community-preview">Run simulation</button><button class="btn" id="stop-community-preview">Stop</button></div><p id="community-preview-status" role="status"></p><div id="community-preview"></div>' : `<article class="notebook"><div class="resource-text">${esc(sub.type === "module" ? "Full module source — review and integrate manually; this source is not executed.\n\n" + (sub.code || "") : sub.content || "")}</div>${safeImage ? `<img class="contribution-image" src="${safeImage}" alt="Illustration for ${esc(sub.name)}">` : ""}${safeLink ? `<p><a href="${esc(safeLink)}" target="_blank" rel="noopener noreferrer">Open learning resource ↗</a></p>` : ""}</article>`}<button class="btn" id="complete-contribution">Mark as completed</button>`;
  let cleanup;
  root.querySelector("#start-community-preview")?.addEventListener("click", () => {
    try {
      cleanup?.();
      cleanup = mountPreview(
        root.querySelector("#community-preview"),
        sub.code,
        (_, msg) => (root.querySelector("#community-preview-status").textContent = msg)
      );
    } catch (err) {
      root.querySelector("#community-preview-status").textContent = err.message;
    }
  });
  root.querySelector("#stop-community-preview")?.addEventListener("click", () => {
    cleanup?.();
    root.querySelector("#community-preview-status").textContent = "Preview stopped.";
  });
  root.querySelector("#complete-contribution").onclick = (e) => {
    progress.complete("community-" + sub.id);
    e.target.textContent = "Completed ✓";
  };
  return () => cleanup?.();
}
export async function mountProfile(root, uid) {
  const { listApprovedFormulas } = await import("../submissions.js");
  const items = (await listApprovedFormulas()).filter((s) => s.authorUid === uid);
  root.innerHTML = `<a class="back-btn" href="#/community">← Community library</a><section class="hero"><span class="eyebrow">Contributor profile</span><h1>${esc(items[0]?.authorName || "Community learner")}</h1><p>${items.length} approved contributions. Only published work is shown publicly.</p></section><div class="bench">${items.map((s) => `<a class="card" href="#/community/${s.id}"><span class="tag">${esc(s.subject)} · ${esc(s.type)}</span><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p></a>`).join("") || "<p>No published contributions yet.</p>"}</div>`;
  return () => {};
}
