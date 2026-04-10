#!/usr/bin/env tsx
/**
 * Build script that compiles Handlebars templates in prompts/skills-tpl/ into
 * static SKILL.md files in skills/, copies external skills from
 * prompts/skills-ext/ as-is, and compiles agent instruction strings
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
const PROMPTS_DIR = path.join(PROJECT_ROOT, 'prompts');
const PROFILES_DIR = path.join(PROMPTS_DIR, 'agent-profiles');
const SKILLS_TPL_DIR = path.join(PROMPTS_DIR, 'skills-tpl');
const SKILLS_EXT_DIR = path.join(PROMPTS_DIR, 'skills-ext');
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
// Missing-variable detection
// ---------------------------------------------------------------------------
const KNOWN_HELPERS = new Set([
  // registered helpers
  'formatDate', 'join', 'exists', 'eq', 'uppercase', 'lowercase', 'hasItems', 'default',
  // built-in block helpers
  'if', 'unless', 'each', 'with', 'lookup', 'log',
]);

let totalWarnings = 0;

/** Walk a Handlebars AST and return all top-level variable names referenced. */
function extractTemplateVars(template: string): Set<string> {
  const ast = Handlebars.parse(template);
  const vars = new Set<string>();

  const visitor = new Handlebars.Visitor();

  function collectParams(params?: hbs.AST.Expression[]) {
    if (!params) return;
    for (const p of params) {
      if (p.type === 'PathExpression') {
        const expr = p as hbs.AST.PathExpression;
        if (!KNOWN_HELPERS.has(expr.original) && !expr.data && expr.depth === 0) {
          vars.add(expr.parts[0] as string);
        }
      }
    }
  }

  visitor.MustacheStatement = function (stmt: hbs.AST.MustacheStatement) {
    const p = stmt.path;
    if (p.type === 'PathExpression') {
      const expr = p as hbs.AST.PathExpression;
      if (!KNOWN_HELPERS.has(expr.original) && !expr.data && expr.depth === 0) {
        vars.add(expr.parts[0] as string);
      }
    }
    collectParams(stmt.params);
    Handlebars.Visitor.prototype.MustacheStatement.call(this, stmt);
  };

  visitor.SubExpression = function (sexpr: hbs.AST.SubExpression) {
    collectParams(sexpr.params);
    Handlebars.Visitor.prototype.SubExpression.call(this, sexpr);
  };

  visitor.BlockStatement = function (block: hbs.AST.BlockStatement) {
    collectParams(block.params);
    Handlebars.Visitor.prototype.BlockStatement.call(this, block);
  };

  visitor.accept(ast);
  return vars;
}

/** Log warnings for template variables not present in context. Returns count. */
function warnMissingVars(
  vars: Set<string>,
  context: Record<string, unknown>,
  label: string,
): number {
  const contextKeys = new Set(Object.keys(context));
  let count = 0;
  for (const v of [...vars].sort()) {
    if (!contextKeys.has(v)) {
      console.warn(`  WARN [${label}]: template references "{{${v}}}" but context has no value for it`);
      count++;
    }
  }
  return count;
}

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

