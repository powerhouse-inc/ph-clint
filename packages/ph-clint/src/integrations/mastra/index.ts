import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Integration, AgentProvider, StreamChunk } from '../../core/types.js';
import { createWorkspace } from '../../core/workspace.js';
import { mapMastraStream } from './stream.js';
import { commandsToMastraTools } from './tools.js';
import { getMastraWorkspacePaths } from './paths.js';
import type { MastraIntegrationOptions } from './types.js';

export type { MastraIntegrationOptions, MastraAgentConfig } from './types.js';
export { getMastraWorkspacePaths } from './paths.js';
export { mapMastraStream } from './stream.js';
export { commandsToMastraTools } from './tools.js';

/**
 * Create a Mastra-backed integration for use with defineCli().
 *
 * Requires @mastra/core, @mastra/memory, and @mastra/libsql to be installed.
 * Uses dynamic imports so the library works without them for non-Mastra CLIs.
 *
 * Each agent gets:
 * - ph-clint commands exposed as callable Mastra tools
 * - A Mastra Workspace with LocalFilesystem (when workspacePath is provided)
 * - Persistent conversation memory via LibSQL (when workspacePath is provided)
 * - Automatic workspace file tools (read_file, write_file, list_files, etc.)
 */
export async function defineMastraIntegration(
  options: MastraIntegrationOptions,
): Promise<Integration> {
  // Dynamic imports — fail early with a clear message if missing
  const { Agent } = await import('@mastra/core/agent');
  const { Workspace: MastraWorkspace, LocalFilesystem } = await import('@mastra/core/workspace');
  const { Memory } = await import('@mastra/memory');
  const { LibSQLStore } = await import('@mastra/libsql');

  // Set up workspace and memory if a workspace path is configured
  let mastraWorkspace: InstanceType<typeof MastraWorkspace> | undefined;
  let memory: InstanceType<typeof Memory> | undefined;
  const workspacePath = options.workspacePath;

  if (workspacePath) {
    const paths = getMastraWorkspacePaths(workspacePath);

    // Ensure database directory exists
    mkdirSync(dirname(paths.dbPath), { recursive: true });

    const store = new LibSQLStore({ id: 'ph-clint-storage', url: `file:${paths.dbPath}` });
    memory = new Memory({ storage: store });

    mastraWorkspace = new MastraWorkspace({
      filesystem: new LocalFilesystem({
        basePath: workspacePath,
      }),
    });
  }

  // Create a ph-clint workspace for command context
  const cliWorkspace = createWorkspace(workspacePath ?? '');

  // Convert commands to Mastra tools
  const context = { workspace: cliWorkspace, config: {} };
  const mastraTools = options.commands
    ? await commandsToMastraTools(options.commands, context)
    : {};

  // Create agent providers
  const agents: AgentProvider[] = options.agents.map((agentConfig) => {
    const model = agentConfig.model ?? 'anthropic/claude-haiku-4-5';

    const agentOpts: Record<string, unknown> = {
      id: agentConfig.id,
      name: agentConfig.name ?? agentConfig.id,
      instructions: agentConfig.instructions,
      model,
      tools: mastraTools,
    };

    if (memory) agentOpts.memory = memory;
    if (mastraWorkspace) agentOpts.workspace = mastraWorkspace;

    const agent = new Agent(agentOpts as any);

    const provider: AgentProvider = {
      id: agentConfig.id,
      async *stream(prompt: string, opts?) {
        const streamOpts: Record<string, unknown> = { maxSteps: 10 };

        if (opts?.threadId) {
          streamOpts.memory = {
            thread: opts.threadId,
            resource: 'cli-user',
          };
        }

        const streamResult = await agent.stream(prompt, streamOpts);
        yield* mapMastraStream(streamResult.fullStream as any);
      },
    };
    return provider;
  });

  return {
    id: 'mastra',
    agents,
  };
}
