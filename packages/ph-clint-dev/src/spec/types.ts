/**
 * ClintProjectSpec — the in-memory shape that describes a ph-clint
 * implementation project. Persisted at
 * `{impl-project}/.ph/ph-clint-cli/project-spec.json` and consumed by
 * the code generator (src/codegen/).
 *
 * Intentionally minimal. Richer structure (services, skills, agents,
 * triggers, document-models) gets added in later phases as each
 * generator step actually needs it.
 */
import { z } from 'zod';

/**
 * Ordered Powerhouse integration level. Higher levels imply all lower ones:
 *   Disabled → Reactor → Switchboard → Connect
 */
export const POWERHOUSE_LEVELS = [
  'Disabled',
  'Reactor',
  'Switchboard',
  'Connect',
] as const;

export const powerhouseLevelSchema = z
  .enum(POWERHOUSE_LEVELS)
  .default('Disabled');

export type PowerhouseLevel = z.infer<typeof powerhouseLevelSchema>;

/** Check whether `level` is at least `threshold` in the ordered enum. */
export function phAtLeast(
  level: PowerhouseLevel,
  threshold: PowerhouseLevel,
): boolean {
  return (
    POWERHOUSE_LEVELS.indexOf(level) >= POWERHOUSE_LEVELS.indexOf(threshold)
  );
}

export const AGENT_ID_RE = /^[a-z][a-z0-9-]*$/;

export const agentModelSchema = z.object({
  id: z.string(),
  isDefault: z.boolean(),
});

export type AgentModel = z.infer<typeof agentModelSchema>;

export const agentProfileSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

export type AgentProfile = z.infer<typeof agentProfileSchema>;

const agentDefBase = {
  id: z.string().regex(AGENT_ID_RE),
  name: z.string(),
  modelId: z.string(),
  profileIds: z.array(z.string()),
  skills: z.array(z.string()),
  toolPatterns: z.array(z.string()),
};

export const mainAgentSchema = z.object({
  ...agentDefBase,
  description: z.string().nullable(),
  image: z.string().nullable(),
});

export type MainAgent = z.infer<typeof mainAgentSchema>;

export const subAgentSchema = z.object({
  ...agentDefBase,
  description: z.string(),
});

export type SubAgent = z.infer<typeof subAgentSchema>;

const mastraCommonSchema = z.object({
  enableChat: z.boolean().default(false),
});

const mastraFeatureSchema = z.object({
  enabled: z.boolean().default(false),
  mainAgent: mainAgentSchema.nullable().default(null),
  subAgents: z.array(subAgentSchema).default([]),
  models: z.array(agentModelSchema).default([]),
  profiles: z.array(agentProfileSchema).default([]),
  common: mastraCommonSchema.default({ enableChat: false }),
});

export type MastraFeature = z.infer<typeof mastraFeatureSchema>;

const routineFeatureSchema = z.object({
  enabled: z.boolean().default(false),
});

const DEFAULT_MASTRA: z.infer<typeof mastraFeatureSchema> = {
  enabled: false,
  mainAgent: null,
  subAgents: [],
  models: [],
  profiles: [],
  common: { enableChat: false },
};
const DEFAULT_ROUTINE = { enabled: false } as const;

export const powerhousePackageSchema = z.object({
  id: z.string(),
  packageName: z.string(),
  documentTypes: z.array(z.string()).default([]),
  version: z.string().nullable().default(null),
});

export type PowerhousePackage = z.infer<typeof powerhousePackageSchema>;

export const externalSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  githubUrl: z.string(),
});

export type ExternalSkill = z.infer<typeof externalSkillSchema>;

