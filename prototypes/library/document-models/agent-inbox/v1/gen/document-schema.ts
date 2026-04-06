import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { agentInboxDocumentType } from "./document-type.js";
import { AgentInboxStateSchema } from "./schema/zod.js";
import type { AgentInboxDocument, AgentInboxPHState } from "./types.js";

/** Schema for validating the header object of a AgentInbox document */
export const AgentInboxDocumentHeaderSchema = BaseDocumentHeaderSchema.extend({
  documentType: z.literal(agentInboxDocumentType),
});

/** Schema for validating the state object of a AgentInbox document */
export const AgentInboxPHStateSchema = BaseDocumentStateSchema.extend({
  global: AgentInboxStateSchema(),
});

export const AgentInboxDocumentSchema = z.object({
  header: AgentInboxDocumentHeaderSchema,
  state: AgentInboxPHStateSchema,
  initialState: AgentInboxPHStateSchema,
});

/** Simple helper function to check if a state object is a AgentInbox document state object */
export function isAgentInboxState(state: unknown): state is AgentInboxPHState {
  return AgentInboxPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a AgentInbox document state object */
export function assertIsAgentInboxState(
  state: unknown,
): asserts state is AgentInboxPHState {
  AgentInboxPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a AgentInbox document */
export function isAgentInboxDocument(
  document: unknown,
): document is AgentInboxDocument {
  return AgentInboxDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a AgentInbox document */
export function assertIsAgentInboxDocument(
  document: unknown,
): asserts document is AgentInboxDocument {
  AgentInboxDocumentSchema.parse(document);
}
