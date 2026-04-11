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

function loadTemplateVars() {
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

const result = buildSkills({
  include: [path.join(PROJECT_ROOT, 'prompts')],
  context: loadTemplateVars(),
  output: [
    path.join(PROJECT_ROOT, 'gen'),
    path.join(PROJECT_ROOT, 'dist', 'gen'),
  ],
  cli,
});
