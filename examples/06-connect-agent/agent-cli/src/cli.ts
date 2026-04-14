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
import { defineCli, definePowerhouseIntegration } from 'ph-clint';
import type { WorkItem } from 'ph-clint';
import { documentModels } from 'agent-app';
import { configSchema } from './config.js';
import { createAgent, AGENT_ID, getChatDocumentId } from './agent.js';
import { createDocumentChangeTrigger } from './trigger.js';

// ── Powerhouse Integration ─────────────────────────────────────────

// Connect (ph connect) must run inside the agent-app Reactor Package.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const agentAppDir = path.resolve(__dirname, '../../agent-app');

const { integration, services } = definePowerhouseIntegration({
  documentModels,
  drive: { name: 'Agent Chat' },
  subscriptions: { documentTypes: ['powerhouse/agent-chat'] },
  switchboard: { enabled: true, port: 4801 },
  connect: { enabled: true, port: 3000, workdir: agentAppDir },
});

// ── Document Change Trigger ─────────────────────────────────────────
// When an agent-chat document changes (e.g. a user sends a message via
// Connect), the trigger produces a work item that invokes the agent.

const documentChangeTrigger = createDocumentChangeTrigger({
  async onDocumentChanged(): Promise<WorkItem | null> {
    // No document yet — nothing to do
    const docId = getChatDocumentId();
    if (!docId) return null;

    // Produce a function work item that the routine loop will execute.
    // The function reads the document, checks if the last message is
    // from a stakeholder, and if so invokes the agent.
    return {
      type: 'function',
      params: {
        fn: async () => {
          // This runs inside the routine loop which has the full context.
          // For now, log that a change was detected — the actual agent
          // invocation will be wired when we validate against real
          // Powerhouse packages and know the exact client API shape.
          console.log(`[trigger] Document change detected on ${docId}`);
        },
      },
    };
  },
});

// ── CLI ─────────────────────────────────────────────────────────────

const cli = defineCli({
  name: 'connect-agent',
  version: '0.1.0',
  description: 'AI agent with Powerhouse Connect web UI',
  configSchema,
  commands: [],
  integrations: [integration],
  services: [...services],
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

cli.setAgentLoader(createAgent);
cli.run(process.argv);
