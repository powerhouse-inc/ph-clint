#!/usr/bin/env tsx
/**
 * Build script — compiles Handlebars templates into static SKILL.md files
 * and agent instruction strings using ph-clint-dev.
 *
 * Run: pnpm build:skills
 */

import path from 'node:path';
import { buildSkills } from 'ph-clint-dev';
import { cli } from '../src/cli.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');

function loadBuildContext() {
  const workspaceDir = process.env.VETRA_MASTRA_WORKDIR ?? process.cwd();
  const connectPort = process.env.VETRA_MASTRA_CONNECT_PORT ?? '3000';
  const switchboardPort = process.env.VETRA_MASTRA_SWITCHBOARD_PORT ?? '4001';
  return {
    agentName: '{{AGENT_NAME}}', // placeholder — replaced per-agent
    workspaceDir,
    connectPort,
    switchboardPort,
    vetraConnectPort: connectPort,
    vetraSwitchboardPort: switchboardPort,
    reactorPackagesDir: process.env.VETRA_MASTRA_REACTOR_PACKAGES_DIR ?? workspaceDir,
    fusionProjectsDir: process.env.VETRA_MASTRA_FUSION_PROJECTS_DIR ?? `${workspaceDir}/fusion-projects`,
    fusionPort: process.env.VETRA_MASTRA_FUSION_PORT ?? '3001',
    fusionSwitchboardUrl: process.env.VETRA_MASTRA_FUSION_SWITCHBOARD_URL ?? `http://localhost:${switchboardPort}/graphql`,
  };
}

function truncate(value: unknown, max = 40): string {
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'string') {
    const inner = value.length > max ? value.slice(0, max) + '…' : value;
    return `"${inner}"`;
  }
  const s = String(value);
  return s.length > max ? s.slice(0, max) + '…' : s;
}
function printPaths(obj: unknown, prefix = '') {
  if (obj === null || obj === undefined || typeof obj !== 'object') return;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      console.log(path);
      printPaths(value, path);
    } else {
      console.log(`${path} = ${truncate(value)}`);
    }
  }
}
console.log('\nCLI Metadata properties:');
printPaths(cli.getMetadata());
console.log();

const result = buildSkills({
  projectRoot: PROJECT_ROOT,
  outputGeneratedDir: path.join(PROJECT_ROOT, 'src', 'mastra', 'generated'),
  context: loadBuildContext(),
  cli,
  agentProfiles: [
    {
      name: 'RupertDevAgent',
      sections: ['AgentBase.md', 'ReactorPackageDevAgent.md'],
    },
    {
      name: 'PowerhouseArchitectAgent',
      sections: ['AgentBase.md', 'PowerhouseArchitectAgent.md'],
    },
  ],
  skillDescriptions: {
    'document-modeling': 'Design Powerhouse document models with state schemas, operations, and reducers',
    'document-editor-creation': 'Build React editor components for Powerhouse document types',
    'fusion-development': 'Build local-first platforms based on Next.js with document drives as the backend',
    'fusion-project-management': 'Initialize, configure, and run Fusion project instances',
    'handle-stakeholder-message': 'Triage stakeholder messages, update WBS documents, and draft replies',
    'reactor-package-project-management': 'Initialize and run Reactor Package projects with Vetra services',
  },
});

if (result.warnings.length > 0) {
  console.warn(`\nDone with ${result.warnings.length} template variable warning(s).`);
}
