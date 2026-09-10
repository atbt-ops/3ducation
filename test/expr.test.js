import { describe, it, expect } from "vitest";
import { compile, isValidExpr } from "../src/lib/expr.js";

const at = (src, scope) => compile(src, ["x", "y", "t"])(scope);

describe("compile", () => {
  it("arithmetic and precedence", () => {
    expect(at("1 + 2 * 3")).toBe(7);
    expect(at("(1 + 2) * 3")).toBe(9);
    expect(at("2 ^ 3 ^ 2")).toBe(512); // right-assoc
    expect(at("10 - 2 - 3")).toBe(5); // left-assoc
  });

  it("unary minus", () => {
    expect(at("-3 + 4")).toBe(1);
    expect(at("2 * -3")).toBe(-6);
    expect(at("-(2 + 3)")).toBe(-5);
    expect(at("-x^2", { x: 3 })).toBe(-9);
  });

  it("variables", () => {
    expect(at("x*x - y*y", { x: 3, y: 2 })).toBe(5);
    expect(at("x + t", { x: 1, t: 4 })).toBe(5);
    expect(() => compile("z", ["x", "y", "t"])).toThrow(); // z is not an allowed var
    expect(at("x", {})).toBe(0); // missing scope value defaults to 0
  });

  it("constants and functions", () => {
    expect(at("cos(pi)")).toBeCloseTo(-1, 10);
    expect(at("sqrt(16)")).toBe(4);
    expect(at("max(2, 9)")).toBe(9);
    expect(at("hypot(3, 4)")).toBe(5);
    expect(at("2 * pi")).toBeCloseTo(Math.PI * 2, 10);
  });

  it("rejects unknown names and bad syntax", () => {
    expect(() => compile("foo(2)")).toThrow();
    expect(() => compile("1 +")).toThrow();
    expect(() => compile("(1 + 2")).toThrow();
    expect(() => compile("evil.stuff")).toThrow();
  });
});

describe("isValidExpr", () => {
  it("accepts good formulas", () => {
    expect(isValidExpr("sin(x*y)")).toBe(true);
    expect(isValidExpr("x^2 + y^2")).toBe(true);
  });
  it("rejects junk", () => {
    expect(isValidExpr("x +")).toBe(false);
    expect(isValidExpr("window")).toBe(false);
    expect(isValidExpr("")).toBe(false);
  });
});
