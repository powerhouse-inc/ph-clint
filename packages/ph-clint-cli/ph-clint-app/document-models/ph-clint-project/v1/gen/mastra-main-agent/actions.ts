/**
 * WARNING: DO NOT EDIT
 * This file is auto-generated and updated by codegen
 */
import type { Action } from "document-model";
import type {
  ClearMainAgentDescriptionInput,
  ClearMainAgentImageInput,
  SetMainAgentDescriptionInput,
  SetMainAgentImageInput,
  SetMainAgentNameInput,
} from "../types.js";

export type SetMainAgentNameAction = Action & {
  type: "SET_MAIN_AGENT_NAME";
  input: SetMainAgentNameInput;
};
export type SetMainAgentDescriptionAction = Action & {
  type: "SET_MAIN_AGENT_DESCRIPTION";
  input: SetMainAgentDescriptionInput;
};
export type ClearMainAgentDescriptionAction = Action & {
  type: "CLEAR_MAIN_AGENT_DESCRIPTION";
  input: ClearMainAgentDescriptionInput;
};
export type SetMainAgentImageAction = Action & {
  type: "SET_MAIN_AGENT_IMAGE";
  input: SetMainAgentImageInput;
};
export type ClearMainAgentImageAction = Action & {
  type: "CLEAR_MAIN_AGENT_IMAGE";
  input: ClearMainAgentImageInput;
};

export type PhClintProjectMastraMainAgentAction =
  | SetMainAgentNameAction
  | SetMainAgentDescriptionAction
  | ClearMainAgentDescriptionAction
  | SetMainAgentImageAction
  | ClearMainAgentImageAction;
