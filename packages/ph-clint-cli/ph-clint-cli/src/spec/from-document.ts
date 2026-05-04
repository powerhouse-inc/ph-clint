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
    ...state,
    scope: state.scope ?? undefined,
    documentId: meta?.documentId,
    documentType: meta?.documentType,
  });

  return parsed.success ? parsed.data : null;
}
