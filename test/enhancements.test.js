import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { INSTRUMENTS } from "../src/instruments/catalog.js";
import { buildInstrument } from "../src/instruments/models.js";
import { validateCode, runSimulation, TEMPLATE } from "../src/features/simulation-language.js";
import {
  mergeStates,
  validateState,
  blank,
  readState,
  setOwner,
  saveItem,
} from "../src/features/store.js";
import { parseFormula } from "../src/features/formula.js";

describe("instrument cabinet", () => {
  it("contains 75 distinct, documented instruments across four categories", () => {
    expect(INSTRUMENTS).toHaveLength(75);
    expect(new Set(INSTRUMENTS.map((i) => i.id)).size).toBe(75);
    expect(new Set(INSTRUMENTS.map((i) => i.name)).size).toBe(75);
    expect(new Set(INSTRUMENTS.map((i) => i.subject)).size).toBe(4);
  });
  it.each(INSTRUMENTS.map((i) => [i.name, i]))(
    "%s constructs finite, selectable geometry",
    (_, item) => {
      const m = buildInstrument(item);
      expect(m.parts.length).toBeGreaterThan(1);
      for (const component of item.components)
        expect(
          m.parts.some(
            (p) =>
              p.userData.component === component || p.userData.alsoComponents?.includes(component)
          )
        ).toBe(true);
      for (const p of m.parts) {
        expect(item.components).toContain(p.userData.component);
        expect([...p.geometry.attributes.position.array].every(Number.isFinite)).toBe(true);
      }
      m.dispose();
    }
  );
});
describe("restricted simulation runtime", () => {
  it("runs the starter and animates only its scene", () => {
    const scene = new THREE.Scene(),
      r = runSimulation(THREE, scene, TEMPLATE);
    expect(scene.children).toHaveLength(1);
    r.tick(0.016, 1);
    expect(scene.children[0].rotation.y).toBeCloseTo(0.0112);
    r.dispose();
  });
  it.each([
    'fetch("https://evil.test")',
    "window.localStorage",
    'scene.constructor.constructor("return window")()',
    "while(true) {}",
    'import x from "evil"',
    'scene["constructor"]',
    "function update(){new THREE.BoxGeometry()}",
    "const g=new THREE.SphereGeometry(1,100000,100000)",
    "const g=new THREE.Group(); g.add(scene);",
    "const a=new THREE.Group();const b=new THREE.Group();a.add(b);b.add(a);",
  ])("blocks unsafe or unbounded source %s", (code) => {
    expect(() => {
      const r = runSimulation(THREE, new THREE.Scene(), code);
      r.tick(0.1, 1);
    }).toThrow();
  });
  it("rejects huge sources and deep syntax", () => {
    expect(() => validateCode("a".repeat(20001))).toThrow();
    expect(() => validateCode("const x=" + Array(100).fill("1+").join("") + "1")).toThrow();
  });
  it("accepts conditionals and transform setters", () => {
    const scene = new THREE.Scene();
    const r = runSimulation(
      THREE,
      scene,
      "const g=new THREE.Group();scene.add(g);g.position.set(1,2,3);function update(dt,time){if(time>1){g.position.x+=dt;}}"
    );
    r.tick(0.5, 2);
    expect(scene.children[0].position.x).toBe(1.5);
    r.dispose();
  });
});
describe("durable account-scoped learning", () => {
  beforeEach(() => {
    const data = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (k) => data.get(k) || null,
      setItem: (k, v) => data.set(k, v),
    });
    setOwner(null);
  });
  it("keeps guest and different accounts separate across reloads", () => {
    saveItem("saved", "one", { expr: "x" });
    setOwner("alice");
    expect(readState().saved.one).toBeUndefined();
    saveItem("saved", "two", { expr: "y" });
    setOwner("bob");
    expect(readState().saved.two).toBeUndefined();
    setOwner("alice");
    expect(readState().saved.two.expr).toBe("y");
    setOwner(null);
    expect(readState().saved.one.expr).toBe("x");
  });
  it("retains in-memory changes when persistence throws", () => {
    globalThis.localStorage.setItem = () => {
      throw new Error("quota");
    };
    expect(saveItem("saved", "one", { expr: "x" })).toBe(false);
    expect(readState().saved.one.expr).toBe("x");
  });
  it("merges independent edits, preserves best score, and converges", () => {
    const a = blank(),
      b = blank();
    a.progress.p = { visited: true, visitedAt: 10, quizCount: 4, quizBest: 3, quizAt: 11 };
    b.progress.p = { visited: true, visitedAt: 12, quizCount: 2, quizBest: 2, quizAt: 12 };
    a.saved.x = { expr: "x", updatedAt: 5 };
    b.saved.y = { expr: "y", updatedAt: 6 };
    const m = mergeStates(a, b);
    expect(m.progress.p.quizBest).toBe(2);
    expect(m.progress.p.quizCount).toBe(2);
    expect(Object.keys(m.saved)).toHaveLength(2);
    expect(mergeStates(m, a)).toEqual(m);
    expect(mergeStates(b, a)).toEqual(m);
  });
  it("propagates deletions and progress resets without resurrection", () => {
    const a = blank(),
      b = blank();
    a.saved.x = { expr: "x", updatedAt: 1 };
    b.saved.x = { deleted: true, updatedAt: 2 };
    a.progress.p = { visited: true, visitedAt: 1 };
    b.resetAt = 3;
    const m = mergeStates(a, b);
    expect(m.saved.x.deleted).toBe(true);
    expect(m.progress).toEqual({});
  });
  it("rejects malformed state and clamps corrupted scores", () => {
    expect(validateState([])).toEqual(blank());
    expect(
      validateState({ progress: { p: { quizBest: 999, quizCount: 2 } } }).progress.p.quizBest
    ).toBe(2);
    expect(validateState(JSON.parse('{"saved":{"__proto__":{"x":1}}}')).saved).toEqual({});
  });
});
describe("formula modes", () => {
  it("supports equations, powers, parameters and implicit geometry", () => {
    expect(parseFormula("z=a*(x²-y²)", "surface")({ a: 2, x: 3, y: 1 })).toBe(16);
    expect(parseFormula("x^2+y^2=4", "implicit")({ x: 2, y: 0 })).toBe(0);
    expect(parseFormula("y=sin(pi*x)", "curve")({ x: 0.5 })).toBeCloseTo(1);
  });
  it.each(["fetch(1)", "x.constructor", "constructor(1)", "x;alert(1)", "x=".repeat(1000)])(
    "rejects unsafe formulas %s",
    (s) => {
      expect(() => parseFormula(s, "curve")).toThrow();
    }
  );
});
