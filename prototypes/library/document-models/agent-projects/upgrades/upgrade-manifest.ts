import type { UpgradeManifest } from "document-model";
import { latestVersion, supportedVersions } from "./versions.js";

export const agentProjectsUpgradeManifest: UpgradeManifest<
  typeof supportedVersions
> = {
  documentType: "powerhouse/agent-projects",
  latestVersion,
  supportedVersions,
  upgrades: {},
};
