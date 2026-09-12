import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * A small orbit camera + renderer wrapper shared by every module.
 * One WebGL context, swapped between module scenes.
 */
export class Viewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

    // A neutral studio-style environment map — gives every PBR material
    // (metals, the lens, mirrors, resistor caps, ...) soft ambient
    // reflections instead of flat shading. MeshBasicMaterial (the flat
    // diagram modules) ignores it entirely, so it's a no-risk global upgrade.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.target = new THREE.Vector3();
    this.wantTarget = new THREE.Vector3();
    this.radius = 10;
    this.minRadius = 2;
    this.maxRadius = 40;
    this.theta = 0.7;
    this.phi = 1.1;
    this.dragging = false;
    this._last = { x: 0, y: 0 };
    this._moved = 0;
    this.onPick = null;

    this._bindPointer();
    this._bindKeys();
    this.raycaster = new THREE.Raycaster();
  }

  _bindPointer() {
    const c = this.canvas;
    c.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this._moved = 0;
      this._last = { x: e.clientX, y: e.clientY };
      c.setPointerCapture?.(e.pointerId);
    });
    window.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this._last.x;
      const dy = e.clientY - this._last.y;
      this._last = { x: e.clientX, y: e.clientY };
      this._moved += Math.abs(dx) + Math.abs(dy);
      this.theta -= dx * 0.006;
      this.phi = Math.min(2.95, Math.max(0.25, this.phi - dy * 0.006));
    });
    window.addEventListener("pointerup", (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      if (this._moved < 5 && this.onPick) {
        const r = c.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 2 - 1;
        const y = -((e.clientY - r.top) / r.height) * 2 + 1;
        this.onPick(x, y);
      }
    });
    c.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this._zoom(e.deltaY * 0.01);
      },
      { passive: false }
    );
  }

  _bindKeys() {
    // Keyboard orbit for people who can't drag.
    this.canvas.addEventListener("keydown", (e) => {
      const step = 0.12;
      const handled = {
        ArrowLeft: () => (this.theta += step),
        ArrowRight: () => (this.theta -= step),
        ArrowUp: () => (this.phi = Math.max(0.25, this.phi - step)),
        ArrowDown: () => (this.phi = Math.min(2.95, this.phi + step)),
        "+": () => this._zoom(-1),
        "=": () => this._zoom(-1),
        "-": () => this._zoom(1),
      }[e.key];
      if (handled) {
        handled();
        e.preventDefault();
      }
    });
  }

  _zoom(units) {
    this.radius = Math.min(
      this.maxRadius,
      Math.max(this.minRadius, this.radius + units * (this.radius * 0.06 + 0.4))
    );
  }

  /** Flat modules (charts, diagrams) skip tone mapping so palette colours stay true. */
  setFlat(flat) {
    this.renderer.toneMapping = flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
  }

  applyView(v = {}) {
    this.target.set(...(v.target || [0, 0, 0]));
    this.wantTarget.copy(this.target);
    this.radius = v.radius ?? 10;
    this.minRadius = v.minRadius ?? this.radius * 0.3;
    this.maxRadius = v.maxRadius ?? this.radius * 3;
    this.theta = v.theta ?? 0.7;
    this.phi = v.phi ?? 1.1;
    this.onPick = null;
  }

  pick(x, y, objects) {
    this.raycaster.setFromCamera({ x, y }, this.camera);
    return this.raycaster.intersectObjects(objects, false);
  }

  updateCamera() {
    this.target.lerp(this.wantTarget, 0.12);
    const { radius: r, phi, theta } = this;
    this.camera.position.set(
      this.target.x + r * Math.sin(phi) * Math.sin(theta),
      this.target.y + r * Math.cos(phi),
      this.target.z + r * Math.sin(phi) * Math.cos(theta)
    );
    this.camera.lookAt(this.target);
  }

  resize(el) {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w < 1 || h < 1) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(scene) {
    if (!scene.environment) scene.environment = this.envMap;
    this.renderer.render(scene, this.camera);
  }
}
