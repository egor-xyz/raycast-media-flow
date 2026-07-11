import { mediaControlProvider } from "../providers/mediaControl";
import { findProviderForBundle, getProviders } from "./registry";
import type { MediaSource, PlaybackCommand } from "./types";

export interface MediaSnapshot {
  sources: MediaSource[];
  engineAvailable: boolean;
}

export async function getMediaSources(pinnedId?: string): Promise<MediaSnapshot> {
  const [engineAvailable, primary] = await Promise.all([
    mediaControlProvider.isAvailable(),
    mediaControlProvider.getSource(),
  ]);

  const providerSources = (
    await Promise.all(
      getProviders().map(async (p) => ((await p.isAvailable()) ? p.getSource() : null)),
    )
  ).filter((s): s is MediaSource => s !== null);

  const merged = new Map<string, MediaSource>();
  if (primary) merged.set(primary.id, primary);
  for (const s of providerSources) {
    const existing = s.bundleId ? merged.get(s.bundleId) : undefined;
    if (existing) {
      merged.set(existing.id, {
        ...existing,
        ...s,
        artworkPath: existing.artworkPath ?? s.artworkPath,
        isPlaying: existing.isPlaying || s.isPlaying,
      });
    } else if (!merged.has(s.id)) {
      merged.set(s.id, s);
    }
  }

  const sources = [...merged.values()].sort((a, b) => {
    if (a.isPlaying !== b.isPlaying) return a.isPlaying ? -1 : 1;
    const aPin = a.id === pinnedId ? 0 : 1;
    const bPin = b.id === pinnedId ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;
    return a.appName.localeCompare(b.appName);
  });

  return { sources, engineAvailable };
}

export async function controlSource(source: MediaSource, cmd: PlaybackCommand): Promise<void> {
  const owner = source.bundleId ? findProviderForBundle(source.bundleId) : undefined;
  if (owner?.capabilities.control && owner.control) {
    await owner.control(cmd);
    return;
  }
  await mediaControlProvider.control?.(cmd);
}
