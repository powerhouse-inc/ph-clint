import type { DocumentDispatch } from "@powerhousedao/reactor-browser";
import {
  useDocumentById,
  useDocumentsInSelectedDrive,
  useDocumentsInSelectedFolder,
  useSelectedDocument,
} from "@powerhousedao/reactor-browser";
import type {
  AgentChatAction,
  AgentChatDocument,
} from "document-models/agent-chat/v1";
import {
  assertIsAgentChatDocument,
  isAgentChatDocument,
} from "./gen/document-schema.js";

/** Hook to get a AgentChat document by its id */
export function useAgentChatDocumentById(
  documentId: string | null | undefined,
):
  | [AgentChatDocument, DocumentDispatch<AgentChatAction>]
  | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isAgentChatDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected AgentChat document */
export function useSelectedAgentChatDocument(): [
  AgentChatDocument,
  DocumentDispatch<AgentChatAction>,
] {
  const [document, dispatch] = useSelectedDocument();

  assertIsAgentChatDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all AgentChat documents in the selected drive */
export function useAgentChatDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isAgentChatDocument);
}

/** Hook to get all AgentChat documents in the selected folder */
export function useAgentChatDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isAgentChatDocument);
}
