/**
 * ph-clint CLI definition.
 *
 * This file is the codegen anchor point. Regions bracketed by
 * `@clint:begin {name}` / `@clint:end {name}` comment markers are
 * rewritten by ph-clint-cli's generator when the project spec changes.
 * Everything outside the markers is user-editable and preserved.
 */
import path from 'node:path';
import { defineCli, buildDefaultReactor, deterministicId } from '@powerhousedao/ph-clint';
import { z } from 'zod';
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
  routine: { id: 'triggers', name: 'Triggers' },
  // @clint:end triggers

  // @clint:begin prompts
  prompts: {
    artifacts: [path.join(CLI_ROOT, 'gen', 'skills'), path.join(CLI_ROOT, 'dist', 'gen', 'skills')],
    agents: {
      'ph-clint-dev-agent': {
        name: 'PhClintDevAgent',
        sections: ['AgentBase.md'],
        skills: ['cli-setup', 'command-definition', 'service-definition'],
      },
    },
    skills: {
      'cli-setup': {
        description: 'Set up a new CLI with defineCli, config schemas, entrypoint, and interactive mode',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align design decisions with the developer. Discovery: explain concepts step by step. One-shot: make all decisions autonomously'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      'command-definition': {
        description: 'Define commands with Zod schemas, execute functions, return values, and parameter prompting',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align design decisions with the developer. Discovery: explain concepts step by step. One-shot: make all decisions autonomously'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      'service-definition': {
        description: 'Define background services with readiness detection, preflight checks, and project scanning',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align design decisions with the developer. Discovery: explain concepts step by step. One-shot: make all decisions autonomously'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
    },
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
    documentModels: [...documentModels],
    drives: [
      { name: 'Clint Folders', role: 'personal', id: deterministicId(CLI_NAME, 'personal-drive') },
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
