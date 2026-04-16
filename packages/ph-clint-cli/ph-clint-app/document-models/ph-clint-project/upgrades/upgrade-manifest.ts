import type { UpgradeManifest } from "document-model";
import { latestVersion, supportedVersions } from "./versions.js";

export const phClintProjectUpgradeManifest: UpgradeManifest<
  typeof supportedVersions
> = {
  documentType: "powerhouse/ph-clint-project",
  latestVersion,
  supportedVersions,
  upgrades: {},
};
