import type { UpgradeManifest } from "document-model";
import { agentInboxUpgradeManifest } from "./agent-inbox/upgrades/upgrade-manifest.js";
import { agentProjectsUpgradeManifest } from "./agent-projects/upgrades/upgrade-manifest.js";
import { claudeChatUpgradeManifest } from "./claude-chat/upgrades/upgrade-manifest.js";

export const upgradeManifests: UpgradeManifest<readonly number[]>[] = [
  agentInboxUpgradeManifest,
  agentProjectsUpgradeManifest,
  claudeChatUpgradeManifest,
];
