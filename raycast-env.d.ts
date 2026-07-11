/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Menu Bar Style - Show icon with track title, or icon only */
  "menuBarStyle": "iconAndTitle" | "iconOnly",
  /** Visibility - Keep the icon visible while no media plays */
  "showWhenStopped": boolean,
  /** Max Title Length - Truncate the menu bar title after this many characters */
  "maxTitleLength": string,
  /** AI - Toggle AI-powered actions */
  "enableAI": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `nowPlaying` command */
  export type NowPlaying = ExtensionPreferences & {}
  /** Preferences accessible in the `mediaDetails` command */
  export type MediaDetails = ExtensionPreferences & {}
  /** Preferences accessible in the `searchDevices` command */
  export type SearchDevices = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `nowPlaying` command */
  export type NowPlaying = {}
  /** Arguments passed to the `mediaDetails` command */
  export type MediaDetails = {}
  /** Arguments passed to the `searchDevices` command */
  export type SearchDevices = {}
}

