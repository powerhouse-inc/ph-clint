import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { agentChatDocumentType } from "./document-type.js";
import { AgentChatStateSchema } from "./schema/zod.js";
import type { AgentChatDocument, AgentChatPHState } from "./types.js";

/** Schema for validating the header object of a AgentChat document */
export const AgentChatDocumentHeaderSchema = BaseDocumentHeaderSchema.extend({
  documentType: z.literal(agentChatDocumentType),
});

/** Schema for validating the state object of a AgentChat document */
export const AgentChatPHStateSchema = BaseDocumentStateSchema.extend({
  global: AgentChatStateSchema(),
});

export const AgentChatDocumentSchema = z.object({
  header: AgentChatDocumentHeaderSchema,
  state: AgentChatPHStateSchema,
  initialState: AgentChatPHStateSchema,
});

/** Simple helper function to check if a state object is a AgentChat document state object */
export function isAgentChatState(state: unknown): state is AgentChatPHState {
  return AgentChatPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a AgentChat document state object */
export function assertIsAgentChatState(
  state: unknown,
): asserts state is AgentChatPHState {
  AgentChatPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a AgentChat document */
export function isAgentChatDocument(
  document: unknown,
): document is AgentChatDocument {
  return AgentChatDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a AgentChat document */
export function assertIsAgentChatDocument(
  document: unknown,
): asserts document is AgentChatDocument {
  AgentChatDocumentSchema.parse(document);
}
