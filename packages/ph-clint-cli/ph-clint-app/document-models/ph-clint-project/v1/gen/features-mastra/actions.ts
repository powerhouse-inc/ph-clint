/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  DisableMastraInput,
  EnableMastraInput,
  SetEnableChatInput,
} from "../types.js";

export type EnableMastraAction = Action & {
  type: "ENABLE_MASTRA";
  input: EnableMastraInput;
};
export type DisableMastraAction = Action & {
  type: "DISABLE_MASTRA";
  input: DisableMastraInput;
};
export type SetEnableChatAction = Action & {
  type: "SET_ENABLE_CHAT";
  input: SetEnableChatInput;
};

export type PhClintProjectFeaturesMastraAction =
  | EnableMastraAction
  | DisableMastraAction
  | SetEnableChatAction;
