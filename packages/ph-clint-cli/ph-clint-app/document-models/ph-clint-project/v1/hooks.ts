/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { DocumentDispatch } from '@powerhousedao/reactor-browser';
import { useDocumentById, useDocumentsInSelectedDrive, useDocumentsInSelectedFolder, useSelectedDocument } from '@powerhousedao/reactor-browser';
import type { PhClintProjectAction, PhClintProjectDocument } from 'document-models/ph-clint-project/v1';
import { assertIsPhClintProjectDocument, isPhClintProjectDocument } from './gen/document-schema.js';

/** Hook to get a PhClintProject document by its id */
export function usePhClintProjectDocumentById(documentId: string | null | undefined): [PhClintProjectDocument, DocumentDispatch<PhClintProjectAction>] | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isPhClintProjectDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected PhClintProject document */
export function useSelectedPhClintProjectDocument(): [PhClintProjectDocument, DocumentDispatch<PhClintProjectAction>] {
  const [document, dispatch] = useSelectedDocument();

  assertIsPhClintProjectDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all PhClintProject documents in the selected drive */
export function usePhClintProjectDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isPhClintProjectDocument);
}

/** Hook to get all PhClintProject documents in the selected folder */
export function usePhClintProjectDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isPhClintProjectDocument);
}