export const clintProjectSpecSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*-cli$/, 'must end with -cli, lowercase letters, digits, hyphens only'),
  scope: z
    .string()
    .regex(/^@[a-z0-9][a-z0-9-]*$/, 'must start with @, lowercase letters, digits, hyphens only')
    .optional(),
  version: z.string().default('0.0.1-dev.0'),
  description: z.string().default(''),
  features: z
    .object({
      powerhouse: powerhouseLevelSchema,
      mastra: mastraFeatureSchema.default(DEFAULT_MASTRA),
      routine: routineFeatureSchema.default(DEFAULT_ROUTINE),
    })
    .default({
      powerhouse: 'Disabled' as const,
      mastra: DEFAULT_MASTRA,
      routine: DEFAULT_ROUTINE,
    }),
  /**
   * Reactor packages and their document types. Each entry groups a package
   * name with the document type IDs it provides. The app package (project's
   * own reactor package) uses a `file:` dependency; external packages become
   * versioned npm dependencies. Drives codegen of `framework.gen.ts`,
   * `app/index.ts`, and `cli/package.json`.
   */
  packages: z.array(powerhousePackageSchema).default([]),
  /**
   * External skills from the skills.sh ecosystem. Each skill has a name
   * (kebab-case) and a GitHub URL for installation.
   */
  externalSkills: z.array(externalSkillSchema).default([]),
  deployment: z.object({
    proxyEnabled: z.boolean().default(false),
    observabilityEnabled: z.boolean().default(false),
    supportedResources: z.array(z.string()).default([]),
  }).default({ proxyEnabled: false, observabilityEnabled: false, supportedResources: [] }),
  /** ID of the source specification document (if backed by a Powerhouse document). */
  documentId: z.string().optional(),
  /** Document type of the source specification document. */
  documentType: z.string().optional(),
});

export type ClintProjectSpec = z.infer<typeof clintProjectSpecSchema>;
export type ClintProjectSpecInput = z.input<typeof clintProjectSpecSchema>;

/** Every agent id in the project: `[mainAgent.id, ...subAgents.map(s => s.id)]` filtered for null main. */
export function getAgentIds(spec: ClintProjectSpec): string[] {
  const main = spec.features.mastra.mainAgent;
  const subs = spec.features.mastra.subAgents.map((s) => s.id);
  return main ? [main.id, ...subs] : subs;
}

/** Resolve an agentId to the main agent or one of the sub-agents. Returns undefined if not found. */
export function getAgent(
  spec: ClintProjectSpec,
  agentId: string,
): MainAgent | SubAgent | undefined {
  const main = spec.features.mastra.mainAgent;
  if (main && main.id === agentId) return main;
  return spec.features.mastra.subAgents.find((s) => s.id === agentId);
}

/** True when `agentId` is the main agent's id. */
export function isMainAgent(spec: ClintProjectSpec, agentId: string): boolean {
  const main = spec.features.mastra.mainAgent;
  return !!main && main.id === agentId;
}

/** Look up the AgentModel an agent references. Throws if the FK is broken. */
export function getAgentModel(
  spec: ClintProjectSpec,
  agentId: string,
): AgentModel {
  const agent = getAgent(spec, agentId);
  if (!agent) throw new Error(`Agent not found: ${agentId}`);
  const model = spec.features.mastra.models.find((m) => m.id === agent.modelId);
  if (!model)
    throw new Error(
      `Model FK broken: agent '${agentId}' references missing model '${agent.modelId}'`,
    );
  return model;
}

/** Resolve an agent's profile references in declared order. Throws on FK breaks. */
export function getAgentProfiles(
  spec: ClintProjectSpec,
  agentId: string,
): AgentProfile[] {
  const agent = getAgent(spec, agentId);
  if (!agent) throw new Error(`Agent not found: ${agentId}`);
  return agent.profileIds.map((pid) => {
    const profile = spec.features.mastra.profiles.find((p) => p.id === pid);
    if (!profile)
      throw new Error(
        `Profile FK broken: agent '${agentId}' references missing profile '${pid}'`,
      );
    return profile;
  });
}

/** Unique provider prefixes (e.g. `anthropic`, `openai`) across every agent's modelId. */
export function getAllProviders(spec: ClintProjectSpec): string[] {
  const providers = new Set<string>();
  for (const agentId of getAgentIds(spec)) {
    const agent = getAgent(spec, agentId);
    if (!agent) continue;
    const [provider] = agent.modelId.split(/[:/]/);
    if (provider) providers.add(provider);
  }
  return [...providers];
}

