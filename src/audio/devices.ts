import type { AudioDevice } from "../core/types";

/** transportType values (lowercased) that count as wireless. */
const WIRELESS_TRANSPORTS = new Set(["bluetooth", "bluetooth-le", "airplay"]);

interface RawDevice {
  id: number;
  name: string;
  isInput: boolean;
  isOutput: boolean;
  transportType: string;
  volume?: number;
}

function isWirelessTransport(transportType: string): boolean {
  return WIRELESS_TRANSPORTS.has(transportType.toLowerCase());
}

function toAudioDevice(device: RawDevice, kind: "input" | "output", defaultId: number | null): AudioDevice {
  return {
    id: String(device.id),
    name: device.name,
    kind,
    transportType: device.transportType,
    isWireless: isWirelessTransport(device.transportType),
    isDefault: defaultId !== null && device.id === defaultId,
    volume: device.volume,
  };
}

async function safeDefaultId(getDefault: () => Promise<{ id: number }>): Promise<number | null> {
  try {
    const device = await getDefault();
    return device?.id ?? null;
  } catch {
    return null;
  }
}

/** All audio devices, split into input/output entries. Empty array if the native library fails. */
export async function getDevices(): Promise<AudioDevice[]> {
  try {
    const lib = await import("macos-audio-devices");
    const [rawDevices, defaultOutputId, defaultInputId] = await Promise.all([
      lib.getAllDevices() as Promise<RawDevice[]>,
      safeDefaultId(lib.getDefaultOutputDevice),
      safeDefaultId(lib.getDefaultInputDevice),
    ]);

    const devices: AudioDevice[] = [];
    for (const device of rawDevices) {
      if (device.isOutput) devices.push(toAudioDevice(device, "output", defaultOutputId));
      if (device.isInput) devices.push(toAudioDevice(device, "input", defaultInputId));
    }
    return devices;
  } catch {
    return [];
  }
}

/** Switch the default output device. Returns false on failure. */
export async function setDefaultOutput(deviceId: string): Promise<boolean> {
  try {
    const lib = await import("macos-audio-devices");
    await lib.setDefaultOutputDevice(Number(deviceId));
    return true;
  } catch {
    return false;
  }
}
