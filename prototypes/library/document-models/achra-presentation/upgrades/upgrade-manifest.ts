import type { UpgradeManifest } from "document-model";
import { latestVersion, supportedVersions } from "./versions.js";

export const achraPresentationUpgradeManifest: UpgradeManifest<
  typeof supportedVersions
> = {
  documentType: "achra/presentation",
  latestVersion,
  supportedVersions,
  upgrades: {},
};
