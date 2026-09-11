import * as THREE from "three";

/**
 * A reusable z = f(x, y) surface: a coloured plane mesh plus a rebuild(fn, scope)
 * function that re-heights and re-colours it. Shared by the Surface studio module
 * and by community formula instruments so both use one tested rendering path.
 */
export function createSurfaceMesh({ range = 3, seg = 80, clamp = 4.5 } = {}) {
  const geo = new THREE.PlaneGeometry(range * 2, range * 2, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.5,
      metalness: 0.04,
      side: THREE.DoubleSide,
    })
  );

  const lo = new THREE.Color(0x0f6b63);
  const mid = new THREE.Color(0xf1ede1);
  const hi = new THREE.Color(0xb1520b);
  const tmp = new THREE.Color();

  function rebuild(fn, scope = {}) {
    const arr = pos.array;
    let minH = Infinity;
    let maxH = -Infinity;
    for (let i = 0; i < arr.length; i += 3) {
      scope.x = base[i];
      scope.y = base[i + 2];
      let h = fn(scope);
      if (!Number.isFinite(h)) h = 0;
      h = Math.max(-clamp, Math.min(clamp, h));
      arr[i + 1] = h;
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
    const span = maxH - minH || 1;
    for (let i = 0, c = 0; i < arr.length; i += 3, c += 3) {
      const f = (arr[i + 1] - minH) / span;
      if (f < 0.5) tmp.copy(lo).lerp(mid, f * 2);
      else tmp.copy(mid).lerp(hi, (f - 0.5) * 2);
      colors[c] = tmp.r;
      colors[c + 1] = tmp.g;
      colors[c + 2] = tmp.b;
    }
    pos.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.computeVertexNormals();
  }

  function axes(size = range) {
    return new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0),
        new THREE.Vector3(0, 0, -size), new THREE.Vector3(0, 0, size),
        new THREE.Vector3(0, -size, 0), new THREE.Vector3(0, size, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x9a9a94 })
    );
  }

  return { mesh, rebuild, axes };
}
