import pendulum from "./pendulum.js";
import projectile from "./projectile.js";
import spring from "./spring.js";
import circuit from "./circuit.js";
import waves from "./waves.js";
import standing from "./standing.js";
import lens from "./lens.js";
import molecule from "./molecule.js";
import periodic from "./periodic.js";
import solids from "./solids.js";
import grapher from "./grapher.js";
import orrery from "./orrery.js";

// Order shapes the workshop grid.
export const MODULES = [
  pendulum,
  projectile,
  spring,
  circuit,
  waves,
  standing,
  lens,
  molecule,
  periodic,
  solids,
  grapher,
  orrery,
];

export const MODULE_IDS = MODULES.map((m) => m.id);

export const SUBJECTS = [...new Set(MODULES.map((m) => m.subject))];

export function getModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}
