import * as T from "three";
import { INSTRUMENTS, findInstrument } from "../instruments/catalog.js";
import { buildInstrument } from "../instruments/models.js";
import { createStage } from "./stage.js";
import { escapeHtml as esc, BACK_BTN } from "../lib/html.js";
import { progress } from "../state.js";
export function mount(root, id) {
  const item = findInstrument(id);
  if (item) return detail(root, item);
  root.innerHTML = `${BACK_BTN}<section class="hero"><span class="eyebrow">The instrument cabinet</span><h1>75 ways to explore science.</h1><p>Inspect laboratory equipment, discover how it works, and explore its components. All models are available offline after the app finishes downloading.</p></section><div class="feature-filters"><label>Find an instrument<input id="instrument-search" class="text-input" type="search" placeholder="Try microscope, burette, or compass"></label><label>Subject<select id="instrument-subject" class="text-input"><option>All</option>${["Physics", "Chemistry", "Biology", "Mathematics"].map((s) => `<option>${s}</option>`).join("")}</select></label></div><p id="instrument-count" class="fact" aria-live="polite"></p><div class="bench" id="instrument-cards"></div>`;
  const q = root.querySelector("#instrument-search"),
    filter = root.querySelector("#instrument-subject"),
    cards = root.querySelector("#instrument-cards");
  function paint() {
    const items = INSTRUMENTS.filter(
      (i) =>
        (filter.value === "All" || i.subject === filter.value) &&
        `${i.name} ${i.applications}`.toLowerCase().includes(q.value.toLowerCase())
    );
    root.querySelector("#instrument-count").textContent = `${items.length} of 75 instruments`;
    cards.innerHTML =
      items
        .map(
          (i) =>
            `<a class="card instrument-card" href="#/instruments/${i.id}"><span class="tag">${esc(i.subject)} · Interactive 3D</span><span class="instrument-glyph" aria-hidden="true">${i.subject === "Physics" ? "⚙" : i.subject === "Chemistry" ? "⚗" : i.subject === "Biology" ? "◉" : "△"}</span><h3>${esc(i.name)}</h3><p>${esc(i.applications)}</p><span class="fact">${i.components.length} components · ${progress.for(i.id).completed ? "Completed ✓" : "Explore →"}</span></a>`
        )
        .join("") || "<p>No instruments match your search.</p>";
  }
  q.oninput = paint;
  filter.onchange = paint;
  paint();
  return () => {};
}
function detail(root, item) {
  progress.markVisited(item.id);
  root.innerHTML = `<a class="back-btn" href="#/instruments">← Instrument cabinet</a><div class="workbench feature-workbench"><div><div class="feature-stage" id="instrument-stage"></div><p class="fact">Drag to rotate · scroll/pinch to zoom · right-drag/two fingers to pan. Click a part to inspect it. Keyboard: arrows, +/−, Shift+arrows.</p><div class="btn-row"><button class="btn" id="reset-instrument">Reset view</button><button class="btn" id="explode" aria-pressed="false">Separate parts</button><button class="btn" id="spin" aria-pressed="false">Auto rotate</button></div></div><aside class="notebook"><span class="eyebrow">${item.subject}</span><h1>${esc(item.name)}</h1><p>${esc(item.description)}</p><h3>Working principle</h3><p>${esc(item.principle)}</p><h3>Applications</h3><p>${esc(item.applications)}</p><h3>Important components</h3><div class="btn-row">${item.components.map((c, i) => `<button class="btn" data-part="${i}">${esc(c)}</button>`).join("")}</div><p id="part-info" role="status">Select a component to highlight it.</p><p class="fact">Illustrative teaching model; dimensions and internal details are simplified.</p><button class="btn primary" id="complete-instrument">${progress.for(item.id).completed ? "Completed ✓" : "Mark as completed"}</button></aside></div>`;
  root.querySelector("#complete-instrument").onclick = (e) => {
    progress.complete(item.id);
    e.target.textContent = "Completed ✓";
  };
  const model = buildInstrument(item),
    stage = createStage(root.querySelector("#instrument-stage"));
  if (!stage) return () => model.dispose();
  stage.scene.add(model.root);
  let separated = false;
  const select = (name) => {
    model.parts.forEach((p) => {
      if (!p.userData.originalMaterial) p.userData.originalMaterial = p.material;
      p.material = p.userData.originalMaterial;
    });
    model.parts
      .filter((p) => p.userData.component === name || p.userData.alsoComponents?.includes(name))
      .forEach((p) => (p.material = highlight));
    root.querySelector("#part-info").textContent =
      `${name} highlighted. Separate the parts for a clearer view.`;
  };
  const highlight = new T.MeshStandardMaterial({
    color: 0xf0a13c,
    emissive: 0x503010,
    roughness: 0.4,
  });
  root
    .querySelectorAll("[data-part]")
    .forEach((b) => (b.onclick = () => select(item.components[+b.dataset.part])));
  let down;
  const canvas = stage.renderer.domElement;
  canvas.onpointerdown = (e) => {
    down = [e.clientX, e.clientY];
  };
  canvas.onpointerup = (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = canvas.getBoundingClientRect(),
      ray = new T.Raycaster();
    ray.setFromCamera(
      { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: (-(e.clientY - r.top) / r.height) * 2 + 1 },
      stage.camera
    );
    const hit = ray.intersectObjects(model.parts)[0];
    if (hit) select(hit.object.userData.component);
  };
  root.querySelector("#reset-instrument").onclick = () => stage.reset();
  root.querySelector("#spin").onclick = (e) => {
    stage.controls.autoRotate = !stage.controls.autoRotate;
    e.target.setAttribute("aria-pressed", stage.controls.autoRotate);
  };
  root.querySelector("#explode").onclick = (e) => {
    separated = !separated;
    e.target.setAttribute("aria-pressed", separated);
    model.parts.forEach((p, i) => {
      p.position.copy(p.userData.home);
      if (separated)
        p.position.add(
          new T.Vector3(((i % 3) - 1) * 0.4, Math.floor(i / 3) * 0.05 + 0.2, ((i % 2) - 0.5) * 0.6)
        );
    });
  };
  root.querySelector("#complete-instrument").onclick = (e) => {
    progress.complete(item.id);
    e.target.textContent = "Completed ✓";
  };
  return () => {
    stage.dispose();
    model.dispose();
    highlight.dispose();
  };
}
