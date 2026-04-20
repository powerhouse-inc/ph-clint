import path from 'node:path';
import { z } from 'zod';
import { defineCli } from '@powerhousedao/ph-clint';
import { CLI_NAME, CLI_VERSION, PROJECT_ROOT, configSchema, secretsSchema } from './config.js';
import { initProject } from './commands/init-project.js';
import { addSource } from './commands/add-source.js';
import { listSources } from './commands/list-sources.js';
import { previewServer } from './services/preview-server.js';
import { createAgent } from './agents/agent-mara.js';

// ── CLI ──────────────────────────────────────────────────────────

export const cli = defineCli({
  name: CLI_NAME,
  version: CLI_VERSION,
  description: `ph-mara v${CLI_VERSION}\nMarketing Research & Assets — GTM Package Generator`,
  configSchema,
  secretsSchema,
  commands: [initProject, addSource, listSources],
  services: [previewServer],
  prompts: {
    sources: [
      path.join(PROJECT_ROOT, 'gen', 'skills'),
      path.join(PROJECT_ROOT, 'dist', 'gen', 'skills'),
    ],
    agents: {
      'gtm-strategist': {
        name: 'GTMStrategist',
        sections: ['GTMStrategist.md'],
        skills: [
          '01-research', '02-messaging',
          '03-design-system', '04-site-prototype',
          '05-presentation', '06-visual-qa',
          'playwright-cli',
        ],
      },
    },
    skills: {
      '01-research': {
        description: 'Analyze sources, discover audience, map concerns, and produce a positioning brief',
        inputSchema: z.object({
          mode: z.enum(['expert', 'discovery', 'one-shot']).default('expert')
            .describe('Expert: guided discovery with user input. Discovery: explain options and let user choose. One-shot: execute autonomously'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      '02-messaging': {
        description: 'Draft, iterate, and finalize site messaging based on the positioning brief',
        inputSchema: z.object({
          mode: z.enum(['expert', 'discovery', 'one-shot']).default('expert')
            .describe('Expert: guided iteration with user approval. Discovery: explain options. One-shot: draft autonomously'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      '03-design-system': {
        description: 'Define visual identity and build a reusable component library',
        inputSchema: z.object({
          mode: z.enum(['expert', 'discovery', 'one-shot']).default('discovery')
            .describe('Expert: technical design decisions. Discovery: explain visual options. One-shot: design autonomously'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      '04-site-prototype': {
        description: 'Build a serveable HTML website from approved messaging and design system',
        inputSchema: z.object({
          mode: z.enum(['expert', 'discovery', 'one-shot']).default('one-shot')
            .describe('Expert: review each pass. Discovery: explain production choices. One-shot: build autonomously'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      '05-presentation': {
        description: 'Produce a slide deck following the emotional driver narrative arc',
        inputSchema: z.object({
          mode: z.enum(['expert', 'discovery', 'one-shot']).default('one-shot')
            .describe('Expert: review narrative arc. Discovery: explain slide choices. One-shot: produce autonomously'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode for: {{prompt}}',
      },
      '06-visual-qa': {
        description: 'Screenshot HTML outputs, identify and fix visual issues',
        inputSchema: z.object({
          mode: z.enum(['expert', 'discovery', 'one-shot']).default('one-shot')
            .describe('Expert: review each issue. Discovery: explain QA process. One-shot: fix autonomously'),
          useBrowser: z.enum(['chromium', 'chrome', 'firefox', 'webkit', 'msedge']).default('chromium')
            .describe('Browser engine for Playwright screenshots'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill in {{mode}} mode with browser {{useBrowser}} for: {{prompt}}',
      },
      'playwright-cli': {
        description: 'Automate browser interactions, take screenshots, and test web pages',
        inputSchema: z.object({
          useBrowser: z.enum(['chromium', 'chrome', 'firefox', 'webkit', 'msedge']).default('chromium')
            .describe('Browser engine to use for Playwright sessions'),
        }),
        instructionTemplate: 'Use your {{skillId}} skill with browser {{useBrowser}} for: {{prompt}}',
      },
    },
  },

  events: {
    'service:pattern-matched': (event) => {
      console.log(`  \u2713 ${event.patternName} matched (${event.remaining} remaining)`);
    },
    'service:ready': (event) => {
      const ep = event.endpoints ?? {};
      console.log(
        `\u2713 ${event.name} is ready` +
          (ep['preview-url'] ? ` \u2014 ${ep['preview-url']}` : ''),
      );
    },
    'service:failed': (event) => {
      console.log(`\u2717 ${event.name} failed: ${event.error}`);
      if (/max instances/.test(event.error ?? '')) {
        console.log(`  Hint: ${event.name} is already running. Stop it first with ${event.id}-stop, or use ${event.id}-restart.`);
      }
    },
    'service:restarting': (event) => {
      console.log(`\u21BB ${event.name} restarting (attempt ${event.attempt}/${event.maxRetries})`);
    },
    'service:stopped': (event) => {
      console.log(`\u25A0 ${event.name} stopped`);
    },
  },

  interactive: {
    welcome: ({ config, workdir }) => {
      const mode = config.apiKey
        ? config.model
        : 'demo mode \u2014 set PH_MARA_API_KEY for real LLM responses';
      const D = '\x1b[2m';
      const R = '\x1b[0m';
      const C = '\x1b[36m';
      return [
        '',
        `  ${C}ph-mara${R} v${CLI_VERSION}`,
        `  Marketing Research & Assets — GTM Package Generator`,
        '',
        `  Type a message to talk to the agent.`,
        `  ${D}Try:${R} "Analyze our product and create a positioning brief"`,
        '',
        `  Type ${D}/${R} for commands. ${D}/cli-docs${R} for documentation.`,
        '',
        `  ${D}Model:${R} ${mode}`,
        `  ${D}Workdir:${R} ${workdir}`,
        '',
      ].join('\n');
    },
  },
});

cli.setAgentLoader(createAgent);
