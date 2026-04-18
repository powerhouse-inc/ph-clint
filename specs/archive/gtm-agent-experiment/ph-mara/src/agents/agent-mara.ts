import fs from 'node:fs';
import path from 'node:path';
import { Agent } from '@mastra/core/agent';
import { Workspace, LocalFilesystem, LocalSandbox } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { createWorkdirStore } from 'ph-clint';
import { createMastraHelpers, getMastraPaths } from 'ph-clint/mastra';
import type { AgentContext, AgentProvider, Command, CommandContext, Logger } from 'ph-clint';
import type { WrapAgentOptions } from 'ph-clint/mastra';
import type { SkillInfo } from 'ph-clint';
import { CLI_NAME, PROJECT_ROOT, type Config } from '../config.js';
import { createDemoAgent } from './demo-agent.js';

const projectRoot = path.basename(PROJECT_ROOT) === '.mastra'
  ? path.dirname(PROJECT_ROOT)
  : PROJECT_ROOT;

function loadInstructions(profileName: string): string {
  return fs.readFileSync(
    path.join(projectRoot, 'gen', 'agent-profiles', `${profileName}.md`), 'utf-8',
  );
}

/**
 * Create the fully configured Mara GTM strategist agent.
 */
export async function createAgentMara(
  config: Config,
  workdir: string,
  projectRoot: string,
  commands: Command[],
  context: CommandContext,
  skills: SkillInfo[],
  log?: Logger,
): Promise<Agent> {
  const store = createWorkdirStore(workdir, CLI_NAME);
  const skillNames = skills.map(s => s.name);
  const paths = getMastraPaths(store, { prePackagedSkills: skillNames });
  fs.mkdirSync(paths.dbFolder, { recursive: true });

  log?.debug('[agent-mara] workdir:', paths.workspaceBasePath);
  log?.debug('[agent-mara] rootFolder:', paths.rootFolder);
  log?.debug('[agent-mara] dbFolder:', paths.dbFolder);

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

  const agentCtx: AgentContext<Config> = {
    workdir,
    config,
    cliName: CLI_NAME,
    cliVersion: '0.1.0',
    context,
    commands,
    skills,
  };
  const m = createMastraHelpers(agentCtx);

  return new Agent({
    id: 'gtm-strategist',
    name: 'GTM Strategist',
    instructions: loadInstructions('GTMStrategist'),
    model: config.apiKey
      ? { id: config.model as `${string}/${string}`, apiKey: config.apiKey }
      : (config.model as `${string}/${string}`),
    tools: async () => {
      log?.debug('[agent-mara] tools callback invoked');
      const tools = await m.getTools();
      log?.debug(`[agent-mara] tools resolved: ${Object.keys(tools).length} tools`);
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
 * Mara agent as a ph-clint AgentProvider.
 */
export async function createAgent(ctx: AgentContext<Config>): Promise<AgentProvider> {
  if (!ctx.config.apiKey) return createDemoAgent();

  const { createMastraHelpers } = await import('ph-clint/mastra');
  const m = createMastraHelpers(ctx);
  const agent = await createAgentMara(ctx.config, ctx.workdir, PROJECT_ROOT, ctx.commands, ctx.context, ctx.skills, ctx.context.log);

  const store = createWorkdirStore(ctx.workdir, CLI_NAME);
  const wrapOpts: WrapAgentOptions = {
    maxSteps: 50,
    enableLogging: ctx.config.agentLogging,
    logDirectory: store.getStoreFolder('logs'),
  };
  return m.wrapAgent(agent, wrapOpts);
}
