#!/usr/bin/env tsx
/**
 * Build script — compiles Handlebars templates into static SKILL.md files
 * and agent instruction strings using ph-clint-dev.
 *
 * Run: pnpm build:skills
 */

import path from 'node:path';
import { buildSkills } from '@powerhousedao/ph-clint-dev';
import { cli } from '../src/cli.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');

function loadTemplateVars() {
  return {
    agentName: '{{AGENT_NAME}}', // placeholder — replaced per-agent
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
