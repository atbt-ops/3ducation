import * as THREE from "three";
import { sceneLights } from "../engine/helpers.js";
import { compile, isValidExpr } from "../lib/expr.js";
import { createSurfaceMesh } from "../lib/surfaceMesh.js";
import { escapeHtml } from "../lib/html.js";

/**
 * Turns an approved "formula" submission into an object shaped exactly like a
 * built-in module, so it can run through the same renderModuleObject() path —
 * same stage, same reset/fullscreen tools, same quiz component.
 */
export function buildCommunityModule(sub) {
  const scene = new THREE.Scene();
  sceneLights(scene, { ambient: 0.72, dir: 0.9 });
  const { mesh: surface, rebuild: rebuildSurface, axes } = createSurfaceMesh({ range: 3, seg: 72 });
  scene.add(surface, axes());

  const fallback = "0";
  const formula = isValidExpr(sub.formula, ["x", "y", "k"]) ? sub.formula : fallback;
  const state = { k: 0.6, fn: compile(formula, ["x", "y", "k"]) };

  function rebuild() {
    rebuildSurface(state.fn, { k: state.k });
  }
  rebuild();

  const els = {};
  const author = escapeHtml(sub.authorName || "a community member");

  return {
    id: `community-${sub.id}`,
    name: sub.name,
    tag: `${sub.subject} · Community`,
    subject: sub.subject,
    grades: [sub.gradeMin, sub.gradeMax],
    blurb: sub.description,
    icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6l4 8 9 1-6.5 6 1.5 9-8-4.5-8 4.5 1.5-9L7 15l9-1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    scene,
    view: { target: [0, 0, 0], radius: 9.5, theta: 0.75, phi: 0.95, minRadius: 4, maxRadius: 18 },

    lesson: `
      <p>${escapeHtml(sub.description)}</p>
      <p class="fact">Formula: <span class="mono">z = ${escapeHtml(sub.formula)}</span></p>
      <p class="fact">Submitted by ${author} — a community instrument, reviewed but not
        written by the 3ducation team.</p>
    `,
    quiz: Array.isArray(sub.quiz) ? sub.quiz : [],

    panelHTML() {
      return `
        <div class="formula"><span>z = f(x, y)</span><b class="mono">${escapeHtml(sub.formula)}</b></div>
        <div class="control"><div class="row"><label for="cm-k">Coefficient k</label><output id="cm-kval" for="cm-k"></output></div>
          <input type="range" id="cm-k" min="0.1" max="1.4" step="0.05" value="${state.k}"></div>
      `;
    },
    wire(root) {
      els.k = root.querySelector("#cm-k");
      els.kval = root.querySelector("#cm-kval");
      els.kval.textContent = state.k.toFixed(2);
      els.k.addEventListener("input", () => {
        state.k = parseFloat(els.k.value);
        els.kval.textContent = state.k.toFixed(2);
        rebuild();
      });
    },
    update(dt, viewer) {
      if (!viewer.dragging) surface.rotation.y += dt * 0.15;
    },
    onEnter() {},
    onExit() {},
  };
}
