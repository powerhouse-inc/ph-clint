/**
 * Mastra instance for Mastra Dev Studio.
 *
 * This file is the entry point for `mastra dev` — it runs outside the ph-clint
 * CLI lifecycle, so it resolves config/workdir/paths independently. The CLI
 * object is imported only to get the canonical command list (which includes
 * auto-injected commands like config and svc).
 */
import fs from 'node:fs';
import { resolveWorkdir, resolveConfig, createWorkdirStore } from 'ph-clint';
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

// Use the CLI as single source of truth for commands (includes auto-injected config + svc)
const commands = cli.listCommands();

const rupertAgent = await createAgentRupert(config, workdir, PROJECT_ROOT, commands);

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
