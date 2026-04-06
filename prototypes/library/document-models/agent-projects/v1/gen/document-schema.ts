import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { agentProjectsDocumentType } from "./document-type.js";
import { AgentProjectsStateSchema } from "./schema/zod.js";
import type { AgentProjectsDocument, AgentProjectsPHState } from "./types.js";

/** Schema for validating the header object of a AgentProjects document */
export const AgentProjectsDocumentHeaderSchema =
  BaseDocumentHeaderSchema.extend({
    documentType: z.literal(agentProjectsDocumentType),
  });

/** Schema for validating the state object of a AgentProjects document */
export const AgentProjectsPHStateSchema = BaseDocumentStateSchema.extend({
  global: AgentProjectsStateSchema(),
});

export const AgentProjectsDocumentSchema = z.object({
  header: AgentProjectsDocumentHeaderSchema,
  state: AgentProjectsPHStateSchema,
  initialState: AgentProjectsPHStateSchema,
});

/** Simple helper function to check if a state object is a AgentProjects document state object */
export function isAgentProjectsState(
  state: unknown,
): state is AgentProjectsPHState {
  return AgentProjectsPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a AgentProjects document state object */
export function assertIsAgentProjectsState(
  state: unknown,
): asserts state is AgentProjectsPHState {
  AgentProjectsPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a AgentProjects document */
export function isAgentProjectsDocument(
  document: unknown,
): document is AgentProjectsDocument {
  return AgentProjectsDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a AgentProjects document */
export function assertIsAgentProjectsDocument(
  document: unknown,
): asserts document is AgentProjectsDocument {
  AgentProjectsDocumentSchema.parse(document);
}
