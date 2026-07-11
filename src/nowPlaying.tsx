import { MenuBarExtra, Icon } from "@raycast/api";

export default function Command() {
  return (
    <MenuBarExtra icon={Icon.Music} tooltip="MediaFlow">
      <MenuBarExtra.Item title="Loading…" />
    </MenuBarExtra>
  );
}
