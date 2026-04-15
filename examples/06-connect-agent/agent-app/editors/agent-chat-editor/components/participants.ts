import type { AgentInfo, Stakeholder } from "document-models/agent-chat";

export interface ParticipantInfo {
  id: string;
  name: string;
  avatar: string;
  isAgent: boolean;
  removed: boolean;
}

function avatarFallback(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

/** Resolve a single participant by ID */
export function getParticipantInfo(
  id: string,
  agents: AgentInfo[],
  stakeholders: Stakeholder[],
): ParticipantInfo {
  const agent = agents.find((a) => a.id === id);
  if (agent) {
    const name = agent.name || "Agent";
    return {
      id: agent.id,
      name,
      avatar: agent.avatar || avatarFallback(name),
      isAgent: true,
      removed: agent.removed,
    };
  }
  const stakeholder = stakeholders.find((s) => s.id === id);
  if (stakeholder) {
    return {
      id: stakeholder.id,
      name: stakeholder.name,
      avatar: stakeholder.avatar || avatarFallback(stakeholder.name),
      isAgent: false,
      removed: stakeholder.removed,
    };
  }
  return {
    id,
    name: id,
    avatar: avatarFallback(id),
    isAgent: false,
    removed: false,
  };
}

/** All active (non-removed) participants, agents first */
export function getActiveParticipants(
  agents: AgentInfo[],
  stakeholders: Stakeholder[],
): ParticipantInfo[] {
  const result: ParticipantInfo[] = [];
  for (const agent of agents) {
    if (!agent.removed) {
      const name = agent.name || "Agent";
      result.push({
        id: agent.id,
        name,
        avatar: agent.avatar || avatarFallback(name),
        isAgent: true,
        removed: false,
      });
    }
  }
  for (const stakeholder of stakeholders) {
    if (!stakeholder.removed) {
      result.push({
        id: stakeholder.id,
        name: stakeholder.name,
        avatar: stakeholder.avatar || avatarFallback(stakeholder.name),
        isAgent: false,
        removed: false,
      });
    }
  }
  return result;
}
