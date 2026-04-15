#!/usr/bin/env node
/**
 * connect-agent CLI — A ph-clint CLI that connects a Mastra AI agent
 * to the Powerhouse document ecosystem via the agent-chat document model.
 *
 * Enables all three Powerhouse layers:
 * - Reactor: in-process document store with agent-chat model
 * - Switchboard: GraphQL + MCP endpoint for remote access
 * - Connect: web UI for browser-based chat
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCli, buildDefaultReactor } from 'ph-clint';
import type { WorkItem } from 'ph-clint';
import { documentModels } from 'agent-app';
import { configSchema } from './config.js';
import { createAgent, AGENT_ID } from './agent.js';
import { createDocumentChangeTrigger } from './trigger.js';
import { writeStreamToDocument } from './bridge.js';
import type { DocumentDispatcher } from './bridge.js';

// Connect (ph connect) must run inside the agent-app Reactor Package.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const agentAppDir = path.resolve(__dirname, '../../agent-app');

// ── Document Change Trigger ─────────────────────────────────────────
// When an agent-chat document changes (e.g. a user sends a message via
// Connect), the trigger produces a work item that invokes the agent.

const documentChangeTrigger = createDocumentChangeTrigger({
  async onDocumentChanged(ctx): Promise<WorkItem | null> {
    const reactor = await ctx.reactor();
    const agent = await ctx.agent();
    if (!reactor || !agent) return null;

    return {
      type: 'function',
      params: {
        fn: async () => {
          const reactor = await ctx.reactor();
          const agent = await ctx.agent();
          if (!reactor || !agent) return;

          // Find all agent-chat documents in the drive
          const docIds = await findChatDocuments(reactor.client, reactor.driveId);
          if (docIds.length === 0) return;

          for (const docId of docIds) {
            // Read current document state
            const doc = await reactor.client.get(docId);
            const state = doc?.state?.global ?? doc?.state;
            if (!state?.messages?.length) continue;

            const lastMsg = state.messages[state.messages.length - 1];

            // Only respond if last message is from a stakeholder (not the agent)
            const agentIds = new Set(
              (state.agents ?? []).map((a: any) => a.id),
            );
            if (agentIds.has(lastMsg.sender)) continue;

            // Build the prompt from the last user message
            let prompt: string;
            if (lastMsg.type === 'Text' && lastMsg.text?.length) {
              prompt = lastMsg.text.join('');
            } else {
              continue; // only respond to text messages
            }

            console.log(`[trigger] Agent responding to message from ${lastMsg.sender} in ${docId}`);

            try {
              // Ensure agent participant exists in the document
              const agentExists = state.agents?.some?.((a: any) => a.id === AGENT_ID);
              if (!agentExists) {
                const { addAgent } = await import('agent-app/document-models/agent-chat');
                await reactor.client.execute(docId, 'main', [
                  addAgent({ id: AGENT_ID, name: 'Connect Agent', role: 'AI Assistant', description: 'Powerhouse Connect Agent' }),
                ]);
              }

              // Stream agent response, writing to document
              const dispatcher: DocumentDispatcher = {
                async addAction(documentId: string, action: any) {
                  await reactor.client.execute(documentId, 'main', [action]);
                },
              };
              const creators = await import('agent-app/document-models/agent-chat');

              for await (const _chunk of writeStreamToDocument(
                agent.stream(prompt, { threadId: docId }),
                { dispatcher, documentId: docId, agentId: AGENT_ID },
                creators,
              )) {
                // Drain — chunks written to document by writeStreamToDocument
              }
              console.log(`[trigger] Agent response complete for ${docId}`);
            } catch (err) {
              console.error('[trigger] Agent response error:', err);
            }
          }
        },
      },
    };
  },
});

/** Find all agent-chat document IDs in the drive. */
async function findChatDocuments(client: any, driveId: string): Promise<string[]> {
  try {
    const children = await client.getChildren(driveId);
    return (children?.results ?? [])
      .filter((d: any) => d.header?.documentType === 'powerhouse/agent-chat')
      .map((d: any) => d.header.id);
  } catch {
    return [];
  }
}

// ── CLI ─────────────────────────────────────────────────────────────

const cli = defineCli({
  name: 'connect-agent',
  version: '0.1.0',
  description: 'AI agent with Powerhouse Connect web UI',
  configSchema,
  commands: [],
  triggers: [documentChangeTrigger],
  interactive: {
    welcome: ({ config }) => {
      const mode = config.apiKey
        ? `Mastra + ${config.model}`
        : 'demo mode — set CONNECT_AGENT_API_KEY for real LLM responses';
      return `Connect Agent (${mode})\nChat here or open Connect in your browser.\nType a message to talk to the agent, or use /help for commands.`;
    },
  },
});

cli.configureReactor({
  create: (ctx) => buildDefaultReactor(ctx, {
    documentModels,
    drive: { name: 'Agent Chat' },
    subscriptions: { documentTypes: ['powerhouse/agent-chat'] },
    switchboard: { enabled: true, port: 4801 },
  }),
  connect: { enabled: true, port: 3000, workdir: agentAppDir },
});

cli.configureAgent(createAgent);
cli.run(process.argv);
