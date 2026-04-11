import path from 'node:path';
import { defineCli } from 'ph-clint';
import { CLI_NAME, CLI_VERSION, PROJECT_ROOT, configSchema, secretsSchema } from './config.js';
import { reactorPackageInit } from './commands/reactor-package-init.js';
import { reactorPackagesList } from './commands/reactor-packages-list.js';
import { fusionProjectInit } from './commands/fusion-project-init.js';
import { fusionProjectsList } from './commands/fusion-projects-list.js';
import { createAgent } from './agents/agent-rupert.js';
import { vetra } from './services/vetra.js';
import { fusionProject } from './services/fusion-project.js';

// ── CLI ──────────────────────────────────────────────────────────

export const cli = defineCli({
  name: CLI_NAME,
  version: CLI_VERSION,
  description: `Vetra CLI v${CLI_VERSION} — Local-first Application Development with Agent Rupert`,
  configSchema,
  secretsSchema,
  commands: [reactorPackageInit, reactorPackagesList, fusionProjectInit, fusionProjectsList],
  services: [vetra, fusionProject],
  prompts: {
    sources: [
      path.join(PROJECT_ROOT, 'gen', 'skills'),
      path.join(PROJECT_ROOT, 'dist', 'gen', 'skills'),
    ],
    agents: {
      'rupert-dev-agent': {
        name: 'RupertDevAgent',
        sections: ['AgentBase.md', 'ReactorPackageDevAgent.md'],
        skills: [
          'document-modeling', 'document-editor-creation',
          'fusion-development', 'fusion-project-management',
          'playwright-cli',
          'reactor-package-project-management',
        ],
      },
      'powerhouse-architect-agent': {
        name: 'PowerhouseArchitectAgent',
        sections: ['AgentBase.md', 'PowerhouseArchitectAgent.md'],
        skills: ['handle-stakeholder-message'],
      },
    },
    skills: {
      'document-modeling': 'Design Powerhouse document models with state schemas, operations, and reducers',
      'document-editor-creation': 'Build React editor components for Powerhouse document types',
      'fusion-development': 'Build local-first platforms based on Next.js with document drives as the backend',
      'fusion-project-management': 'Initialize, configure, and run Fusion project instances',
      'handle-stakeholder-message': 'Triage stakeholder messages, update WBS documents, and draft replies',
      'reactor-package-project-management': 'Initialize and run Reactor Package projects with Vetra services',
    },
  },

  events: {
    'service:pattern-matched': (event) => {
      console.log(`  \u2713 ${event.name} matched (${event.remaining} remaining)`);
    },
    'service:ready': (event) => {
      const ep = event.endpoints ?? {};
      console.log(
        `\u2713 ${event.label} is ready` +
          (ep['connect-studio'] ? ` \u2014 Connect Studio on port ${ep['connect-studio']}` : ''),
      );
    },
    'service:failed': (event) => {
      console.log(`\u2717 ${event.label} failed: ${event.error}`);
      if (event.id === 'vetra' && /exited before becoming ready/.test(event.error ?? '')) {
        console.log('  Hint: Is the working directory a Reactor package project? Try: vetra-start --workdir <project-name>');
      }
    },
    'service:restarting': (event) => {
      console.log(`\u21BB ${event.label} restarting (attempt ${event.attempt}/${event.maxRetries})`);
    },
    'service:stopped': (event) => {
      console.log(`\u25A0 ${event.label} stopped`);
    },
  },

  interactive: {
    welcome: ({ config, workdir }) => {
      const mode = config.apiKey
        ? config.model
        : 'demo mode \u2014 set VETRA_MASTRA_API_KEY for real LLM responses';
      const G = '\x1b[32m';
      const W = '\x1b[97m';
      const D = '\x1b[2m';
      const R = '\x1b[0m';
      return [
        '',
        `  ${G}\u2556HHHHHHH  \u2565HHHHHH\u2556`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592h'\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592${W}    Vetra CLI v${CLI_VERSION}`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2592\u2592  \u2559\u2592\u2592\u2592\u2592\u2592\u2592\u2592${W}    Agent Rupert`,
        `  ${G}\u2560\u2592\u2592\u2592\u2592\u255C"     \u2559\u2592\u2592\u2592\u2592\u2592${R}`,
        `  ${G},\u2556\u2556,         ,,\u2556\u2556,${R}    Type a message to talk to the agent.`,
        `  ${G}\u2592\u2592\u2592\u2592\u2592\u2592\u2565    \u2565\u2592\u2592\u2592\u2592\u2592\u2592${R}    ${D}Try:${R} "Create a document model for invoices"`,
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

cli.setAgentLoader(createAgent);
