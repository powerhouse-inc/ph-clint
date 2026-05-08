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

  /** Real agent with agentId, one model, default profile (AgentBase). */
  'mastra-configured': {
    name: 'test-mastra-cfg-cli',
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
    name: 'test-multi-cli',
    scope: '@acme',
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
        agentId: 'sb-agent',
        agentName: 'Switchboard Agent',
        models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
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
        agentId: 'chat-agent',
        agentName: 'Chat Agent',
        models: [{ id: 'anthropic/claude-sonnet-4-5', isDefault: true }],
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
   * package. The glob exercises the runtime-filter branch of `framework.gen.ts`
   * codegen against an app package whose `documentModels` is exported as
   * `[] as const` (the state `ph init` leaves it in until the user authors
   * a document model). Without the `DocumentModelModule` widening cast in
   * `buildFrameworkGenTs`, `tsc` fails with TS2339 on `m.documentModel.global.id`
   * because the filter callback's `m` collapses to `never`.
   */
  'connect-full': {
    name: 'test-connect-cli',
    scope: '@ph',
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
  ['mastra-demo', 'minimal'],
  ['minimal', 'reactor-minimal'],
  ['reactor-minimal', 'switchboard'],
  ['switchboard', 'connect-full'],
];
