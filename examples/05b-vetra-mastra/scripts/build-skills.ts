#!/usr/bin/env tsx
/**
 * Build script that compiles Handlebars templates in skills-src/ into
 * static SKILL.md files in skills/ and compiled agent instruction strings
 * exported from src/mastra/generated/.
 *
 * Run: pnpm build:skills
 */

import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const SKILLS_SRC = path.join(PROJECT_ROOT, 'skills-src');
const PROFILES_DIR = path.join(SKILLS_SRC, 'agent-profiles');
const SKILLS_DIR = path.join(SKILLS_SRC, 'skills');
const OUTPUT_SKILLS = path.join(PROJECT_ROOT, 'skills');
const OUTPUT_GENERATED = path.join(PROJECT_ROOT, 'src', 'mastra', 'generated');

// ---------------------------------------------------------------------------
// Build-time context
// ---------------------------------------------------------------------------
function loadBuildContext() {
  const workspaceDir = process.env.VETRA_MASTRA_WORKDIR ?? process.cwd();
  const connectPort = process.env.VETRA_MASTRA_CONNECT_PORT ?? '3000';
  const switchboardPort = process.env.VETRA_MASTRA_SWITCHBOARD_PORT ?? '4001';
  return {
    agentName: '{{AGENT_NAME}}', // placeholder — replaced per-agent below
    workspaceDir,
    connectPort,
    switchboardPort,
    // Aliases used by prototype agent profiles (ReactorPackageDevAgent, FusionDevAgent)
    vetraConnectPort: connectPort,
    vetraSwitchboardPort: switchboardPort,
    reactorPackagesDir: process.env.VETRA_MASTRA_REACTOR_PACKAGES_DIR ?? workspaceDir,
    fusionProjectsDir: process.env.VETRA_MASTRA_FUSION_PROJECTS_DIR ?? `${workspaceDir}/fusion-projects`,
    fusionPort: process.env.VETRA_MASTRA_FUSION_PORT ?? '3001',
    fusionSwitchboardUrl: process.env.VETRA_MASTRA_FUSION_SWITCHBOARD_URL ?? `http://localhost:${switchboardPort}/graphql`,
  };
}

// ---------------------------------------------------------------------------
// Handlebars helpers
// ---------------------------------------------------------------------------
Handlebars.registerHelper('formatDate', (date: unknown, format: string) => {
  if (!date) return '';
  const d = new Date(date as string);
  if (format === 'time') return d.toLocaleTimeString();
  if (format === 'date') return d.toLocaleDateString();
  return d.toISOString();
});
Handlebars.registerHelper('join', (arr: unknown[], sep: string) =>
  Array.isArray(arr) ? arr.join(typeof sep === 'string' ? sep : ', ') : '',
);
Handlebars.registerHelper('exists', (value: unknown) =>
  value !== undefined && value !== null && value !== '',
);
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('uppercase', (s: unknown) =>
  typeof s === 'string' ? s.toUpperCase() : '',
);
Handlebars.registerHelper('lowercase', (s: unknown) =>
  typeof s === 'string' ? s.toLowerCase() : '',
);
Handlebars.registerHelper('hasItems', (arr: unknown) =>
  Array.isArray(arr) && arr.length > 0,
);
Handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) =>
  value !== undefined && value !== null && value !== '' ? value : defaultValue,
);

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function readFile(p: string): string {
  return fs.readFileSync(p, 'utf-8');
}

function writeOutput(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
}

