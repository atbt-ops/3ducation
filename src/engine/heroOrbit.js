import * as THREE from "three";
import { sceneLights, disposeScene, prefersReducedMotion } from "./helpers.js";

/**
 * A small decorative, always-live 3D scene for the home hero — an animated
 * orbit motif echoing the brand mark (a nucleus with two crossed rings, like
 * the logo). Self-contained: owns its own renderer and animation loop.
 * Call start() once the canvas is in the DOM, dispose() when leaving home —
 * see main.js, which tears this down on every route change and only ever
 * runs it while "#/" is the active route.
 */
export function createHeroOrbit(canvas) {
  const scene = new THREE.Scene();
  sceneLights(scene, { ambient: 0.8, dir: 1.0, rim: 0.55 });

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.55, 7.2);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xb1520b,
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x4a1f03,
      emissiveIntensity: 0.5,
    })
  );
  group.add(nucleus);

  // Two ring "orbits" at the brand mark's own angles (0° and 60°).
  const ringGeo = new THREE.TorusGeometry(2.1, 0.035, 12, 96);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x0f6b63, roughness: 0.4, metalness: 0.25 });
  const ringA = new THREE.Mesh(ringGeo, ringMat);
  ringA.rotation.x = Math.PI / 2.5;
  const ringB = new THREE.Mesh(ringGeo, ringMat);
  ringB.rotation.x = Math.PI / 2.5;
  ringB.rotation.z = Math.PI / 3;
  group.add(ringA, ringB);

  // One electron riding each ring.
  const electronGeo = new THREE.SphereGeometry(0.17, 16, 16);
  const electronMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x8a3f08,
    emissiveIntensity: 0.7,
    roughness: 0.25,
  });
  const electrons = [ringA, ringB].map((ring, i) => {
    const mesh = new THREE.Mesh(electronGeo, electronMat.clone());
    group.add(mesh);
    return { mesh, ring, t: i * Math.PI }; // start on opposite sides
  });

  function positionElectron(e) {
    const local = new THREE.Vector3(2.1 * Math.cos(e.t), 2.1 * Math.sin(e.t), 0);
    local.applyQuaternion(e.ring.quaternion);
    e.mesh.position.copy(local);
  }
  electrons.forEach(positionElectron);

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 1 || h < 1) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let raf = null;
  let last = 0;

  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    group.rotation.y += dt * 0.22;
    electrons.forEach((e) => {
      e.t += dt * 0.85;
      positionElectron(e);
    });
    resize();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  return {
    /** Starts the loop, unless the visitor asked for reduced motion — then renders one still frame. */
    start() {
      if (raf) return;
      resize();
      renderer.render(scene, camera);
      if (prefersReducedMotion) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    },
    dispose() {
      this.stop();
      disposeScene(scene);
      renderer.dispose();
    },
  };
}
