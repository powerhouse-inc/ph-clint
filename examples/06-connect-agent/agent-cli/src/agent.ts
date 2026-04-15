/**
 * Agent factory for the connect-agent CLI.
 *
 * Creates a Mastra agent that reads conversation history from the agent-chat
 * document and writes responses back to it via the bridge.
 */

import type { AgentSetupContext, AgentProvider, StreamChunk, AgentStreamOptions, ReactorContext } from 'ph-clint';
import type { Config } from './config.js';
import { writeStreamToDocument, writeUserMessage } from './bridge.js';
import type { DocumentDispatcher } from './bridge.js';

export const AGENT_ID = 'connect-agent';

const instructions = `You are a helpful AI assistant in a Powerhouse Connect agent chat.

## Behavior
- You are conversational and concise.
- When the user asks questions, provide clear and direct answers.
- You have access to tools provided by the CLI — use them when relevant.
- Keep responses focused and practical.`;

/**
 * Create the agent for the connect-agent CLI.
 *
 * When an API key is configured, creates a full Mastra agent with memory and tools.
 * Otherwise, returns a simple demo echo agent.
 *
 * The returned agent wraps output in a document bridge so all agent output
 * is written to the agent-chat document when a reactor is available.
 */
export async function createAgent(ctx: AgentSetupContext<Config>): Promise<AgentProvider> {
  const inner = await createInnerAgent(ctx);
  return createDocumentBridgedProvider(inner, ctx);
}

/**
 * Create the raw (unwrapped) agent — no document bridging.
 * Used by the trigger to stream responses directly via writeStreamToDocument.
 */
async function createInnerAgent(ctx: AgentSetupContext<Config>): Promise<AgentProvider> {
  if (!ctx.config.apiKey) {
    return createDemoAgent();
  }

  const { createMastraHelpers } = await import('ph-clint/mastra');
  const { Agent } = await import('@mastra/core/agent');
  const m = createMastraHelpers(ctx);

  const mastraAgent = new Agent({
    id: AGENT_ID,
    name: 'Connect Agent',
    instructions,
    model: ctx.config.model,
    tools: await m.getTools(),
    memory: await m.createMemory(),
  });

  return m.wrapAgent(mastraAgent, { maxSteps: 40 });
}

/**
 * Wraps an AgentProvider to also write all stream output to the agent-chat document.
 */
function createDocumentBridgedProvider(
  inner: AgentProvider,
  ctx: AgentSetupContext<Config>,
): AgentProvider {
  return {
    id: inner.id,
    async *stream(prompt: string, opts?: AgentStreamOptions): AsyncGenerator<StreamChunk> {
      const reactor = await ctx.context.reactor?.();
      if (!reactor) {
        // No reactor configured — pass through without document bridge
        yield* inner.stream(prompt, opts);
        return;
      }

      // Ensure we have a document to write to
      const documentId = await ensureChatDocument(reactor, ctx);

      // Ensure stakeholder exists for the CLI user
      await ensureStakeholder(reactor, documentId, 'cli-user', 'CLI User');

      // Ensure agent participant exists
      await ensureAgent(reactor, documentId, AGENT_ID, 'Connect Agent');

      // Write user message to document
      const dispatcher = createDispatcher(reactor);
      await writeUserMessage(dispatcher, documentId, 'cli-user', prompt);

      // Stream agent response, writing chunks to document
      const creators = await import('agent-app/document-models/agent-chat');
      yield* writeStreamToDocument(
        inner.stream(prompt, opts),
        { dispatcher, documentId, agentId: AGENT_ID },
        creators,
      );
    },
  };
}

/**
 * Simple demo agent that echoes input when no API key is configured.
 */
function createDemoAgent(): AgentProvider {
  return {
    id: 'connect-agent-demo',
    async *stream(prompt: string): AsyncGenerator<StreamChunk> {
      yield {
        type: 'text-delta',
        text: `[Demo mode — set CONNECT_AGENT_API_KEY for real LLM responses]\n\nYou said: "${prompt}"\n`,
      };
    },
  };
}

// ── Reactor client helpers ─────────────────────────────────────────

/** Cache the chat document ID across calls. */
let chatDocumentId: string | undefined;

/** Get the cached chat document ID (undefined if no document created yet). */
export function getChatDocumentId(): string | undefined {
  return chatDocumentId;
}

async function ensureChatDocument(
  reactor: ReactorContext,
  ctx: AgentSetupContext<Config>,
): Promise<string> {
  if (chatDocumentId) return chatDocumentId;

  // Try to find an existing agent-chat document among drive children
  const children = await reactor.client.getChildren(reactor.driveId);
  const existing = children?.results?.find?.(
    (d: any) => d.header?.documentType === 'powerhouse/agent-chat',
  );
  if (existing) {
    chatDocumentId = existing.header.id;
    return chatDocumentId!;
  }

  // Create a new agent-chat document and add it to the drive
  const chatDoc = await reactor.client.createEmpty('powerhouse/agent-chat');
  chatDocumentId = chatDoc.header.id;
  await reactor.client.addChildren(reactor.driveId, [chatDocumentId]);

  // Set initial pruneLength
  if (ctx.config.pruneLength) {
    const { setPruneLength } = await import('agent-app/document-models/agent-chat');
    await reactor.client.execute(chatDocumentId, 'main', [
      setPruneLength({ pruneLength: ctx.config.pruneLength }),
    ]);
  }

  return chatDocumentId!;
}

async function ensureStakeholder(
  reactor: ReactorContext,
  documentId: string,
  id: string,
  name: string,
): Promise<void> {
  try {
    const doc = await reactor.client.get(documentId);
    const state = doc?.state?.global ?? doc?.state;
    const exists = state?.stakeholders?.some?.((s: any) => s.id === id);
    if (exists) return;

    const { addStakeholder } = await import('agent-app/document-models/agent-chat');
    await reactor.client.execute(documentId, 'main', [addStakeholder({ id, name })]);
  } catch {
    // Best-effort — may fail if stakeholder already exists
  }
}

async function ensureAgent(
  reactor: ReactorContext,
  documentId: string,
  id: string,
  name: string,
): Promise<void> {
  try {
    const doc = await reactor.client.get(documentId);
    const state = doc?.state?.global ?? doc?.state;
    const exists = state?.agents?.some?.((a: any) => a.id === id);
    if (exists) return;

    const { addAgent } = await import('agent-app/document-models/agent-chat');
    await reactor.client.execute(documentId, 'main', [
      addAgent({ id, name, role: 'AI Assistant', description: 'Powerhouse Connect Agent' }),
    ]);
  } catch {
    // Best-effort — may fail if agent already exists
  }
}

function createDispatcher(reactor: ReactorContext): DocumentDispatcher {
  return {
    async addAction(documentId: string, action: any): Promise<void> {
      await reactor.client.execute(documentId, 'main', [action]);
    },
  };
}
