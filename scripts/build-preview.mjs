import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
await mkdir("src/generated", { recursive: true });
await build({
  entryPoints: ["src/features/preview-runtime.js"],
  bundle: true,
  format: "iife",
  minify: true,
  outfile: "src/generated/preview-runtime.txt",
  target: "es2020",
  legalComments: "none",
});
