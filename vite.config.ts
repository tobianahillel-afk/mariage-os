import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";

const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@app": fromRoot("./src/app"),
      "@ui": fromRoot("./src/ui"),
      "@domain": fromRoot("./src/domain"),
      "@application": fromRoot("./src/application"),
      "@infra": fromRoot("./src/infrastructure"),
      "@shared": fromRoot("./src/shared"),
    },
  },
  build: {
    sourcemap: true,
    target: "es2022",
  },
});
