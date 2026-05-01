import type { Action } from "document-model";
import type { ImportSpecInput } from "../types.js";

export type ImportSpecAction = Action & {
  type: "IMPORT_SPEC";
  input: ImportSpecInput;
};

export type PhClintProjectLifecycleAction = ImportSpecAction;
