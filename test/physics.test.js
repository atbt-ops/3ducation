import { describe, it, expect } from "vitest";
import {
  pendulumPeriod,
  projectile,
  ohms,
  thinLens,
  harmonic,
  eulerCharacteristic,
  clamp,
} from "../src/lib/physics.js";

describe("pendulumPeriod", () => {
  it("matches 2π√(L/g)", () => {
    expect(pendulumPeriod(1, 9.8)).toBeCloseTo(2.0071, 3);
  });
  it("scales with √L", () => {
    const a = pendulumPeriod(1, 9.8);
    const b = pendulumPeriod(2, 9.8);
    expect(b / a).toBeCloseTo(Math.SQRT2, 5);
  });
});

describe("projectile", () => {
  it("range peaks at 45° from ground level", () => {
    const opts = { speed: 20, gravity: 9.8, height: 0 };
    const at45 = projectile({ ...opts, angleDeg: 45 }).range;
    expect(projectile({ ...opts, angleDeg: 30 }).range).toBeLessThan(at45);
    expect(projectile({ ...opts, angleDeg: 60 }).range).toBeLessThan(at45);
  });
  it("30° and 60° give equal range from ground level", () => {
    const opts = { speed: 15, gravity: 9.8, height: 0 };
    expect(projectile({ ...opts, angleDeg: 30 }).range).toBeCloseTo(
      projectile({ ...opts, angleDeg: 60 }).range,
      6
    );
  });
});

describe("ohms", () => {
  it("I = V / R and P = V I", () => {
    expect(ohms({ volts: 12, ohms: 4 })).toMatchObject({ current: 3, power: 36 });
  });
});

describe("thinLens", () => {
  it("object beyond f → real, inverted", () => {
    const r = thinLens(2, 6);
    expect(r.real).toBe(true);
    expect(r.inverted).toBe(true);
  });
  it("object inside f → virtual, upright, magnified", () => {
    const r = thinLens(2, 1);
    expect(r.real).toBe(false);
    expect(r.inverted).toBe(false);
    expect(Math.abs(r.magnification)).toBeGreaterThan(1);
  });
  it("object at f → image at infinity", () => {
    expect(thinLens(2, 2).imageDist).toBe(Infinity);
  });
});

describe("harmonic", () => {
  it("nth harmonic is n times the fundamental", () => {
    expect(harmonic(110, 3)).toBe(330);
  });
});

describe("eulerCharacteristic", () => {
  it("is 2 for a cube", () => {
    expect(eulerCharacteristic(8, 12, 6)).toBe(2);
  });
});

describe("clamp", () => {
  it("bounds a value", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
});
