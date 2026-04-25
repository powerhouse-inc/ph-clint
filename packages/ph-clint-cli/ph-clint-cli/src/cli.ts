/**
 * ph-clint CLI definition.
 *
 * This file is the codegen anchor point. Regions bracketed by
 * `@clint:begin {name}` / `@clint:end {name}` comment markers are
 * rewritten by ph-clint-cli's generator when the project spec changes.
 * Everything outside the markers is user-editable and preserved.
 */
import { defineCli, buildDefaultReactor } from '@powerhousedao/ph-clint';
import { CLI_NAME, CLI_VERSION, CLI_ROOT } from './config.js';
import { configSchema, secretsSchema } from './framework.js';

// @clint:begin imports
import { documentModels } from '@powerhousedao/ph-clint-app';
import { createAgent } from './agents/clint-agent.js';
import { init } from './commands/clint-project-init.js';
import { regen } from './commands/clint-project-regen.js';
import { build } from './commands/clint-project-build.js';
import { clintProjectPublish } from './commands/clint-project-publish.js';
import { clintProject } from './services/clint-project.js';
import { skillsSync } from './commands/clint-skills-sync.js';
import { specChangeTrigger } from './triggers/spec-change.js';
import { publishTrigger } from './triggers/publish-trigger.js';
// @clint:end imports

export const cli = defineCli({
  name: CLI_NAME,
  version: CLI_VERSION,
  root: CLI_ROOT,
  description: `${CLI_NAME} v${CLI_VERSION} — scaffold and maintain ph-clint implementation projects`,
  configSchema,
  secretsSchema,

  // @clint:begin commands
  commands: [init, regen, build, clintProjectPublish, skillsSync],
  // @clint:end commands

  // @clint:begin services
  services: [clintProject],
  // @clint:end services

  // @clint:begin triggers
  triggers: [specChangeTrigger, publishTrigger],
  // @clint:end triggers

  // @clint:begin prompts
  prompts: {
    artifacts: [],
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
    drives: [
      { name: 'Clint Folders', role: 'personal' },
    ],
    subscriptions: { documentTypes: ['powerhouse/ph-clint-project'] },
  }),
  switchboard: { enabled: true },
  connect: { enabled: true },
});
// @clint:end reactor

// @clint:begin mastra
cli.configureAgent(createAgent);
// @clint:end mastra
