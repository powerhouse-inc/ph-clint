/**
 * Mastra instance for Mastra Dev Studio.
 *
 * This file is the entry point for `mastra dev` — it runs outside the ph-clint
 * CLI lifecycle, so it resolves config/workdir/paths independently. The CLI
 * object is imported only to get the canonical command list (which includes
 * auto-injected commands like config and svc).
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolveWorkdir, resolveConfig, createWorkdirStore, installSkills, readSkills } from '@powerhousedao/ph-clint';
import type { AgentSetupContext } from '@powerhousedao/ph-clint';
import { createMastraHelpers, getMastraPaths } from '@powerhousedao/ph-clint/mastra';
import { Mastra } from '@mastra/core/mastra';
import { Agent } from '@mastra/core/agent';
import { MCPClient } from '@mastra/mcp';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { CLI_NAME, CLI_ROOT } from '../config.js';
import { configSchema, secretsSchema, type Config } from '../framework.js';
import { cli } from '../cli.js';

// ── Resolve runtime context (Mastra Studio runs outside CLI lifecycle) ──

const workdir = resolveWorkdir({ fallback: CLI_ROOT });
const config = resolveConfig({ configSchema: configSchema.extend(secretsSchema.shape), cliName: CLI_NAME, workdir }) as Config;
const store = createWorkdirStore(workdir, CLI_NAME);
const paths = getMastraPaths(store);

// Debug: show resolved path structure
console.log('[mastra] workdir:', paths.workspaceBasePath);
console.log('[mastra] rootFolder:', paths.rootFolder);
console.log('[mastra] dbFolder:', paths.dbFolder);
console.log('[mastra] dbPath:', paths.dbPath);

// Workaround: Mastra Dev Studio has two independent code paths for API keys.
//
// 1. Agent LLM calls — use the `apiKey` passed programmatically to Agent() via
//    the model config object `{ id, apiKey }`. This works fine.
//
// 2. Studio UI provider detection — the GET /agents/providers route calls
//    isProviderConnected() (@mastra/server), which checks process.env directly:
//      `process.env[provider.apiKeyEnvVar]`  (ANTHROPIC_API_KEY for Anthropic)
//    This ignores any key passed to the Agent constructor.
//
// Without this bridge, Studio shows "Set ANTHROPIC_API_KEY to use this provider"
// even though the agent can make LLM calls just fine. We write the ph-clint
// resolved key into process.env so Studio's detection picks it up. The guard
// preserves an explicitly set env var.
if (config.apiKey && !process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = config.apiKey;
}

fs.mkdirSync(paths.dbFolder, { recursive: true });

// Under `mastra dev`, CLI_ROOT resolves to .mastra/ (bundler output).
// The actual project root with gen/ is its parent.
const actualRoot = path.basename(CLI_ROOT) === '.mastra'
  ? path.dirname(CLI_ROOT)
  : CLI_ROOT;

const skillArtifacts = [
  path.join(actualRoot, 'gen', 'skills'),
  path.join(actualRoot, 'dist', 'gen', 'skills'),
];

// Install pre-packaged skills into .ph/{cliName}/.mastra/skills/
installSkills({ store, skillArtifacts });

// Read skills from generated output
const skills = readSkills(skillArtifacts);

// Use the CLI as single source of truth for commands (includes auto-injected config + svc)
const commands = cli.listCommands();

// Build a minimal CommandContext for Mastra Studio (no services — runs outside CLI lifecycle)
const studioContext = { workdir, workspace: store, config, stdout: console.log };

// Build AgentSetupContext for createMastraHelpers
const agentCtx: AgentSetupContext<Config> = {
  workdir,
  config,
  cliName: CLI_NAME,
  cliVersion: '0.1.0',
  context: studioContext as any,
  commands,
  skills,
  prompts: {
    artifacts: skillArtifacts,
    agents: {
      'rupert-dev-agent': {
        name: 'RupertDevAgent',
        sections: ['AgentBase.md', 'ReactorPackageDevAgent.md'],
        skills: ['document-modeling', 'document-editor-creation', 'fusion-development', 'fusion-project-management', 'playwright-cli', 'reactor-project-management'],
      },
    },
  },
};

const m = createMastraHelpers(agentCtx);

const rupertAgent = new Agent({
  id: 'rupert-dev-agent',
  name: 'Rupert Dev Agent',
  instructions: m.getAgentInstructions('rupert-dev-agent'),
  model: config.apiKey
    ? { id: config.model as `${string}/${string}`, apiKey: config.apiKey }
    : (config.model as `${string}/${string}`),
  tools: async () => m.getTools({ MCPClient }),
  workspace: await m.createWorkspace(),
  memory: await m.createMemory(),
});

export const mastra = new Mastra({
  agents: { rupertAgent },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: `file:${paths.dbPath}`,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
