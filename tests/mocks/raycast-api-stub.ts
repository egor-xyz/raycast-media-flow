// Resolution-only stub for "@raycast/api" in the vitest module graph.
//
// @raycast/api ships types only (no "main"/"exports" — the real runtime is injected
// by the Raycast app), so Vite/vitest can't resolve it on its own. Tests that need to
// import runtime values from "@raycast/api" (currently just find-similar.test.ts) rely
// on `vi.mock("@raycast/api", ...)` to replace the module contents; this file only
// needs to exist so that import specifier resolves to *something* before the mock
// factory takes over. Do not import this file directly — mock "@raycast/api" instead.
export {};
