import { mkdirSync } from 'node:fs';
import type { AgentContext, AgentProvider, StreamChunk } from '../../core/types.js';
import { createWorkdirStore } from '../../core/store.js';
import { mapMastraStream } from './stream.js';
import { commandsToMastraTools } from './tools.js';
import { getMastraPaths } from './paths.js';
import type { MastraHelpers } from './types.js';

export type { MastraHelpers } from './types.js';
export type { MastraPaths, MastraPathOptions } from './paths.js';
export { getMastraPaths } from './paths.js';
export { mapMastraStream } from './stream.js';
export { commandsToMastraTools } from './tools.js';

/**
 * Create convenience helpers for building Mastra agents.
 *
 * All Mastra imports happen lazily inside the helper functions,
 * so the ph-clint library works without Mastra installed.
 *
 * Usage (inside an agent factory callback):
 * ```ts
 * agent: {
 *   default: async (ctx) => {
 *     const { createMastraHelpers } = await import('ph-clint/mastra');
 *     const m = createMastraHelpers(ctx);
 *     const { Agent } = await import('@mastra/core/agent');
 *     return m.wrapAgent(new Agent({ ... }));
 *   }
 * }
 * ```
 */
export function createMastraHelpers(ctx: AgentContext): MastraHelpers {
  const store = createWorkdirStore(ctx.workdir, ctx.cliName);
  const paths = getMastraPaths(store);
  const commandContext = { workdir: ctx.workdir, workspace: store, config: ctx.config, stdout: console.log };

  return {
    async getTools() {
      return commandsToMastraTools(ctx.commands, commandContext);
    },

    async createWorkspace() {
      const { Workspace: MastraWorkspace, LocalFilesystem } = await import('@mastra/core/workspace');
      return new MastraWorkspace({
        filesystem: new LocalFilesystem({
          basePath: paths.workspaceBasePath,
        }),
      });
    },

    async createMemory() {
      const { Memory } = await import('@mastra/memory');
      const { LibSQLStore } = await import('@mastra/libsql');

      // Ensure database directory exists
      mkdirSync(paths.dbFolder, { recursive: true });

      const libsqlStore = new LibSQLStore({ id: 'ph-clint-storage', url: `file:${paths.dbPath}` });
      return new Memory({ storage: libsqlStore });
    },

    wrapAgent(agent: any): AgentProvider {
      return {
        id: agent.id ?? 'default',
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
    },
  };
}
