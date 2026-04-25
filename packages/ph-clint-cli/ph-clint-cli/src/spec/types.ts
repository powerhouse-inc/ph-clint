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

const mastraFeatureSchema = z.object({
  enabled: z.boolean().default(false),
});

const routineFeatureSchema = z.object({
  enabled: z.boolean().default(false),
});

const DEFAULT_MASTRA = { enabled: false } as const;
const DEFAULT_ROUTINE = { enabled: false } as const;

export const powerhousePackageSchema = z.object({
  id: z.string(),
  packageName: z.string(),
  documentTypes: z.array(z.string()).default([]),
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
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, digits, hyphens only'),
  scope: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, digits, hyphens only')
    .optional(),
  version: z.string().default('0.0.1-dev.0'),
  description: z.string().default(''),
  bin: z.string().optional(),
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
  /** ID of the source specification document (if backed by a Powerhouse document). */
  documentId: z.string().optional(),
  /** Document type of the source specification document. */
  documentType: z.string().optional(),
});

export type ClintProjectSpec = z.infer<typeof clintProjectSpecSchema>;
export type ClintProjectSpecInput = z.input<typeof clintProjectSpecSchema>;

/** npm package name (e.g. `@scope/foo` or `foo`). */
export function getPackageName(spec: ClintProjectSpec): string {
  return spec.scope ? `@${spec.scope}/${spec.name}` : spec.name;
}

/** bin name (defaults to the bare project name). */
export function getBinName(spec: ClintProjectSpec): string {
  return spec.bin ?? spec.name;
}

/**
 * Name of the CLI sub-folder when the project is split (Powerhouse enabled).
 * For flat projects this is irrelevant — callers use the project root directly.
 */
export function getCliFolderName(spec: ClintProjectSpec): string {
  return `${spec.name}-cli`;
}

/**
 * Name of the reactor-package sub-folder when the project is split.
 */
export function getAppFolderName(spec: ClintProjectSpec): string {
  return `${spec.name}-app`;
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
 * The app npm package name (`@scope/{name}-app` or `{name}-app`).
 * Matches what the document model reducer stores in `packages[].packageName`.
 */
export function getAppPackageName(spec: ClintProjectSpec): string {
  const base = `${spec.name}-app`;
  return spec.scope ? `@${spec.scope}/${base}` : base;
}

/** Directory name for the app package (`{name}-app`, no scope prefix). */
export function getAppDirName(spec: ClintProjectSpec): string {
  return `${spec.name}-app`;
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
