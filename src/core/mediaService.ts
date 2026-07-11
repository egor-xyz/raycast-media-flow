import { mediaControlProvider } from "../providers/mediaControl";
import { findProviderForBundle, getProviders } from "./registry";
import type { MediaSource, PlaybackCommand } from "./types";

export interface MediaSnapshot {
  sources: MediaSource[];
  engineAvailable: boolean;
}

/** Strips keys whose value is explicitly undefined so they cannot clobber merge targets. */
function defined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

const keyOf = (s: MediaSource) => s.bundleId ?? s.id;

export async function getMediaSources(pinnedId?: string): Promise<MediaSnapshot> {
  const engineAvailablePromise = mediaControlProvider.isAvailable().catch(() => false);
  const primaryPromise = engineAvailablePromise.then((ok) => (ok ? mediaControlProvider.getSource().catch(() => null) : null));

  const [engineAvailable, primary] = await Promise.all([engineAvailablePromise, primaryPromise]);

  const providerSources = (
    await Promise.all(
      getProviders().map((p) =>
        p
          .isAvailable()
          .then((ok) => (ok ? p.getSource() : null))
          .catch(() => null),
      ),
    )
  ).filter((s): s is MediaSource => s !== null);

  const merged = new Map<string, MediaSource>();
  if (primary) merged.set(keyOf(primary), primary);
  for (const s of providerSources) {
    const key = keyOf(s);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        ...defined(s),
        artworkPath: existing.artworkPath ?? s.artworkPath,
        isPlaying: existing.isPlaying || s.isPlaying,
      });
    } else {
      merged.set(key, s);
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