function renderTemplate(template: string, context: Record<string, unknown>, label = '<template>'): string {
  const vars = extractTemplateVars(template);
  totalWarnings += warnMissingVars(vars, context, label);
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
    const baseRendered = renderTemplate(baseRaw, agentContext, `${profile.name}/${profile.baseTemplate}`);
    const specRendered = renderTemplate(specRaw, agentContext, `${profile.name}/${profile.specializedTemplate}`);

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
function buildSkills(context: Record<string, unknown>) {
  console.log('\n--- Building SKILL.md files (templates) ---');

  if (!fs.existsSync(SKILLS_TPL_DIR)) {
    console.log('  No prompts/skills-tpl/ directory — skipping.');
    return;
  }

  const skillDirs = fs
    .readdirSync(SKILLS_TPL_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const skillName of skillDirs) {
    const skillDir = path.join(SKILLS_TPL_DIR, skillName);
    const outputDir = path.join(OUTPUT_SKILLS, skillName);
    const refsDir = path.join(outputDir, 'references');

    // --- Preamble (the main SKILL.md body) ---
    const preamblePath = path.join(skillDir, '.preamble.md');
    const preambleRaw = fs.existsSync(preamblePath) ? readFile(preamblePath).trim() : '';
    const preamble = preambleRaw ? renderTemplate(preambleRaw, context, `${skillName}/.preamble.md`) : '';

    // --- Scenario files (NN.name.md) → rendered as references ---
    const scenarioFiles = fs
      .readdirSync(skillDir)
      .filter((f) => /^\d+\..*\.md$/.test(f))
      .sort();

    // --- Result (.result.md) → also a reference ---
    const resultPath = path.join(skillDir, '.result.md');
    const hasResult = fs.existsSync(resultPath);

    if (!preamble && scenarioFiles.length === 0 && !hasResult) {
      console.warn(`  SKIP ${skillName}: no content files found`);
      continue;
    }

    // Render and write scenario references
    const refLinks: string[] = [];
    if (scenarioFiles.length > 0 || hasResult) {
      fs.mkdirSync(refsDir, { recursive: true });
    }

    for (const scenarioFile of scenarioFiles) {
      const content = readFile(path.join(skillDir, scenarioFile)).trim();
      const rendered = renderTemplate(content, context, `${skillName}/${scenarioFile}`);
      writeOutput(path.join(refsDir, scenarioFile), rendered + '\n');
      // Extract a human-readable title from the filename (e.g. "00.check-prerequisites.md" → "Check Prerequisites")
      const label = slugToTitle(scenarioFile.replace(/^\d+\./, '').replace(/\.md$/, ''));
      refLinks.push(`* **${label}** [references/${scenarioFile}](references/${scenarioFile})`);
    }

    if (hasResult) {
      const content = readFile(resultPath).trim();
      const rendered = renderTemplate(content, context, `${skillName}/.result.md`);
      writeOutput(path.join(refsDir, 'expected-outcome.md'), rendered + '\n');
      refLinks.push(`* **Expected Outcome** [references/expected-outcome.md](references/expected-outcome.md)`);
    }

    // --- Build SKILL.md (preamble + reference links) ---
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

    const sections = [preamble];
    if (refLinks.length > 0) {
      sections.push('## Specific tasks\n\n' + refLinks.join('\n'));
    }

    const skillMd = frontmatter + '\n\n' + sections.filter(Boolean).join('\n\n') + '\n';

    writeOutput(path.join(outputDir, 'SKILL.md'), skillMd);
    console.log(
      `  OK ${skillName} → SKILL.md + ${scenarioFiles.length + (hasResult ? 1 : 0)} references (${skillMd.length} chars)`,
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Copy external skills (no Handlebars processing)
// ---------------------------------------------------------------------------
function copyExternalSkills() {
  console.log('\n--- Copying external skills ---');

  if (!fs.existsSync(SKILLS_EXT_DIR)) {
    console.log('  No prompts/skills-ext/ directory — skipping.');
    return;
  }

  const skillDirs = fs
    .readdirSync(SKILLS_EXT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const skillName of skillDirs) {
    const srcDir = path.join(SKILLS_EXT_DIR, skillName);
    const destDir = path.join(OUTPUT_SKILLS, skillName);
    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log(`  OK ${skillName} → copied as-is`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log('Building skills from', path.relative(process.cwd(), PROMPTS_DIR));

  const context = loadBuildContext();

  buildAgentInstructions(context);
  buildSkills(context);
  copyExternalSkills();

  if (totalWarnings > 0) {
    console.warn(`\nDone with ${totalWarnings} template variable warning(s).`);
  } else {
    console.log('\nDone.');
  }
}

main();
