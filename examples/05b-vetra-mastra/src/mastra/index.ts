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
import { resolveWorkdir, resolveConfig, createWorkdirStore, installSkills } from 'ph-clint';
import { getMastraPaths } from 'ph-clint/mastra';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { CLI_NAME, PROJECT_ROOT, configSchema, type Config } from '../config.js';
import { cli } from '../cli.js';
import { createAgentRupert } from '../agents/agent-rupert.js';

// ── Resolve runtime context (Mastra Studio runs outside CLI lifecycle) ──

const workdir = resolveWorkdir({ fallback: PROJECT_ROOT });
const config = resolveConfig({ configSchema, cliName: CLI_NAME, workdir }) as Config;
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

// Install pre-packaged skills into .ph/{cliName}/.mastra/skills/
// Under `mastra dev`, PROJECT_ROOT resolves to .mastra/ (bundler output).
// The actual project root with skills/ is its parent.
const actualRoot = path.basename(PROJECT_ROOT) === '.mastra'
  ? path.dirname(PROJECT_ROOT)
  : PROJECT_ROOT;
installSkills({
  store,
  skillSources: [
    path.join(actualRoot, 'skills'),
    path.join(actualRoot, 'dist', 'skills'),
  ],
});

// Use the CLI as single source of truth for commands (includes auto-injected config + svc)
const commands = cli.listCommands();

// Build a minimal CommandContext for Mastra Studio (no services — runs outside CLI lifecycle)
const studioContext = { workdir, workspace: store, config, stdout: console.log };

const rupertAgent = await createAgentRupert(config, workdir, PROJECT_ROOT, commands, studioContext, []);

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
