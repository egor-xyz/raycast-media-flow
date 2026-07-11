import {
  Clipboard,
  Icon,
  LaunchType,
  LocalStorage,
  MenuBarExtra,
  getPreferenceValues,
  launchCommand,
  open,
} from "@raycast/api";
import { getProgressIcon, usePromise } from "@raycast/utils";
import { useEffect } from "react";
import { getDevices, setDefaultOutput } from "./audio/devices";
import { getSystemVolume, setSystemVolume } from "./audio/volume";
import { controlSource, getMediaSources, type MediaSnapshot } from "./core/mediaService";
import { registerAllProviders } from "./core/setup";
import type { MediaSource } from "./core/types";
import { execSafe } from "./lib/exec";
import { formatTime, truncate } from "./lib/format";

registerAllProviders();

interface Prefs {
  menuBarStyle: "iconAndTitle" | "iconOnly";
  showWhenStopped: boolean;
  maxTitleLength: string;
  enableAI: boolean;
}

const PIN_KEY = "pinnedSourceId";
const VOLUME_STEPS = [0, 25, 50, 75, 100];

export default function Command() {
  const prefs = getPreferenceValues<Prefs>();
  const maxLen = Number(prefs.maxTitleLength) || 30;

  const { data, isLoading, revalidate } = usePromise(async () => {
    const pinnedId = await LocalStorage.getItem<string>(PIN_KEY);
    const [snapshot, devices, volume] = await Promise.all([
      getMediaSources(pinnedId ?? undefined),
      getDevices(),
      getSystemVolume(),
    ]);
    return { snapshot, devices, volume, pinnedId, at: new Date() };
  });

  // Live update while the menu is open; process is unloaded when it closes.
  useEffect(() => {
    const t = setInterval(() => revalidate(), 2000);
    return () => clearInterval(t);
  }, [revalidate]);

  const playing = data?.snapshot.sources.find((s) => s.isPlaying);
  const title =
    prefs.menuBarStyle === "iconAndTitle" && playing
      ? truncate(`${playing.title} – ${playing.artist ?? playing.appName}`, maxLen)
      : undefined;

  if (!playing && !prefs.showWhenStopped && !isLoading) return null;

  return (
    <MenuBarExtra
      isLoading={isLoading}
      icon={playing?.artworkPath ? { source: playing.artworkPath } : Icon.Music}
      title={title}
      tooltip={playing ? `${playing.title} — ${playing.artist ?? ""} — ${playing.appName}` : "MediaFlow"}
    >
      {data && <Menu {...data} maxLen={maxLen} enableAI={prefs.enableAI} onAction={revalidate} />}
    </MenuBarExtra>
  );
}

function Menu(props: {
  snapshot: MediaSnapshot;
  devices: Awaited<ReturnType<typeof getDevices>>;
  volume: number | null;
  pinnedId: string | undefined;
  at: Date;
  maxLen: number;
  enableAI: boolean;
  onAction: () => void;
}) {
  const { snapshot, devices, volume, pinnedId, at, maxLen, enableAI, onAction } = props;
  const outputs = devices.filter((d) => d.kind === "output");

  return (
    <>
      <MenuBarExtra.Section title="Now Playing">
        {snapshot.sources.length === 0 && (
          <>
            <MenuBarExtra.Item
              title="Nothing playing"
              icon={Icon.SpeakerOff}
              subtitle={snapshot.engineAvailable ? undefined : "brew install media-control for full coverage"}
            />
            <MenuBarExtra.Item title="Open Music" icon={Icon.Music} onAction={() => void execSafe("open", ["-b", "com.apple.Music"])} />
            <MenuBarExtra.Item title="Open Spotify" icon={Icon.Music} onAction={() => void execSafe("open", ["-b", "com.spotify.client"])} />
          </>
        )}
        {snapshot.sources.map((s) => (
          <SourceItems key={s.id} source={s} pinned={pinnedId === s.id} maxLen={maxLen} enableAI={enableAI} onAction={onAction} />
        ))}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Audio">
        <MenuBarExtra.Submenu title={`Output: ${outputs.find((d) => d.isDefault)?.name ?? "Unknown"}`} icon={Icon.Speaker}>
          {outputs.map((d) => (
            <MenuBarExtra.Item
              key={d.id}
              title={d.name}
              icon={d.isDefault ? Icon.CheckCircle : d.isWireless ? Icon.Bluetooth : Icon.Plug}
              onAction={async () => {
                await setDefaultOutput(d.id);
                onAction();
              }}
            />
          ))}
        </MenuBarExtra.Submenu>
        <MenuBarExtra.Submenu title={`Volume: ${volume ?? "–"}%`} icon={volume !== null ? getProgressIcon(volume / 100) : Icon.SpeakerOff}>
          {/* cmd+arrowUp/Down aren't in @raycast/eslint-plugin's reserved-shortcut list, so they're safe here. */}
          <MenuBarExtra.Item
            title="Louder"
            icon={Icon.SpeakerUp}
            shortcut={{ modifiers: ["cmd"], key: "arrowUp" }}
            onAction={async () => {
              await setSystemVolume((volume ?? 0) + 10);
              onAction();
            }}
          />
          <MenuBarExtra.Item
            title="Quieter"
            icon={Icon.SpeakerDown}
            shortcut={{ modifiers: ["cmd"], key: "arrowDown" }}
            onAction={async () => {
              await setSystemVolume((volume ?? 0) - 10);
              onAction();
            }}
          />
          {VOLUME_STEPS.map((v) => (
            <MenuBarExtra.Item
              key={v}
              title={v === 0 ? "Mute" : `${v}%`}
              icon={volume !== null && Math.abs(volume - v) < 13 ? Icon.CheckCircle : undefined}
              onAction={async () => {
                await setSystemVolume(v);
                onAction();
              }}
            />
          ))}
        </MenuBarExtra.Submenu>
      </MenuBarExtra.Section>

      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Details…"
          icon={Icon.AppWindowSidebarLeft}
          onAction={() => launchCommand({ name: "mediaDetails", type: LaunchType.UserInitiated })}
        />
        <MenuBarExtra.Item title={`Updated ${at.toLocaleTimeString()}`} icon={Icon.Clock} onAction={onAction} />
      </MenuBarExtra.Section>
    </>
  );
}

