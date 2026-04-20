import path from 'node:path';
import { z } from 'zod';
import { defineCli } from '@powerhousedao/ph-clint';
import { CLI_NAME, CLI_VERSION, PROJECT_ROOT, configSchema, secretsSchema } from './config.js';
import { reactorProjectInit } from './commands/reactor-project-init.js';
import { fusionProjectInit } from './commands/fusion-project-init.js';
import { phLogin, phLogout, phAccessToken } from './commands/ph-auth.js';
import { reactorProjectPublish } from './commands/reactor-project-publish.js';
import { reactorProjectBuild } from './commands/reactor-project-build.js';
import { createAgent } from './agents/agent-rupert.js';
import { reactorProject } from './services/reactor-project.js';
import { fusionProject } from './services/fusion-project.js';

// ── CLI ──────────────────────────────────────────────────────────

export const cli = defineCli({
  name: CLI_NAME,
  version: CLI_VERSION,
  description: `Powerhouse Rupert CLI v${CLI_VERSION}\nFull-stack Development of Local-first Apps and Platforms`,
  configSchema,
  secretsSchema,
  commands: [reactorProjectInit, fusionProjectInit, phLogin, phLogout, phAccessToken, reactorProjectPublish, reactorProjectBuild],
  services: [reactorProject, fusionProject],
  prompts: {
    sources: [path.join(PROJECT_ROOT, 'gen', 'skills'), path.join(PROJECT_ROOT, 'dist', 'gen', 'skills')],
    agents: {
      'rupert-dev-agent': {
        name: 'RupertDevAgent',
        sections: ['AgentBase.md', 'ReactorPackageDevAgent.md'],
        skills: ['document-modeling', 'document-editor-creation', 'fusion-development', 'fusion-project-management', 'playwright-cli', 'reactor-project-management'],
      },
      'powerhouse-architect-agent': {
        name: 'PowerhouseArchitectAgent',
        sections: ['AgentBase.md', 'PowerhouseArchitectAgent.md'],
        skills: ['handle-stakeholder-message'],
      },
    },
    skills: {
      'document-modeling': {
        description: 'Design Powerhouse document models with state schemas, operations, and reducers',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align technical design decisions between fellow experts. Discovery: explain the process and guide non-expert users to decisions. One-shot: make all design decisions autonomously and execute without asking'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      'document-editor-creation': {
        description: 'Build React editor components for Powerhouse document types',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align technical design decisions between fellow experts. Discovery: explain the process and guide non-expert users to decisions. One-shot: make all design decisions autonomously and execute without asking'),
          useBrowser: z.enum(['chromium', 'chrome', 'firefox', 'webkit', 'msedge']).default('chromium').describe('Browser engine for Playwright visual verification of the editor'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode with browser {{useBrowser}} for: {{prompt}}',
      },
      'fusion-development': {
        description: 'Build local-first platforms based on Next.js with document drives as the backend',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align technical design decisions between fellow experts. Discovery: explain the process and guide non-expert users to decisions. One-shot: make all design decisions autonomously and execute without asking'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      'fusion-project-management': {
        description: 'Initialize, configure, and run Fusion project instances',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align technical design decisions between fellow experts. Discovery: explain the process and guide non-expert users to decisions. One-shot: make all design decisions autonomously and execute without asking'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      'handle-stakeholder-message': {
        description: 'Triage stakeholder messages, update WBS documents, and draft replies',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align technical design decisions between fellow experts. Discovery: explain the process and guide non-expert users to decisions. One-shot: make all design decisions autonomously and execute without asking'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      'reactor-project-management': {
        description: 'Initialize and run Reactor Package projects with Vetra services',
        inputSchema: z.object({
          mode: z
            .enum(['expert', 'discovery', 'one-shot'])
            .default('expert')
            .describe('Expert: align technical design decisions between fellow experts. Discovery: explain the process and guide non-expert users to decisions. One-shot: make all design decisions autonomously and execute without asking'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      'playwright-cli': {
        description: 'Automate browser interactions, test web pages and work with Playwright tests',
        inputSchema: z.object({
          useBrowser: z.enum(['chromium', 'chrome', 'firefox', 'webkit', 'msedge']).default('chromium').describe('Browser engine to use for Playwright sessions'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill with browser {{useBrowser}} for: {{prompt}}',
      },
    },
  },

  events: {
    'service:pattern-matched': (event, log) => {
      log.info(`  \u2713 ${event.patternName} matched (${event.remaining} remaining)`);
    },
    'service:ready': (event, log) => {
      const ep = event.endpoints ?? {};
      log.info(`\u2713 ${event.name} is ready` + (ep['vetra-studio'] ? ` \u2014 Vetra Studio at ${ep['vetra-studio']}` : ''));
    },
    'service:failed': (event, log) => {
      log.error(`\u2717 ${event.name} failed: ${event.error}`);
      if (event.id === 'reactor-project' && /exited before becoming ready/.test(event.error ?? '')) {
        log.info('  Hint: Is the working directory a Reactor package project? Try: reactor-project-start --workdir <project-name>');
      }
      if (/max instances/.test(event.error ?? '')) {
        log.info(`  Hint: ${event.name} is already running. Stop it first with ${event.id}-stop, or use ${event.id}-restart.`);
      }
    },
    'service:restarting': (event, log) => {
      log.warn(`\u21BB ${event.name} restarting (attempt ${event.attempt}/${event.maxRetries})`);
    },
    'service:stopped': (event, log) => {
      log.info(`\u25A0 ${event.name} stopped`);
    },
  },

  interactive: {
    welcome: ({ config, workdir }) => {
      const mode = config.apiKey ? config.model : 'demo mode \u2014 set VETRA_MASTRA_API_KEY for real LLM responses';
      const G = '\x1b[32m';
      const W = '\x1b[97m';
      const D = '\x1b[2m';
      const R = '\x1b[0m';
      return [
        '',
        `  ${G}\u2556HHHHHHH  \u2565HHHHHH\u2556`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592h'\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592${W}    Powerhouse Rupert CLI v${CLI_VERSION}`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592  \u2559\u2592\u2592\u2592\u2592\u2592\u2592\u2592${W}    Full-stack Development of Local-first Apps and Platforms`,
        `  ${G}\u2560\u2592\u2592\u2592\u2592\u255C"     \u2559\u2592\u2592\u2592\u2592\u2592${R}`,
        `  ${G},\u2556\u2556,         ,,\u2556\u2556,${R}    Type a message to talk to the agent.`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2565    \u2565\u2592\u2592\u2592\u2592\u2592\u2592${R}    ${D}Try:${R} "Create a Reactor package with invoice document model and editor`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592  \u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592${R}`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592hj\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592${R}    Type ${D}/${R} for commands. ${D}/cli-docs${R} for documentation.`,
        '',
        `  ${D}Model:${R} ${mode}`,
        `  ${D}Workdir:${R} ${workdir}`,
        '',
      ].join('\n');
    },
  },
});

cli.configureAgent(createAgent);
