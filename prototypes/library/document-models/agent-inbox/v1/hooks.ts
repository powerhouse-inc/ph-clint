import type { DocumentDispatch } from "@powerhousedao/reactor-browser";
import {
  useDocumentById,
  useDocumentsInSelectedDrive,
  useDocumentsInSelectedFolder,
  useSelectedDocument,
} from "@powerhousedao/reactor-browser";
import type {
  AgentInboxAction,
  AgentInboxDocument,
} from "@powerhousedao/agent-manager/document-models/agent-inbox/v1";
import {
  assertIsAgentInboxDocument,
  isAgentInboxDocument,
} from "./gen/document-schema.js";

/** Hook to get a AgentInbox document by its id */
export function useAgentInboxDocumentById(
  documentId: string | null | undefined,
):
  | [AgentInboxDocument, DocumentDispatch<AgentInboxAction>]
  | [undefined, undefined] {
  const [document, dispatch] = useDocumentById(documentId);
  if (!isAgentInboxDocument(document)) return [undefined, undefined];
  return [document, dispatch];
}

/** Hook to get the selected AgentInbox document */
export function useSelectedAgentInboxDocument(): [
  AgentInboxDocument,
  DocumentDispatch<AgentInboxAction>,
] {
  const [document, dispatch] = useSelectedDocument();

  assertIsAgentInboxDocument(document);
  return [document, dispatch] as const;
}

/** Hook to get all AgentInbox documents in the selected drive */
export function useAgentInboxDocumentsInSelectedDrive() {
  const documentsInSelectedDrive = useDocumentsInSelectedDrive();
  return documentsInSelectedDrive?.filter(isAgentInboxDocument);
}

/** Hook to get all AgentInbox documents in the selected folder */
export function useAgentInboxDocumentsInSelectedFolder() {
  const documentsInSelectedFolder = useDocumentsInSelectedFolder();
  return documentsInSelectedFolder?.filter(isAgentInboxDocument);
}
