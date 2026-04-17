/**
 * Agent factory for the connect-agent CLI.
 *
 * Creates a Mastra agent that reads conversation history from the agent-chat
 * document and writes responses back to it via the bridge.
 */

import type { AgentSetupContext, AgentProvider, StreamChunk, AgentStreamOptions, ReactorContext } from 'ph-clint';
import type { Config } from './config.js';
import type { Registry } from './framework.js';
import type { AgentChatAction } from 'agent-app/document-models/agent-chat';
import * as agentChatCreators from 'agent-app/document-models/agent-chat';
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
      // AgentSetupContext doesn't carry the registry generic; cast once at the boundary.
      const reactor = await ctx.context.reactor?.() as ReactorContext<Registry> | undefined;
      if (!reactor) {
        yield* inner.stream(prompt, opts);
        return;
      }

      const documentId = await ensureChatDocument(reactor, ctx);

      await ensureParticipant(reactor, documentId, 'stakeholders', 'cli-user',
        agentChatCreators.addStakeholder({ id: 'cli-user', name: 'CLI User' }));
      await ensureParticipant(reactor, documentId, 'agents', AGENT_ID,
        agentChatCreators.addAgent({ id: AGENT_ID, name: 'Connect Agent', role: 'AI Assistant', description: 'Powerhouse Connect Agent' }));

      const dispatcher = createDispatcher(reactor);
      await writeUserMessage(dispatcher, documentId, 'cli-user', prompt);

      yield* writeStreamToDocument(
        inner.stream(prompt, opts),
        { dispatcher, documentId, agentId: AGENT_ID },
        agentChatCreators,
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

// ── Reactor helpers (exported for trigger use) ───────────────────

/** Cache the chat document ID across calls. */
let chatDocumentId: string | undefined;

async function ensureChatDocument(
  reactor: ReactorContext<Registry>,
  ctx: AgentSetupContext<Config>,
): Promise<string> {
  if (chatDocumentId) return chatDocumentId;

  const docs = await findChatDocuments(reactor);
  if (docs.length > 0) {
    chatDocumentId = docs[0];
    return chatDocumentId!;
  }

  const chatDoc = await reactor.client.createEmpty('powerhouse/agent-chat');
  chatDocumentId = chatDoc.header.id;
  await reactor.client.addChildren(reactor.driveId, [chatDocumentId]);

  if (ctx.config.pruneLength) {
    await reactor.client.execute(chatDocumentId, 'main', [
      agentChatCreators.setPruneLength({ pruneLength: ctx.config.pruneLength }),
    ]);
  }

  return chatDocumentId!;
}

/** Ensure a participant exists in the document's collection before dispatching. */
export async function ensureParticipant(
  reactor: ReactorContext<Registry>,
  documentId: string,
  collection: 'stakeholders' | 'agents',
  id: string,
  action: AgentChatAction,
): Promise<void> {
  try {
    const doc = await reactor.client.get(documentId);
    const state = doc.state.global;
    if (state[collection]?.some((p) => p.id === id)) return;
    await reactor.client.execute(documentId, 'main', [action]);
  } catch (err) {
    console.warn(`[agent] Failed to ensure ${collection} entry "${id}":`, err);
  }
}

/** Find all agent-chat document IDs in a drive. */
export async function findChatDocuments(
  reactor: ReactorContext<Registry>,
): Promise<string[]> {
  try {
    const children = await reactor.client.getChildren(reactor.driveId);
    return (children?.results ?? [])
      .filter((d) => d.header?.documentType === 'powerhouse/agent-chat')
      .map((d) => d.header.id);
  } catch {
    return [];
  }
}

/** Create a DocumentDispatcher that dispatches actions via the reactor client. */
export function createDispatcher(reactor: ReactorContext<Registry>): DocumentDispatcher {
  return {
    async addAction(documentId: string, action: AgentChatAction): Promise<void> {
      await reactor.client.execute(documentId, 'main', [action]);
    },
  };
}
