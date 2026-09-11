import * as THREE from "three";

/**
 * A small, always-camera-facing text label — a rounded pill rendered onto a
 * canvas texture and shown on a THREE.Sprite. For naming multiple objects
 * directly in a 3D scene (the planets in an orrery, the samples in the rock
 * cycle, …) instead of only in the side panel after clicking one.
 *
 * Usage: `mesh.add(createLabel("Mercury"))` with a small local Y offset so
 * it sits just above the object — sprites ignore the parent's rotation, so
 * it stays upright and camera-facing no matter how the object spins.
 */
export function createLabel(text, opts = {}) {
  const { fontSize = 40, color = "#1c1c1f", background = "rgba(255,255,255,0.88)", scale = 1 } = opts;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const padX = 22;
  const padY = 14;
  ctx.font = `700 ${fontSize}px 'Bricolage Grotesque', sans-serif`;
  const textWidth = ctx.measureText(text).width || fontSize * text.length * 0.55;
  canvas.width = Math.ceil(textWidth + padX * 2);
  canvas.height = Math.ceil(fontSize + padY * 2);
  // Resizing the canvas resets the 2D context, so the font has to be set again.
  ctx.font = `700 ${fontSize}px 'Bricolage Grotesque', sans-serif`;

  const w = canvas.width;
  const h = canvas.height;
  const r = h / 2;
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false, // labels always read clearly, even from behind another object
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = w / h;
  const baseHeight = 0.5 * scale;
  sprite.scale.set(baseHeight * aspect, baseHeight, 1);
  sprite.renderOrder = 999;
  return sprite;
}
