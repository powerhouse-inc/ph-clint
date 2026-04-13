import type { BuildConfig, BuildResult, ResolvedBuildConfig } from './types.js';
import { buildAgentProfiles } from './agent-profiles.js';
import { buildSkillTemplates } from './skill-builder.js';
import { copyExternalSkills } from './skill-copier.js';

/**
 * Resolve a BuildConfig into the internal ResolvedBuildConfig by
 * extracting agent profiles and skill descriptions from CLI metadata.
 */
function resolve(config: BuildConfig): ResolvedBuildConfig {
  const meta = config.cli.getMetadata() as Record<string, unknown>;
  const prompts = (meta.prompts ?? {}) as {
    agents?: Record<string, { name: string; sections: string[]; skills: string[] }>;
    skills?: Record<string, { description: string }>;
  };

  // Extract agent profiles from CLI prompts.agents
  const agentProfiles = Object.values(prompts.agents ?? {}).map((a) => ({
    name: a.name,
    sections: a.sections,
  }));

  // Extract description strings from skill configs
  const skillDescriptions: Record<string, string> = {};
  for (const [id, skill] of Object.entries(prompts.skills ?? {})) {
    skillDescriptions[id] = skill.description;
  }

  return {
    include: config.include,
    output: config.output,
    context: { ...config.context, ...meta },
    agentProfiles,
    skillDescriptions,
    subdirs: config.subdirs,
    customHelpers: config.customHelpers,
    logger: config.logger ?? console.log,
  };
}

/**
 * Build skills from Handlebars templates.
 * Orchestrates three steps:
 * 1. Build agent profile instructions (base + specialized templates → Markdown)
 * 2. Build SKILL.md files from template directories
 * 3. Copy external skills as-is
 */
export function buildSkills(config: BuildConfig): BuildResult {
  const resolved = resolve(config);
  const log = resolved.logger;
  const allWarnings: string[] = [];

  log(`Building skills from ${resolved.include.join(', ')}`);

  // 1. Agent profiles
  const profiles = buildAgentProfiles(resolved);
  allWarnings.push(...profiles.warnings);

  // 2. Skill templates
  const templates = buildSkillTemplates(resolved);
  allWarnings.push(...templates.warnings);

  // 3. External skills
  const copied = copyExternalSkills(resolved);

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
