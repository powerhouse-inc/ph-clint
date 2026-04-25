/**
 * Named spec fixtures for codegen permutation testing.
 *
 * Each fixture is a `ClintProjectSpecInput` — the raw input shape before
 * Zod defaults are applied. Tests call `clintProjectSpecSchema.parse(fixture)`
 * to get the fully-resolved `ClintProjectSpec`.
 *
 * PH-enabled fixtures use `packages: []` (no document types). The app
 * package is scaffolded by `ph init` which exports an empty `documentModels`
 * array — enough for the CLI to compile and run.
 */
import { type ClintProjectSpecInput } from '../../src/spec/types.js';

export const FIXTURES: Record<string, ClintProjectSpecInput> = {
  /** Absolute baseline — no features enabled. */
  minimal: {
    name: 'test-minimal',
  },

  /** Mastra on but unconfigured — demo agent, no API key needed. */
  'mastra-demo': {
    name: 'test-mastra-demo',
    features: {
      mastra: { enabled: true },
    },
  },

  /** Real agent with agentId, one model, default profile (AgentBase). */
  'mastra-configured': {
    name: 'test-mastra-cfg',
    features: {
      mastra: {
        enabled: true,
        agentId: 'test-agent',
        agentName: 'Test Agent',
        models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
      },
    },
  },

  /** Multiple models from different providers + custom profiles + scoped. */
  'mastra-multi-model': {
    name: 'test-multi',
    scope: 'acme',
    features: {
      mastra: {
        enabled: true,
        agentId: 'multi-agent',
        agentName: 'Multi Agent',
        models: [
          { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
          { id: 'anthropic/claude-haiku-4-5', isDefault: false },
          { id: 'openai/gpt-4o', isDefault: false },
        ],
        profiles: [
          { id: 'core', title: 'Core Profile', content: 'You are a helpful assistant.' },
          { id: 'developer', title: 'Developer Profile', content: 'You are a senior developer.' },
        ],
      },
    },
  },

  /** Simplest split layout — Reactor level, no agent, no document types. */
  'reactor-minimal': {
    name: 'test-reactor',
    features: {
      powerhouse: 'Reactor',
    },
  },

  /** Mid-level Powerhouse + agent, no document types. */
  switchboard: {
    name: 'test-switchboard',
    features: {
      powerhouse: 'Switchboard',
      mastra: {
        enabled: true,
        agentId: 'sb-agent',
        agentName: 'Switchboard Agent',
        models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
      },
    },
  },

  /** Everything on: Connect + agent + routine, no document types. */
  'connect-full': {
    name: 'test-connect',
    scope: 'ph',
    features: {
      powerhouse: 'Connect',
      mastra: {
        enabled: true,
        agentId: 'connect-agent',
        agentName: 'Connect Agent',
        models: [
          { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
          { id: 'openai/gpt-4o', isDefault: false },
        ],
        profiles: [
          { id: 'base', title: 'Base', content: 'You are the connect agent.' },
          { id: 'ops', title: 'Operations', content: 'You handle operations.' },
        ],
      },
      routine: { enabled: true },
    },
  },
};

/**
 * Incremental transition pairs: [fromFixture, toFixture].
 * Each pair tests update-mode codegen from one spec state to another.
 */
export const TRANSITIONS: [string, string][] = [
  ['minimal', 'mastra-demo'],
  ['mastra-demo', 'mastra-configured'],
  ['mastra-configured', 'mastra-multi-model'],
  ['mastra-demo', 'minimal'],
  ['minimal', 'reactor-minimal'],
  ['reactor-minimal', 'switchboard'],
  ['switchboard', 'connect-full'],
];
