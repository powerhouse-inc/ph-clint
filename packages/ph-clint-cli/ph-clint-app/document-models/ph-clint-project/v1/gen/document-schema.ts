/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { phClintProjectDocumentType } from "./document-type.js";
import { PhClintProjectStateSchema } from "./schema/zod.js";
import type { PhClintProjectDocument, PhClintProjectPHState } from "./types.js";

/** Schema for validating the header object of a PhClintProject document */
export const PhClintProjectDocumentHeaderSchema =
  BaseDocumentHeaderSchema.extend({
    documentType: z.literal(phClintProjectDocumentType),
  });

/** Schema for validating the state object of a PhClintProject document */
export const PhClintProjectPHStateSchema = BaseDocumentStateSchema.extend({
  global: PhClintProjectStateSchema(),
});

export const PhClintProjectDocumentSchema = z.object({
  header: PhClintProjectDocumentHeaderSchema,
  state: PhClintProjectPHStateSchema,
  initialState: PhClintProjectPHStateSchema,
});

/** Simple helper function to check if a state object is a PhClintProject document state object */
export function isPhClintProjectState(
  state: unknown,
): state is PhClintProjectPHState {
  return PhClintProjectPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a PhClintProject document state object */
export function assertIsPhClintProjectState(
  state: unknown,
): asserts state is PhClintProjectPHState {
  PhClintProjectPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a PhClintProject document */
export function isPhClintProjectDocument(
  document: unknown,
): document is PhClintProjectDocument {
  return PhClintProjectDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a PhClintProject document */
export function assertIsPhClintProjectDocument(
  document: unknown,
): asserts document is PhClintProjectDocument {
  PhClintProjectDocumentSchema.parse(document);
}
