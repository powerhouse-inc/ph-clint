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

const powerhouseFeatureSchema = z.object({
  enabled: z.boolean().default(false),
  switchboard: z.boolean().default(true),
  connect: z.boolean().default(true),
});

const mastraFeatureSchema = z.object({
  enabled: z.boolean().default(false),
});

const routineFeatureSchema = z.object({
  enabled: z.boolean().default(false),
});

// Zod 4 does not cascade `.default({})` through nested object schemas — a
// missing outer key fills in `{}`, but nested keys with their own `.default`
// are not re-defaulted unless the object itself re-parses. We spell out full
// defaults here so `clintProjectSpecSchema.parse({ name: 'x' })` yields a
// fully-populated feature tree.
const DEFAULT_POWERHOUSE = {
  enabled: false,
  switchboard: true,
  connect: true,
} as const;
const DEFAULT_MASTRA = { enabled: false } as const;
const DEFAULT_ROUTINE = { enabled: false } as const;

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
      powerhouse: powerhouseFeatureSchema.default(DEFAULT_POWERHOUSE),
      mastra: mastraFeatureSchema.default(DEFAULT_MASTRA),
      routine: routineFeatureSchema.default(DEFAULT_ROUTINE),
    })
    .default({
      powerhouse: DEFAULT_POWERHOUSE,
      mastra: DEFAULT_MASTRA,
      routine: DEFAULT_ROUTINE,
    }),
  /**
   * Document types registered with this CLI — full documentType ID strings
   * (e.g. `powerhouse/ph-clint-project`). Drives codegen of `src/framework.gen.ts`,
   * which emits a typed `defineRegistry([...] as const)` call so impl code
   * gets narrowed `reactor.client.get(id, 'my-type')` access. Empty on
   * fresh projects — populated as document models are added to the reactor
   * package.
   */
  documentTypes: z.array(z.string()).default([]),
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
