/**
 * Configuration for the build-skills pipeline.
 */
export interface BuildConfig {
  /** Absolute path to the project root. */
  projectRoot: string;
  /** Directory containing prompts (agent-profiles, skills-tpl, skills-ext). Default: {projectRoot}/prompts */
  promptsDir?: string;
  /** Output directory for built skills. Default: {projectRoot}/skills */
  outputSkillsDir?: string;
  /** Output directory for generated TS files. Default: {projectRoot}/src/generated */
  outputGeneratedDir?: string;
  /** Build-time context — variables available in Handlebars templates. */
  context: Record<string, unknown>;
  /** Agent profile definitions. */
  agentProfiles?: AgentProfile[];
  /** Per-skill description overrides. Key = skill folder name, value = description text. */
  skillDescriptions?: Record<string, string>;
  /** Additional Handlebars helpers to register. */
  customHelpers?: Record<string, (...args: unknown[]) => unknown>;
  /** Override subdirectory names within promptsDir. */
  subdirs?: {
    profiles?: string;     // default: 'agent-profiles'
    skillsTpl?: string;    // default: 'skills-tpl'
    skillsExt?: string;    // default: 'skills-ext'
  };
  /** Optional CLI instance. When provided, cli metadata is auto-injected into context as `cli`. */
  cli?: { getMetadata(): Record<string, unknown> };
  /** Logger function. Default: console.log */
  logger?: (msg: string) => void;
}

/**
 * An agent profile — concatenates one or more template sections into a single instruction string.
 */
export interface AgentProfile {
  /** Agent name (used as variable name prefix in generated TS). */
  name: string;
  /** Template filenames within the profiles directory, concatenated in order. */
  sections: string[];
}

/**
 * Result of a build-skills run.
 */
export interface BuildResult {
  skillsBuilt: number;
  skillsCopied: number;
  agentProfilesBuilt: number;
  warnings: string[];
}
