import fs from 'node:fs';
import path from 'node:path';
import { renderSkillTemplate } from 'ph-clint';
import type { BuildConfig } from './types.js';

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Build SKILL.md files from Handlebars templates in skills-tpl/.
 * Each skill directory produces a SKILL.md + references/ folder.
 *
 * @returns Number of skills built and any warnings.
 */
export function buildSkillTemplates(config: BuildConfig): { count: number; warnings: string[] } {
  const log = config.logger ?? console.log;
  const skillsTplDir = path.join(
    config.promptsDir ?? path.join(config.projectRoot, 'prompts'),
    config.subdirs?.skillsTpl ?? 'skills-tpl',
  );
  const outputSkillsDir = config.outputSkillsDir ?? path.join(config.projectRoot, 'skills');

  log('\n--- Building SKILL.md files (templates) ---');

  if (!fs.existsSync(skillsTplDir)) {
    log('  No skills-tpl/ directory — skipping.');
    return { count: 0, warnings: [] };
  }

  const skillDirs = fs
    .readdirSync(skillsTplDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const allWarnings: string[] = [];
  const renderOpts = config.customHelpers ? { helpers: config.customHelpers } : undefined;
  let count = 0;

  for (const skillName of skillDirs) {
    const skillDir = path.join(skillsTplDir, skillName);
    const outputDir = path.join(outputSkillsDir, skillName);
    const refsDir = path.join(outputDir, 'references');

    // Preamble
    const preamblePath = path.join(skillDir, '.preamble.md');
    const preambleRaw = fs.existsSync(preamblePath) ? fs.readFileSync(preamblePath, 'utf-8').trim() : '';
    let preamble = '';
    if (preambleRaw) {
      const r = renderSkillTemplate(preambleRaw, config.context, renderOpts);
      preamble = r.rendered;
      for (const w of r.warnings) {
        const msg = `${skillName}/.preamble.md: ${w}`;
        allWarnings.push(msg);
        log(`  WARN ${msg}`);
      }
    }

    // Scenario files (NN.name.md)
    const scenarioFiles = fs
      .readdirSync(skillDir)
      .filter((f) => /^\d+\..*\.md$/.test(f))
      .sort();

    // Result file
    const resultPath = path.join(skillDir, '.result.md');
    const hasResult = fs.existsSync(resultPath);

    if (!preamble && scenarioFiles.length === 0 && !hasResult) {
      log(`  SKIP ${skillName}: no content files found`);
      continue;
    }

    // Render and write references
    const refLinks: string[] = [];
    if (scenarioFiles.length > 0 || hasResult) {
      fs.mkdirSync(refsDir, { recursive: true });
    }

    for (const scenarioFile of scenarioFiles) {
      const content = fs.readFileSync(path.join(skillDir, scenarioFile), 'utf-8').trim();
      const r = renderSkillTemplate(content, config.context, renderOpts);
      for (const w of r.warnings) {
        const msg = `${skillName}/${scenarioFile}: ${w}`;
        allWarnings.push(msg);
        log(`  WARN ${msg}`);
      }
      fs.mkdirSync(path.dirname(path.join(refsDir, scenarioFile)), { recursive: true });
      fs.writeFileSync(path.join(refsDir, scenarioFile), r.rendered + '\n', 'utf-8');
      const label = slugToTitle(scenarioFile.replace(/^\d+\./, '').replace(/\.md$/, ''));
      refLinks.push(`* **${label}** [references/${scenarioFile}](references/${scenarioFile})`);
    }

    if (hasResult) {
      const content = fs.readFileSync(resultPath, 'utf-8').trim();
      const r = renderSkillTemplate(content, config.context, renderOpts);
      for (const w of r.warnings) {
        const msg = `${skillName}/.result.md: ${w}`;
        allWarnings.push(msg);
        log(`  WARN ${msg}`);
      }
      fs.writeFileSync(path.join(refsDir, 'expected-outcome.md'), r.rendered + '\n', 'utf-8');
      refLinks.push(`* **Expected Outcome** [references/expected-outcome.md](references/expected-outcome.md)`);
    }

    // Build SKILL.md
    const description = config.skillDescriptions?.[skillName] ?? `${slugToTitle(skillName)} tasks`;

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

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'SKILL.md'), skillMd, 'utf-8');
    log(`  OK ${skillName} → SKILL.md + ${scenarioFiles.length + (hasResult ? 1 : 0)} references (${skillMd.length} chars)`);
    count++;
  }

  return { count, warnings: allWarnings };
}
