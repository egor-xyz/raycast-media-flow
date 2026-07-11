import { AI, environment } from "@raycast/api";
import { getMediaSources } from "../core/mediaService";
import { registerAllProviders } from "../core/setup";

/** Suggests tracks similar to the current one. */
export default async function tool(): Promise<string> {
  registerAllProviders();
  const { sources } = await getMediaSources();
  const s = sources.find((x) => x.isPlaying) ?? sources[0];
  if (!s) return "Nothing is playing — no track to compare.";
  if (!environment.canAccess(AI)) return "Raycast AI is not available on this account.";
  return AI.ask(
    `Suggest 5 songs similar to "${s.title}" by ${s.artist ?? "unknown"}. Markdown list: **Title** — Artist (one line why).`,
  );
}
