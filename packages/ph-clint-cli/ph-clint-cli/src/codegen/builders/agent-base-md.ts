/**
 * Builds `prompts/agent-profiles/AgentBase.md` — the minimal base profile.
 */
import {
  type ClintProjectSpec,
  getPackageName,
} from '../../spec/types.js';

export function buildAgentBaseMd(spec: ClintProjectSpec): string {
  return [
    '# Agent Base System Prompt',
    '',
    `You are {{agentName}}, an agent available through the ${getPackageName(spec)} CLI.`,
    '',
    '## Capabilities',
    '',
    'This base profile is a minimal placeholder. Extend it with project-specific',
    "context, workflows, and domain knowledge. Additional sections listed in the",
    "agent's `sections` array are concatenated after this file at build time.",
    '',
  ].join('\n');
}
