/** Escape text for safe interpolation into innerHTML. */
export function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

/** The same "← Workshop" back-link the module view uses, for pages/*.js's own main.innerHTML. */
export const BACK_BTN = `
  <a class="back-btn" href="#/">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L3 7L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Workshop
  </a>`;
