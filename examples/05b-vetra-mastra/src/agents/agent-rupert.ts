import fs from 'node:fs';
import { Agent } from '@mastra/core/agent';
import { Workspace, LocalFilesystem } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { createWorkdirStore } from 'ph-clint';
import { getMastraPaths, commandsToMastraTools } from 'ph-clint/mastra';
import type { AgentContext, AgentProvider, Command } from 'ph-clint';
import { CLI_NAME, PROJECT_ROOT, type Config } from '../config.js';
import { rupertDevAgentInstructions } from './instructions.js';
import { createDemoAgent } from './demo-agent.js';

const SKILL_NAMES = [
  'document-editor-creation',
  'document-modeling',
  'fusion-development',
  'fusion-project-management',
  'handle-stakeholder-message',
  'project-management',
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
 */
export async function createAgentRupert(
  config: Config,
  workdir: string,
  projectRoot: string,
  commands: Command[],
): Promise<Agent> {
  const store = createWorkdirStore(workdir, CLI_NAME);
  const paths = getMastraPaths(store, { prePackagedSkills: SKILL_NAMES });
  fs.mkdirSync(paths.dbFolder, { recursive: true });

  // Debug: show the new path structure
  console.log('[agent-rupert] workdir:', paths.workspaceBasePath);
  console.log('[agent-rupert] rootFolder:', paths.rootFolder);
  console.log('[agent-rupert] dbFolder:', paths.dbFolder);
  console.log('[agent-rupert] skillPaths:');
  for (const sp of paths.skillPaths) {
    console.log(`[agent-rupert]   ${sp}`);
  }
  console.log('[agent-rupert] allowedPaths:', paths.allowedPaths);

  const workspace = new Workspace({
    filesystem: new LocalFilesystem({
      basePath: paths.workspaceBasePath,
      allowedPaths: paths.allowedPaths,
    }),
    skills: paths.skillPaths,
  });

  const libsqlStore = new LibSQLStore({ id: 'ph-clint-storage', url: `file:${paths.dbPath}` });
  const memory = new Memory({ storage: libsqlStore });

  const commandContext = { workdir, workspace: store, config, stdout: console.log };
  const cliTools = await commandsToMastraTools(commands, commandContext);

  return new Agent({
    id: 'rupert-dev-agent',
    name: 'Rupert Dev Agent',
    instructions: rupertDevAgentInstructions,
    model: config.apiKey
      ? { id: config.model as `${string}/${string}`, apiKey: config.apiKey }
      : (config.model as `${string}/${string}`),
    tools: cliTools,
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
  const agent = await createAgentRupert(ctx.config, ctx.workdir, PROJECT_ROOT, ctx.commands);
  return m.wrapAgent(agent);
}
