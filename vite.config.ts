import { defineConfig } from "vite";

// base: "./" keeps every asset path relative so the build works when
// served from a subpath (e.g. apps.charliekrug.com/spec-drift), not just
// from a domain root.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
});
