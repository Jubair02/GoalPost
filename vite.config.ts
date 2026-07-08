import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split eagerly-used vendors into their own long-cached chunks so app
        // redeploys don't force re-downloading React/router/animation code.
        // Firebase is intentionally NOT listed — it's dynamically imported and
        // Rollup keeps it in async chunks loaded only when the leaderboard runs.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/framer-motion|motion-dom|motion-utils/.test(id)) return "motion";
          if (/react-router|@remix-run/.test(id)) return "router";
          if (/[\\/]react[\\/]|[\\/]react-dom[\\/]|[\\/]scheduler[\\/]/.test(id)) return "react";
        },
      },
    },
  },
});
