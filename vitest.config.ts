import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// `server-only` lança erro fora do bundler do Next; nos testes ele vira um módulo vazio.
const serverOnlyStub = fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: { "server-only": serverOnlyStub },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "api",
          include: ["tests/api/**/*.test.ts"],
          environment: "node",
          // Testes de API usam o Supabase local, configurado em .env.local.
          env: { ...loadEnv(mode, process.cwd(), ""), RATE_LIMIT_DISABLED: "1" },
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
}));
