/**
 * ph-clint CLI definition.
 *
 * This file is the codegen anchor point. Regions bracketed by
 * `@clint:begin {name}` / `@clint:end {name}` comment markers are
 * rewritten by ph-clint-cli's generator when the project spec changes.
 * Everything outside the markers is user-editable and preserved.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCli, buildDefaultReactor } from '@powerhousedao/ph-clint';
import { CLI_NAME, CLI_VERSION } from './config.js';
import { configSchema, secretsSchema } from './framework.js';

// @clint:begin imports
import { documentModels } from '@powerhousedao/ph-clint-app';
import { createAgent } from './agents/clint-agent.js';
import { init } from './commands/init.js';
import { regen } from './commands/regen.js';
import { specChangeTrigger } from './triggers/spec-change.js';
// @clint:end imports

// Connect (ph connect) must run inside the Reactor Package (ph-clint-app).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '../../ph-clint-app');

export const cli = defineCli({
  name: CLI_NAME,
  version: CLI_VERSION,
  description: `${CLI_NAME} v${CLI_VERSION} — scaffold and maintain ph-clint implementation projects`,
  configSchema,
  secretsSchema,

  // @clint:begin commands
  commands: [init, regen],
  // @clint:end commands

  // @clint:begin services
  services: [],
  // @clint:end services

  // @clint:begin triggers
  triggers: [specChangeTrigger],
  // @clint:end triggers

  // @clint:begin prompts
  prompts: {
    sources: [],
    agents: {},
    skills: {},
  },
  // @clint:end prompts

  // @clint:begin events
  events: {},
  // @clint:end events

  // @clint:begin interactive
  interactive: {
    welcome: ({ config, workdir }) => {
      const mode = config.apiKey
        ? config.model
        : 'demo mode — set PH_CLINT_API_KEY for real LLM responses';
      return [
        `ph-clint v${CLI_VERSION}`,
        `Model:   ${mode}`,
        `Workdir: ${workdir}`,
        '',
        'Type a message to talk to the agent, or /help for commands.',
      ].join('\n');
    },
  },
  // @clint:end interactive
});

// @clint:begin reactor
cli.configureReactor({
  create: (ctx) => buildDefaultReactor(ctx, {
    documentModels,
    drive: { name: 'Clint' },
    subscriptions: { documentTypes: ['powerhouse/ph-clint-project'] },
  }),
  switchboard: { enabled: true },
  connect: { enabled: true, workdir: appDir },
});
// @clint:end reactor

// @clint:begin mastra
cli.configureAgent(createAgent);
// @clint:end mastra
