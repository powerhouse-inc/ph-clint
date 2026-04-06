import type { UpgradeManifest } from "document-model";
import { latestVersion, supportedVersions } from "./versions.js";

export const claudeChatUpgradeManifest: UpgradeManifest<
  typeof supportedVersions
> = {
  documentType: "powerhouse/claude-chat",
  latestVersion,
  supportedVersions,
  upgrades: {},
};
