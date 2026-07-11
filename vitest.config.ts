import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      // @raycast/api ships types only, with no resolvable runtime entry (the real
      // module is injected by the Raycast app). Point it at a stub so the module
      // graph can resolve the specifier; tests that need runtime values from it
      // override the contents with vi.mock("@raycast/api", ...).
      "@raycast/api": fileURLToPath(new URL("./tests/mocks/raycast-api-stub.ts", import.meta.url)),
    },
  },
});
