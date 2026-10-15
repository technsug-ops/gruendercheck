import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: { testTimeout: 60_000, include: ["**/*.test.ts"], exclude: ["node_modules", "legacy", ".next"] },
});
