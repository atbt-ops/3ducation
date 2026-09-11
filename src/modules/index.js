import { REGISTRY } from "./registry.js";

// `MODULES` is lightweight metadata only (id, name, tag, subject, grades,
// blurb, icon, video?, load) — no THREE.js scene construction happens by
// importing this file, unlike before. The home page, subject pages, cards,
// and badges only ever needed these fields anyway. The one thing that needs
// a module's full behavior (scene, lesson, quiz, panelHTML, wire, update,
// onEnter, onExit) is the instrument view itself, which calls loadModule(id)
// to lazily import() the real file — see renderModule() in main.js.
export const MODULES = REGISTRY;

export const MODULE_IDS = MODULES.map((m) => m.id);

export const SUBJECTS = [...new Set(MODULES.map((m) => m.subject))];

// Indian school bands, by class number.
export const BANDS = [
  { label: "Primary", min: 1, max: 5 },
  { label: "Middle", min: 6, max: 8 },
  { label: "Secondary", min: 9, max: 12 },
];

export function inBand(m, band) {
  const [lo, hi] = m.grades || [1, 12];
  return lo <= band.max && hi >= band.min;
}

/** The lightweight metadata for one instrument — safe to call synchronously anywhere. */
export function getModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}

/** The full instrument — scene, lesson, quiz, panel, update loop — loaded on demand. Returns null if `id` isn't a real instrument. */
export async function loadModule(id) {
  const entry = getModule(id);
  if (!entry) return null;
  const mod = await entry.load();
  return mod.default;
}
