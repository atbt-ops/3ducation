import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1));
const group = new THREE.Group();
scene.add(group);

const CELL = 0.9;
const cells = [];
for (let r = 0; r < 2; r++) {
  for (let c = 0; c < 2; c++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(CELL - 0.06, CELL - 0.06),
      new THREE.MeshBasicMaterial({ color: 0xf0ede1 })
    );
    m.position.set((c - 0.5) * CELL, (0.5 - r) * CELL, 0);
    group.add(m);
    cells.push(m);
  }
}
group.add(
  new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(CELL * 2, CELL * 2)),
    new THREE.LineBasicMaterial({ color: 0x63665a })
  )
);
[-CELL / 2, CELL / 2].forEach((x) => {
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, -CELL, 0.01), new THREE.Vector3(x, CELL, 0.01)]),
      new THREE.LineBasicMaterial({ color: 0x9a9a94 })
    )
  );
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-CELL, x, 0.01), new THREE.Vector3(CELL, x, 0.01)]),
      new THREE.LineBasicMaterial({ color: 0x9a9a94 })
    )
  );
});

const TRAITS = {
  pea: { dom: "T", rec: "t", domName: "Tall", recName: "Short" },
  eye: { dom: "B", rec: "b", domName: "Brown eyes", recName: "Blue eyes" },
  seed: { dom: "R", rec: "y", domName: "Round seed", recName: "Wrinkled seed" },
};

const state = { trait: "pea", parentA: "Aa", parentB: "Aa" };

function alleles(genotype, t) {
  return genotype.split("").map((c) => (c === "A" ? t.dom : t.rec));
}

function punnett() {
  const t = TRAITS[state.trait];
  const a = alleles(state.parentA, t);
  const b = alleles(state.parentB, t);
  const grid = [];
  for (const x of a) for (const y of b) grid.push([x, y].sort().reverse().join(""));
  const counts = {};
  grid.forEach((g) => (counts[g] = (counts[g] || 0) + 1));
  return { grid, counts, t };
}

const els = {};

export default {
  id: "genetics",
  name: "Punnett square",
  tag: "Biology · Genetics",
  subject: "Biology",
  grades: [9, 12],
  flat: true,
  blurb: "Cross two parents, predict the offspring.",
  icon: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="7" width="26" height="26" stroke="currentColor" stroke-width="2"/><path d="M20 7v26M7 20h26" stroke="currentColor" stroke-width="2"/></svg>',
  scene,
  view: { target: [0, 0, 0], radius: 4.5, theta: 0, phi: 1.5708, minRadius: 2.5, maxRadius: 9 },

  lesson: `
    <p>Each parent carries two copies (<strong>alleles</strong>) of a gene, one from each of
    <em>their</em> parents. A <strong>Punnett square</strong> lines up the possible alleles from one
    parent against the other, filling in every combination the offspring could inherit.</p>
    <p>A <strong>dominant</strong> allele (capital letter) shows up even with just one copy; a
    <strong>recessive</strong> one (lowercase) only shows if both copies match. Cross two heterozygous
    parents (<span class="mono">Aa × Aa</span>) and you get the classic 3:1 ratio — three showing the
    dominant trait for every one showing the recessive.</p>
  `,

  quiz: [
    { q: "Crossing Aa × Aa, what fraction of offspring show the recessive trait?", choices: ["0%", "25%", "50%", "100%"], answer: 1, explain: "Only aa (1 of 4 combinations) shows the recessive trait." },
    { q: "A recessive trait only appears when an organism has…", choices: ["one recessive allele", "two recessive alleles", "two dominant alleles", "no alleles"], answer: 1, explain: "It needs to be homozygous recessive (aa) to show." },
    { q: "Crossing AA × aa produces offspring that are all…", choices: ["AA", "aa", "Aa", "a mix of all three"], answer: 2, explain: "Every offspring gets one A and one a — all heterozygous." },
  ],

  presets: [
    { label: "Aa × Aa", note: "The classic 3:1 ratio — dominant to recessive.", values: { "gn-a": "Aa", "gn-b": "Aa" } },
    { label: "AA × aa", note: "All offspring are heterozygous carriers, showing the dominant trait.", values: { "gn-a": "AA", "gn-b": "aa" } },
    { label: "Aa × aa", note: "A 1:1 split — a 'test cross' used to reveal a hidden genotype.", values: { "gn-a": "Aa", "gn-b": "aa" } },
  ],

  panelHTML() {
    const traitOpts = Object.entries(TRAITS)
      .map(([k, t]) => `<option value="${k}" ${k === state.trait ? "selected" : ""}>${t.domName} vs ${t.recName}</option>`)
      .join("");
    const genoOpts = (sel) => ["AA", "Aa", "aa"].map((g) => `<option value="${g}" ${g === sel ? "selected" : ""}>${g}</option>`).join("");
    return `
      <div class="control"><label for="gn-trait">Trait</label><select id="gn-trait" class="text-input">${traitOpts}</select></div>
      <div class="control"><label for="gn-a">Parent 1 genotype</label><select id="gn-a" class="text-input">${genoOpts(state.parentA)}</select></div>
      <div class="control"><label for="gn-b">Parent 2 genotype</label><select id="gn-b" class="text-input">${genoOpts(state.parentB)}</select></div>
      <div class="section-label">Offspring</div>
      <dl class="stat-grid" id="gn-results"></dl>
    `;
  },

  wire(root) {
    els.trait = root.querySelector("#gn-trait");
    els.a = root.querySelector("#gn-a");
    els.b = root.querySelector("#gn-b");
    els.results = root.querySelector("#gn-results");

    const sync = () => {
      const { grid, counts, t } = punnett();
      grid.forEach((g, i) => {
        cells[i].material.color.setHex(g[0] === t.dom || g[1] === t.dom ? 0xdff0d8 : 0xf5dede);
      });
      const label = (g) => {
        const dom = g.includes(t.dom);
        const rec = g.includes(t.rec);
        const geno = dom && rec ? "Aa" : dom ? "AA" : "aa";
        return `${geno} (${dom ? t.domName : t.recName})`;
      };
      els.results.innerHTML = Object.entries(counts)
        .map(([g, n]) => `<div><dt>${label(g)}</dt><dd class="mono">${n}/4</dd></div>`)
        .join("");
    };
    els.trait.addEventListener("input", () => {
      state.trait = els.trait.value;
      sync();
    });
    els.a.addEventListener("input", () => {
      state.parentA = els.a.value;
      sync();
    });
    els.b.addEventListener("input", () => {
      state.parentB = els.b.value;
      sync();
    });
    sync();
  },

  update() {},
  onEnter() {},
  onExit() {},
};
