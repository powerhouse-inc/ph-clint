import type { UpgradeManifest } from "document-model";
import { agentChatUpgradeManifest } from "./agent-chat/upgrades/upgrade-manifest.js";

export const upgradeManifests: UpgradeManifest<readonly number[]>[] = [
  agentChatUpgradeManifest,
];
