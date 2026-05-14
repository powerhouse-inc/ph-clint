/**
 * Named spec fixtures for codegen permutation testing.
 *
 * Each fixture is a `ClintProjectSpecInput` — the raw input shape before
 * Zod defaults are applied. Tests call `clintProjectSpecSchema.parse(fixture)`
 * to get the fully-resolved `ClintProjectSpec`.
 *
 * Most PH-enabled fixtures use `packages: []` (no document types). The app
 * package is scaffolded by `ph init` which exports an empty `documentModels`
 * array — enough for the CLI to compile and run when the spec doesn't
 * reference any document types.
 *
 * `connect-full` additionally exercises the `*​/*` glob branch of
 * `framework.gen.ts` codegen against that empty `documentModels` export to
 * regression-cover the empty-glob-package case (the freshly-scaffolded
 * reactor package with no models defined yet).
 */
import { type ClintProjectSpecInput } from '../../src/spec/types.js';

export const FIXTURES: Record<string, ClintProjectSpecInput> = {
  /** Absolute baseline — no features enabled. */
  minimal: {
    name: 'test-minimal-cli',
  },

  /** Mastra on but unconfigured — demo agent, no API key needed. */
  'mastra-demo': {
    name: 'test-mastra-demo-cli',
    features: {
      mastra: { enabled: true },
    },
  },

  /** Real main agent with one model, default profile. */
  'mastra-configured': {
    name: 'test-mastra-cfg-cli',
    features: {
      mastra: {
        enabled: true,
        models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
        profiles: [
          { id: 'base', title: 'Base Profile', content: 'You are a helpful assistant.' },
        ],
        mainAgent: {
          id: 'test-agent',
          name: 'Test Agent',
          description: null,
          image: null,
          modelId: 'anthropic/claude-sonnet-4-5',
          profileIds: ['base'],
          skills: [],
          toolPatterns: [],
        },
      },
    },
  },

  /** Multiple models from different providers + custom profiles + scoped. Main only. */
  'mastra-multi-model': {
    name: 'test-multi-cli',
    scope: '@acme',
    features: {
      mastra: {
        enabled: true,
        models: [
          { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
          { id: 'anthropic/claude-haiku-4-5', isDefault: false },
          { id: 'openai/gpt-4o', isDefault: false },
        ],
        profiles: [
          { id: 'core', title: 'Core Profile', content: 'You are a helpful assistant.' },
          { id: 'developer', title: 'Developer Profile', content: 'You are a senior developer.' },
        ],
        mainAgent: {
          id: 'multi-agent',
          name: 'Multi Agent',
          description: null,
          image: null,
          modelId: 'anthropic/claude-sonnet-4-5',
          profileIds: ['core', 'developer'],
          skills: [],
          toolPatterns: [],
        },
      },
    },
  },

  /** Main + one sub-agent on a different provider. Exercises agent-as-tool emission. */
  'mastra-with-subagents': {
    name: 'test-subagent-cli',
    features: {
      mastra: {
        enabled: true,
        models: [
          { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
          { id: 'openai/gpt-4o', isDefault: false },
        ],
        profiles: [
          { id: 'base', title: 'Base', content: 'You orchestrate sub-agents.' },
          { id: 'summarizer', title: 'Summarizer', content: 'You summarize long documents.' },
        ],
        mainAgent: {
          id: 'main-agent',
          name: 'Main Agent',
          description: null,
          image: null,
          modelId: 'anthropic/claude-sonnet-4-5',
          profileIds: ['base'],
          skills: [],
          toolPatterns: [],
        },
        subAgents: [
          {
            id: 'summarizer',
            name: 'Summarizer',
            description: 'Summarizes long documents into bullet points.',
            modelId: 'openai/gpt-4o',
            profileIds: ['summarizer'],
            skills: [],
            toolPatterns: ['cli-docs'],
          },
        ],
      },
    },
  },

  /** Simplest split layout — Reactor level, no agent, no document types. */
  'reactor-minimal': {
    name: 'test-reactor-cli',
    features: {
      powerhouse: 'Reactor',
    },
  },

  /** Mid-level Powerhouse + agent, no document types. */
  switchboard: {
    name: 'test-switchboard-cli',
    features: {
      powerhouse: 'Switchboard',
      mastra: {
        enabled: true,
        models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
        profiles: [{ id: 'base', title: 'Base', content: 'You are a helpful assistant.' }],
        mainAgent: {
          id: 'sb-agent',
          name: 'Switchboard Agent',
          description: null,
          image: null,
          modelId: 'anthropic/claude-sonnet-4-5',
          profileIds: ['base'],
          skills: [],
          toolPatterns: [],
        },
      },
    },
  },

  /** Switchboard + agent + chat enabled, with clint-common package. */
  'chat-switchboard': {
    name: 'test-chat-cli',
    features: {
      powerhouse: 'Switchboard',
      mastra: {
        enabled: true,
        models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
        profiles: [{ id: 'base', title: 'Base', content: 'You are a helpful assistant.' }],
        mainAgent: {
          id: 'chat-agent',
          name: 'Chat Agent',
          description: null,
          image: null,
          modelId: 'anthropic/claude-sonnet-4-5',
          profileIds: ['base'],
          skills: [],
          toolPatterns: [],
        },
        common: { enableChat: true },
      },
    },
    packages: [
      {
        id: 'pkg-clint-common',
        packageName: '@powerhousedao/clint-common',
        documentTypes: ['powerhouse/chat-session'],
      },
    ],
  },

  /**
   * Everything on: Connect + agent + routine, plus a `*​/*` glob on the app
   * package. Exercises the runtime-filter branch of `framework.gen.ts` codegen.
   */
  'connect-full': {
    name: 'test-connect-cli',
    scope: '@ph',
    features: {
      powerhouse: 'Connect',
      mastra: {
        enabled: true,
        models: [
          { id: 'anthropic/claude-sonnet-4-5', isDefault: true },
          { id: 'openai/gpt-4o', isDefault: false },
        ],
        profiles: [
          { id: 'base', title: 'Base', content: 'You are the connect agent.' },
          { id: 'ops', title: 'Operations', content: 'You handle operations.' },
        ],
        mainAgent: {
          id: 'connect-agent',
          name: 'Connect Agent',
          description: null,
          image: null,
          modelId: 'anthropic/claude-sonnet-4-5',
          profileIds: ['base', 'ops'],
          skills: [],
          toolPatterns: [],
        },
      },
      routine: { enabled: true },
    },
    packages: [
      {
        id: 'app-test-connect',
        packageName: '@ph/test-connect-app',
        documentTypes: ['*/*'],
      },
    ],
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
  ['mastra-multi-model', 'mastra-with-subagents'],
  ['mastra-demo', 'minimal'],
  ['minimal', 'reactor-minimal'],
  ['reactor-minimal', 'switchboard'],
  ['switchboard', 'connect-full'],
];
