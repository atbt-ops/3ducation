import * as THREE from "three";

export function sceneLights(scene, opts = {}) {
  const amb = new THREE.AmbientLight(0xffffff, opts.ambient ?? 0.55);
  const dir = new THREE.DirectionalLight(0xfff2d8, opts.dir ?? 0.9);
  dir.position.set(4, 6, 5);
  scene.add(amb, dir);
  return { amb, dir };
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
