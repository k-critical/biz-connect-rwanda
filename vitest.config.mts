import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside Next's server bundle; tests run server code directly.
      "server-only": fileURLToPath(new URL("./vitest.server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["dotenv/config"],
    // Uploads made by tests go to a temporary folder, never the real one.
    env: { UPLOADS_DIR: join(tmpdir(), "bizconnect-test-uploads") },
    exclude: ["node_modules/**", "prototype/**", ".next/**"],
  },
});
