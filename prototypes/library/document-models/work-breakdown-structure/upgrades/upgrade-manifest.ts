import type { UpgradeManifest } from "document-model";
import { latestVersion, supportedVersions } from "./versions.js";

export const workBreakdownStructureUpgradeManifest: UpgradeManifest<
  typeof supportedVersions
> = {
  documentType: "powerhouse/work-breakdown-structure",
  latestVersion,
  supportedVersions,
  upgrades: {},
};
