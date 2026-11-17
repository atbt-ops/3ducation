import * as THREE from "three";
import { runSimulation } from "./simulation-language.js";
let frame = 0,
  run,
  renderer;
function stop() {
  cancelAnimationFrame(frame);
  run?.dispose();
  renderer?.dispose();
  renderer?.forceContextLoss();
  document.body.replaceChildren();
}
function send(type, message) {
  parent.postMessage({ sparkPreview: true, type, message }, "*");
}
addEventListener("message", (e) => {
  if (e.source !== parent || e.data?.type !== "spark-preview-code") return;
  stop();
  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f3f1);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x586b69, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 4, 5);
    scene.add(light);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    document.body.append(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    let theta = 0.6,
      phi = 1.1,
      radius = 6;
    const resize = () => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    onresize = resize;
    let down = null;
    renderer.domElement.onpointerdown = (e) => {
      down = [e.clientX, e.clientY];
      e.target.setPointerCapture(e.pointerId);
    };
    renderer.domElement.onpointermove = (e) => {
      if (!down) return;
      theta -= (e.clientX - down[0]) * 0.01;
      phi = Math.max(0.1, Math.min(3, phi + (e.clientY - down[1]) * 0.01));
      down = [e.clientX, e.clientY];
    };
    renderer.domElement.onpointerup = () => (down = null);
    renderer.domElement.onwheel = (e) => {
      e.preventDefault();
      radius = Math.max(2, Math.min(20, radius + e.deltaY * 0.01));
    };
    run = runSimulation(THREE, scene, e.data.code);
    let last = performance.now(),
      start = last;
    const animate = (t) => {
      try {
        run.tick(Math.min((t - last) / 1000, 0.05), (t - start) / 1000);
        last = t;
        camera.position.set(
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      } catch (err) {
        send("error", err.message);
        stop();
      }
    };
    frame = requestAnimationFrame(animate);
    send("running", "Preview running. Drag to orbit, scroll to zoom.");
  } catch (err) {
    send("error", err.message);
    stop();
  }
});
send("ready", "Ready");
