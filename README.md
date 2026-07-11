# MediaFlow

[![Test](https://github.com/egor-xyz/raycast-media-flow/actions/workflows/test.yml/badge.svg)](https://github.com/egor-xyz/raycast-media-flow/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A universal, open-source now-playing monitor and audio device switcher for macOS,
living in the Raycast menu bar.

> **Screenshot:** TBD — menu bar and details view screenshots will be added once the
> extension is submitted to the Raycast Store.

## Features

- **Now Playing menu bar** — artwork, title/artist, live progress, play/pause/skip,
  and quick device/volume switching without leaving the menu bar.
- **Device switching** — list and switch audio input/output devices, wireless badge,
  per-device volume where the hardware supports it.
- **Media details view** — a rich `List.Item.Detail` view with large artwork, full
  metadata, and every active source at once (not just whichever app the menu bar
  happened to pick).
- **AI tools** — `Get Now Playing`, `Control Playback`, and `Find Similar Music`,
  usable from Raycast AI / Quick AI once the extension is installed.

## Install

Raycast Store listing: TBD.

For local development:

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs `ray develop` and hot-reloads the extension in Raycast.

### Optional dependency: `media-control`

```bash
brew install media-control
```

MediaFlow's primary detection engine shells out to the `media-control` CLI
([ungive/mediaremote-adapter](https://github.com/ungive/mediaremote-adapter)), which
covers *any* app registered with the macOS Now Playing service — Music, Spotify,
TIDAL, Deezer, Amazon Music, VLC, browsers, and most podcast apps — in one shot,
including artwork.

It is **optional but strongly recommended**. Without it, MediaFlow degrades
gracefully to AppleScript-only coverage (Music.app and Spotify, plus a Safari/Chrome
tab-title fallback) and shows an install hint in the menu. Direct use of Apple's
`MediaRemote` API has been entitlement-gated since macOS 15.4, which is why
`media-control` — not a bundled/private API call — is the supported path. See
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full detection-engine
writeup.

## Supported apps

| App | Detection | Control | Artwork |
| --- | --- | --- | --- |
| Music.app | `media-control` + AppleScript | Yes (AppleScript) | Via `media-control` |
| Spotify | `media-control` + AppleScript | Yes (AppleScript) | Via `media-control` |
| VLC | `media-control` only — AppleScript offers transport-only control, but no VLC provider is implemented | Via `media-control` | Via `media-control` |
| TIDAL | `media-control` only — no AppleScript dictionary | Via `media-control` | Via `media-control` |
| Deezer | `media-control` only — no AppleScript dictionary | Via `media-control` | Via `media-control` |
| Amazon Music | `media-control` only — no AppleScript dictionary | Via `media-control` | Via `media-control` |
| Firefox | `media-control` only — no AppleScript support | Via `media-control` | Via `media-control` |
| Podcast apps (generic) | `media-control` only | Via `media-control` | Via `media-control` |
| Safari | `media-control` where the tab registers Now Playing, plus a tab-title fallback provider (YouTube-title heuristic) | No | No (tab-title fallback has no artwork) |
| Chrome | `media-control` where the tab registers Now Playing, plus a tab-title fallback provider (YouTube-title heuristic) | No | No (tab-title fallback has no artwork) |

Coverage without `media-control` installed shrinks to the two AppleScript-covered
rows above (Music, Spotify) plus the Safari/Chrome tab-title fallback — every other
row in this table depends on `media-control` being installed.

## Contributing

See [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md). Adding support for a new app?
Start with [`docs/ADDING_NEW_SOURCE.md`](./docs/ADDING_NEW_SOURCE.md).

## License

MIT — see [`LICENSE`](./LICENSE).
