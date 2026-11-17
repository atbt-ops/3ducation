import * as T from "three";
// Low-poly PBR assemblies: geometry is generated locally and shared by families.
export function buildInstrument(item) {
  const root = new T.Group(),
    parts = [];
  const metal = new T.MeshStandardMaterial({ color: 0x87959b, metalness: 0.75, roughness: 0.25 });
  const dark = new T.MeshStandardMaterial({ color: 0x233d40, metalness: 0.25, roughness: 0.4 });
  const glass = new T.MeshStandardMaterial({
    color: 0xb4e6e2,
    transparent: true,
    opacity: 0.32,
    roughness: 0.12,
    metalness: 0.08,
    side: T.DoubleSide,
    depthWrite: false,
  });
  const white = new T.MeshStandardMaterial({ color: 0xe8e5d9, roughness: 0.65 });
  const accent = new T.MeshStandardMaterial({
    color:
      item.subject === "Chemistry"
        ? 0xb1520b
        : item.subject === "Mathematics"
          ? 0x7255bc
          : 0x1d8174,
    roughness: 0.4,
  });
  const red = new T.MeshStandardMaterial({ color: 0xc45443 });
  const add = (geo, x, y, z, mat = metal, rx = 0, rz = 0) => {
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, 0, rz);
    root.add(m);
    parts.push(m);
    return m;
  };
  const box = (x, y, z, w, h, d, m = metal) => add(new T.BoxGeometry(w, h, d), x, y, z, m);
  const cyl = (x, y, z, r, h, m = metal, rt = r) =>
    add(new T.CylinderGeometry(rt, r, h, 32, 1, m === glass), x, y, z, m);
  const ball = (x, y, z, r, m = metal) => add(new T.SphereGeometry(r, 24, 16), x, y, z, m);
  const ring = (x, y, z, r, t = 0.06, m = metal) =>
    add(new T.TorusGeometry(r, t, 8, 40), x, y, z, m, Math.PI / 2);
  const rod = (a, b, r = 0.05, m = metal) => {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b);
    const mesh = add(new T.CylinderGeometry(r, r, start.distanceTo(end), 12), 0, 0, 0, m);
    mesh.position.copy(start.add(end).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      new T.Vector3(...b).sub(new T.Vector3(...a)).normalize()
    );
    return mesh;
  };
  const ticks = (x, y, n = 12, vertical = true) => {
    for (let i = 0; i < n; i++)
      box(
        x + (vertical ? 0 : i * 0.18),
        y + (vertical ? i * 0.18 : 0),
        0.39,
        vertical ? 0.18 : 0.015,
        vertical ? 0.015 : 0.16,
        0.015,
        white
      );
  };
  const screen = (w = 1.4, h = 0.8) => {
    box(0, 1, 0, 2.4, 1.9, 0.7, dark);
    box(-0.2, 1.2, 0.37, w, h, 0.03, white);
  };
  const tripod = () => {
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      rod([0, 1.4, 0], [Math.cos(a), -1, Math.sin(a)], 0.065);
    }
  };
  const flask = (type) => {
    if (type === "flask") cyl(0, 0.2, 0, 1, 1.6, glass, 0.23);
    else ball(0, 0.2, 0, type === "volumetric" ? 0.8 : 1, glass);
    cyl(0, 1.5, 0, 0.24, 1.25, glass);
    ring(0, 2.13, 0, 0.25, 0.04);
    if (type === "volumetric") {
      ring(0, 1.65, 0, 0.25, 0.025, accent);
      cyl(0, 2.25, 0, 0.22, 0.3, white);
    }
  };
  switch (item.family) {
    case "caliper":
      box(0, 0, 0, 3.8, 0.25, 0.18);
      box(-1.7, 0.45, 0, 0.18, 1.2, 0.18);
      box(-0.4, 0.45, 0, 0.24, 1.2, 0.25);
      box(-0.2, -0.15, 0.1, 0.8, 0.45, 0.2, dark);
      ticks(-1.6, 0.02, 18, false);
      break;
    case "micrometer":
      add(new T.TorusGeometry(0.85, 0.17, 12, 30, Math.PI * 1.5), -0.5, 0, 0, dark, 0, Math.PI / 4);
      rod([-0.5, 0.5, 0], [1.6, 0.5, 0], 0.1);
      rod([0.9, 0.5, 0], [1.7, 0.5, 0], 0.25, accent);
      box(-1.25, 0.5, 0, 0.25, 0.25, 0.25);
      break;
    case "ruler":
    case "sliderule":
      box(0, 0, 0, 4, 0.42, 0.1, white);
      ticks(-1.8, -0.1, 21, false);
      if (item.family === "sliderule") {
        box(0, 0, 0.1, 3.8, 0.12, 0.1, accent);
        box(0.5, 0, 0.2, 0.35, 0.6, 0.05, glass);
      }
      break;
    case "tape":
      box(-0.8, 0.3, 0, 1.4, 1.3, 0.8, accent);
      box(1, 0.1, 0, 2.3, 0.18, 0.25, white);
      ticks(0.1, 0.1, 11, false);
      break;
    case "stopwatch":
    case "compass":
    case "clinometer":
      add(new T.CylinderGeometry(1, 1, 0.25, 48), 0, 0, 0, white, Math.PI / 2);
      ring(0, 0, 0, 1, 0.06, dark).rotation.x = 0;
      rod([0, 0, 0.18], [0.6, 0.7, 0.18], 0.035, red);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        box(0.85 * Math.sin(a), 0.85 * Math.cos(a), 0.2, 0.04, 0.1, 0.03, dark);
      }
      if (item.family === "stopwatch") box(0, 1.15, 0, 0.35, 0.25, 0.2, accent);
      if (item.family === "clinometer") {
        rod([0, 0, 0.3], [0, -1.5, 0.3], 0.01);
        ball(0, -1.5, 0.3, 0.15);
      }
      break;
    case "spring":
      box(0, 0.5, 0, 0.7, 2.8, 0.55, glass);
      for (let i = 0; i < 15; i++) ring(0, -0.5 + i * 0.13, 0, 0.2, 0.025);
      rod([0, -1.5, 0], [0, -0.7, 0]);
      ring(0, -1.6, 0, 0.25, 0.04).rotation.x = 0;
      ticks(0.2, -0.6, 13);
      break;
    case "balance":
      box(0, -1, 0, 1.4, 0.18, 1, dark);
      rod([0, -1, 0], [0, 1.2, 0], 0.1);
      rod([-1.5, 1, 0], [1.5, 1, 0], 0.09);
      for (const x of [-1.3, 1.3]) {
        rod([x, 1, 0], [x, -0.2, 0], 0.02);
        cyl(x, -0.25, 0, 0.6, 0.08, white);
      }
      break;
    case "digital":
      box(0, 0, 0, 2.4, 0.6, 1.8, white);
      cyl(0, 0.5, 0, 0.9, 0.18);
      box(0, 0.05, 0.92, 1, 0.3, 0.03, dark);
      break;
    case "meter":
    case "multimeter":
    case "scope":
    case "phmeter":
    case "spirometer":
      screen(item.family === "scope" ? 1.5 : 1.1);
      if (item.family === "meter") rod([-0.2, 0.9, 0.4], [0.15, 1.45, 0.4], 0.02, red);
      else {
        cyl(0.75, 0.75, 0.45, 0.19, 0.1, accent).rotation.x = Math.PI / 2;
        box(-0.25, 1.2, 0.4, 0.7, 0.06, 0.02, accent);
      }
      for (const x of [-0.6, 0.6]) ball(x, 0.3, 0.45, 0.08, red);
      if (["phmeter", "spirometer"].includes(item.family)) {
        rod([1, 0.5, 0], [1.7, -0.5, 0], 0.04, dark);
        cyl(1.7, -0.3, 0, 0.12, 1.2, white);
      }
      break;
    case "electroscope":
      cyl(0, 0, 0, 0.9, 2, glass);
      rod([0, 0, 0], [0, 1.8, 0]);
      ball(0, 1.8, 0, 0.4);
      rod([0, 0, 0], [-0.45, -0.7, 0], 0.04, accent);
      rod([0, 0, 0], [0.45, -0.7, 0], 0.04, accent);
      break;
    case "magnet":
      box(-0.75, 0, 0, 1.5, 0.55, 0.6, red);
      box(0.75, 0, 0, 1.5, 0.55, 0.6, accent);
      break;
    case "optics":
      box(0, -0.7, 0, 4, 0.15, 0.3);
      for (const x of [-1.4, 0, 1.4]) {
        rod([x, -0.7, 0], [x, 0.5, 0]);
        if (x === 1.4) box(x, 0.6, 0, 0.08, 1.7, 1.5, white);
        else cyl(x, 0.6, 0, 0.6, 0.1, x === 0 ? glass : accent).rotation.z = Math.PI / 2;
      }
      break;
    case "prism":
      add(new T.CylinderGeometry(1.2, 1.2, 1.6, 3), 0, 0, 0, glass, Math.PI / 2);
      rod([-1, 0, 0.7], [0, 1, 0.7], 0.025, accent);
      rod([0, 1, 0.7], [1, 0, 0.7], 0.025, red);
      break;
    case "telescope": {
      tripod();
      const tube = cyl(0, 1.6, 0, 0.45, 2.8, dark);
      tube.rotation.z = 1.1;
      rod([1.25, 1, 0], [1.7, 0.8, 0], 0.18);
      break;
    }
    case "pendulum":
      box(0, -1.5, 0, 2, 0.2, 1.2, dark);
      rod([-1, -1.4, 0], [-1, 1.8, 0], 0.1);
      rod([-1, 1.8, 0], [0.8, 1.8, 0], 0.1);
      rod([0.5, 1.8, 0], [0.5, -0.8, 0], 0.015);
      ball(0.5, -0.8, 0, 0.35, accent);
      break;
    case "beaker":
    case "cylinder":
    case "testtube":
    case "crucible":
    case "dish":
    case "petri": {
      const f = item.family;
      const r = f === "cylinder" ? 0.42 : f === "testtube" ? 0.3 : 1;
      const h =
        f === "cylinder"
          ? 3
          : f === "testtube"
            ? 2.6
            : ["petri", "dish"].includes(f)
              ? 0.35
              : f === "crucible"
                ? 0.8
                : 1.7;
      cyl(0, 0, 0, r, h, ["dish", "crucible"].includes(f) ? white : glass);
      cyl(0, -h / 2, 0, r, 0.06, white);
      ring(0, h / 2, 0, r, 0.035);
      if (f === "cylinder") cyl(0, -h / 2 - 0.1, 0, 0.7, 0.12);
      if (f === "petri") cyl(0.25, 0.5, 0, 1.05, 0.15, glass);
      if (["beaker", "cylinder"].includes(f)) ticks(r * 0.45, -h * 0.4, Math.floor(h * 4));
      break;
    }
    case "flask":
    case "volumetric":
    case "roundflask":
      flask(item.family);
      break;
    case "burette":
    case "pipette":
    case "dropper":
    case "micropipette": {
      const f = item.family;
      const r = f === "micropipette" ? 0.3 : 0.14;
      cyl(0, 0, 0, r, 3, f === "micropipette" ? white : glass);
      cyl(0, -1.8, 0, 0.02, 0.6, white, r);
      if (f === "pipette") ball(0, 0, 0, 0.38, glass);
      if (f === "dropper") ball(0, 1.5, 0, 0.32, dark);
      if (f === "micropipette") {
        cyl(0, 1.7, 0, 0.22, 0.4, accent);
        box(0, 0.5, 0.3, 0.25, 0.4, 0.03, dark);
      }
      if (f === "burette") {
        rod([-0.4, -1.2, 0], [0.4, -1.2, 0], 0.07, accent);
        ticks(0.1, -0.9, 14);
      }
      break;
    }
    case "rack":
      box(0, -0.8, 0, 2.7, 0.12, 1, white);
      box(0, 0.7, 0, 2.7, 0.12, 1, white);
      for (const x of [-1, -0.5, 0, 0.5, 1]) cyl(x, 0.3, 0, 0.15, 2, glass);
      break;
    case "funnel":
    case "separator":
      cyl(0, 0.4, 0, item.family === "separator" ? 0.45 : 0.1, 1.5, glass, 1);
      cyl(0, -0.8, 0, 0.12, 1.2, glass);
      if (item.family === "separator") {
        ball(0, 0.8, 0, 0.8, glass);
        rod([-0.3, -0.8, 0], [0.3, -0.8, 0], 0.06, accent);
      }
      break;
    case "burner":
      cyl(0, -0.9, 0, 0.8, 0.2, dark);
      cyl(0, 0, 0, 0.22, 1.7);
      cyl(0, -0.5, 0, 0.28, 0.4, accent);
      rod([0, -0.7, 0], [0.9, -0.7, 0], 0.1);
      break;
    case "tripod":
      tripod();
      ring(0, 1.4, 0, 0.8, 0.08);
      break;
    case "gauze":
      for (let i = -10; i <= 10; i++) {
        rod([-1, 0, i * 0.1], [1, 0, i * 0.1], 0.008);
        rod([i * 0.1, 0, -1], [i * 0.1, 0, 1], 0.008);
      }
      cyl(0, 0.02, 0, 0.5, 0.04, white);
      break;
    case "mortar":
      cyl(0, -0.1, 0, 0.6, 1, white, 1);
      rod([0.3, 0.3, 0], [1.3, 1.6, 0], 0.18, white);
      break;
    case "condenser":
      cyl(0, 0, 0, 0.4, 2.8, glass);
      cyl(0, 0, 0, 0.13, 3.6, glass);
      rod([0, 1, 0], [0.8, 1.3, 0], 0.12, glass);
      rod([0, -1, 0], [-0.8, -1.3, 0], 0.12, glass);
      root.rotation.z = 0.4;
      break;
    case "microscope":
    case "stereo":
      box(0, -1, 0, 2, 0.25, 1.6, dark);
      rod([-0.65, -0.8, 0], [-0.65, 1.5, 0], 0.18, dark);
      box(0, 0.2, 0, 1.6, 0.12, 1, metal);
      cyl(0, 1.35, 0, 0.23, 1.5, white);
      cyl(0, 0.65, 0, 0.16, 0.35, accent);
      cyl(-0.8, 0.6, 0.3, 0.24, 0.15).rotation.x = Math.PI / 2;
      if (item.family === "stereo") cyl(0.45, 1.6, 0, 0.2, 0.7, dark);
      ball(0, -0.5, 0, 0.25, white);
      break;
    case "lens":
      add(new T.CylinderGeometry(0.8, 0.8, 0.08, 48), 0, 0.4, 0, glass, Math.PI / 2);
      ring(0, 0.4, 0, 0.82, 0.06).rotation.x = 0;
      rod([0, -0.4, 0], [0, -1.6, 0], 0.13, dark);
      break;
    case "slide":
    case "coverslip":
      box(0, 0, 0, 2.6, 0.06, 1, glass);
      box(0, 0.06, 0, 0.8, 0.03, 0.8, glass);
      box(0, 0.09, 0, 0.25, 0.01, 0.3, accent);
      if (item.name === "Haemocytometer")
        for (let i = -4; i <= 4; i++) {
          rod([-0.4, 0.12, i * 0.1], [0.4, 0.12, i * 0.1], 0.003, dark);
          rod([i * 0.1, 0.12, -0.4], [i * 0.1, 0.12, 0.4], 0.003, dark);
        }
      break;
    case "centrifuge":
      cyl(0, -0.3, 0, 1.4, 0.9, white);
      cyl(0, 0.2, 0, 1.05, 0.15, dark);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        cyl(0.7 * Math.cos(a), 0.45, 0.7 * Math.sin(a), 0.1, 0.55, glass);
      }
      cyl(0, 1, 0, 1.4, 0.1, glass);
      break;
    case "scalpel":
    case "needle":
    case "loop":
      rod([0, -1.4, 0], [0, 0.5, 0], 0.1, dark);
      if (item.family === "scalpel") box(0.1, 1, 0, 0.3, 1, 0.03);
      else rod([0, 0.5, 0], [0, 1.6, 0], 0.025);
      if (item.family === "loop") ring(0, 1.7, 0, 0.14, 0.015).rotation.x = 0;
      break;
    case "forceps":
      rod([0, -1.4, 0], [-0.3, 1.4, 0], 0.06);
      rod([0, -1.4, 0], [0.3, 1.4, 0], 0.06);
      break;
    case "scissors":
      for (const x of [-1, 1]) {
        rod([x * 0.5, -0.8, 0], [-x * 0.3, 1.2, 0], 0.06);
        ring(x * 0.5, -1, 0, 0.28, 0.06).rotation.x = 0;
      }
      ball(0, 0, 0, 0.12);
      break;
    case "tray":
      box(0, 0, 0, 2.8, 0.15, 1.8, dark);
      for (const x of [-1.4, 1.4]) box(x, 0.15, 0, 0.1, 0.3, 1.8);
      for (const z of [-0.9, 0.9]) box(0, 0.15, z, 2.8, 0.3, 0.1);
      break;
    case "cabinet":
      box(0, 0, 0, 2, 2.6, 1.5, white);
      box(0, 0, 0.78, 1.7, 2.2, 0.08, glass);
      for (const y of [-0.8, 0, 0.8]) box(0, y, 0.2, 1.6, 0.04, 1, dark);
      box(0.75, 0, 0.9, 0.08, 0.7, 0.08, accent);
      break;
    case "autoclave":
      cyl(0, 0, 0, 1, 2.2);
      cyl(0, 1.2, 0, 1.06, 0.2);
      ball(0, 1.5, 0, 0.2, white);
      rod([-0.5, 1.4, 0], [0.5, 1.4, 0], 0.07, dark);
      break;
    case "respirometer":
    case "potometer":
      cyl(-0.7, 0, 0, 0.5, 1.5, glass);
      rod([-0.7, 0.8, 0], [-0.7, 1.5, 0], 0.06, glass);
      rod([-0.7, 1.5, 0], [1.5, 1.5, 0], 0.06, glass);
      ball(0.8, 1.5, 0, 0.065, red);
      if (item.family === "potometer") {
        rod([-0.7, 0.5, 0], [-1.3, 2.5, 0], 0.035, accent);
        for (const y of [1.7, 2.1]) ball(-1.15, y, 0, 0.2, accent);
      }
      break;
    case "protractor":
      add(
        new T.CylinderGeometry(1.5, 1.5, 0.08, 48, 1, false, 0, Math.PI),
        0,
        0,
        0,
        glass,
        Math.PI / 2
      );
      rod([-1.5, 0, 0.1], [1.5, 0, 0.1], 0.03, dark);
      for (let i = 0; i <= 18; i++) {
        const a = (i * Math.PI) / 18;
        rod(
          [1.3 * Math.cos(a), 1.3 * Math.sin(a), 0.12],
          [1.45 * Math.cos(a), 1.45 * Math.sin(a), 0.12],
          0.01,
          dark
        );
      }
      break;
    case "drawingcompass":
    case "divider":
      rod([0, 1.2, 0], [-0.9, -1.2, 0], 0.07);
      rod([0, 1.2, 0], [0.9, -1.2, 0], 0.07, item.family === "drawingcompass" ? accent : metal);
      ball(0, 1.2, 0, 0.17);
      break;
    case "setsquare": {
      const s = new T.Shape();
      s.moveTo(-1, -1);
      s.lineTo(1.3, -1);
      s.lineTo(-1, item.name.includes("45") ? 1.3 : 2);
      s.closePath();
      add(new T.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }), 0, 0, 0, glass);
      rod([-1, -1, 0.1], [1.3, -1, 0.1], 0.025, accent);
      ball(-1, -1, 0.1, 0.07, red);
      break;
    }
    case "abacus":
      for (const x of [-1.5, 1.5]) box(x, 0, 0, 0.16, 2.4, 0.25, dark);
      for (let y = -0.9; y <= 0.91; y += 0.45) {
        rod([-1.5, y, 0], [1.5, y, 0], 0.025);
        for (let i = 0; i < 8; i++) ball(-1.2 + i * 0.25, y, 0, 0.1, i < 4 ? accent : red);
      }
      break;
    case "geoboard":
      box(0, -0.15, 0, 2.6, 0.2, 2.6, white);
      for (let x = -1; x <= 1; x += 0.5)
        for (let z = -1; z <= 1; z += 0.5) cyl(x, 0.05, z, 0.035, 0.25);
      rod([-1, 0.15, -1], [1, 0.15, -1], 0.02, accent);
      rod([1, 0.15, -1], [0, 0.15, 1], 0.02, accent);
      rod([0, 0.15, 1], [-1, 0.15, -1], 0.02, accent);
      break;
    case "wheel":
      ring(0, -0.5, 0, 0.9, 0.12, dark).rotation.x = 0;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        rod([0, -0.5, 0], [0.85 * Math.cos(a), -0.5 + 0.85 * Math.sin(a), 0], 0.03);
      }
      rod([0, -0.5, 0.15], [0.6, 2, 0.15], 0.07);
      rod([0.4, 2, 0.15], [1, 2, 0.15], 0.1, dark);
      break;
    case "planimeter":
    case "pantograph":
      for (const [a, b] of [
        [
          [0, 1, 0],
          [1.4, 0, 0],
        ],
        [
          [1.4, 0, 0],
          [0, -1, 0],
        ],
        [
          [0, -1, 0],
          [-1.4, 0, 0],
        ],
        [
          [-1.4, 0, 0],
          [0, 1, 0],
        ],
      ])
        rod(a, b, 0.07, accent);
      for (const [x, y] of [
        [0, 1],
        [1.4, 0],
        [0, -1],
        [-1.4, 0],
      ])
        ball(x, y, 0, 0.12);
      break;
    case "spherometer":
      tripod();
      cyl(0, 1.3, 0, 0.7, 0.15);
      rod([0, -1, 0], [0, 2, 0], 0.1);
      cyl(0, 2, 0, 0.6, 0.12, white);
      break;
    case "solids":
      box(-1, 0, 0, 0.9, 0.9, 0.9, accent);
      ball(0.5, 0, 0, 0.6, white);
      cyl(1.5, 0, 0, 0.45, 1, red, 0);
      cyl(-0.2, 0, 1.2, 0.4, 1, metal);
      break;
    default:
      throw new Error("Missing model family: " + item.family);
  }
  // Explicit part-to-component mapping follows construction order above.
  const maps = {
    caliper: [2, 0, 1, 3],
    micrometer: [0, 2, 3, 1],
    ruler: [0],
    sliderule: [0],
    tape: [0, 1],
    stopwatch: [0, 0, 0],
    compass: [0, 3, 1],
    clinometer: [0, 0, 0],
    spring: [0],
    balance: [1, 1, 0, 0, 2, 0, 3],
    digital: [1, 0, 2],
    meter: [2, 0, 1, 3, 3],
    multimeter: [0, 0, 1, 0, 2, 2],
    scope: [0, 0, 1, 0, 3, 3],
    phmeter: [0, 0, 3, 0, 0, 0, 2, 1],
    spirometer: [2, 2, 1, 2, 2, 2, 3, 0],
    electroscope: [3, 1, 0, 2, 2],
    magnet: [0, 1],
    optics: [0, 0, 1, 0, 2, 0, 3],
    telescope: [3, 3, 3, 0, 1],
    prism: [0, 1, 2],
    pendulum: [3, 0, 0, 1, 2],
    beaker: [0, 0, 1],
    cylinder: [0, 0, 3, 1],
    testtube: [0, 1, 2],
    crucible: [0, 2, 1],
    dish: [0, 0, 2],
    petri: [0, 2, 0, 1],
    flask: [0, 1, 2],
    volumetric: [0, 1, 1, 2, 3],
    roundflask: [0, 1, 2],
    burette: [0, 2, 1],
    pipette: [0, 3, 1],
    dropper: [1, 2, 0],
    micropipette: [2, 3, 0, 1],
    rack: [2, 0],
    funnel: [0, 1],
    separator: [0, 3, 0, 2],
    burner: [0, 1, 2, 3],
    tripod: [1, 1, 1, 0],
    gauze: [],
    mortar: [0, 1],
    condenser: [1, 0, 3, 2],
    microscope: [4, 4, 2, 0, 1, 3, 4],
    stereo: [3, 3, 2, 0, 1, 3, 0, 3],
    lens: [0, 1, 2],
    slide: [0, 2, 1],
    coverslip: [0, 1, 2],
    centrifuge: [3, 0],
    scalpel: [1, 0],
    needle: [0, 1],
    loop: [0, 1, 2],
    forceps: [0, 1],
    scissors: [0, 2, 0, 2, 1],
    tray: [1, 0, 0, 0, 0],
    cabinet: [0, 1, 3, 3, 3, 2],
    autoclave: [0, 1, 2, 3],
    respirometer: [0, 3, 1, 2],
    potometer: [1, 2, 2, 3, 0],
    protractor: [0, 2],
    drawingcompass: [0, 1, 2],
    divider: [0, 1, 2],
    setsquare: [0, 1, 2],
    abacus: [0, 0],
    geoboard: [0],
    wheel: [0, 1, 1, 1, 1, 1, 1, 2, 3],
    planimeter: [1, 1, 1, 1, 0, 2, 3, 1],
    pantograph: [0, 0, 0, 0, 1, 2, 3, 1],
    spherometer: [0, 0, 0, 3, 1, 2],
    solids: [0, 2, 1, 3],
  };
  const indices = maps[item.family] || [];
  // Repeated geometry represents repeated parts (graduations, beads, tubes).
  const repeated = {
    ruler: 1,
    tape: 1,
    spring: 1,
    beaker: 2,
    cylinder: 2,
    burette: 0,
    rack: 3,
    gauze: 0,
    centrifuge: 1,
    protractor: 0,
    abacus: 2,
    geoboard: 1,
  };
  parts.forEach((mesh, i) => {
    const component = indices[i] ?? repeated[item.family] ?? 0;
    mesh.userData.component = item.components[component] || item.components[0];
    mesh.userData.home = mesh.position.clone();
  });
  // Some components are features of one continuous object, not detachable meshes.
  const associations = {
    sliderule: { 1: [parts.length - 2], 2: [parts.length - 1] },
    burette: { 3: [2] },
    dish: { 1: [2] },
    ruler: { 2: [0] },
    tape: { 2: [1] },
    stopwatch: { 1: [parts.length - 1], 2: [parts.length - 1] },
    compass: { 2: [2] },
    spring: { 2: [parts.length - 1], 3: [parts.length - 14] },
    digital: { 3: [2] },
    multimeter: { 3: [4, 5] },
    scope: { 2: [2] },
    magnet: { 2: [0, 1] },
    telescope: { 2: [0, 1, 2] },
    flask: { 2: [2] },
    roundflask: { 2: [2] },
    pipette: { 2: [0] },
    rack: { 1: [1] },
    funnel: { 2: [0] },
    separator: { 1: [2] },
    tripod: { 2: [0, 1, 2] },
    gauze: { 1: [0, 20], 2: [parts.length - 1] },
    mortar: { 2: [0] },
    scalpel: { 2: [0] },
    needle: { 2: [1] },
    forceps: { 2: [0, 1] },
    tray: { 2: [0] },
    protractor: { 1: [1] },
    abacus: { 1: [2, 11, 20, 29, 38] },
    geoboard: { 2: [parts.length - 1, parts.length - 2, parts.length - 3] },
  };
  for (const [index, meshIndices] of Object.entries(associations[item.family] || {}))
    for (const meshIndex of meshIndices) {
      const mesh = parts[meshIndex];
      if (mesh) (mesh.userData.alsoComponents ??= []).push(item.components[+index]);
    }
  if (item.family === "centrifuge") parts.at(-1).userData.component = item.components[2];
  if (item.family === "spring") parts[16].userData.component = item.components[3];
  if (item.family === "clinometer") {
    parts.at(-1).userData.component = item.components[3];
    parts.at(-2).userData.component = item.components[2];
    parts[2].userData.component = item.components[1];
  }

  return {
    root,
    parts,
    dispose() {
      root.traverse((o) => o.geometry?.dispose());
      new Set([metal, dark, glass, white, accent, red]).forEach((m) => m.dispose());
    },
  };
}