function renderTemplate(template: string, context: Record<string, unknown>): string {
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled(context);
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const SKILL_DESCRIPTIONS: Record<string, string> = {
  'document-modeling': 'Design Powerhouse document models with state schemas, operations, and reducers',
  'document-editor-creation': 'Build React editor components for Powerhouse document types',
  'fusion-development': 'Build local-first platforms based on Next.js with document drives as the backend',
  'fusion-project-management': 'Initialize, configure, and run Fusion project instances',
  'handle-stakeholder-message': 'Triage stakeholder messages, update WBS documents, and draft replies',
  'reactor-package-project-management': 'Initialize and run Reactor Package projects with Vetra services',
};

function slugToDescription(slug: string): string {
  return SKILL_DESCRIPTIONS[slug] ?? `${slugToTitle(slug)} tasks`;
}

// ---------------------------------------------------------------------------
// 1. Build agent profile instructions
// ---------------------------------------------------------------------------
interface AgentProfile {
  name: string;
  baseTemplate: string;
  specializedTemplate: string;
}

const AGENT_PROFILES: AgentProfile[] = [
  {
    name: 'RupertDevAgent',
    baseTemplate: 'AgentBase.md',
    specializedTemplate: 'RupertDevAgent.md',
  },
  {
    name: 'ReactorPackageDevAgent',
    baseTemplate: 'AgentBase.md',
    specializedTemplate: 'ReactorPackageDevAgent.md',
  },
  {
    name: 'FusionDevAgent',
    baseTemplate: 'AgentBase.md',
    specializedTemplate: 'FusionDevAgent.md',
  },
];

function buildAgentInstructions(context: Record<string, unknown>) {
  console.log('\n--- Building agent instructions ---');

  const exports: string[] = [];

  for (const profile of AGENT_PROFILES) {
    const basePath = path.join(PROFILES_DIR, profile.baseTemplate);
    const specPath = path.join(PROFILES_DIR, profile.specializedTemplate);

    if (!fs.existsSync(basePath) || !fs.existsSync(specPath)) {
      console.warn(`  SKIP ${profile.name}: missing template files`);
      continue;
    }

    const baseRaw = readFile(basePath);
    const specRaw = readFile(specPath);

    // Render with agent-specific context
    const agentContext = { ...context, agentName: profile.name };
    const baseRendered = renderTemplate(baseRaw, agentContext);
    const specRendered = renderTemplate(specRaw, agentContext);

    // Combine: base + blank line + specialized
    const combined = baseRendered.trim() + '\n\n' + specRendered.trim() + '\n';

    // Export as a TypeScript const
    const varName = profile.name.charAt(0).toLowerCase() + profile.name.slice(1) + 'Instructions';
    exports.push(
      `export const ${varName} = ${JSON.stringify(combined)};\n`,
    );

    console.log(`  OK ${profile.name} → ${varName} (${combined.length} chars)`);
  }

  const outputPath = path.join(OUTPUT_GENERATED, 'agent-instructions.ts');
  writeOutput(
    outputPath,
    `// Auto-generated by scripts/build-skills.ts — do not edit.\n\n${exports.join('\n')}\n`,
  );
  console.log(`  Written to ${path.relative(PROJECT_ROOT, outputPath)}`);
}

// ---------------------------------------------------------------------------
// 2. Build SKILL.md files
// ---------------------------------------------------------------------------
function buildSkills() {
  console.log('\n--- Building SKILL.md files ---');

  if (!fs.existsSync(SKILLS_DIR)) {
    console.log('  No skills-src/skills/ directory — skipping.');
    return;
  }

  const skillDirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const skillName of skillDirs) {
    const skillDir = path.join(SKILLS_DIR, skillName);
    const sections: string[] = [];

    // --- Preamble (optional) ---
    const preamblePath = path.join(skillDir, '.preamble.md');
    if (fs.existsSync(preamblePath)) {
      sections.push(readFile(preamblePath).trim());
    }

    // --- Scenario files (NN.name.md), sorted by filename ---
    const scenarioFiles = fs
      .readdirSync(skillDir)
      .filter((f) => /^\d+\..*\.md$/.test(f))
      .sort();

    for (const scenarioFile of scenarioFiles) {
      const content = readFile(path.join(skillDir, scenarioFile)).trim();
      sections.push(content);
    }

    // --- Result (optional) ---
    const resultPath = path.join(skillDir, '.result.md');
    if (fs.existsSync(resultPath)) {
      sections.push('## Expected Skill Outcome\n\n' + readFile(resultPath).trim());
    }

    if (sections.length === 0) {
      console.warn(`  SKIP ${skillName}: no content files found`);
      continue;
    }

    // --- Build SKILL.md ---
    const description = slugToDescription(skillName);

    const frontmatter = [
      '---',
      `name: ${skillName}`,
      `description: "${description}"`,
      'metadata:',
      '  author: Powerhouse',
      '  version: "1.0.0"',
      '---',
    ].join('\n');

    const body = sections.join('\n\n');

    const skillMd = frontmatter + '\n\n' + body + '\n';

    const outputPath = path.join(OUTPUT_SKILLS, skillName, 'SKILL.md');
    writeOutput(outputPath, skillMd);
    console.log(
      `  OK ${skillName} → SKILL.md (${scenarioFiles.length} scenarios, ${skillMd.length} chars)`,
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log('Building skills from', path.relative(process.cwd(), SKILLS_SRC));

  const context = loadBuildContext();

  buildAgentInstructions(context);
  buildSkills();

  console.log('\nDone.');
}

main();