/** npm package name (e.g. `@scope/my-tool-cli` or `my-tool-cli`). */
export function getPackageName(spec: ClintProjectSpec): string {
  return spec.scope ? `${spec.scope}/${spec.name}` : spec.name;
}

/** bin name (strips -cli suffix, e.g. `my-tool-cli` → `my-tool`). */
export function getBinName(spec: ClintProjectSpec): string {
  return spec.name.replace(/-cli$/, '');
}

/**
 * Name of the CLI sub-folder when the project is split (Powerhouse enabled).
 * For flat projects this is irrelevant — callers use the project root directly.
 */
export function getCliFolderName(spec: ClintProjectSpec): string {
  return spec.name;
}

/**
 * Name of the reactor-package sub-folder when the project is split.
 */
export function getAppFolderName(spec: ClintProjectSpec): string {
  return spec.name.replace(/-cli$/, '-app');
}

/**
 * Flat list of all document types across all packages. Convenience for
 * codegen that needs to iterate every registered document type regardless
 * of which package provides it.
 */
export function getAllDocumentTypes(spec: ClintProjectSpec): string[] {
  return spec.packages.flatMap((p) => p.documentTypes);
}

/**
 * The app npm package name (`@scope/my-tool-app` or `my-tool-app`).
 * Matches what the document model reducer stores in `packages[].packageName`.
 */
export function getAppPackageName(spec: ClintProjectSpec): string {
  const base = getAppFolderName(spec);
  return spec.scope ? `${spec.scope}/${base}` : base;
}

/** Directory name for the app package (e.g. `my-tool-app`, no scope prefix). */
export function getAppDirName(spec: ClintProjectSpec): string {
  return getAppFolderName(spec);
}

/**
 * Folder slug for a documentType ID. The slug is the portion after the last
 * `/` (e.g. `powerhouse/ph-clint-project` → `ph-clint-project`). Matches the
 * convention used by Powerhouse's reactor-package codegen — each document
 * model lives at `document-models/<slug>/`.
 */
export function getDocumentTypeSlug(documentType: string): string {
  const lastSlash = documentType.lastIndexOf('/');
  return lastSlash >= 0 ? documentType.slice(lastSlash + 1) : documentType;
}

/**
 * PascalCase export name for a documentType ID. Powerhouse's module
 * generator exports each module as `PascalCase(<slug>)` (e.g.
 * `powerhouse/ph-clint-project` → `PhClintProject`). The top-level reactor
 * package re-exports these names, so this helper gives codegen the string
 * it needs both for the import and the `defineRegistry` entry.
 */
export function getDocumentTypeModuleName(documentType: string): string {
  const slug = getDocumentTypeSlug(documentType);
  return slug
    .split(/[-_]/)
    .filter((s) => s.length > 0)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('');
}

/**
 * Returns true when a documentType entry contains glob wildcards (`*`).
 * Glob entries like `*​/*`, `powerhouse/*`, or `powerhouse/doc-*` are spec
 * shorthand meaning "all matching document types from this package" and
 * must be resolved at runtime rather than emitted as static imports.
 */
export function isDocTypeGlob(documentType: string): boolean {
  return documentType.includes('*');
}

/**
 * Convert a documentType glob pattern to a regex source string suitable
 * for embedding in a `/pattern/` literal.  Each `*` matches any non-`/`
 * characters. Forward slashes are escaped so the output is safe inside
 * `/.../`.
 *
 * Examples:
 *   `*​/*`            → `^[^\/]*\/[^\/]*$`   (any org, any name)
 *   `powerhouse/*`   → `^powerhouse\/[^\/]*$`
 *   `powerhouse/doc-*` → `^powerhouse\/doc-[^\/]*$`
 */
export function docTypeGlobToRegex(pattern: string): string {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\\/]/g, '\\$&');
  const withWildcards = escaped.replace(/\*/g, '[^\\/]*');
  return `^${withWildcards}$`;
}
