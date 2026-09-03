import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repositoryRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@app": resolve(repositoryRoot, "src/app"),
      "@ui": resolve(repositoryRoot, "src/ui"),
      "@domain": resolve(repositoryRoot, "src/domain"),
      "@application": resolve(repositoryRoot, "src/application"),
      "@infra": resolve(repositoryRoot, "src/infrastructure"),
      "@shared": resolve(repositoryRoot, "src/shared"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.property.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.property.test.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
