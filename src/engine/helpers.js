import * as THREE from "three";

export function sceneLights(scene, opts = {}) {
  // Sky/ground hemisphere fill + warm key + cool rim — reads well on a light page.
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd7d7d2, opts.ambient ?? opts.hemi ?? 0.72);
  const key = new THREE.DirectionalLight(0xfff3e0, opts.dir ?? 0.95);
  key.position.set(4, 7, 5);
  const rim = new THREE.DirectionalLight(0xdfeaff, opts.rim ?? 0.4);
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
