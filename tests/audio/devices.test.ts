import { beforeEach, describe, expect, it, vi } from "vitest";

const lib = vi.hoisted(() => ({
  getAllDevices: vi.fn(),
  getDefaultOutputDevice: vi.fn(),
  getDefaultInputDevice: vi.fn(),
  setDefaultOutputDevice: vi.fn(),
}));
vi.mock("macos-audio-devices", () => lib);
import { getDevices, setDefaultOutput } from "../../src/audio/devices";

beforeEach(() => Object.values(lib).forEach((f) => f.mockReset()));

describe("getDevices", () => {
  it("maps devices with wireless + default flags", async () => {
    lib.getAllDevices.mockResolvedValue([
      { id: 1, name: "MacBook Speakers", isInput: false, isOutput: true, transportType: "builtin", volume: 0.5 },
      { id: 2, name: "AirPods Pro", isInput: true, isOutput: true, transportType: "bluetooth" },
    ]);
    lib.getDefaultOutputDevice.mockResolvedValue({ id: 2 });
    lib.getDefaultInputDevice.mockResolvedValue({ id: 2 });
    const devices = await getDevices();
    const airpodsOut = devices.find((d) => d.id === "2" && d.kind === "output")!;
    expect(airpodsOut).toMatchObject({ name: "AirPods Pro", isWireless: true, isDefault: true });
    expect(devices.find((d) => d.id === "1")).toMatchObject({ isWireless: false, isDefault: false, volume: 0.5 });
    // device 2 is both input and output → two entries
    expect(devices.filter((d) => d.id === "2")).toHaveLength(2);
  });
  it("empty array on library failure", async () => {
    lib.getAllDevices.mockRejectedValue(new Error("boom"));
    expect(await getDevices()).toEqual([]);
  });
});

describe("setDefaultOutput", () => {
  it("delegates to library", async () => {
    lib.setDefaultOutputDevice.mockResolvedValue(undefined);
    expect(await setDefaultOutput("2")).toBe(true);
    expect(lib.setDefaultOutputDevice).toHaveBeenCalledWith(2);
  });
  it("false on error", async () => {
    lib.setDefaultOutputDevice.mockRejectedValue(new Error("no"));
    expect(await setDefaultOutput("2")).toBe(false);
  });
});
