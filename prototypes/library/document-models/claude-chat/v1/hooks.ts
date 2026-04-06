import type { DocumentDispatch } from "@powerhousedao/reactor-browser";
import {
  useDocumentById,
  useDocumentsInSelectedDrive,
  useDocumentsInSelectedFolder,
  useSelectedDocument,
} from "@powerhousedao/reactor-browser";
import type {
  ClaudeChatAction,
  ClaudeChatDocument,
} from "@powerhousedao/agent-manager/document-models/claude-chat/v1";
import {
  assertIsClaudeChatDocument,
  isClaudeChatDocument,
} from "./gen/document-schema.js";

/** Hook to get a ClaudeChat document by its id */
export function useClaudeChatDocumentById(
  documentId: string | null | undefined,
):
  | [ClaudeChatDocument, DocumentDispatch<ClaudeChatAction>]
  | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isClaudeChatDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected ClaudeChat document */
export function useSelectedClaudeChatDocument(): [
  ClaudeChatDocument,
  DocumentDispatch<ClaudeChatAction>,
] {
  const [document, dispatch] = useSelectedDocument();

  assertIsClaudeChatDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all ClaudeChat documents in the selected drive */
export function useClaudeChatDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isClaudeChatDocument);
}

/** Hook to get all ClaudeChat documents in the selected folder */
export function useClaudeChatDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isClaudeChatDocument);
}
