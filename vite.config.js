import { defineConfig } from "vite";

export default defineConfig({
  // Vite picks up .env automatically; VITE_ prefix is exposed to the browser.
  // Never put FLAGSMITH_API_KEY (admin key) in a VITE_ variable.
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});