/** Best-effort app launch for a source with no URL: open by bundle id, else by app name. */
function openSource(s: MediaSource): void {
  if (s.url) {
    void open(s.url);
  } else if (s.bundleId) {
    void execSafe("open", ["-b", s.bundleId]);
  } else {
    void execSafe("open", ["-a", s.appName]);
  }
}

function SourceItems(props: { source: MediaSource; pinned: boolean; maxLen: number; enableAI: boolean; onAction: () => void }) {
  const { source: s, pinned, maxLen, enableAI, onAction } = props;
  const progress = s.duration && s.position !== undefined ? Math.min(1, s.position / s.duration) : undefined;
  const timing = s.duration ? `${formatTime(s.position)} / ${formatTime(s.duration)}` : undefined;

  return (
    <>
      <MenuBarExtra.Item
        title={truncate(`${s.title}${s.artist ? ` — ${s.artist}` : ""}`, maxLen + 20)}
        subtitle={[s.appName, timing].filter(Boolean).join(" • ")}
        icon={s.artworkPath ? { source: s.artworkPath } : progress !== undefined ? getProgressIcon(progress) : Icon.Music}
        tooltip={`${s.title} — ${s.artist ?? ""} (${s.appName})`}
        onAction={() => openSource(s)}
      />
      <MenuBarExtra.Item
        title={s.isPlaying ? "Pause" : "Play"}
        icon={s.isPlaying ? Icon.Pause : Icon.Play}
        shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
        onAction={async () => {
          await controlSource(s, "playpause");
          onAction();
        }}
      />
      <MenuBarExtra.Item
        title="Next Track"
        icon={Icon.Forward}
        alternate={
          <MenuBarExtra.Item
            title="Previous Track"
            icon={Icon.Rewind}
            onAction={async () => {
              await controlSource(s, "previous");
              onAction();
            }}
          />
        }
        onAction={async () => {
          await controlSource(s, "next");
          onAction();
        }}
      />
      <MenuBarExtra.Submenu title="More" icon={Icon.Ellipsis}>
        <MenuBarExtra.Item
          title={`Copy "${truncate(s.title, 25)} — ${s.artist ?? ""}"`}
          icon={Icon.Clipboard}
          onAction={async () => {
            await Clipboard.copy(`${s.title} — ${s.artist ?? ""}`);
          }}
        />
        {s.url && (
          <MenuBarExtra.Item
            title="Copy URL"
            icon={Icon.Link}
            onAction={async () => {
              await Clipboard.copy(s.url as string);
            }}
          />
        )}
        <MenuBarExtra.Item
          title={pinned ? "Unpin" : "Pin to Top"}
          icon={pinned ? Icon.PinDisabled : Icon.Pin}
          onAction={async () => {
            if (pinned) await LocalStorage.removeItem(PIN_KEY);
            else await LocalStorage.setItem(PIN_KEY, s.id);
            onAction();
          }}
        />
        {enableAI && (
          <MenuBarExtra.Item
            title="Find Similar (AI)"
            icon={Icon.Stars}
            onAction={() =>
              launchCommand({ name: "mediaDetails", type: LaunchType.UserInitiated, context: { findSimilarFor: s.id } })
            }
          />
        )}
      </MenuBarExtra.Submenu>
    </>
  );
}
