import fs from 'node:fs';
import { Agent } from '@mastra/core/agent';
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { MCPClient } from '@mastra/mcp';
import { createWorkdirStore } from 'ph-clint';
import { createMastraHelpers, getMastraPaths } from 'ph-clint/mastra';
import type { AgentContext, AgentProvider, Command, CommandContext, Logger } from 'ph-clint';
import { CLI_NAME, PROJECT_ROOT, type Config } from '../config.js';
import { rupertDevAgentInstructions } from './instructions.js';
import { createDemoAgent } from './demo-agent.js';

const SKILL_NAMES = [
  'document-editor-creation',
  'document-modeling',
  'fusion-development',
  'fusion-project-management',
  'handle-stakeholder-message',
  'playwright-cli',
  'reactor-package-project-management',
];

/**
 * Create the fully configured Rupert dev agent.
 *
 * Used by both the ph-clint CLI and Mastra Dev Studio — same tools,
 * same memory, same workspace, same skills, same config.
 *
 * @param config      Resolved CLI config (with apiKey, model, etc.)
 * @param workdir     Resolved working directory (for mastra paths, workspace)
 * @param projectRoot Root of the example project (where skills/ lives).
 *                    Required because Mastra's bundler breaks import.meta.url paths.
 * @param commands    Commands to convert to Mastra tools. Includes auto-injected
 *                    commands (config, svc) when called from the CLI.
 * @param context     CommandContext for tool execution and MCP discovery.
 */
export async function createAgentRupert(
  config: Config,
  workdir: string,
  projectRoot: string,
  commands: Command[],
  context: CommandContext,
  log?: Logger,
): Promise<Agent> {
  const store = createWorkdirStore(workdir, CLI_NAME);
  const paths = getMastraPaths(store, { prePackagedSkills: SKILL_NAMES });
  fs.mkdirSync(paths.dbFolder, { recursive: true });

  log?.debug('[agent-rupert] workdir:', paths.workspaceBasePath);
  log?.debug('[agent-rupert] rootFolder:', paths.rootFolder);
  log?.debug('[agent-rupert] dbFolder:', paths.dbFolder);
  log?.debug('[agent-rupert] skillPaths:');
  for (const sp of paths.skillPaths) {
    log?.debug(`[agent-rupert]   ${sp}`);
  }
  log?.debug('[agent-rupert] allowedPaths:', paths.allowedPaths);

  const workspace = new Workspace({
    filesystem: new LocalFilesystem({
      basePath: paths.workspaceBasePath,
      allowedPaths: paths.allowedPaths,
    }),
    sandbox: new LocalSandbox({
      workingDirectory: paths.workspaceBasePath,
    }),
    skills: paths.skillPaths,
  });

  const libsqlStore = new LibSQLStore({ id: 'ph-clint-storage', url: `file:${paths.dbPath}` });
  const memory = new Memory({ storage: libsqlStore });

  // Use createMastraHelpers for CLI tools + auto-discovered MCP tools.
  // tools callback is invoked per-turn, so MCP endpoints that appear after
  // agent creation (e.g. vetra-start in interactive mode) are picked up.
  const agentCtx: AgentContext<Config> = {
    workdir,
    config,
    cliName: CLI_NAME,
    cliVersion: '0.1.0',
    context,
    commands,
  };
  const m = createMastraHelpers(agentCtx);

  return new Agent({
    id: 'rupert-dev-agent',
    name: 'Rupert Dev Agent',
    instructions: rupertDevAgentInstructions,
    model: config.apiKey
      ? { id: config.model as `${string}/${string}`, apiKey: config.apiKey }
      : (config.model as `${string}/${string}`),
    tools: async () => {
      log?.debug('[agent-rupert] tools callback invoked');
      const tools = await m.getTools({ MCPClient });
      log?.debug(`[agent-rupert] tools resolved: ${Object.keys(tools).length} tools`);
      return tools;
    },
    workspace,
    memory,
  });
}

/**
 * Agent factory for the ph-clint CLI.
 *
 * Returns a demo agent when no API key is configured, or wraps the full
 * Rupert agent as a ph-clint AgentProvider.
 */
export async function createAgent(ctx: AgentContext<Config>): Promise<AgentProvider> {
  if (!ctx.config.apiKey) return createDemoAgent();

  const { createMastraHelpers } = await import('ph-clint/mastra');
  const m = createMastraHelpers(ctx);
  const agent = await createAgentRupert(ctx.config, ctx.workdir, PROJECT_ROOT, ctx.commands, ctx.context, ctx.context.log);
  return m.wrapAgent(agent, { maxSteps: 80 });
}
