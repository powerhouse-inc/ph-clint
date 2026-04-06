import type { DocumentDispatch } from "@powerhousedao/reactor-browser";
import {
  useDocumentsInSelectedDrive,
  useDocumentsInSelectedFolder,
  useDocumentById,
  useSelectedDocument,
} from "@powerhousedao/reactor-browser";
import type {
  AchraPresentationDocument,
  AchraPresentationAction,
} from "@powerhousedao/agent-manager/document-models/achra-presentation";
import { isAchraPresentationDocument } from "./gen/document-schema.js";

/** Hook to get a AchraPresentation document by its id */
export function useAchraPresentationDocumentById(
  documentId: string | null | undefined,
):
  | [AchraPresentationDocument, DocumentDispatch<AchraPresentationAction>]
  | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isAchraPresentationDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected AchraPresentation document */
export function useSelectedAchraPresentationDocument():
  | [AchraPresentationDocument, DocumentDispatch<AchraPresentationAction>]
  | [undefined, undefined] {
  const [document, dispatch] = useSelectedDocument();
  if (!isAchraPresentationDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get all AchraPresentation documents in the selected drive */
export function useAchraPresentationDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isAchraPresentationDocument);
}

/** Hook to get all AchraPresentation documents in the selected folder */
export function useAchraPresentationDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isAchraPresentationDocument);
}
