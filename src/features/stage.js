import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export function createStage(host, onFrame = () => {}) {
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    host.innerHTML =
      '<p class="fact">3D rendering is unavailable on this device. Try enabling hardware acceleration. The lesson remains available.</p>';
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(45, 1, 0.1, 150);
  camera.position.set(5, 3.5, 6);
  scene.add(new T.HemisphereLight(0xffffff, 0x678386, 2));
  const light = new T.DirectionalLight(0xffffff, 3);
  light.position.set(4, 6, 3);
  scene.add(light);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute(
    "aria-label",
    "Interactive 3D view. Arrow keys rotate; plus and minus zoom; shift arrows pan."
  );
  host.append(canvas);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.minDistance = 2;
  controls.maxDistance = 35;
  const keys = (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "="].includes(e.key)) {
      e.preventDefault();
      const dx = e.key === "ArrowLeft" ? -0.15 : e.key === "ArrowRight" ? 0.15 : 0,
        dy = e.key === "ArrowUp" ? 0.15 : e.key === "ArrowDown" ? -0.15 : 0;
      if (e.shiftKey) {
        controls.target.x += dx;
        controls.target.y += dy;
        camera.position.x += dx;
        camera.position.y += dy;
      } else if (dx || dy) {
        const off = camera.position.clone().sub(controls.target),
          s = new T.Spherical().setFromVector3(off);
        s.theta += dx;
        s.phi = T.MathUtils.clamp(s.phi + dy, 0.1, Math.PI - 0.1);
        camera.position.copy(new T.Vector3().setFromSpherical(s).add(controls.target));
      } else
        camera.position
          .sub(controls.target)
          .multiplyScalar(e.key === "-" ? 1.1 : 0.9)
          .add(controls.target);
      controls.update();
    }
  };
  canvas.addEventListener("keydown", keys);
  const resize = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (w && h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  let frame = 0,
    last = performance.now();
  const animate = (t) => {
    frame = requestAnimationFrame(animate);
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    if (document.hidden) return;
    onFrame(dt, t / 1000);
    controls.update();
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(animate);
  return {
    scene,
    camera,
    renderer,
    controls,
    reset() {
      controls.target.set(0, 0, 0);
      camera.position.set(5, 3.5, 6);
      controls.update();
    },
    dispose() {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      canvas.removeEventListener("keydown", keys);
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
