import * as T from "three";
import { compile } from "../lib/expr.js";
import { createStage } from "./stage.js";
import { escapeHtml as esc, BACK_BTN } from "../lib/html.js";
import { readState, saveItem } from "./store.js";
const SAMPLES = [
  ["Sine wave", "curve", "a*sin(b*x)"],
  ["Parabola", "curve", "a*x^2+b"],
  ["Circle", "implicit", "x^2+y^2=a^2"],
  ["Saddle", "surface", "a*(x^2-y^2)"],
  ["Gaussian hill", "surface", "a*exp(-(x^2+y^2))"],
  ["Derivative", "derivative", "a*x^3"],
  ["Integral", "integral", "a*x^2"],
];
export function parseFormula(source, mode) {
  source = source.trim().replace(/π/g, "pi").replace(/²/g, "^2").replace(/³/g, "^3");
  if (source.length > 300) throw new Error("Keep the equation under 300 characters.");
  const parts = source.split("=");
  if (parts.length > 2) throw new Error("Use one equals sign.");
  if (parts.length === 2) {
    if (mode === "implicit") source = `(${parts[0]})-(${parts[1]})`;
    else if (["y", "z", "f(x)"].includes(parts[0].trim())) source = parts[1];
    else throw new Error("Use implicit mode for an equation with expressions on both sides.");
  }
  return compile(source, ["x", "y", "a", "b", "k"]);
}
export function mount(root, savedId) {
  const saved = readState().saved[savedId];
  let state = {
    mode: "surface",
    expr: "a*(x^2-y^2)",
    a: 0.6,
    b: 1,
    range: 4,
    ...(saved && !saved.deleted ? saved : {}),
  };
  root.innerHTML = `${BACK_BTN}<section class="hero"><span class="eyebrow">Formula Box</span><h1>Make an equation visible.</h1><p>Start with a sample, change the equation, and move the sliders. No programming needed.</p></section><div class="workbench feature-workbench"><div><div id="formula-stage" class="feature-stage"></div><div id="formula-plot" class="formula-plot" hidden></div><p class="fact" id="formula-caption"></p><p id="formula-error" role="status"></p></div><aside class="notebook"><label>Visualization<select class="text-input" id="formula-mode">${[
    ["surface", "3D surface · z = f(x,y)"],
    ["curve", "2D function · y = f(x)"],
    ["implicit", "2D implicit equation"],
    ["derivative", "Function and derivative"],
    ["integral", "Definite integral from 0 to b"],
  ]
    .map(([v, t]) => `<option value="${v}">${t}</option>`)
    .join(
      ""
    )}</select></label><label>Equation<input id="formula-expr" class="text-input mono" maxlength="300" value="${esc(state.expr)}" spellcheck="false"></label><label>Parameter a <output id="a-out"></output><input type="range" id="formula-a" min="-5" max="5" step="0.1" value="${state.a}"></label><label>Parameter b <output id="b-out"></output><input type="range" id="formula-b" min="-5" max="5" step="0.1" value="${state.b}"></label><label>Axis range ±<select class="text-input" id="formula-range"><option>2</option><option>4</option><option>6</option><option>10</option></select></label><h3>Try a sample</h3><div class="btn-row">${SAMPLES.map(([name], i) => `<button class="btn" data-sample="${i}">${name}</button>`).join("")}</div><button id="save-formula" class="btn primary">Save visualization</button><p id="save-result" role="status"></p><details open><summary>How to write a formula</summary><p>Use <code>*</code> for multiplication and <code>^</code> for powers: <code>2*x^2</code>. Functions include sin, cos, tan, sqrt, abs, exp and log (natural logarithm). Angles use radians. Use x and y for a surface, or x for a function. The sliders control a and b; k also uses a.</p><p>Implicit examples: <code>x^2+y^2=4</code> and <code>y=x^2</code>. Derivatives and integrals are numerical approximations. Undefined points are omitted.</p></details></aside></div>`;
  const q = (id) => root.querySelector("#" + id),
    host = q("formula-stage");
  let stage = null,
    mesh = null;
  q("formula-mode").value = state.mode;
  q("formula-range").value = state.range;
  function draw() {
    try {
      state = {
        ...state,
        mode: q("formula-mode").value,
        expr: q("formula-expr").value,
        a: +q("formula-a").value,
        b: +q("formula-b").value,
        range: +q("formula-range").value,
      };
      q("a-out").textContent = state.a;
      q("b-out").textContent = state.b;
      const fn = parseFormula(state.expr, state.mode),
        f = (x, y = 0) => fn({ x, y, a: state.a, b: state.b, k: state.a });
      q("formula-error").textContent = "";
      q("formula-expr").removeAttribute("aria-invalid");
      const is3d = state.mode === "surface";
      host.hidden = !is3d;
      q("formula-plot").hidden = is3d;
      if (is3d) {
        if (!stage) stage = createStage(host);
        if (!stage) return;
        if (mesh) {
          stage.scene.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
        const n = 64,
          r = state.range,
          vertices = [],
          colors = [];
        let skipped = 0;
        const point = (i, j) => {
          const x = -r + (2 * r * i) / n,
            y = -r + (2 * r * j) / n,
            z = f(x, y);
          return Number.isFinite(z) && Math.abs(z) < r * 4 ? [x, z, y] : null;
        };
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            const p = [point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)];
            if (p.some((v) => !v)) {
              skipped++;
              continue;
            }
            for (const k of [0, 1, 2, 0, 2, 3]) {
              vertices.push(...p[k]);
              const c = new T.Color().setHSL(
                0.48 - 0.38 * T.MathUtils.clamp((p[k][1] + r) / (2 * r), 0, 1),
                0.5,
                0.45
              );
              colors.push(c.r, c.g, c.b);
            }
          }
        if (!vertices.length)
          throw new Error("No finite surface in this range. Try a different equation or range.");
        const geo = new T.BufferGeometry();
        geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
        geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        mesh = new T.Mesh(
          geo,
          new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.5 })
        );
        stage.scene.add(mesh);
        if (!stage.scene.getObjectByName("axes")) {
          const axes = new T.AxesHelper(5);
          axes.name = "axes";
          stage.scene.add(axes);
        }
        q("formula-caption").textContent =
          `Horizontal axes: x and y; height: z. Drag to rotate; pinch to zoom; two fingers to pan. ${skipped ? "Undefined or out-of-range regions omitted." : ""}`;
      } else {
        stage?.dispose();
        stage = null;
        mesh = null;
        plot(q("formula-plot"), f, state);
        q("formula-caption").textContent =
          "Horizontal axis x · vertical axis y. Teal: function/equation; orange: derivative or signed integral area.";
      }
    } catch (e) {
      q("formula-error").textContent = e.message;
      q("formula-expr").setAttribute("aria-invalid", "true");
    }
  }
  let timer;
  for (const id of ["formula-expr", "formula-mode", "formula-a", "formula-b", "formula-range"])
    q(id).oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(draw, 80);
    };
  root.querySelectorAll("[data-sample]").forEach(
    (b) =>
      (b.onclick = () => {
        const [, mode, expr] = SAMPLES[+b.dataset.sample];
        q("formula-mode").value = mode;
        q("formula-expr").value = expr;
        draw();
      })
  );
  q("save-formula").onclick = () => {
    try {
      draw();
      parseFormula(state.expr, state.mode);
      if (q("formula-error").textContent) return;
      const id = savedId || crypto.randomUUID();
      const ok = saveItem("saved", id, { ...state, name: state.expr });
      q("save-result").textContent = ok
        ? "Saved. Find it in My learning."
        : "Saved for this session only; browser storage is full or disabled.";
    } catch (e) {
      q("save-result").textContent = e.message;
    }
  };
  draw();
  return () => {
    clearTimeout(timer);
    stage?.dispose();
  };
}
function plot(host, f, s) {
  const r = s.range,
    size = 600,
    map = (x) => ((x + r) / (2 * r)) * size;
  let paths = "";
  let info = "";
  const trace = (fn, color) => {
    let d = "",
      open = false,
      last = null;
    for (let i = 0; i <= 800; i++) {
      const x = -r + (2 * r * i) / 800,
        y = fn(x);
      if (!Number.isFinite(y) || Math.abs(y) > r * 2 || (last !== null && Math.abs(y - last) > r)) {
        open = false;
        last = Number.isFinite(y) ? y : null;
        continue;
      }
      d += `${open ? "L" : "M"}${map(x).toFixed(2)},${(size - map(y)).toFixed(2)} `;
      open = true;
      last = y;
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
  };
  if (s.mode === "implicit") {
    // Marching squares with linear interpolation of edge crossings.
    const n = 100;
    let d = "";
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = -r + (2 * r * i) / n,
          y = -r + (2 * r * j) / n,
          h = (2 * r) / n,
          p = [
            [x, y],
            [x + h, y],
            [x + h, y + h],
            [x, y + h],
          ],
          v = p.map(([a, b]) => f(a, b)),
          hits = [];
        for (let k = 0; k < 4; k++) {
          const l = (k + 1) % 4;
          if (Number.isFinite(v[k]) && Number.isFinite(v[l]) && v[k] < 0 !== v[l] < 0) {
            const t = v[k] / (v[k] - v[l]);
            hits.push([p[k][0] + t * (p[l][0] - p[k][0]), p[k][1] + t * (p[l][1] - p[k][1])]);
          }
        }
        for (let k = 0; k + 1 < hits.length; k += 2)
          d += `M${map(hits[k][0])},${size - map(hits[k][1])}L${map(hits[k + 1][0])},${size - map(hits[k + 1][1])}`;
      }
    paths = `<path d="${d}" fill="none" stroke="#0f8b80" stroke-width="2.5"/>`;
    info = "Implicit contour sampled on a 100 × 100 grid.";
  } else {
    paths = trace(f, "#0f8b80");
    if (s.mode === "derivative")
      paths += trace((x) => (f(x + 0.0001) - f(x - 0.0001)) / 0.0002, "#b1520b");
    if (s.mode === "integral") {
      let sum = 0,
        valid = true,
        d = `M${map(0)},300`;
      for (let i = 0; i <= 400; i++) {
        const x = (s.b * i) / 400,
          y = f(x);
        if (!Number.isFinite(y)) {
          valid = false;
          break;
        }
        sum += (y * (i === 0 || i === 400 ? 0.5 : 1) * s.b) / 400;
        d += `L${map(x)},${size - map(y)}`;
      }
      d += `L${map(s.b)},300Z`;
      if (valid) {
        paths = `<path d="${d}" fill="#b1520b" opacity=".2"/>` + paths;
        info = `Integral from 0 to ${s.b} ≈ ${sum.toFixed(5)} (trapezoidal estimate).`;
      } else info = "Integral undefined on this interval.";
    }
  }
  let grid = "";
  for (let i = -4; i <= 4; i++) {
    const c = map((i * r) / 4);
    grid += `<path d="M${c} 0V600 M0 ${c}H600" stroke="currentColor" opacity=".1"/><text x="${c + 3}" y="316" font-size="12" fill="currentColor">${((i * r) / 4).toFixed(1)}</text>`;
    if (i !== 0)
      grid += `<text x="304" y="${600 - c - 4}" font-size="12" fill="currentColor">${((i * r) / 4).toFixed(1)}</text>`;
  }
  host.innerHTML = `<svg role="img" aria-label="Graph of ${esc(s.expr)}" viewBox="0 0 600 600">${grid}<path d="M0 300H600 M300 0V600" stroke="currentColor" opacity=".5"/>${paths}</svg><p class="fact">${info}</p>`;
}
