// Pure functions shared by modules and covered by unit tests.
// Keep everything here side-effect free.

export const G_PRESETS = { moon: 1.6, mars: 3.7, earth: 9.8, jupiter: 24.8 };

/** Small-angle period of a simple pendulum (seconds). */
export function pendulumPeriod(length, gravity) {
  return 2 * Math.PI * Math.sqrt(length / gravity);
}

/** Projectile launched from height h0 over flat ground. */
export function projectile({ speed, angleDeg, gravity, height = 0 }) {
  const rad = (angleDeg * Math.PI) / 180;
  const vx = speed * Math.cos(rad);
  const vy = speed * Math.sin(rad);
  const tFlight = (vy + Math.sqrt(vy * vy + 2 * gravity * height)) / gravity;
  return {
    vx,
    vy,
    tFlight,
    range: vx * tFlight,
    apex: height + (vy * vy) / (2 * gravity),
  };
}

/** Ohm's law + power for a single resistor across a source. */
export function ohms({ volts, ohms: r }) {
  const current = volts / r;
  return { current, power: volts * current };
}

/** Thin-lens image distance and magnification. focal & object > 0. */
export function thinLens(focal, objectDist) {
  // 1/f = 1/do + 1/di
  const inv = 1 / focal - 1 / objectDist;
  const imageDist = inv === 0 ? Infinity : 1 / inv;
  const magnification = -imageDist / objectDist;
  return {
    imageDist,
    magnification,
    real: imageDist > 0,
    inverted: magnification < 0,
  };
}

/** Frequency of the nth harmonic of a string fixed at both ends. */
export function harmonic(fundamentalHz, n) {
  return fundamentalHz * n;
}

/** Euler characteristic check for a convex polyhedron. */
export function eulerCharacteristic(v, e, f) {
  return v - e + f;
}

export function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}
