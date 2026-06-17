import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: ["**/*.{test,spec}.{js,jsx}"],
    exclude: [
      "node_modules",
      "dist",
      "tests/*-*.spec.js", // Exclude Playwright E2E tests
      "playwright-report",
      "test-results",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.config.js",
        "**/src/test/setup.js",
        "**/tests/*-*.spec.js",
      ],
    },
  },
});
