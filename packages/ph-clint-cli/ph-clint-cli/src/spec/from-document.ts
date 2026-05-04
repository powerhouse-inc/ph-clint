/**
 * Convert a `powerhouse/ph-clint-project` document's global state into a
 * `ClintProjectSpec` that the code generator consumes.
 *
 * The document state is deliberately more permissive than the codegen spec:
 * `name` is nullable in the state (so empty documents are creatable), but the
 * generator requires a valid package name. Callers handle the `null` result
 * (typically by skipping the regen until the user sets a name).
 */
import type { PhClintProjectGlobalState } from '@powerhousedao/ph-clint-app/document-models/ph-clint-project';
import {
  clintProjectSpecSchema,
  type ClintProjectSpec,
} from './types.js';

/**
 * Build a `ClintProjectSpec` from the document state.
 *
 * Returns `null` if the document has no valid package name yet — callers
 * should wait for the user to populate it before triggering codegen.
 */
export function specFromDocumentState(
  state: PhClintProjectGlobalState,
  meta?: { documentId?: string; documentType?: string },
): ClintProjectSpec | null {
  if (!state.name) return null;

  const parsed = clintProjectSpecSchema.safeParse({
    name: state.name,
    scope: state.scope ?? undefined,
    version: state.version,
    description: state.description,
    features: {
      powerhouse: state.features.powerhouse,
      mastra: { ...state.features.mastra },
      routine: { ...state.features.routine },
    },
    packages: state.packages.map((p) => ({
      id: p.id,
      packageName: p.packageName,
      documentTypes: [...p.documentTypes],
    })),
    externalSkills: state.externalSkills.map((s) => ({
      id: s.id,
      name: s.name,
      githubUrl: s.githubUrl,
    })),
    deployment: {
      proxyEnabled: state.deployment.proxyEnabled,
      supportedResources: [...state.deployment.supportedResources],
    },
    documentId: meta?.documentId,
    documentType: meta?.documentType,
  });

  return parsed.success ? parsed.data : null;
}
