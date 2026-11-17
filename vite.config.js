import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.DEPLOY_BASE || "./";

export default defineConfig({
  base,
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // three.js is the single biggest dependency and never changes between
        // our own deploys (same pinned version) — splitting it into its own
        // chunk means a returning visitor's browser can reuse its cached copy
        // across deploys, only re-downloading the (much smaller) app-code
        // chunk that actually changed. Safe, mechanical, no behavior change.
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: "prompt",
      // Registration, update prompts and download status live in the app shell.
      injectRegister: false,
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      workbox: {
        // three.js bundles are large; make sure they are precached for offline use.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,woff2,glb,gltf,bin}"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "spark-font-styles",
              expiration: { maxEntries: 8, maxAgeSeconds: 31536000 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "spark-font-files",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
      manifest: {
        name: "SparkLab — Science Lab",
        short_name: "SparkLab",
        description:
          "A free, interactive 3D science lab: physics, chemistry, biology and math you can touch.",
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
