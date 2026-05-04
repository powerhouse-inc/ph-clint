/**
 * Ensure a ph-clint-project spec document exists in the personal drive.
 *
 * Single code path used by:
 *   - `clint-project-init` (after scaffolding)
 *   - `clint-project-regen` (recover deleted docs)
 *   - `spec-change` trigger (auto-link unlinked projects)
 *
 * If the spec already has a `documentId` that exists in the drive, this is
 * a no-op. If the document was deleted (or never created), a new one is
 * created, added to the drive at `specs/{name}`, and the spec JSON on disk
 * is updated with the new `documentId`.
 */
import { importSpec } from '@powerhousedao/ph-clint-app/document-models/ph-clint-project';
import type { FolderOperations } from '@powerhousedao/ph-clint';
import type { ReactorContext, DocumentRegistry } from '@powerhousedao/ph-clint';
import { writeProjectSpec } from './file.js';
import { specToImportInput } from '../triggers/spec-change.js';
import type { ClintProjectSpec } from './types.js';

const DOCUMENT_TYPE = 'powerhouse/ph-clint-project';

export interface EnsureSpecDocumentResult {
  docId: string;
  created: boolean;
}

/**
 * Ensure the spec document exists in the personal drive. Creates one if
 * missing or if the existing `documentId` no longer resolves to a drive node.
 */
export async function ensureSpecDocument<R extends DocumentRegistry = DocumentRegistry>(opts: {
  spec: ClintProjectSpec;
  targetDir: string;
  reactor: ReactorContext<R>;
  folders: FolderOperations;
}): Promise<EnsureSpecDocumentResult> {
  const { spec, targetDir, reactor, folders } = opts;

  // Check if the document already exists in the drive's folder tree
  if (spec.documentId) {
    const entries = await folders.findByType(DOCUMENT_TYPE);
    const inDrive = entries.some((e) => e.id === spec.documentId);
    if (inDrive) return { docId: spec.documentId, created: false };
  }

  // Reuse existing document if it's still in the reactor, otherwise create new
  let docId: string;
  if (spec.documentId) {
    try {
      const existing = await reactor.client.get(spec.documentId);
      if (existing) {
        docId = spec.documentId;
      } else {
        const newDoc = await reactor.client.createEmpty(DOCUMENT_TYPE);
        docId = (newDoc as any).header.id;
      }
    } catch {
      const newDoc = await reactor.client.createEmpty(DOCUMENT_TYPE);
      docId = (newDoc as any).header.id;
    }
  } else {
    const newDoc = await reactor.client.createEmpty(DOCUMENT_TYPE);
    docId = (newDoc as any).header.id;
  }

  // Add to the drive's folder tree
  await folders.addDocument(docId, `specs/${spec.name}`, spec.name);

  const importInput = specToImportInput(spec);
  await reactor.client.execute(docId, 'main', [importSpec(importInput)]);

  // Persist the link back to disk
  spec.documentId = docId;
  spec.documentType = DOCUMENT_TYPE;
  await writeProjectSpec(targetDir, spec);

  return { docId, created: true };
}
