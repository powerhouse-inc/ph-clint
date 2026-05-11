import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { AgentSetupContext, AgentProvider, AgentPromptInput, StreamChunk } from '../../core/types.js';
import { createWorkdirStore } from '../../core/store.js';
import { mapMastraStream } from './stream.js';
import { commandsToMastraTools } from './tools.js';
import { getMastraPaths } from './paths.js';
import { discoverMcpTools, disconnectAllMcp } from './mcp.js';
import { MarkdownConversationLogger, loggedStream } from './logging.js';
import { createInstrumentedStream } from './instrumented-stream.js';
import type { GetToolsOptions, MastraHelpers, WrapAgentOptions } from './types.js';

export type { MastraHelpers, GetToolsOptions, WrapAgentOptions } from './types.js';
export type { MastraPaths, MastraPathOptions } from './paths.js';
export type { IConversationLogger, ConversationLoggerOptions } from './logging.js';
export { getMastraPaths } from './paths.js';
export { mapMastraStream } from './stream.js';
export { commandsToMastraTools } from './tools.js';
export { discoverMcpTools, disconnectAllMcp } from './mcp.js';
export { MarkdownConversationLogger, loggedStream } from './logging.js';

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
export function createMastraHelpers(ctx: AgentSetupContext): MastraHelpers {
  const store = createWorkdirStore(ctx.workdir, ctx.cliName);
  const paths = getMastraPaths(store);

  return {
    async getTools(options?: GetToolsOptions) {
      const log = ctx.context.log;
      // Use the full runtime CommandContext (ctx.context) — it has services, processes,
      // routine, emit, log attached. Building a new context from raw fields loses those.
      const cliTools = await commandsToMastraTools(ctx.commands, ctx.context);

      if (options?.includeMcp === false) return cliTools;

      const services = ctx.context.services;
      if (!services) {
        log?.debug('[getTools] No services on context — skipping MCP discovery');
        return cliTools;
      }

      log?.debug('[getTools] Discovering MCP tools from services...');
      const mcpTools = await discoverMcpTools(services, log, options?.MCPClient);
      log?.debug(`[getTools] CLI tools: ${Object.keys(cliTools).length}, MCP tools: ${Object.keys(mcpTools).length}`);
      return { ...cliTools, ...mcpTools };
    },

    getAgentInstructions(agentId: string): string {
      const prompts = ctx.prompts;
      if (!prompts) {
        throw new Error(`getAgentInstructions('${agentId}'): no prompts config on AgentSetupContext`);
      }
      const agentConfig = prompts.agents?.[agentId];
      if (!agentConfig) {
        throw new Error(`getAgentInstructions('${agentId}'): agent ID not found in prompts.agents`);
      }

      // agent-profiles/ is a sibling of the skill artifact directory
      for (const artifact of prompts.artifacts) {
        const profileDir = path.join(path.dirname(artifact), 'agent-profiles');
        const profilePath = path.join(profileDir, `${agentConfig.name}.md`);
        if (existsSync(profilePath)) {
          return readFileSync(profilePath, 'utf-8');
        }
      }

      throw new Error(
        `getAgentInstructions('${agentId}'): profile file '${agentConfig.name}.md' not found in agent-profiles/ sibling of any artifact directory`,
      );
    },

    async createWorkspace() {
      const { Workspace: MastraWorkspace, LocalFilesystem, LocalSandbox } = await import('@mastra/core/workspace');
      const skillNames = ctx.skills.map(s => s.name);
      const fullPaths = getMastraPaths(store, { prePackagedSkills: skillNames });
      return new MastraWorkspace({
        filesystem: new LocalFilesystem({
          basePath: fullPaths.workspaceBasePath,
          allowedPaths: fullPaths.allowedPaths,
        }),
        sandbox: new LocalSandbox({
          workingDirectory: fullPaths.workspaceBasePath,
        }),
        skills: fullPaths.skillPaths,
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

    wrapAgent(agent: any, options?: WrapAgentOptions): AgentProvider {
      const maxSteps = options?.maxSteps ?? 30;
      const agentId = agent.id ?? 'default';
      const agentName = agent.name ?? agentId;

      // Build providerOptions for Anthropic caching
      let providerOptions: Record<string, unknown> | undefined;
      if (options?.cacheControl) {
        const cc = options.cacheControl === true
          ? { type: 'ephemeral' as const }
          : { type: 'ephemeral' as const, ...(options.cacheControl.ttl ? { ttl: options.cacheControl.ttl } : {}) };
        providerOptions = { anthropic: { cacheControl: cc } };
      }

      // Create logger if enabled
      const logger = options?.enableLogging && options.logDirectory
        ? new MarkdownConversationLogger({ directory: options.logDirectory })
        : undefined;

      const rawStream = async function*(prompt: AgentPromptInput, opts?: Parameters<AgentProvider['stream']>[1]): AsyncGenerator<StreamChunk> {
        const streamOpts: Record<string, unknown> = { maxSteps };
        if (providerOptions) streamOpts.providerOptions = providerOptions;

        if (opts?.threadId) {
          streamOpts.memory = {
            thread: opts.threadId,
            resource: 'cli-user',
          };
        }

        // Pass abort signal through to Mastra agent
        if (opts?.abortSignal) {
          streamOpts.abortSignal = opts.abortSignal;
        }

        const sessionId = opts?.threadId ?? agentId;

        // Build the message input for Mastra. When prompt is an array of
        // content parts (text + images), construct a UserModelMessage so the
        // model receives the images natively via the AI SDK vision format.
        let mastraInput: unknown;
        if (typeof prompt === 'string') {
          mastraInput = prompt;
        } else {
          mastraInput = {
            role: 'user' as const,
            content: prompt.map((part) => {
              if (part.type === 'text') return { type: 'text' as const, text: part.text };
              return { type: 'image' as const, image: part.image, mediaType: part.mediaType };
            }),
          };
        }

        if (logger) {
          // Resolve instructions from the Mastra Agent if available
          let instructions: string | undefined;
          try {
            instructions = typeof agent.getInstructions === 'function'
              ? await agent.getInstructions()
              : agent.instructions;
          } catch { /* ignore — instructions are optional */ }
          if (typeof instructions !== 'string') instructions = undefined;

          logger.startSession(sessionId, agentId, agentName, instructions);
          const logText = typeof prompt === 'string'
            ? prompt
            : prompt.filter(p => p.type === 'text').map(p => (p as { text: string }).text).join('\n');
          logger.logUserMessage(sessionId, logText);
        }

        const streamResult = await agent.stream(mastraInput, streamOpts);

        const innerStream = mapMastraStream(streamResult.fullStream as any);

        try {
          if (logger) {
            yield* loggedStream(innerStream, logger, sessionId);
          } else {
            yield* innerStream;
          }
        } catch (err) {
          const isAbort = err instanceof Error && err.name === 'AbortError';
          if (isAbort) {
            // Log abort in markdown logger
            if (logger) {
              logger.logError(sessionId, 'Stream aborted by user');
            }
            return; // Clean exit — not an error
          }
          if (logger) {
            logger.logError(sessionId, err instanceof Error ? err.message : String(err));
          }
          throw err;
        }
      };

      const stream = createInstrumentedStream(rawStream, {
        metrics: ctx.observability.metrics,
        attrs: { agentId },
      });

      return {
        id: agentId,
        name: agentName,
        description: options?.description,
        image: options?.image,
        mastraAgent: agent,
        stream,
      };
    },
  };
}
