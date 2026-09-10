// Rasterises public/favicon.svg into the PNG icons the PWA manifest needs.
// Runs as part of `npm run build`; safe to run standalone with `npm run icons`.
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/icons");

const art = `<g fill="none" stroke="#B1520B" stroke-width="3">
    <ellipse cx="32" cy="32" rx="26" ry="11"/>
    <ellipse cx="32" cy="32" rx="26" ry="11" transform="rotate(60 32 32)"/>
    <ellipse cx="32" cy="32" rx="26" ry="11" transform="rotate(120 32 32)"/>
  </g>
  <circle cx="32" cy="32" r="7" fill="#0F6B63"/>`;

const plain = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#ffffff"/>
  ${art}
</svg>`;

// Maskable: keep art inside the safe zone (~80%), full-bleed background.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#ffffff"/>
  <g transform="translate(32 32) scale(0.62) translate(-32 -32)">
    ${art}
  </g>
</svg>`;

const jobs = [
  { name: "icon-192.png", size: 192, svg: plain },
  { name: "icon-512.png", size: 512, svg: plain },
  { name: "maskable-512.png", size: 512, svg: maskable },
  { name: "apple-touch-icon.png", size: 180, svg: plain },
];

await mkdir(outDir, { recursive: true });
for (const { name, size, svg } of jobs) {
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(resolve(outDir, name), png);
  console.log(`icons/${name}  ${size}x${size}`);
}

if (!existsSync(resolve(root, "public/favicon.svg"))) {
  console.warn("warning: public/favicon.svg missing");
}
