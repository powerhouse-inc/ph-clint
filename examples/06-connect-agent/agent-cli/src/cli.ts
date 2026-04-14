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

import { defineCli, definePowerhouseIntegration } from 'ph-clint';
import { documentModels } from 'agent-app';
import { configSchema } from './config.js';
import { createAgent } from './agent.js';

// ── Powerhouse Integration ─────────────────────────────────────────

const { integration, services } = definePowerhouseIntegration({
  documentModels,
  drive: { name: 'Agent Chat' },
  subscriptions: { documentTypes: ['powerhouse/agent-chat'] },
  switchboard: { enabled: true },
  connect: { enabled: true },
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
