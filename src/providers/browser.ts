import type { MediaSource, SourceProvider } from "../core/types";
import { runAppleScript } from "../lib/applescript";

const SAFARI_SCRIPT =
  'tell application "Safari" to return (name of current tab of front window) & "|" & (URL of current tab of front window)';
const CHROME_SCRIPT =
  'tell application "Google Chrome" to return (title of active tab of front window) & "|" & (URL of active tab of front window)';

/** Domains whose tabs are treated as playable media sources. */
const PLAYER_DOMAINS = ["youtube.com/watch", "music.youtube.com", "open.spotify.com", "soundcloud.com"] as const;

const YOUTUBE_SUFFIX = " - YouTube";
const NOTIFICATION_PREFIX = /^\(\d+\)\s*/;

function matchesPlayerDomain(url: string): boolean {
  return PLAYER_DOMAINS.some((domain) => url.includes(domain));
}

function isYouTubeDomain(url: string): boolean {
  return url.includes("youtube.com");
}

/**
 * Parse a YouTube tab title into title/artist. Strips a leading notification-count
 * prefix (e.g. "(3) ") and the trailing " - YouTube" suffix, then splits on the
 * first " - " into artist/title when present. Null when nothing is left.
 */
export function parseYouTubeTitle(tabTitle: string): { title: string; artist?: string } | null {
  let s = tabTitle.replace(NOTIFICATION_PREFIX, "");
  if (s.endsWith(YOUTUBE_SUFFIX)) {
    s = s.slice(0, -YOUTUBE_SUFFIX.length);
  }
  s = s.trim();
  if (!s) return null;

  const idx = s.indexOf(" - ");
  if (idx === -1) return { title: s };

  const artist = s.slice(0, idx).trim();
  const title = s.slice(idx + 3).trim();
  if (!title) return null;
  return artist ? { artist, title } : { title };
}

interface BrowserProviderConfig {
  id: string;
  displayName: string;
  bundleId: string;
  processName: string;
  script: string;
}

function makeBrowserProvider(cfg: BrowserProviderConfig): SourceProvider {
  return {
    id: cfg.id,
    displayName: cfg.displayName,
    bundleIds: [cfg.bundleId],
    capabilities: { control: false, artwork: false, seek: false },

    async isAvailable() {
      const out = await runAppleScript(
        `tell application "System Events" to (name of processes) contains "${cfg.processName}"`,
      );
      return out === "true";
    },

    async getSource(): Promise<MediaSource | null> {
      const out = await runAppleScript(cfg.script);
      if (out === null) return null;

      // URL is everything after the LAST "|" — titles may contain pipes.
      const lastPipe = out.lastIndexOf("|");
      if (lastPipe === -1) return null;
      const rawTitle = out.slice(0, lastPipe);
      const url = out.slice(lastPipe + 1);

      if (!matchesPlayerDomain(url)) return null;

      let title: string;
      let artist: string | undefined;
      if (isYouTubeDomain(url)) {
        const parsed = parseYouTubeTitle(rawTitle);
        if (!parsed) return null;
        title = parsed.title;
        artist = parsed.artist;
      } else {
        if (!rawTitle.trim()) return null;
        title = rawTitle;
      }

      return {
        id: cfg.id,
        appName: cfg.displayName,
        bundleId: cfg.bundleId,
        title,
        artist,
        isPlaying: false,
        origin: "browser",
        url,
      };
    },
  };
}

export const safariProvider = makeBrowserProvider({
  id: "browser-safari",
  displayName: "Safari",
  bundleId: "com.apple.Safari",
  processName: "Safari",
  script: SAFARI_SCRIPT,
});

export const chromeProvider = makeBrowserProvider({
  id: "browser-chrome",
  displayName: "Chrome",
  bundleId: "com.google.Chrome",
  processName: "Google Chrome",
  script: CHROME_SCRIPT,
});
