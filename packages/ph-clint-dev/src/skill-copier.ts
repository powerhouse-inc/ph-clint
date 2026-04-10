import fs from 'node:fs';
import path from 'node:path';
import type { BuildConfig } from './types.js';

/**
 * Copy external skills from skills-ext/ to the output directory without processing.
 *
 * @returns Number of skills copied.
 */
export function copyExternalSkills(config: BuildConfig): number {
  const log = config.logger ?? console.log;
  const skillsExtDir = path.join(
    config.promptsDir ?? path.join(config.projectRoot, 'prompts'),
    config.subdirs?.skillsExt ?? 'skills-ext',
  );
  const outputSkillsDir = config.outputSkillsDir ?? path.join(config.projectRoot, 'skills');

  log('\n--- Copying external skills ---');

  if (!fs.existsSync(skillsExtDir)) {
    log('  No skills-ext/ directory — skipping.');
    return 0;
  }

  const skillDirs = fs
    .readdirSync(skillsExtDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const skillName of skillDirs) {
    const srcDir = path.join(skillsExtDir, skillName);
    const destDir = path.join(outputSkillsDir, skillName);
    fs.cpSync(srcDir, destDir, { recursive: true });
    log(`  OK ${skillName} → copied as-is`);
  }

  return skillDirs.length;
}
