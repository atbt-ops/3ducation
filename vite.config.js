import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Deployed at https://atbt-ops.github.io/3ducation/
const base = process.env.DEPLOY_BASE || "/3ducation/";

export default defineConfig({
  base,
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 900,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      workbox: {
        // three.js bundles are large; make sure they are precached for offline use.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
      manifest: {
        name: "3ducation — Science Lab",
        short_name: "3ducation",
        description:
          "A free, interactive 3D science lab: physics, chemistry, math and astronomy you can touch.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
