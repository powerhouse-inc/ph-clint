import type { BuildConfig, BuildResult } from './types.js';
import { buildAgentProfiles } from './agent-profiles.js';
import { buildSkillTemplates } from './skill-builder.js';
import { copyExternalSkills } from './skill-copier.js';

/**
 * Build skills from Handlebars templates.
 * Orchestrates three steps:
 * 1. Build agent profile instructions (base + specialized templates → TS export)
 * 2. Build SKILL.md files from template directories
 * 3. Copy external skills as-is
 */
export function buildSkills(config: BuildConfig): BuildResult {
  // Auto-inject CLI metadata into template context when cli is provided.
  // Metadata properties (commands, services, skills, config, etc.) are spread
  // at the top level so templates can use e.g. {{commands.vetra-start.id}}.
  if (config.cli) {
    const meta = config.cli.getMetadata();
    config = { ...config, context: { ...config.context, ...meta } };
  }

  const log = config.logger ?? console.log;
  const allWarnings: string[] = [];

  log(`Building skills from ${config.promptsDir ?? config.projectRoot + '/prompts'}`);

  // 1. Agent profiles
  const profiles = buildAgentProfiles(config);
  allWarnings.push(...profiles.warnings);

  // 2. Skill templates
  const templates = buildSkillTemplates(config);
  allWarnings.push(...templates.warnings);

  // 3. External skills
  const copied = copyExternalSkills(config);

  if (allWarnings.length > 0) {
    log(`\nDone with ${allWarnings.length} template variable warning(s).`);
  } else {
    log('\nDone.');
  }

  return {
    agentProfilesBuilt: profiles.count,
    skillsBuilt: templates.count,
    skillsCopied: copied,
    warnings: allWarnings,
  };
}
