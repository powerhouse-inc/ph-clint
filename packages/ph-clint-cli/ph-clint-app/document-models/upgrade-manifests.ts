import type { UpgradeManifest } from "document-model";
import { phClintProjectUpgradeManifest } from "./ph-clint-project/upgrades/upgrade-manifest.js";

export const upgradeManifests: UpgradeManifest<readonly number[]>[] = [
  phClintProjectUpgradeManifest,
];
