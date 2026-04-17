/**
 * Convert a `powerhouse/ph-clint-project` document's global state into a
 * `ClintProjectSpec` that the code generator consumes.
 *
 * The document state is deliberately more permissive than the codegen spec:
 * `name` is nullable in the state (so empty documents are creatable), but the
 * generator requires a valid package name. Callers handle the `null` result
 * (typically by skipping the regen until the user sets a name).
 */
import type { PhClintProjectGlobalState } from 'ph-clint-app/document-models/ph-clint-project';
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
): ClintProjectSpec | null {
  if (!state.name) return null;

  // `documentTypes` is a forward-compatible field — older `ph-clint-project`
  // document states don't declare it yet. Pull through if present, otherwise
  // leave it to the schema default (`[]`). Codegen treats the empty list as
  // "no registry entries" and emits an empty `defineRegistry([...])`.
  const documentTypes =
    (state as { documentTypes?: unknown }).documentTypes ?? undefined;

  const parsed = clintProjectSpecSchema.safeParse({
    name: state.name,
    scope: state.scope ?? undefined,
    version: state.version,
    description: state.description,
    bin: state.bin ?? undefined,
    features: {
      powerhouse: { ...state.features.powerhouse },
      mastra: { ...state.features.mastra },
      routine: { ...state.features.routine },
    },
    ...(Array.isArray(documentTypes) ? { documentTypes } : {}),
  });

  return parsed.success ? parsed.data : null;
}
