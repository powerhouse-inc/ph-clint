/**
 * connect-agent CLI — A ph-clint CLI that connects a Mastra AI agent
 * to the Powerhouse document ecosystem via the agent-chat document model.
 *
 * Enables all three Powerhouse layers:
 * - Reactor: in-process document store with agent-chat model
 * - Switchboard: GraphQL + MCP endpoint for remote access
 * - Connect: web UI for browser-based chat
 */

import { defineCli, buildDefaultReactor, readPackageInfo } from '@powerhousedao/ph-clint';
import type { WorkItem } from '@powerhousedao/ph-clint';
import { documentModels } from 'agent-app';
import * as agentChatCreators from 'agent-app/document-models/agent-chat';
import { configSchema } from './config.js';
import { createDocumentChangeTrigger } from './framework.js';
import { createAgent, AGENT_ID, findChatDocuments, ensureParticipant, createDispatcher } from './agent.js';
import { writeStreamToDocument } from './bridge.js';

const pkg = readPackageInfo(import.meta.url);

// ── Document Change Trigger ─────────────────────────────────────────
// When an agent-chat document changes (e.g. a user sends a message via
// Connect), the trigger produces a work item that invokes the agent.
//
// `documentId` is omitted so we react to any agent-chat document on the
// drive. The `onChange` handler then iterates the drive to find all chat
// docs (a single change may touch several) and dispatches the agent.
// The `doc` parameter is unused — we refetch inside the work-item body so
// the agent always sees the latest state when it actually runs.

const documentChangeTrigger = createDocumentChangeTrigger<'powerhouse/agent-chat'>({
  id: 'document-change',
  documentType: 'powerhouse/agent-chat',
  documentId: async (ctx) => {
    const reactor = await ctx.reactor();
    if (!reactor) return undefined;
    const docIds = await findChatDocuments(reactor);
    return docIds[0];
  },
  async onChange(_doc, ctx): Promise<WorkItem | null> {
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

          const docIds = await findChatDocuments(reactor);
          if (docIds.length === 0) return;

          for (const docId of docIds) {
            const doc = await reactor.client.get(docId);
            const state = doc.state.global;
            if (!state.messages?.length) continue;

            const lastMsg = state.messages[state.messages.length - 1];

            // Only respond if last message is from a stakeholder (not the agent)
            const agentIds = new Set(
              (state.agents ?? []).map((a) => a.id),
            );
            if (agentIds.has(lastMsg.sender)) continue;

            // Only respond to text messages
            if (lastMsg.type !== 'Text' || !lastMsg.text?.length) continue;
            const prompt = lastMsg.text.join('');

            console.log(`[trigger] Agent responding to message from ${lastMsg.sender} in ${docId}`);

            try {
              await ensureParticipant(reactor, docId, 'agents', AGENT_ID,
                agentChatCreators.addAgent({ id: AGENT_ID, name: 'Connect Agent', role: 'AI Assistant', description: 'Powerhouse Connect Agent' }));

              const dispatcher = createDispatcher(reactor);
              for await (const _chunk of writeStreamToDocument(
                agent.stream(prompt, { threadId: docId }),
                { dispatcher, documentId: docId, agentId: AGENT_ID },
                agentChatCreators,
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

// ── CLI ─────────────────────────────────────────────────────────────

const cli = defineCli({
  name: pkg.name.replace(/-cli$/, ''),
  version: pkg.version,
  root: pkg.root,
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
  }),
  switchboard: { enabled: true },
  connect: { enabled: true },
});

cli.configureAgent(createAgent);

export { cli };
