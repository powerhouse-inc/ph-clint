import {
  BaseDocumentHeaderSchema,
  BaseDocumentStateSchema,
} from "document-model";
import { z } from "zod";
import { achraPresentationDocumentType } from "./document-type.js";
import { AchraPresentationStateSchema } from "./schema/zod.js";
import type {
  AchraPresentationDocument,
  AchraPresentationPHState,
} from "./types.js";

/** Schema for validating the header object of a AchraPresentation document */
export const AchraPresentationDocumentHeaderSchema =
  BaseDocumentHeaderSchema.extend({
    documentType: z.literal(achraPresentationDocumentType),
  });

/** Schema for validating the state object of a AchraPresentation document */
export const AchraPresentationPHStateSchema = BaseDocumentStateSchema.extend({
  global: AchraPresentationStateSchema(),
});

export const AchraPresentationDocumentSchema = z.object({
  header: AchraPresentationDocumentHeaderSchema,
  state: AchraPresentationPHStateSchema,
  initialState: AchraPresentationPHStateSchema,
});

/** Simple helper function to check if a state object is a AchraPresentation document state object */
export function isAchraPresentationState(
  state: unknown,
): state is AchraPresentationPHState {
  return AchraPresentationPHStateSchema.safeParse(state).success;
}

/** Simple helper function to assert that a document state object is a AchraPresentation document state object */
export function assertIsAchraPresentationState(
  state: unknown,
): asserts state is AchraPresentationPHState {
  AchraPresentationPHStateSchema.parse(state);
}

/** Simple helper function to check if a document is a AchraPresentation document */
export function isAchraPresentationDocument(
  document: unknown,
): document is AchraPresentationDocument {
  return AchraPresentationDocumentSchema.safeParse(document).success;
}

/** Simple helper function to assert that a document is a AchraPresentation document */
export function assertIsAchraPresentationDocument(
  document: unknown,
): asserts document is AchraPresentationDocument {
  AchraPresentationDocumentSchema.parse(document);
}
