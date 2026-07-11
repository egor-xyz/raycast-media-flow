import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@raycast/api", () => ({
  AI: { ask: vi.fn(async () => "**Song B** — Artist B (similar vibe)") },
  environment: { canAccess: vi.fn(() => true) },
  Tool: {},
}));
vi.mock("../../src/core/mediaService", () => ({
  getMediaSources: vi.fn(async () => ({ engineAvailable: true, sources: [] })),
}));
vi.mock("../../src/core/setup", () => ({ registerAllProviders: vi.fn() }));

import { AI, environment } from "@raycast/api";
import { getMediaSources } from "../../src/core/mediaService";
import findSimilar from "../../src/tools/find-similar";

const canAccess = environment.canAccess as ReturnType<typeof vi.fn>;
const getSources = getMediaSources as unknown as ReturnType<typeof vi.fn>;
const ask = AI.ask as ReturnType<typeof vi.fn>;

describe("find-similar tool", () => {
  beforeEach(() => {
    canAccess.mockReset().mockReturnValue(true);
    getSources.mockReset().mockResolvedValue({ engineAvailable: true, sources: [] });
    ask.mockReset().mockResolvedValue("**Song B** — Artist B (similar vibe)");
  });

  it("returns an unavailable message when Raycast AI cannot be accessed", async () => {
    canAccess.mockReturnValue(false);
    const out = await findSimilar();
    expect(out).toBe("Raycast AI is not available on this account.");
    expect(getSources).not.toHaveBeenCalled();
  });

  it("returns a nothing-playing message when there are no sources", async () => {
    getSources.mockResolvedValue({ engineAvailable: true, sources: [] });
    const out = await findSimilar();
    expect(out).toBe("Nothing is playing — no track to compare.");
    expect(ask).not.toHaveBeenCalled();
  });

  it("asks the AI for suggestions using the playing track's title", async () => {
    getSources.mockResolvedValue({
      engineAvailable: true,
      sources: [{ id: "a", appName: "Music", title: "Song A", artist: "Artist A", isPlaying: true, origin: "applescript" }],
    });
    const out = await findSimilar();
    expect(ask).toHaveBeenCalledWith(expect.stringContaining("Song A"));
    expect(out).toContain("Song B");
  });
});
