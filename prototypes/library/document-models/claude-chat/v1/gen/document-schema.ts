import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { claudeChatDocumentType } from "./document-type.js";
import { ClaudeChatStateSchema } from "./schema/zod.js";
import type { ClaudeChatDocument, ClaudeChatPHState } from "./types.js";

/** Schema for validating the header object of a ClaudeChat document */
export const ClaudeChatDocumentHeaderSchema = BaseDocumentHeaderSchema.extend({
  documentType: z.literal(claudeChatDocumentType),
});

/** Schema for validating the state object of a ClaudeChat document */
export const ClaudeChatPHStateSchema = BaseDocumentStateSchema.extend({
  global: ClaudeChatStateSchema(),
});

export const ClaudeChatDocumentSchema = z.object({
  header: ClaudeChatDocumentHeaderSchema,
  state: ClaudeChatPHStateSchema,
  initialState: ClaudeChatPHStateSchema,
});

/** Simple helper function to check if a state object is a ClaudeChat document state object */
export function isClaudeChatState(state: unknown): state is ClaudeChatPHState {
  return ClaudeChatPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a ClaudeChat document state object */
export function assertIsClaudeChatState(
  state: unknown,
): asserts state is ClaudeChatPHState {
  ClaudeChatPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a ClaudeChat document */
export function isClaudeChatDocument(
  document: unknown,
): document is ClaudeChatDocument {
  return ClaudeChatDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a ClaudeChat document */
export function assertIsClaudeChatDocument(
  document: unknown,
): asserts document is ClaudeChatDocument {
  ClaudeChatDocumentSchema.parse(document);
}
