import pendulum from "./pendulum.js";
import projectile from "./projectile.js";
import waves from "./waves.js";
import molecule from "./molecule.js";
import solids from "./solids.js";
import grapher from "./grapher.js";
import orrery from "./orrery.js";

// Order shapes the workshop grid.
export const MODULES = [pendulum, projectile, waves, molecule, solids, grapher, orrery];

export const MODULE_IDS = MODULES.map((m) => m.id);

export function getModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}
