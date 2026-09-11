import pendulum from "./pendulum.js";
import projectile from "./projectile.js";
import spring from "./spring.js";
import incline from "./incline.js";
import cradle from "./cradle.js";
import circuit from "./circuit.js";
import resistors from "./resistors.js";
import magnet from "./magnet.js";
import electromagnet from "./electromagnet.js";
import waves from "./waves.js";
import standing from "./standing.js";
import lens from "./lens.js";
import buoyancy from "./buoyancy.js";
import heat from "./heat.js";
import molecule from "./molecule.js";
import states from "./states.js";
import atom from "./atom.js";
import gaslaws from "./gaslaws.js";
import ph from "./ph.js";
import periodic from "./periodic.js";
import cell from "./cell.js";
import dna from "./dna.js";
import photosynthesis from "./photosynthesis.js";
import heart from "./heart.js";
import solids from "./solids.js";
import grapher from "./grapher.js";
import fractions from "./fractions.js";
import times from "./times.js";
import unitcircle from "./unitcircle.js";
import pythagoras from "./pythagoras.js";
import galton from "./galton.js";
import dice from "./dice.js";
import calculus from "./calculus.js";
import orrery from "./orrery.js";
import moon from "./moon.js";
import seasons from "./seasons.js";

// Order shapes the workshop grid: grouped roughly by subject, easy → advanced.
export const MODULES = [
  pendulum,
  projectile,
  spring,
  incline,
  cradle,
  circuit,
  resistors,
  magnet,
  electromagnet,
  waves,
  standing,
  lens,
  buoyancy,
  heat,
  molecule,
  states,
  atom,
  gaslaws,
  ph,
  periodic,
  cell,
  dna,
  photosynthesis,
  heart,
  solids,
  grapher,
  fractions,
  times,
  unitcircle,
  pythagoras,
  galton,
  dice,
  calculus,
  orrery,
  moon,
  seasons,
];

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

export function getModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}
