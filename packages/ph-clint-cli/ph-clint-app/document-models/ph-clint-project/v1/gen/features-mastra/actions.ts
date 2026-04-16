import type { Action } from "document-model";
import type { EnableMastraInput, DisableMastraInput } from "../types.js";

export type EnableMastraAction = Action & {
  type: "ENABLE_MASTRA";
  input: EnableMastraInput;
};
export type DisableMastraAction = Action & {
  type: "DISABLE_MASTRA";
  input: DisableMastraInput;
};

export type PhClintProjectFeaturesMastraAction =
  | EnableMastraAction
  | DisableMastraAction;
