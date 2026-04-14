/**
 * Agent factory for the connect-agent CLI.
 *
 * Creates a Mastra agent that reads conversation history from the agent-chat
 * document and writes responses back to it via the bridge.
 */

import type { AgentContext, AgentProvider, StreamChunk, AgentStreamOptions, PowerhouseContext } from 'ph-clint';
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
 */
export async function createAgent(ctx: AgentContext<Config>): Promise<AgentProvider> {
  if (!ctx.config.apiKey) {
    return createDemoAgent(ctx);
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

  const wrapped = m.wrapAgent(mastraAgent, { maxSteps: 40 });

  // Return a provider that bridges to the document
  return createDocumentBridgedProvider(wrapped, ctx);
}

/**
 * Wraps an AgentProvider to also write all stream output to the agent-chat document.
 */
function createDocumentBridgedProvider(
  inner: AgentProvider,
  ctx: AgentContext<Config>,
): AgentProvider {
  return {
    id: inner.id,
    async *stream(prompt: string, opts?: AgentStreamOptions): AsyncGenerator<StreamChunk> {
      const ph = ctx.context.powerhouse;
      if (!ph) {
        // No Powerhouse context — pass through without document bridge
        yield* inner.stream(prompt, opts);
        return;
      }

      // Ensure we have a document to write to
      const documentId = await ensureChatDocument(ph, ctx);

      // Ensure stakeholder exists for the CLI user
      await ensureStakeholder(ph, documentId, 'cli-user', 'CLI User');

      // Ensure agent participant exists
      await ensureAgent(ph, documentId, AGENT_ID, 'Connect Agent');

      // Write user message to document
      const dispatcher = createDispatcher(ph);
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
function createDemoAgent(ctx: AgentContext<Config>): AgentProvider {
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
  ph: PowerhouseContext,
  ctx: AgentContext<Config>,
): Promise<string> {
  if (chatDocumentId) return chatDocumentId;

  // Try to find an existing agent-chat document in the drive
  const documents = await ph.client.getDocuments(ph.driveId);
  const existing = documents?.find?.((d: any) => d.documentType === 'powerhouse/agent-chat');
  if (existing) {
    chatDocumentId = existing.id ?? existing.documentId;
    return chatDocumentId!;
  }

  // Create a new agent-chat document
  const result = await ph.client.createDocument(ph.driveId, {
    documentType: 'powerhouse/agent-chat',
  });
  chatDocumentId = result?.id ?? result?.documentId ?? result;

  // Set initial pruneLength
  if (ctx.config.pruneLength) {
    const { setPruneLength } = await import('agent-app/document-models/agent-chat');
    await ph.client.addAction(chatDocumentId, setPruneLength({
      pruneLength: ctx.config.pruneLength,
    }));
  }

  return chatDocumentId!;
}

async function ensureStakeholder(
  ph: any,
  documentId: string,
  id: string,
  name: string,
): Promise<void> {
  try {
    const doc = await ph.client.getDocument(ph.driveId, documentId);
    const state = doc?.state?.global ?? doc?.state;
    const exists = state?.stakeholders?.some?.((s: any) => s.id === id);
    if (exists) return;

    const { addStakeholder } = await import('agent-app/document-models/agent-chat');
    await ph.client.addAction(documentId, addStakeholder({ id, name }));
  } catch {
    // Best-effort — may fail if stakeholder already exists
  }
}

async function ensureAgent(
  ph: any,
  documentId: string,
  id: string,
  name: string,
): Promise<void> {
  try {
    const doc = await ph.client.getDocument(ph.driveId, documentId);
    const state = doc?.state?.global ?? doc?.state;
    const exists = state?.agents?.some?.((a: any) => a.id === id);
    if (exists) return;

    const { addAgent } = await import('agent-app/document-models/agent-chat');
    await ph.client.addAction(documentId, addAgent({
      id,
      name,
      role: 'AI Assistant',
      description: 'Powerhouse Connect Agent',
    }));
  } catch {
    // Best-effort — may fail if agent already exists
  }
}

function createDispatcher(ph: any): DocumentDispatcher {
  return {
    async addAction(documentId: string, action: any): Promise<void> {
      await ph.client.addAction(documentId, action);
    },
  };
}
