import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Domain logic is framework-free (CLAUDE.md §15), so tests run in plain Node.
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
