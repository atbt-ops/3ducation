/**
 * Guided experiments. A preset names a setup and a question, and carries the
 * exact control values to dial in. It applies by writing to the module's own
 * <input> elements and firing their "input" handlers — no per-module wiring.
 *
 * module.presets = [{ label, note, values: { "<input id>": value } }]
 */
export function mountPresets(container, presets, panelRoot) {
  if (!presets || !presets.length) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  container.innerHTML = `
    <span class="section-label">Try these</span>
    <div class="preset-row"></div>
    <p class="preset-note" role="status" hidden></p>
  `;
  const row = container.querySelector(".preset-row");
  const noteEl = container.querySelector(".preset-note");

  presets.forEach((preset, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip preset";
    b.textContent = preset.label;
    b.addEventListener("click", () => {
      for (const [id, value] of Object.entries(preset.values || {})) {
        const input = panelRoot.querySelector(`#${CSS.escape(id)}`);
        if (!input) continue;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      row.querySelectorAll(".preset").forEach((el, j) =>
        el.setAttribute("aria-pressed", j === i ? "true" : "false")
      );
      if (preset.note) {
        noteEl.textContent = preset.note;
        noteEl.hidden = false;
      } else {
        noteEl.hidden = true;
      }
    });
    b.setAttribute("aria-pressed", "false");
    row.appendChild(b);
  });
}
