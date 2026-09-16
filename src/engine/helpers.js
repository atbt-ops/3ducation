import * as THREE from "three";

export function sceneLights(scene, opts = {}) {
  // Sky/ground hemisphere fill + warm key + cool rim — reads well on a light page.
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd7d7d2, opts.ambient ?? opts.hemi ?? 0.72);
  const key = new THREE.DirectionalLight(0xfff3e0, opts.dir ?? 0.95);
  key.position.set(4, 7, 5);
  const rim = new THREE.DirectionalLight(0xdfeaff, opts.rim ?? 0.5);
  rim.position.set(-5, 3, -6);
  scene.add(hemi, key, rim);
  return { hemi, key, rim };
}

/**
 * A soft fake contact shadow — a ground plane with a radial-gradient alpha map.
 * Cheaper and more forgiving than shadow maps, and it always looks right.
 */
export function contactShadow({ radius = 3, opacity = 0.26, y = -0.9 } = {}) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(18,17,13,${opacity})`);
  g.addColorStop(0.65, `rgba(18,17,13,${opacity * 0.35})`);
  g.addColorStop(1, "rgba(18,17,13,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = -1;
  return mesh;
}

/**
 * A soft radial-gradient billboard for faking a glow around something
 * that's supposed to look self-luminous (a sun, a lit bulb) without a
 * post-processing bloom pass. Same canvas-gradient technique as
 * contactShadow, just camera-facing.
 *
 * Defaults to normal alpha blending — on this app's light page background,
 * additive blending (which only ever *adds* light) is nearly invisible
 * against a bright backdrop. Pass `blending: THREE.AdditiveBlending`
 * explicitly for scenes that already have a dark background (e.g. the
 * starfield space scenes), where additive glow looks properly luminous.
 */
export function glowSprite({ color = 0xffd27a, size = 3, opacity = 0.6, blending = THREE.NormalBlending } = {}) {
  const res = 128;
  const c = document.createElement("canvas");
  c.width = c.height = res;
  const ctx = c.getContext("2d");
  const col = new THREE.Color(color);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  const g = ctx.createRadialGradient(res / 2, res / 2, 0, res / 2, res / 2, res / 2);
  g.addColorStop(0, `rgba(${rgb},${opacity})`);
  g.addColorStop(0.4, `rgba(${rgb},${opacity * 0.5})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, res, res);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      blending,
    })
  );
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = -1;
  return sprite;
}

/**
 * A starfield backdrop for scenes set in empty space — a shell of small
 * points at a fixed radius around the origin. Cheap (one draw call) and
 * gives orbit/astronomy scenes something other than the page background
 * behind them.
 */
export function starfield({ count = 500, radius = 45, size = 0.12 } = {}) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Rejection-sample a direction so points spread evenly over the sphere
    // (naive spherical-coordinate sampling clumps at the poles).
    let x, y, z, lenSq;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      lenSq = x * x + y * y + z * z;
    } while (lenSq > 1 || lenSq === 0);
    const len = Math.sqrt(lenSq);
    const r = radius * (0.85 + Math.random() * 0.15);
    positions[i * 3] = (x / len) * r;
    positions[i * 3 + 1] = (y / len) * r;
    positions[i * 3 + 2] = (z / len) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = -2;
  return points;
}

/**
 * A shaded-disc material for the "blob" style flat diagrams (heart, digestive
 * system, respiratory system, plant parts) — replaces a flat solid-color fill
 * with a baked radial gradient (a light highlight offset toward the upper
 * left, darkening toward the rim) so each circle reads as a glossy, rounded
 * shape instead of a clip-art dot. Same canvas-gradient technique as
 * contactShadow/glowSprite. Opaque, so it drops straight into CircleGeometry
 * meshes with no other changes to draw order or overlap behaviour.
 */
export function radialGradientMaterial(color, { highlight = 0.45, shadow = 0.45, size = 128 } = {}) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const base = new THREE.Color(color);
  const light = base.clone().lerp(new THREE.Color(0xffffff), highlight);
  const dark = base.clone().lerp(new THREE.Color(0x000000), shadow);
  const cx = size * 0.38;
  const cy = size * 0.34;
  const g = ctx.createRadialGradient(cx, cy, size * 0.02, cx, cy, size * 0.8);
  g.addColorStop(0, `#${light.getHexString()}`);
  g.addColorStop(0.55, `#${base.getHexString()}`);
  g.addColorStop(1, `#${dark.getHexString()}`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) });
}

export function bondMesh(a, b, radius, color) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, 12);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  return mesh;
}

export function circlePoints(r, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)));
  }
  return pts;
}

export function groundGrid(size = 8, divisions = 16, y = -0.9) {
  const grid = new THREE.GridHelper(size, divisions, 0x8a6a3a, 0xd8d0bc);
  grid.position.y = y;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  return grid;
}

export function disposeScene(scene) {
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

export const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
