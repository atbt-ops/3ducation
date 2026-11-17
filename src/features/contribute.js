import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { TEMPLATE, validateCode } from "./simulation-language.js";
import { mountPreview } from "./preview.js";
import { readState, saveItem, removeItem } from "./store.js";
import { createSubmission, listMySubmissions, flushSubmissions } from "../submissions.js";
import { escapeHtml as esc, BACK_BTN } from "../lib/html.js";
export function mount(root, _id, { user, signIn } = {}) {
  root.innerHTML = `${BACK_BTN}<section class="hero"><span class="eyebrow">Create together</span><h1>Share a spark of understanding.</h1><p>Explain an experiment, share a learning resource, or build a Three.js simulation. Save drafts offline; signed-in submissions go to a reviewer before publication.</p></section><div class="contribution-layout"><form id="contribution-form" class="notebook"><label>Contribution path<select id="contribution-type" class="text-input"><option value="resource">No code · Learning resource or instrument</option><option value="code">Developer · Three.js simulation / model</option><option value="formula">No code · Mathematical surface</option></select></label><label>Title<input id="contribution-name" class="text-input" maxlength="100" required minlength="3"></label><label>Subject<select id="contribution-subject" class="text-input">${["Physics", "Chemistry", "Biology", "Mathematics"].map((s) => `<option>${s}</option>`).join("")}</select></label><label>Short description<textarea id="contribution-description" class="text-input" maxlength="2000" minlength="20" required rows="3"></textarea></label><div class="feature-filters"><label>From class<input id="grade-min" class="text-input" type="number" min="1" max="12" value="6"></label><label>To class<input id="grade-max" class="text-input" type="number" min="1" max="12" value="12"></label></div><div id="resource-fields"><label>Explanation / working principle / experiment steps<textarea id="contribution-content" class="text-input" rows="9" maxlength="12000"></textarea></label><label>Learning resource link (optional HTTPS)<input id="contribution-url" class="text-input" type="url" maxlength="1000"></label><label>Illustration (optional, JPG/PNG/WebP, up to 2 MB)<input id="contribution-image" type="file" accept="image/png,image/jpeg,image/webp"></label><img id="image-preview" class="contribution-image" hidden alt="Your contribution illustration"></div><div id="formula-fields" hidden><label>z = f(x,y)<input id="contribution-formula" class="text-input mono" maxlength="300" value="k*(x^2-y^2)"></label><p class="fact">Use x, y and k. Test in the <a href="#/formula">Formula Box</a>. To include a quiz, use the <a href="#/submit/formula">existing formula and quiz builder</a>.</p></div><div class="btn-row"><button type="button" class="btn" id="save-draft">Save draft</button><button class="btn primary" type="submit">Send for review</button></div><p id="contribution-status" role="status"></p>${!user ? '<button class="btn" type="button" id="contribution-signin">Sign in to submit</button>' : ""}</form><div><section id="developer-fields" hidden><h2>Simulation studio</h2><p class="fact">A restricted Three.js API keeps previews isolated. Imports, network access, browser APIs and loops are unavailable. Use <code>function update(dt, time)</code> to animate. Build geometry outside update.</p><div id="code-editor" aria-label="Three.js source editor"></div><div class="btn-row"><button class="btn primary" type="button" id="run-preview">Validate & preview</button><button class="btn" type="button" id="stop-preview">Stop</button><button class="btn" type="button" id="load-starter">Load starter</button></div><p id="preview-status" role="status"></p><div id="code-preview"></div><details><summary>Supported API</summary><p>THREE.BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, Mesh, Group and Vector3. scene.add(), group.add(), position/rotation/scale.set(), x/y/z assignment; Math.sin/cos/tan/abs/sqrt/pow/min/max/floor/ceil, PI and E. Up to 180 objects, 100,000 vertices, 64 segments and 20,000 source characters. This is a teaching subset of JavaScript.</p></details></section><section><h2>Your drafts and contribution history</h2><p class="fact">To bring guest drafts into your signed-in account, use “Copy guest learning” in <a href="#/dashboard">My learning</a>.</p><p id="profile-name"></p><div id="contribution-history"></div></section></div></div>`;
  const q = (id) => root.querySelector("#" + id);
  q("profile-name").textContent = user?.displayName || "Guest · local drafts";
  let image = "",
    draftId = crypto.randomUUID(),
    previewCleanup = null,
    disposed = false;
  const editor = new EditorView({
    state: EditorState.create({
      doc: TEMPLATE,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        javascript(),
        syntaxHighlighting(defaultHighlightStyle),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": "Three.js source code" }),
      ],
    }),
    parent: q("code-editor"),
  });
  function fields() {
    const type = q("contribution-type").value;
    q("resource-fields").hidden = type !== "resource";
    q("formula-fields").hidden = type !== "formula";
    q("developer-fields").hidden = type !== "code";
    if (type !== "code") {
      previewCleanup?.();
      previewCleanup = null;
    }
  }
  q("contribution-type").onchange = fields;
  fields();
  const data = () => ({
    type: q("contribution-type").value,
    name: q("contribution-name").value,
    subject: q("contribution-subject").value,
    description: q("contribution-description").value,
    gradeMin: +q("grade-min").value,
    gradeMax: +q("grade-max").value,
    content: q("contribution-content").value,
    resourceUrl: q("contribution-url").value,
    formula: q("contribution-formula").value,
    code: editor.state.doc.toString(),
    image,
  });
  const restore = (id, d) => {
    draftId = id;
    for (const [key, el] of [
      ["type", "contribution-type"],
      ["name", "contribution-name"],
      ["subject", "contribution-subject"],
      ["description", "contribution-description"],
      ["content", "contribution-content"],
      ["resourceUrl", "contribution-url"],
      ["formula", "contribution-formula"],
      ["gradeMin", "grade-min"],
      ["gradeMax", "grade-max"],
    ])
      if (d[key] != null) q(el).value = d[key];
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: d.code || TEMPLATE },
    });
    image = d.image || "";
    q("image-preview").hidden = !image;
    q("image-preview").src = image;
    fields();
    q("contribution-status").textContent =
      d.status === "changes_requested"
        ? "Revise the contribution and send it for review again."
        : "Draft loaded.";
  };
  async function historyList() {
    let items = Object.entries(readState().drafts)
      .filter(([, d]) => !d.deleted)
      .map(([id, d]) => ({ id, ...d }));
    try {
      if (user) {
        const remote = await listMySubmissions(user.uid);
        const map = new Map(items.map((d) => [d.id, d]));
        remote.forEach((d) => map.set(d.id, d));
        items = [...map.values()];
      }
    } catch (e) {
      if (!disposed) q("contribution-status").textContent = e.message;
    }
    if (disposed) return;
    const host = q("contribution-history");
    host.innerHTML =
      items
        .map(
          (d) =>
            `<article class="submission-row"><b>${esc(d.name || "Untitled draft")}</b><p>${esc(d.status || "draft")} · ${esc(d.type || "resource")}</p>${d.reviewNote ? `<p>Reviewer: ${esc(d.reviewNote)}</p>` : ""}${d.lastError ? `<p>${esc(d.lastError)}</p>` : ""}${["draft", "changes_requested"].includes(d.status || "draft") ? `<button class="btn" data-load="${esc(d.id)}">${d.status === "changes_requested" ? "Revise" : "Edit draft"}</button>` : ""}${d.status === "approved" ? `<a href="#/community/${d.id}">View published contribution</a>` : ""}</article>`
        )
        .join("") || '<p class="fact">Your saved drafts and review decisions will appear here.</p>';
    host.querySelectorAll("[data-load]").forEach(
      (b) =>
        (b.onclick = () =>
          restore(
            b.dataset.load,
            items.find((d) => d.id === b.dataset.load)
          ))
    );
  }
  q("save-draft").onclick = () => {
    const ok = saveItem("drafts", draftId, { ...data(), status: "draft", id: draftId });
    q("contribution-status").textContent = ok
      ? "Draft saved on this device."
      : "Storage unavailable. Copy your work before closing.";
    historyList();
  };
  q("contribution-image").onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (
        file.size > 2 * 1024 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type)
      )
        throw new Error("Choose a JPG, PNG or WebP under 2 MB.");
      const bitmap = await createImageBitmap(file);
      const c = document.createElement("canvas"),
        ratio = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
      c.width = bitmap.width * ratio;
      c.height = bitmap.height * ratio;
      c.getContext("2d").drawImage(bitmap, 0, 0, c.width, c.height);
      bitmap.close();
      image = c.toDataURL("image/jpeg", 0.65);
      if (image.length > 180000) {
        image = "";
        throw new Error("Image is too detailed. Choose a smaller illustration.");
      }
      q("image-preview").src = image;
      q("image-preview").hidden = false;
    } catch (err) {
      q("contribution-status").textContent = err.message;
    }
  };
  q("run-preview").onclick = () => {
    try {
      const code = editor.state.doc.toString();
      validateCode(code);
      previewCleanup?.();
      q("preview-status").textContent = "Starting isolated preview…";
      previewCleanup = mountPreview(q("code-preview"), code, (_type, msg) => {
        if (!disposed) q("preview-status").textContent = msg;
      });
    } catch (e) {
      q("preview-status").textContent = e.message;
    }
  };
  q("stop-preview").onclick = () => {
    previewCleanup?.();
    previewCleanup = null;
    q("preview-status").textContent = "Preview stopped.";
  };
  q("load-starter").onclick = () =>
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: TEMPLATE } });
  q("contribution-signin")?.addEventListener("click", () => {
    q("save-draft").click();
    signIn?.();
  });
  q("contribution-form").onsubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      q("contribution-status").textContent = "Save a draft, then sign in to send it for review.";
      return;
    }
    const button = e.submitter;
    button.disabled = true;
    try {
      const existing = draftId.startsWith(user.uid + "__") ? draftId : undefined;
      const id = await createSubmission(user, data(), existing);
      if (id !== draftId) removeItem("drafts", draftId);
      draftId = id;
      q("contribution-status").textContent =
        "Queued for review. It will upload when the cloud connection is available.";
      historyList();
    } catch (err) {
      q("contribution-status").textContent = err.message;
    } finally {
      button.disabled = false;
    }
  };
  const changed = () => historyList();
  addEventListener("spark-contributions", changed);
  const retry = () => {
    if (user) flushSubmissions(user);
  };
  addEventListener("online", retry);
  historyList();
  return () => {
    disposed = true;
    editor.destroy();
    previewCleanup?.();
    removeEventListener("spark-contributions", changed);
    removeEventListener("online", retry);
  };
}
