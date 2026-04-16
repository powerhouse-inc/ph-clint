/**
 * ph-clint CLI definition.
 *
 * This file is the codegen anchor point. Regions bracketed by
 * `@clint:begin {name}` / `@clint:end {name}` comment markers are
 * rewritten by ph-clint-cli's generator when the project spec changes.
 * Everything outside the markers is user-editable and preserved.
 */
import { defineCli } from 'ph-clint';
import { CLI_NAME, CLI_VERSION, configSchema, secretsSchema } from './config.js';

// @clint:begin imports
// Imports injected by codegen (commands, services, triggers, agent factories).
// @clint:end imports

export const cli = defineCli({
  name: CLI_NAME,
  version: CLI_VERSION,
  description: `${CLI_NAME} v${CLI_VERSION}`,
  configSchema,
  secretsSchema,

  // @clint:begin commands
  commands: [],
  // @clint:end commands

  // @clint:begin services
  services: [],
  // @clint:end services

  // @clint:begin triggers
  triggers: [],
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

  // Interactive (REPL) config — populated by codegen. Omitted here because
  // InteractiveConfig.welcome is required.
  // @clint:begin interactive
  // @clint:end interactive
});

// @clint:begin reactor
// Powerhouse reactor wiring — populated when features.powerhouse.enabled.
// Example (see examples/06-connect-agent/agent-cli/src/cli.ts):
//   cli.configureReactor({
//     create: (ctx) => buildDefaultReactor(ctx, { documentModels, ... }),
//     switchboard: { enabled: true, port: 4801 },
//     connect: { enabled: true, port: 3000, workdir: appDir },
//   });
// @clint:end reactor

// @clint:begin mastra
// Mastra agent wiring — populated when features.mastra.enabled.
// Example (see examples/05-ph-rupert/src/cli.ts):
//   cli.configureAgent(createAgent);
// @clint:end mastra
