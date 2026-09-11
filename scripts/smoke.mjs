// Headless smoke test: construct every module, render its panel HTML, and run a
// few animation frames with a stub viewer. Catches import errors, bad geometry
// args, and throws in update() — everything short of real WebGL rendering.
// Run with `npm run smoke`.

const noop = () => {};
const fakeCtx = new Proxy(
  {
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    fillRect: noop,
    fillText: noop,
    measureText: () => ({ width: 10 }),
  },
  { get: (t, p) => (p in t ? t[p] : noop) }
);
function fakeCanvas() {
  return { width: 0, height: 0, getContext: () => fakeCtx, style: {} };
}
function fakeEl() {
  const el = {
    style: {},
    dataset: {},
    classList: { add: noop, remove: noop, toggle: noop },
    children: [],
    addEventListener: noop,
    removeEventListener: noop,
    appendChild: (c) => c,
    append: noop,
    prepend: noop,
    replaceChildren: noop,
    insertBefore: noop,
    setAttribute: noop,
    removeAttribute: noop,
    getAttribute: () => null,
    querySelector: () => fakeEl(),
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    focus: noop,
    dispatchEvent: noop,
    requestFullscreen: () => Promise.resolve(),
    value: "1",
    textContent: "",
    innerHTML: "",
    hidden: false,
    remove: noop,
  };
  return el;
}

globalThis.window = {
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  devicePixelRatio: 1,
  addEventListener: noop,
  removeEventListener: noop,
  ResizeObserver: class {
    observe() {}
  },
};
globalThis.document = {
  createElement: (t) => (t === "canvas" ? fakeCanvas() : fakeEl()),
  createElementNS: () => fakeEl(),
  getElementById: () => fakeEl(),
  querySelector: () => fakeEl(),
  addEventListener: noop,
  fullscreenElement: null,
  exitFullscreen: noop,
};
globalThis.CSS = { escape: (s) => String(s) };
globalThis.Event = class {
  constructor(type) {
    this.type = type;
  }
};

const THREE = await import("three");

const stubViewer = {
  dragging: false,
  onPick: null,
  wantTarget: new THREE.Vector3(),
  pick: () => [],
  applyView: noop,
  setFlat: noop,
};

// MODULES is lightweight metadata + a lazy loader (see src/modules/registry.js)
// — the actual scene/behavior only exists once entry.load() is awaited, same
// as what the real app does when someone opens an instrument. Loading every
// one here, for real, is what keeps this test meaningful despite the lazy
// split: it still constructs every scene and exercises every update loop.
const { MODULES } = await import("../src/modules/index.js");

function metaMismatches(entry, m) {
  const bad = [];
  for (const field of ["id", "name", "tag", "subject", "blurb", "icon"]) {
    if (entry[field] !== m[field]) bad.push(field);
  }
  if (JSON.stringify(entry.grades) !== JSON.stringify(m.grades)) bad.push("grades");
  if (JSON.stringify(entry.video || null) !== JSON.stringify(m.video || null)) bad.push("video");
  return bad;
}

let failed = 0;
for (const entry of MODULES) {
  try {
    const loaded = await entry.load();
    const m = loaded.default;
    const mismatches = metaMismatches(entry, m);
    if (mismatches.length) {
      throw new Error(`registry.js metadata is out of sync with the module: ${mismatches.join(", ")}`);
    }
    if (typeof m.panelHTML === "function") {
      const html = m.panelHTML();
      if (typeof html !== "string") throw new Error("panelHTML did not return a string");
    }
    if (typeof m.wire === "function") m.wire(fakeEl());
    if (typeof m.onEnter === "function") m.onEnter(stubViewer);
    for (let f = 0; f < 30; f++) {
      if (typeof m.update === "function") m.update(0.016, stubViewer);
    }
    if (typeof m.onExit === "function") m.onExit(stubViewer);
    if (!m.scene || !m.scene.isScene) throw new Error("no scene");
    if (!Array.isArray(m.grades) || m.grades.length !== 2) throw new Error("bad grades");
    if (m.video && (!m.video.id || !m.video.title)) throw new Error("video needs id + title");
    console.log(`ok   ${m.id}`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${entry.id}: ${e.message}`);
  }
}

console.log(`\n${MODULES.length - failed}/${MODULES.length} modules passed`);
process.exit(failed ? 1 : 0);
