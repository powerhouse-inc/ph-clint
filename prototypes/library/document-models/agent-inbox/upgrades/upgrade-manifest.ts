import type { UpgradeManifest } from "document-model";
import { latestVersion, supportedVersions } from "./versions.js";

export const agentInboxUpgradeManifest: UpgradeManifest<
  typeof supportedVersions
> = {
  documentType: "powerhouse/agent-inbox",
  latestVersion,
  supportedVersions,
  upgrades: {},
};
