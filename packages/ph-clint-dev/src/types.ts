/**
 * Configuration for the build-skills pipeline.
 */
export interface BuildConfig {
  /** CLI instance — source of truth for agent profiles, skill descriptions. */
  cli: { getMetadata(): object };
  /** Build-time context — variables available in Handlebars templates. */
  context: Record<string, unknown>;
  /** Directories containing prompt templates (agent-profiles/, skills-tpl/, skills-ext/). */
  include: string[];
  /** Output directories for both built skills and generated agent instruction files. Written to all paths. */
  output: string[];
  /** Additional Handlebars helpers to register. */
  customHelpers?: Record<string, (...args: unknown[]) => unknown>;
  /** Override subdirectory names within include dirs. */
  subdirs?: {
    profiles?: string;     // default: 'agent-profiles'
    skillsTpl?: string;    // default: 'skills-tpl'
    skillsExt?: string;    // default: 'skills-ext'
  };
  /** Logger function. Default: console.log */
  logger?: (msg: string) => void;
}

/**
 * Internal resolved config used by build sub-functions.
 * Derived from BuildConfig + CLI metadata.
 */
export interface ResolvedBuildConfig {
  /** All include directories (prompt template sources). */
  include: string[];
  /** Output directories for skills and agent instructions. */
  output: string[];
  /** Build-time context (merged with CLI metadata). */
  context: Record<string, unknown>;
  /** Agent profiles from CLI prompts.agents. */
  agentProfiles: AgentProfile[];
  /** Skill descriptions from CLI prompts.skills. */
  skillDescriptions: Record<string, string>;
  /** Subdirectory name overrides. */
  subdirs?: {
    profiles?: string;
    skillsTpl?: string;
    skillsExt?: string;
  };
  /** Additional Handlebars helpers. */
  customHelpers?: Record<string, (...args: unknown[]) => unknown>;
  /** Logger function. */
  logger: (msg: string) => void;
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
